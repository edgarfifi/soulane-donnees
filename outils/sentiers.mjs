// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des sentiers de rando balisés de Soulane (relations route=hiking / foot) à partir des extraits
// d'OpenStreetMap de Geofabrik (© contributeurs OpenStreetMap, ODbL) :
//   node --max-old-space-size=10240 outils/sentiers.mjs <dossier de sortie> --geofabrik

// scripts/sentiers-build.ts
import { createHash } from "node:crypto";
import { closeSync, createWriteStream, fstatSync, mkdirSync, openSync, readFileSync, readSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

// src/shared/core/osmPbf.ts
var Pb = class _Pb {
  constructor(buf, end = buf.length) {
    this.buf = buf;
    this.end = end;
  }
  pos = 0;
  get more() {
    return this.pos < this.end;
  }
  varint() {
    const b = this.buf;
    let v = 0;
    let mul = 1;
    for (; ; ) {
      if (this.pos >= this.end) throw new Error("PBF : varint tronqu\xE9");
      const c = b[this.pos++];
      v += (c & 127) * mul;
      if (c < 128) return v;
      mul *= 128;
      if (mul > 2 ** 63) throw new Error("PBF : varint trop long");
    }
  }
  /** Entier signé « zigzag » (sint32 / sint64). */
  svarint() {
    const v = this.varint();
    return v % 2 === 1 ? -(v + 1) / 2 : v / 2;
  }
  /** Clé d'un champ : [numéro, type]. */
  key() {
    const k = this.varint();
    return [Math.floor(k / 8), k & 7];
  }
  /** Sous-lecteur d'un champ de longueur (message, chaîne, tableau compacté). */
  sub() {
    const len = this.varint();
    const start = this.pos;
    if (start + len > this.end) throw new Error("PBF : champ tronqu\xE9");
    this.pos += len;
    const p = new _Pb(this.buf, start + len);
    p.pos = start;
    return p;
  }
  bytes() {
    const s = this.sub();
    return this.buf.subarray(s.pos, s.end);
  }
  skip(type) {
    if (type === 0) this.varint();
    else if (type === 1) this.pos += 8;
    else if (type === 2) {
      const len = this.varint();
      this.pos += len;
    } else if (type === 5) this.pos += 4;
    else throw new Error(`PBF : type de champ ${type} inconnu`);
  }
};
var utf8 = new TextDecoder();
var int64 = (v) => v >= 2 ** 63 ? v - 2 ** 64 : v;
function readBlobHeader(header) {
  const p = new Pb(header);
  let type = "";
  let datasize = 0;
  while (p.more) {
    const [f, t] = p.key();
    if (f === 1 && t === 2) type = utf8.decode(p.bytes());
    else if (f === 3 && t === 0) datasize = p.varint();
    else p.skip(t);
  }
  return { type, datasize };
}
function blobData(blob, inflate) {
  const p = new Pb(blob);
  while (p.more) {
    const [f, t] = p.key();
    if (f === 1 && t === 2) return p.bytes();
    if (f === 3 && t === 2) return inflate(p.bytes());
    if (f >= 4 && t === 2) throw new Error(`PBF : compression non prise en charge (champ ${f})`);
    p.skip(t);
  }
  throw new Error("PBF : bloc sans donn\xE9es");
}
function closeRanges(summaries) {
  for (let i = 0; i < summaries.length; i++) {
    const s = summaries[i];
    if (!s.open) continue;
    const next = summaries[i + 1];
    s.maxId = next && next.kind === s.kind && next.minId > s.minId ? next.minId - 1 : Infinity;
  }
}
var MEMBER_TYPES = ["node", "way", "relation"];
function packed(p, signed, delta) {
  const s = p.sub();
  const out = [];
  let acc = 0;
  while (s.more) {
    const v = signed ? s.svarint() : s.varint();
    acc = delta ? acc + v : v;
    out.push(acc);
  }
  return out;
}
function readPrimitiveBlock(data, visit = {}) {
  const p = new Pb(data);
  const strings = [];
  const groups = [];
  let gran = 100;
  let latOff = 0;
  let lonOff = 0;
  while (p.more) {
    const [f, t] = p.key();
    if (f === 1 && t === 2) {
      const s = p.sub();
      while (s.more) {
        const [sf, st] = s.key();
        if (sf === 1 && st === 2) strings.push(utf8.decode(s.bytes()));
        else s.skip(st);
      }
    } else if (f === 2 && t === 2) groups.push(p.sub());
    else if (f === 17 && t === 0) gran = p.varint();
    else if (f === 19 && t === 0) latOff = int64(p.varint());
    else if (f === 20 && t === 0) lonOff = int64(p.varint());
    else p.skip(t);
  }
  const coord = (off, v) => (off + gran * v) * 1e-9;
  const sum = { kind: "empty", minId: Infinity, maxId: -Infinity };
  const seen = (kind, id) => {
    if (sum.kind === "empty") sum.kind = kind;
    else if (sum.kind !== kind) sum.kind = "mixed";
    if (id < sum.minId) sum.minId = id;
    if (id > sum.maxId) sum.maxId = id;
  };
  const tagsOf = (keys, vals) => {
    const o = {};
    for (let i = 0; i < keys.length && i < vals.length; i++) o[strings[keys[i]]] = strings[vals[i]];
    return o;
  };
  for (const g of groups) {
    while (g.more) {
      const [f, t] = g.key();
      if (f === 2 && t === 2) {
        const d = g.sub();
        let ids = [];
        let lats = [];
        let lons = [];
        while (d.more) {
          const [df, dt] = d.key();
          if (df === 1 && dt === 2 && !visit.node) {
            const first = d.sub();
            if (first.more) {
              seen("nodes", first.svarint());
              sum.open = true;
              sum.maxId = Infinity;
            }
          } else if (df === 1 && dt === 2) ids = packed(d, true, true);
          else if (df === 8 && dt === 2 && visit.node) lats = packed(d, true, true);
          else if (df === 9 && dt === 2 && visit.node) lons = packed(d, true, true);
          else d.skip(dt);
        }
        if (ids.length) {
          seen("nodes", ids[0]);
          seen("nodes", ids[ids.length - 1]);
        }
        if (visit.node) for (let i = 0; i < ids.length; i++) visit.node(ids[i], coord(lonOff, lons[i]), coord(latOff, lats[i]));
      } else if (f === 1 && t === 2) {
        const n = g.sub();
        let id = 0;
        let lat = 0;
        let lon = 0;
        while (n.more) {
          const [nf, nt] = n.key();
          if (nf === 1 && nt === 0) id = n.svarint();
          else if (nf === 8 && nt === 0) lat = n.svarint();
          else if (nf === 9 && nt === 0) lon = n.svarint();
          else n.skip(nt);
        }
        seen("nodes", id);
        visit.node?.(id, coord(lonOff, lon), coord(latOff, lat));
      } else if (f === 3 && t === 2) {
        const w = g.sub();
        let id = 0;
        let keys = [];
        let vals = [];
        let refs = [];
        let want = true;
        while (w.more) {
          const [wf, wt] = w.key();
          if (wf === 1 && wt === 0) {
            id = w.varint();
            want = !!visit.way && (visit.wantWay ? visit.wantWay(id) : true);
            if (!want) {
              w.pos = w.end;
              break;
            }
          } else if (wf === 2 && wt === 2 && visit.wayTags) keys = packed(w, false, false);
          else if (wf === 3 && wt === 2 && visit.wayTags) vals = packed(w, false, false);
          else if (wf === 8 && wt === 2) refs = packed(w, true, true);
          else w.skip(wt);
        }
        seen("ways", id);
        if (want && visit.way) visit.way(id, refs, visit.wayTags ? tagsOf(keys, vals) : null);
      } else if (f === 4 && t === 2) {
        const r = g.sub();
        let id = 0;
        let keys = [];
        let vals = [];
        let roles = [];
        let memids = [];
        let types = [];
        while (r.more) {
          const [rf, rt] = r.key();
          if (rf === 1 && rt === 0) id = r.varint();
          else if (!visit.relation) r.skip(rt);
          else if (rf === 2 && rt === 2) keys = packed(r, false, false);
          else if (rf === 3 && rt === 2) vals = packed(r, false, false);
          else if (rf === 8 && rt === 2) roles = packed(r, false, false);
          else if (rf === 9 && rt === 2) memids = packed(r, true, true);
          else if (rf === 10 && rt === 2) types = packed(r, false, false);
          else r.skip(rt);
        }
        seen("relations", id);
        if (visit.relation) {
          const members = memids.map((ref, i) => ({ type: MEMBER_TYPES[types[i] ?? 0] ?? "node", ref, role: strings[roles[i]] ?? "" }));
          visit.relation(id, tagsOf(keys, vals), members);
        }
      } else g.skip(t);
    }
  }
  return sum;
}
function listBlobs(read, fileSize) {
  const out = [];
  let off = 0;
  while (off < fileSize) {
    const l = read(off, 4);
    const hlen = (l[0] << 24 >>> 0) + (l[1] << 16) + (l[2] << 8) + l[3];
    if (hlen <= 0 || hlen > 64 * 1024) throw new Error(`PBF : en-t\xEAte de bloc invalide \xE0 ${off}`);
    const h = readBlobHeader(read(off + 4, hlen));
    const start = off + 4 + hlen;
    if (h.datasize <= 0 || start + h.datasize > fileSize) throw new Error(`PBF : bloc tronqu\xE9 \xE0 ${off}`);
    out.push({ type: h.type, offset: start, size: h.datasize });
    off = start + h.datasize;
  }
  return out;
}

// src/shared/core/trailData.ts
var TRAIL_LAYER = "sentiers";
var TRAIL_ZOOMS = [8, 9, 10, 11, 12];
var TRAIL_MAXZOOM = 12;
function trailTileGrid(z) {
  return z >= TRAIL_MAXZOOM ? { extent: 8192, tolerance: 2 } : { extent: 4096, tolerance: 4 };
}
var TRAIL_NETWORKS = ["iwn", "nwn", "rwn", "lwn"];
var TRAIL_LEVEL_MINZOOM = { 0: 8, 1: 8, 2: 10, 3: 11 };
var TRAIL_EXTRACTS = [
  "europe/france",
  "europe/spain",
  "europe/andorra",
  "europe/switzerland",
  "europe/liechtenstein",
  "europe/italy",
  "europe/austria",
  "europe/germany/bayern",
  "europe/monaco"
];
function extractCountry(name) {
  const n = name.toLowerCase();
  const table = [
    [/switzerland/, "ch"],
    [/liechtenstein/, "li"],
    [/austria/, "at"],
    [/italy|italia|nord-ovest|nord-est|centro|sud|isole/, "it"],
    [/bayern|germany/, "de"],
    [/andorra/, "ad"],
    [/monaco/, "mc"],
    [/spain|aragon|cataluna|navarra|pais-vasco|asturias|cantabria|castilla|galicia|madrid|valencia|andalucia|murcia|extremadura|rioja|baleares|canarias/, "es"],
    [/france|alpes|rhone|provence|midi|aquitaine|languedoc|auvergne|corse|occitanie/, "fr"]
  ];
  return table.find(([re]) => re.test(n))?.[1] ?? "";
}
var FOOT_ROUTES = ["hiking", "foot", "walking"];
var routeKinds = (tags) => (tags.route ?? "").split(";").map((s) => s.trim());
function isTrailRelation(tags) {
  if (tags.type !== "route" && tags.type !== "superroute") return false;
  if (!routeKinds(tags).some((k) => FOOT_ROUTES.includes(k))) return false;
  if (tags.state === "proposed" || tags.proposed === "yes" || tags.disused === "yes" || tags.abandoned === "yes") return false;
  return true;
}
function isRoutePart(tags) {
  if (tags.type !== "route" && tags.type !== "superroute") return false;
  return !tags.route || routeKinds(tags).some((k) => FOOT_ROUTES.includes(k));
}
function descend(rels, from) {
  const seen = /* @__PURE__ */ new Set([from]);
  const stack = [from];
  while (stack.length) {
    const r = rels.get(stack.pop());
    if (!r) continue;
    for (const c of r.rels) {
      if (seen.has(c)) continue;
      seen.add(c);
      stack.push(c);
    }
  }
  return [...seen];
}
function trailWayIds(rels) {
  const out = /* @__PURE__ */ new Set();
  for (const [id, r] of rels) {
    if (!r.trail) continue;
    for (const d of descend(rels, id)) for (const w of rels.get(d)?.ways ?? []) out.add(w);
  }
  return out;
}
function trailRouteWays(rels) {
  const absorbed = /* @__PURE__ */ new Set();
  for (const [id, r] of rels) {
    if (!r.trail || !r.network) continue;
    for (const c of r.rels) {
      const k = rels.get(c);
      if (c !== id && k?.trail && k.network === r.network && !k.rels.includes(id)) absorbed.add(c);
    }
  }
  const out = /* @__PURE__ */ new Map();
  for (const [id, r] of rels) {
    if (!r.trail || absorbed.has(id)) continue;
    const ways = /* @__PURE__ */ new Set();
    for (const d of descend(rels, id)) for (const w of rels.get(d)?.ways ?? []) ways.add(w);
    out.set(id, [...ways]);
  }
  return out;
}
function trailLevel(tags) {
  const i = TRAIL_NETWORKS.indexOf((tags.network ?? "").trim().toLowerCase());
  return i < 0 ? 3 : i;
}
var TRAIL_STYLE_BITS = { NDS: 16, AL1: 32, AL2: 64, AL3: 128, AL4: 256 };
var CAI_LEVEL = { T: "1", E: "2", EE: "3" };
var VORARLBERG = { "yellow:white:yellow_upper": "AL1", "red:white:red_bar": "AL2", "blue:white:blue_bar": "AL4" };
function trailStyle(tags, country) {
  const network = tags.network ?? "";
  const osmc = tags["osmc:symbol"] ?? "";
  let style = null;
  if (country === "ch" && network === "lwn") {
    if (osmc.startsWith("yellow:") && osmc.endsWith(":yellow_diamond")) style = "AL1";
    else if (osmc === "red:white:red_bar") style = "AL2";
    else if (osmc === "blue:white:blue_bar") style = "AL4";
  }
  if (tags.operator === "Land Vorarlberg" && network === "rwn" && tags["network:type"] === "basic_network" && VORARLBERG[osmc]) style = VORARLBERG[osmc];
  if (country === "it" && network === "lwn" && osmc.startsWith("red") && "cai_scale" in tags) style = `AL${CAI_LEVEL[tags.cai_scale] ?? "4"}`;
  if (!style && tags["network:type"] === "node_network") style = "NDS";
  return style;
}
var clean = (s, max) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "\u2026" : t;
};
function trailRoute(tags, country = "") {
  const style = trailStyle(tags, country);
  return {
    // (Réseau de nœuds : toujours local, comme Waymarked.)
    level: tags["network:type"] === "node_network" ? 3 : trailLevel(tags),
    ref: clean(tags.ref, 24),
    name: clean(tags["name:fr"] || tags.name, 48),
    ...style ? { style } : {},
    ...country ? { country } : {}
  };
}
var collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
var TRAIL_LABEL_REFS = 3;
var hasLevelColor = (r) => !r.style;
var hasLabel = (r) => !r.style || r.style !== "NDS" && r.country !== "ch" && r.country !== "at";
function trailProps(routes2) {
  let n = 3;
  let c = 0;
  for (const r of routes2) {
    if (r.style) c |= TRAIL_STYLE_BITS[r.style];
    if (!hasLevelColor(r)) continue;
    if (r.level < n) n = r.level;
    c |= 1 << r.level;
  }
  const labelled = routes2.filter(hasLabel);
  const refs = /* @__PURE__ */ new Map();
  for (const r of labelled) {
    if (!r.ref) continue;
    const prev = refs.get(r.ref);
    if (prev === void 0 || r.level < prev) refs.set(r.ref, r.level);
  }
  if (refs.size) {
    const sorted = [...refs].sort((a, b) => a[1] - b[1] || collator.compare(a[0], b[0])).map((e) => e[0]);
    const l = sorted.slice(0, TRAIL_LABEL_REFS).join(" \xB7 ") + (sorted.length > TRAIL_LABEL_REFS ? " \u2026" : "");
    return { n, c, l };
  }
  const names = new Set(labelled.map((r) => r.name).filter(Boolean));
  return { n, c, l: names.size === 1 ? [...names][0] : "" };
}
function mergeTrailLines(lines2) {
  const ptKey = (c, i) => `${Math.round(c[i] * 1e7)},${Math.round(c[i + 1] * 1e7)}`;
  const groups = /* @__PURE__ */ new Map();
  for (const l of lines2) {
    if (l.coords.length < 4) continue;
    const k = `${l.c}|${l.l}`;
    const g = groups.get(k);
    if (g) g.push(l);
    else groups.set(k, [l]);
  }
  const out = [];
  for (const g of groups.values()) {
    const ends = /* @__PURE__ */ new Map();
    const add = (k, i) => {
      const e = ends.get(k);
      if (e) e.push(i);
      else ends.set(k, [i]);
    };
    const keys = g.map((l) => [ptKey(l.coords, 0), ptKey(l.coords, l.coords.length - 2)]);
    keys.forEach(([a, b], i) => {
      add(a, i);
      add(b, i);
    });
    const used = new Uint8Array(g.length);
    const other = (k, i) => {
      const e = ends.get(k);
      if (e.length !== 2) return -1;
      const j = e[0] === i ? e[1] : e[0];
      return j === i || used[j] ? -1 : j;
    };
    for (let s = 0; s < g.length; s++) {
      if (used[s]) continue;
      used[s] = 1;
      let coords = g[s].coords.slice();
      let head = keys[s][0];
      let tail = keys[s][1];
      let j = other(tail, s);
      while (j >= 0) {
        used[j] = 1;
        const c = g[j].coords;
        if (keys[j][0] === tail) {
          for (let i = 2; i < c.length; i++) coords.push(c[i]);
          tail = keys[j][1];
        } else {
          for (let i = c.length - 4; i >= 0; i -= 2) coords.push(c[i], c[i + 1]);
          tail = keys[j][0];
        }
        if (tail === head) break;
        j = other(tail, j);
      }
      j = head !== tail ? other(head, s) : -1;
      while (j >= 0) {
        used[j] = 1;
        const c = g[j].coords;
        const pre = [];
        if (keys[j][1] === head) {
          for (let i = 0; i < c.length - 2; i++) pre.push(c[i]);
          head = keys[j][0];
        } else {
          for (let i = c.length - 2; i >= 2; i -= 2) pre.push(c[i], c[i + 1]);
          head = keys[j][1];
        }
        coords = pre.concat(coords);
        j = head !== tail ? other(head, j) : -1;
      }
      out.push({ coords, n: g[s].n, c: g[s].c, l: g[s].l });
    }
  }
  return out;
}

// src/shared/core/borderClip.ts
function signedArea(ring) {
  let s = 0;
  const n = ring.length;
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n;
    s += ring[i] * ring[j + 1] - ring[j] * ring[i + 1];
  }
  return s / 2;
}
function clipRingToRect(ring, r) {
  let pts = ring.slice();
  const edges = [
    [(x) => x >= r.west, (ax, ay, bx, by) => [r.west, ay + (by - ay) * (r.west - ax) / (bx - ax)]],
    [(x) => x <= r.east, (ax, ay, bx, by) => [r.east, ay + (by - ay) * (r.east - ax) / (bx - ax)]],
    [(_, y) => y >= r.south, (ax, ay, bx, by) => [ax + (bx - ax) * (r.south - ay) / (by - ay), r.south]],
    [(_, y) => y <= r.north, (ax, ay, bx, by) => [ax + (bx - ax) * (r.north - ay) / (by - ay), r.north]]
  ];
  for (const [inside, cut] of edges) {
    const out = [];
    const n = pts.length;
    if (!n) break;
    for (let i = 0; i < n; i += 2) {
      const ax = pts[(i - 2 + n) % n];
      const ay = pts[(i - 1 + n) % n];
      const bx = pts[i];
      const by = pts[i + 1];
      const ain = inside(ax, ay);
      const bin = inside(bx, by);
      if (bin) {
        if (!ain) out.push(...cut(ax, ay, bx, by));
        out.push(bx, by);
      } else if (ain) out.push(...cut(ax, ay, bx, by));
    }
    pts = out;
  }
  return pts.length >= 6 ? pts : [];
}

// src/shared/core/isolines.ts
var T = 0;
var R = 1;
var B = 2;
var L = 3;
var CA = 0;
var CB = 1;
var CC = 2;
var CD = 3;
var CASES = [];
CASES[1] = [[L, B, CD]];
CASES[2] = [[B, R, CC]];
CASES[3] = [[L, R, CC]];
CASES[4] = [[T, R, CB]];
CASES[6] = [[T, B, CB]];
CASES[7] = [[L, T, CA]];
CASES[8] = [[L, T, CA]];
CASES[9] = [[T, B, CA]];
CASES[11] = [[T, R, CB]];
CASES[12] = [[L, R, CA]];
CASES[13] = [[B, R, CC]];
CASES[14] = [[L, B, CD]];

// src/shared/core/mvt.ts
var Writer = class {
  buf = new Uint8Array(1024);
  pos = 0;
  grow(n) {
    if (this.pos + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.pos + n) size *= 2;
    const b = new Uint8Array(size);
    b.set(this.buf.subarray(0, this.pos));
    this.buf = b;
  }
  varint(v) {
    this.grow(10);
    while (v >= 128) {
      this.buf[this.pos++] = v % 128 | 128;
      v = Math.floor(v / 128);
    }
    this.buf[this.pos++] = v;
  }
  tag(field, wire) {
    this.varint(field * 8 + wire);
  }
  bytes(field, b) {
    this.tag(field, 2);
    this.varint(b.length);
    this.grow(b.length);
    this.buf.set(b, this.pos);
    this.pos += b.length;
  }
  double(field, v) {
    this.tag(field, 1);
    this.grow(8);
    new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 8).setFloat64(0, v, true);
    this.pos += 8;
  }
  result() {
    return this.buf.slice(0, this.pos);
  }
};
var zigzag = (n) => n >= 0 ? n * 2 : -n * 2 - 1;
var utf82 = new TextEncoder();
function geometryCommands(f) {
  const out = [];
  let cx = 0;
  let cy = 0;
  const cmd = (id, count) => count << 3 | id;
  if (f.type === 1) {
    const pts = f.geometry.flatMap((p) => {
      const r = [];
      for (let i = 0; i + 1 < p.length; i += 2) r.push([p[i], p[i + 1]]);
      return r;
    });
    if (!pts.length) return out;
    out.push(cmd(1, pts.length));
    for (const [x, y] of pts) {
      out.push(zigzag(x - cx), zigzag(y - cy));
      cx = x;
      cy = y;
    }
    return out;
  }
  for (const line of f.geometry) {
    const n = line.length >> 1;
    if (n < 2) continue;
    let m = n;
    if (f.type === 3 && m > 1 && line[0] === line[(m - 1) * 2] && line[1] === line[(m - 1) * 2 + 1]) m--;
    out.push(cmd(1, 1), zigzag(line[0] - cx), zigzag(line[1] - cy));
    cx = line[0];
    cy = line[1];
    out.push(cmd(2, m - 1));
    for (let i = 1; i < m; i++) {
      const x = line[i * 2];
      const y = line[i * 2 + 1];
      out.push(zigzag(x - cx), zigzag(y - cy));
      cx = x;
      cy = y;
    }
    if (f.type === 3) out.push(cmd(7, 1));
  }
  return out;
}
function encodeValue(v) {
  const w = new Writer();
  if (typeof v === "string") w.bytes(1, utf82.encode(v));
  else if (typeof v === "boolean") {
    w.tag(7, 0);
    w.varint(v ? 1 : 0);
  } else if (Number.isInteger(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER) {
    if (v >= 0) {
      w.tag(5, 0);
      w.varint(v);
    } else {
      w.tag(6, 0);
      w.varint(zigzag(v));
    }
  } else w.double(3, v);
  return w.result();
}
function packed2(field, values, w) {
  const inner = new Writer();
  for (const v of values) inner.varint(v);
  w.bytes(field, inner.result());
}
function encodeLayer(layer) {
  const w = new Writer();
  w.tag(15, 0);
  w.varint(2);
  w.bytes(1, utf82.encode(layer.name));
  const keys = [];
  const keyIndex = /* @__PURE__ */ new Map();
  const values = [];
  const valueIndex = /* @__PURE__ */ new Map();
  const features2 = [];
  for (const f of layer.features) {
    const geom = geometryCommands(f);
    if (!geom.length) continue;
    const tags = [];
    for (const [k, v] of Object.entries(f.properties)) {
      if (v === void 0 || v === null) continue;
      let ki = keyIndex.get(k);
      if (ki === void 0) {
        ki = keys.length;
        keys.push(k);
        keyIndex.set(k, ki);
      }
      const vk = typeof v + ":" + String(v);
      let vi = valueIndex.get(vk);
      if (vi === void 0) {
        vi = values.length;
        values.push(v);
        valueIndex.set(vk, vi);
      }
      tags.push(ki, vi);
    }
    const fw = new Writer();
    if (tags.length) packed2(2, tags, fw);
    fw.tag(3, 0);
    fw.varint(f.type);
    packed2(4, geom, fw);
    features2.push(fw.result());
  }
  for (const f of features2) w.bytes(2, f);
  for (const k of keys) w.bytes(3, utf82.encode(k));
  for (const v of values) w.bytes(4, encodeValue(v));
  w.tag(5, 0);
  w.varint(layer.extent ?? 4096);
  return w.result();
}
function encodeMvt(layers) {
  const w = new Writer();
  for (const l of layers) if (l.features.length) w.bytes(3, encodeLayer(l));
  return w.result();
}

// src/shared/core/contourTile.ts
function clipLine(pts, closed, S) {
  const inside = (x, y) => x >= 0 && x <= S && y >= 0 && y <= S;
  const n = pts.length >> 1;
  if (n < 2) return [];
  let all = true;
  for (let i = 0; i < n; i++) if (!inside(pts[i * 2], pts[i * 2 + 1])) all = false;
  if (all) return [{ points: pts.slice(), closed }];
  const out = [];
  let cur = null;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const x0 = pts[i * 2];
    const y0 = pts[i * 2 + 1];
    const x1 = pts[(i + 1) % n * 2];
    const y1 = pts[(i + 1) % n * 2 + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t02 = 0;
    let t1 = 1;
    const lb = (p, q) => {
      if (p === 0) return q >= 0;
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t02) t02 = r;
      } else {
        if (r < t02) return false;
        if (r < t1) t1 = r;
      }
      return true;
    };
    const ok = lb(-dx, x0) && lb(dx, S - x0) && lb(-dy, y0) && lb(dy, S - y0);
    if (!ok) {
      cur = null;
      continue;
    }
    const ax = x0 + t02 * dx;
    const ay = y0 + t02 * dy;
    const bx = x0 + t1 * dx;
    const by = y0 + t1 * dy;
    if (!cur || t02 > 0) {
      cur = [ax, ay];
      out.push(cur);
    }
    cur.push(bx, by);
    if (t1 < 1) cur = null;
  }
  if (closed && out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] === pts[0] && first[1] === pts[1] && last[last.length - 2] === pts[0] && last[last.length - 1] === pts[1]) {
      out[0] = last.concat(first.slice(2));
      out.pop();
    }
  }
  return out.filter((p) => p.length >= 4).map((points) => ({ points, closed: false }));
}
function simplifyLine(pts, tol) {
  const n = pts.length >> 1;
  if (n <= 2 || tol <= 0) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = pts[a * 2];
    const ay = pts[a * 2 + 1];
    const dx = pts[b * 2] - ax;
    const dy = pts[b * 2 + 1] - ay;
    const len2 = dx * dx + dy * dy;
    let best = -1;
    let bestD = t2;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i * 2] - ax;
      const py = pts[i * 2 + 1] - ay;
      let d;
      if (len2 === 0) d = px * px + py * py;
      else {
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
        const ex = px - t * dx;
        const ey = py - t * dy;
        d = ex * ex + ey * ey;
      }
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
  return out;
}

// src/shared/core/vectorTiling.ts
function mercator(lng, lat) {
  const r = Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180;
  return [(lng + 180) / 360, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2];
}
function tileFeatures(features2, zooms, opts = {}) {
  const extent = opts.extent ?? 4096;
  const buffer = opts.buffer ?? 64;
  const tol = opts.tolerance ?? 4;
  const out = /* @__PURE__ */ new Map();
  const push = (key, f) => {
    const l = out.get(key);
    if (l) l.push(f);
    else out.set(key, [f]);
  };
  for (const f of features2) {
    const n = f.coords.length >> 1;
    if (n < 2) continue;
    const world = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      const [x, y] = mercator(f.coords[i * 2], f.coords[i * 2 + 1]);
      world[i * 2] = x;
      world[i * 2 + 1] = y;
    }
    for (const z of zooms) {
      if (f.minzoom !== void 0 && z < f.minzoom) continue;
      const scale = 2 ** z * extent;
      const pts = [];
      for (let i = 0; i < n * 2; i++) pts.push(world[i] * scale);
      const simple = simplifyLine(pts, tol);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < simple.length; i += 2) {
        minX = Math.min(minX, simple[i]);
        maxX = Math.max(maxX, simple[i]);
        minY = Math.min(minY, simple[i + 1]);
        maxY = Math.max(maxY, simple[i + 1]);
      }
      const tmax = 2 ** z - 1;
      const tx0 = Math.max(0, Math.floor((minX - buffer) / extent));
      const tx1 = Math.min(tmax, Math.floor((maxX + buffer) / extent));
      const ty0 = Math.max(0, Math.floor((minY - buffer) / extent));
      const ty1 = Math.min(tmax, Math.floor((maxY + buffer) / extent));
      for (let tx = tx0; tx <= tx1; tx++) {
        for (let ty = ty0; ty <= ty1; ty++) {
          const ox = tx * extent;
          const oy = ty * extent;
          const key = `${z}/${tx}/${ty}`;
          if (f.type === "line") {
            const local = [];
            for (let i = 0; i < simple.length; i += 2) local.push(simple[i] - ox + buffer, simple[i + 1] - oy + buffer);
            for (const piece of clipLine(local, false, extent + 2 * buffer)) {
              const q = roundLine(piece.points, buffer);
              if (q.length >= 4) push(key, { type: 2, geometry: [q], properties: f.properties });
            }
          } else {
            const local = [];
            for (let i = 0; i < simple.length; i += 2) local.push(simple[i] - ox, simple[i + 1] - oy);
            const ring = clipRingToRect(local, { west: -buffer, east: extent + buffer, south: -buffer, north: extent + buffer });
            const q = roundLine(ring, 0);
            if (q.length < 6) continue;
            if (signedArea(q) < 0) reversePairs(q);
            push(key, { type: 3, geometry: [q], properties: f.properties });
          }
        }
      }
    }
  }
  return out;
}
function roundLine(pts, shift) {
  const q = [];
  for (let i = 0; i < pts.length; i += 2) {
    const x = Math.round(pts[i] - shift);
    const y = Math.round(pts[i + 1] - shift);
    if (q.length && q[q.length - 2] === x && q[q.length - 1] === y) continue;
    q.push(x, y);
  }
  return q;
}
function reversePairs(p) {
  for (let i = 0, j = p.length - 2; i < j; i += 2, j -= 2) {
    const x = p[i];
    const y = p[i + 1];
    p[i] = p[j];
    p[i + 1] = p[j + 1];
    p[j] = x;
    p[j + 1] = y;
  }
}
function encodeTiles(tiles, layer, extent = 4096) {
  const out = /* @__PURE__ */ new Map();
  for (const [key, features2] of tiles) out.set(key, encodeMvt([{ name: layer, extent, features: features2 }]));
  return out;
}

// scripts/sentiers-build.ts
var [outDir, ...args] = process.argv.slice(2);
if (!outDir || !args.length) {
  console.error("Usage : node --max-old-space-size=8192 scripts/sentiers.mjs <dossier de sortie> (--geofabrik | <extrait.osm.pbf> [\u2026])");
  process.exit(1);
}
var GEOFABRIK = args[0] === "--geofabrik";
var inputs = GEOFABRIK ? TRAIL_EXTRACTS.map((e) => `https://download.geofabrik.de/${e}-latest.osm.pbf`) : args;
var sourceDates = {};
var extractName = (f) => basename(f).replace(/-latest\.osm\.pbf$|\.osm\.pbf$|\.pbf$/, "");
async function download(url, file) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees)" } });
      if (!r.ok || !r.body) throw new Error(`${r.status}`);
      await pipeline(Readable.fromWeb(r.body), createWriteStream(file));
      const lm = r.headers.get("last-modified");
      const d = lm ? new Date(lm) : null;
      return d && !isNaN(d.getTime()) ? d.toISOString() : null;
    } catch (e) {
      if (i >= 4) throw new Error(`${url} : t\xE9l\xE9chargement impossible (${String(e)})`, { cause: e });
      console.log(`${url} : essai ${i} rat\xE9 (${String(e)}), nouvel essai dans une minute`);
      await new Promise((res) => setTimeout(res, 6e4));
    }
  }
}
var t0 = Date.now();
var secs = () => `${Math.round((Date.now() - t0) / 1e3)} s`;
var relations = /* @__PURE__ */ new Map();
var routeInfo = /* @__PURE__ */ new Map();
var wayCoords = /* @__PURE__ */ new Map();
function sortedUnique(values) {
  const a = Float64Array.from(values).sort();
  let n = 0;
  for (let i = 0; i < a.length; i++) if (i === 0 || a[i] !== a[i - 1]) a[n++] = a[i];
  return a.subarray(0, n);
}
function indexOf(a, v) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    const x = a[mid];
    if (x === v) return mid;
    if (x < v) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
function anyIn(a, min, max) {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (a[mid] < min) lo = mid + 1;
    else hi = mid;
  }
  return lo < a.length && a[lo] <= max;
}
for (const source of inputs) {
  let input = source;
  if (GEOFABRIK) {
    input = join(dirname(resolve(outDir)), `.${extractName(source)}.osm.pbf`);
    const d = await download(source, input);
    if (d) sourceDates[extractName(source)] = d;
    console.log(`${extractName(source)} : ${(statSync(input).size / 1048576).toFixed(0)} Mo t\xE9l\xE9charg\xE9s (${secs()})`);
  }
  const fd = openSync(input, "r");
  const size = fstatSync(fd).size;
  const read = (offset, length) => {
    const b = Buffer.allocUnsafe(length);
    let got = 0;
    while (got < length) {
      const n = readSync(fd, b, got, length - got, offset + got);
      if (n <= 0) throw new Error(`${input} : fin de fichier inattendue`);
      got += n;
    }
    return b;
  };
  const blobs = listBlobs(read, size).filter((b) => b.type === "OSMData");
  const country = extractCountry(extractName(source));
  const data = (i) => blobData(read(blobs[i].offset, blobs[i].size), (z) => inflateSync(z));
  const summaries = [];
  let rels = 0;
  for (let i = 0; i < blobs.length; i++) {
    summaries.push(
      readPrimitiveBlock(data(i), {
        relation: (id, tags, members) => {
          if (relations.has(id) || !isRoutePart(tags)) return;
          const trail = isTrailRelation(tags);
          relations.set(id, {
            trail,
            ...tags.network ? { network: tags.network } : {},
            ways: members.filter((m) => m.type === "way").map((m) => m.ref),
            rels: members.filter((m) => m.type === "relation").map((m) => m.ref)
          });
          if (trail) {
            routeInfo.set(id, trailRoute(tags, country));
            rels++;
          }
        }
      })
    );
  }
  closeRanges(summaries);
  const wantWays = sortedUnique(trailWayIds(relations));
  console.log(`${basename(input)} : ${blobs.length} blocs, ${rels} itin\xE9raires de plus (${routeInfo.size} en tout), ${wantWays.length} chemins (${secs()})`);
  const fileWays = /* @__PURE__ */ new Map();
  for (let i = 0; i < blobs.length; i++) {
    const s = summaries[i];
    if (s.kind !== "ways" && s.kind !== "mixed" || !anyIn(wantWays, s.minId, s.maxId)) continue;
    readPrimitiveBlock(data(i), { wantWay: (id) => indexOf(wantWays, id) >= 0, way: (id, refs) => fileWays.set(id, refs) });
  }
  const allRefs = [];
  for (const refs of fileWays.values()) for (const r of refs) allRefs.push(r);
  const wantNodes = sortedUnique(allRefs);
  allRefs.length = 0;
  const lon = new Float64Array(wantNodes.length).fill(NaN);
  const lat = new Float64Array(wantNodes.length);
  for (let i = 0; i < blobs.length; i++) {
    const s = summaries[i];
    if (s.kind !== "nodes" && s.kind !== "mixed" || !anyIn(wantNodes, s.minId, s.maxId)) continue;
    readPrimitiveBlock(data(i), {
      node: (id, x, y) => {
        const k = indexOf(wantNodes, id);
        if (k >= 0) {
          lon[k] = x;
          lat[k] = y;
        }
      }
    });
  }
  closeSync(fd);
  if (GEOFABRIK) rmSync(input, { force: true });
  let kept = 0;
  for (const [id, refs] of fileWays) {
    const c = [];
    for (const r of refs) {
      const k = indexOf(wantNodes, r);
      if (k >= 0 && !Number.isNaN(lon[k])) c.push(lon[k], lat[k]);
    }
    if (c.length < 4) continue;
    const prev = wayCoords.get(id);
    if (!prev || prev.length < c.length) {
      wayCoords.set(id, Float64Array.from(c));
      kept++;
    }
  }
  console.log(`${basename(input)} : ${fileWays.size} chemins lus, ${wantNodes.length} n\u0153uds, ${kept} chemins gard\xE9s (${secs()})`);
}
var tops = trailRouteWays(relations);
var routes = [];
var wayRoutes = /* @__PURE__ */ new Map();
for (const [id, ways] of tops) {
  const ri = routes.length;
  routes.push(routeInfo.get(id));
  for (const w of ways) {
    const l = wayRoutes.get(w);
    if (!l) wayRoutes.set(w, [ri]);
    else if (!l.includes(ri)) l.push(ri);
  }
}
relations.clear();
var lines = [];
var km = 0;
var R2 = 6371.0088;
for (const [id, c] of wayCoords) {
  const rs = wayRoutes.get(id);
  if (!rs) continue;
  const p = trailProps(rs.map((i) => routes[i]));
  lines.push({ coords: Array.from(c), n: p.n, c: p.c, l: p.l });
  for (let i = 2; i < c.length; i += 2) {
    const dLat = (c[i + 1] - c[i - 1]) * Math.PI / 180;
    const dLon = (c[i] - c[i - 2]) * Math.PI / 180;
    const m = Math.cos((c[i + 1] + c[i - 1]) / 2 * Math.PI / 180);
    km += R2 * Math.hypot(dLat, dLon * m);
  }
}
wayCoords.clear();
var merged = mergeTrailLines(lines);
lines.length = 0;
var byLevel = [0, 0, 0, 0];
for (const r of routes) byLevel[r.level]++;
console.log(`${merged.length} traits (${Math.round(km)} km) ; itin\xE9raires : ${byLevel.join(" / ")} (international / national / r\xE9gional / local) (${secs()})`);
var features = merged.map((l) => ({
  type: "line",
  coords: l.coords,
  properties: l.l ? { n: l.n, c: l.c, l: l.l } : { n: l.n, c: l.c },
  minzoom: TRAIL_LEVEL_MINZOOM[l.n]
}));
rmSync(outDir, { recursive: true, force: true });
var CHUNK_Z = 6;
var chunks = /* @__PURE__ */ new Map();
for (const f of features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < f.coords.length; i += 2) {
    const [x, y] = tileXY(f.coords[i], f.coords[i + 1], CHUNK_Z);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++) {
      const k = `${x}/${y}`;
      const l = chunks.get(k);
      if (l) l.push(f);
      else chunks.set(k, [f]);
    }
}
function tileXY(lng, latDeg, z) {
  const n = 2 ** z;
  const r = latDeg * Math.PI / 180;
  return [Math.floor((lng + 180) / 360 * n), Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n)];
}
var stats = {};
var total = 0;
var digests = [];
for (const z of TRAIL_ZOOMS) {
  let count = 0;
  let bytes = 0;
  const write = (tiles) => {
    for (const [key, b] of tiles) {
      const [zz, x, y] = key.split("/");
      mkdirSync(join(outDir, zz, x), { recursive: true });
      writeFileSync(join(outDir, zz, x, `${y}.pbf`), b);
      bytes += b.length;
      count++;
      digests.push(`${key} ${createHash("sha256").update(b).digest("hex")}`);
    }
  };
  const { extent, tolerance } = trailTileGrid(z);
  const opts = { extent, buffer: extent / 64, tolerance };
  if (z <= CHUNK_Z) write(encodeTiles(tileFeatures(features, [z], opts), TRAIL_LAYER, extent));
  else {
    const shift = z - CHUNK_Z;
    for (const [k, list] of chunks) {
      const [cx, cy] = k.split("/").map(Number);
      const tiles = tileFeatures(list, [z], opts);
      for (const key of [...tiles.keys()]) {
        const [, x, y] = key.split("/").map(Number);
        if (x >> shift !== cx || y >> shift !== cy) tiles.delete(key);
      }
      write(encodeTiles(tiles, TRAIL_LAYER, extent));
    }
  }
  stats[z] = { tuiles: count, octets: bytes };
  total += bytes;
  console.log(`zoom ${z} : ${count} tuiles, ${(bytes / 1048576).toFixed(1)} Mo (${secs()})`);
}
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  outil = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex").slice(0, 12);
} catch {
}
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      fabrique: (/* @__PURE__ */ new Date()).toISOString(),
      source: "Extraits Geofabrik (\xA9 contributeurs OpenStreetMap, ODbL) : relations route=hiking / foot",
      extraits: inputs.map((f) => basename(f).replace(/-latest\.osm\.pbf$|\.osm\.pbf$|\.pbf$/, "")),
      ...Object.keys(sourceDates).length ? { source_dates: sourceDates } : {},
      zooms: [...TRAIL_ZOOMS],
      itineraires: routes.length,
      itineraires_par_reseau: { international: byLevel[0], national: byLevel[1], regional: byLevel[2], local: byLevel[3] },
      traits: merged.length,
      km: Math.round(km),
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`Total ${(total / 1048576).toFixed(1)} Mo en ${secs()}`);
