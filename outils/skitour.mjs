// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles et les fichiers des topos Skitour de Soulane à partir de la liste de l'API de skitour.fr et des GPX de son
// topoguide collaboratif (CC BY-SA 4.0 ; jamais les sorties ni les photos) :
//   SKITOUR_API_KEY=… node outils/skitour.mjs <dossier de sortie> [--precedent <version publiée, dépliée>]

// scripts/skitour-build.ts
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// src/shared/core/xmlText.ts
var ENTITIES = {
  nbsp: String.fromCharCode(160),
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  laquo: String.fromCharCode(171),
  raquo: String.fromCharCode(187),
  hellip: String.fromCharCode(8230),
  ndash: String.fromCharCode(8211),
  mdash: String.fromCharCode(8212),
  lsquo: String.fromCharCode(8216),
  rsquo: String.fromCharCode(8217),
  ldquo: String.fromCharCode(8220),
  rdquo: String.fromCharCode(8221),
  deg: String.fromCharCode(176),
  times: String.fromCharCode(215),
  eacute: String.fromCharCode(233),
  egrave: String.fromCharCode(232),
  ecirc: String.fromCharCode(234),
  agrave: String.fromCharCode(224),
  acirc: String.fromCharCode(226),
  ccedil: String.fromCharCode(231),
  ocirc: String.fromCharCode(244),
  ucirc: String.fromCharCode(251),
  icirc: String.fromCharCode(238),
  euml: String.fromCharCode(235),
  iuml: String.fromCharCode(239)
};
function decodeHtmlEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number.parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 1114111 && !(code >= 55296 && code <= 57343) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// src/shared/core/camptocamp.ts
var SKITOUR_SITE = "https://skitour.fr";
var SKITOUR_LICENCE = { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr" };
var TOPO_FAMILIES = [
  { id: "rando", label: "Randonn\xE9e", acts: ["hiking"] },
  { id: "ski", label: "Ski de randonn\xE9e", acts: ["skitouring"] },
  { id: "alpi", label: "Alpinisme", acts: ["snow_ice_mixed", "mountain_climbing"] }
];
var C2C_ACTS = TOPO_FAMILIES.flatMap((f) => f.acts);
var ORIENTATIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
var decodeEntities = decodeHtmlEntities;

// src/shared/core/skitour.ts
var SKITOUR_LAYER = "topos";
var SKITOUR_ZOOMS = [8, 9, 10, 11, 12, 13, 14];
var SKITOUR_INDEX_FILE = "index.json";
var SKITOUR_INDEX_VERSION = 1;
var SKITOUR_CACHE_FILE = "gpx.json";
var SKITOUR_CREDIT = `Topos \xA9 les contributeurs de Skitour (${SKITOUR_LICENCE.name})`;
var SKITOUR_ATTRIBUTION = `Topos \xA9 les contributeurs de <a href="${SKITOUR_SITE}" target="_blank" rel="noopener">Skitour</a> (<a href="${SKITOUR_LICENCE.url}" target="_blank" rel="noopener">${SKITOUR_LICENCE.name}</a>)`;
var skitourGpxUrl = (id) => `${SKITOUR_SITE}/topos/gpx/${id}.gpx`;
var skitourListUrl = (page) => `${SKITOUR_SITE}/api/topos?p=${page}`;
var isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var numOf = (v) => {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
function skitourText(v) {
  return typeof v === "string" ? decodeEntities(v).replace(/\s+/g, " ").trim() : "";
}
function lngLatOf(v) {
  const a = Array.isArray(v) ? v : [];
  const lat = numOf(a[0]);
  const lng = numOf(a[1]);
  if (lat == null || lng == null || lat === 0 && lng === 0 || Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}
var round5 = (v) => Math.round(v * 1e5) / 1e5;
var orientationOf = (v) => {
  const o = skitourText(v);
  return ORIENTATIONS.includes(o) ? o : "";
};
function parseSkitourItem(raw) {
  if (!isObj(raw)) return null;
  const id = numOf(raw.id);
  const nom = skitourText(raw.nom);
  if (id == null || !Number.isInteger(id) || id <= 0 || !nom) return null;
  const massif = isObj(raw.massif) ? raw.massif : {};
  const depart = isObj(raw.depart) ? raw.depart : {};
  return {
    id,
    nom,
    orientation: orientationOf(raw.orientation),
    denivele: numOf(raw.denivele),
    difSki: /^\d(\.\d)?$/.test(skitourText(raw.dif_ski)) ? skitourText(raw.dif_ski) : "",
    expo: numOf(raw.expo),
    difficulte: skitourText(raw.difficulte),
    hasGpx: raw.gpx != null && raw.gpx !== "" && String(raw.gpx) !== "0",
    massifId: numOf(massif.id),
    massif: skitourText(massif.nom),
    departNom: skitourText(depart.nom),
    departAlt: numOf(depart.altitude),
    depart: lngLatOf(depart.latlon)
  };
}
function parseSkitourList(json) {
  if (!Array.isArray(json)) throw new Error(`Liste des topos illisible : ${JSON.stringify(json)?.slice(0, 120)}`);
  return json.map(parseSkitourItem).filter((t) => !!t);
}
var GPX_POINT = /<(trkpt|rtept)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
var attrOf = (attrs, name) => numOf(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`).exec(attrs)?.[1]);
function pointsOf(block) {
  const coords = [];
  const eles = [];
  for (const m of block.matchAll(GPX_POINT)) {
    const lat = attrOf(m[2], "lat");
    const lng = attrOf(m[2], "lon");
    if (lat == null || lng == null || Math.abs(lat) > 85 || Math.abs(lng) > 180 || lat === 0 && lng === 0) continue;
    const e = numOf(/<ele>\s*([^<]*?)\s*<\/ele>/.exec(m[3] ?? "")?.[1]);
    const last = coords[coords.length - 1];
    if (last && last[0] === lng && last[1] === lat) continue;
    coords.push([lng, lat]);
    eles.push(e != null && e > -500 && e < 9e3 ? e : null);
  }
  return { coords, eles };
}
function readGpxParts(text) {
  if (!/<gpx[\s>]/.test(text)) return null;
  const blocks = text.split(/<trkseg\b[^>]*>/).slice(1);
  const raw = blocks.length ? blocks.map((b) => b.split(/<\/trkseg>/)[0]) : text.split(/<rte\b[^>]*>/).slice(1).map((b) => b.split(/<\/rte>/)[0]);
  return raw.map(pointsOf).filter((p) => p.coords.length >= 2);
}
var metersBetween = (a, b) => Math.hypot((a[0] - b[0]) * 111320 * Math.cos(a[1] * Math.PI / 180), (a[1] - b[1]) * 110574);
function skitourHighPoint(parts, depart) {
  let best = null;
  for (const part of parts) {
    const { coords, eles } = part;
    for (let i = 0; i < coords.length; i++) {
      const e = eles[i];
      if (e == null) continue;
      if (best && e <= best.e) continue;
      const neighbours = [i - 1, i + 1].filter((k) => eles[k] != null);
      const spike = neighbours.length > 0 && neighbours.every((k) => e - eles[k] > 30 && e - eles[k] > 1.5 * metersBetween(coords[i], coords[k]));
      if (!spike) best = { p: coords[i], e };
    }
  }
  if (best) return [best.p[0], best.p[1], Math.round(best.e)];
  const from = depart ?? parts[0]?.coords[0];
  if (!from) return null;
  let far = null;
  let d = -1;
  for (const part of parts) {
    for (const c of part.coords) {
      const m = metersBetween(from, c);
      if (m > d) {
        d = m;
        far = c;
      }
    }
  }
  return far ? [far[0], far[1], null] : null;
}
function skitourTraceOf(parts, depart) {
  const hp = skitourHighPoint(parts, depart);
  if (!parts.length || !hp) return null;
  const out = [];
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const part of parts) {
    const line = [];
    for (const [x, y] of part.coords) {
      const p = [round5(x), round5(y)];
      const last = line[line.length - 1];
      if (last && last[0] === p[0] && last[1] === p[1]) continue;
      line.push(p);
      w = Math.min(w, p[0]);
      e = Math.max(e, p[0]);
      s = Math.min(s, p[1]);
      n = Math.max(n, p[1]);
    }
    if (line.length >= 2) out.push(line);
  }
  if (!out.length) return null;
  return { parts: out, hp: [round5(hp[0]), round5(hp[1]), hp[2]], box: [w, s, e, n] };
}
function encodeSkitourTrace(t) {
  const parts = t.parts.map((line) => {
    const out = [];
    let px = 0;
    let py = 0;
    for (const [x, y] of line) {
      const ix = Math.round(x * 1e5);
      const iy = Math.round(y * 1e5);
      out.push(ix - px, iy - py);
      px = ix;
      py = iy;
    }
    return out;
  });
  return JSON.stringify({ v: 1, hp: t.hp, box: t.box, parts });
}
function readSkitourTrace(json) {
  if (!isObj(json) || json.v !== 1 || !Array.isArray(json.parts) || !Array.isArray(json.hp) || !Array.isArray(json.box)) return null;
  const parts = [];
  for (const raw of json.parts) {
    if (!Array.isArray(raw) || raw.length < 4 || raw.length % 2) return null;
    const line = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i < raw.length; i += 2) {
      if (typeof raw[i] !== "number" || typeof raw[i + 1] !== "number") return null;
      x += raw[i];
      y += raw[i + 1];
      line.push([x / 1e5, y / 1e5]);
    }
    parts.push(line);
  }
  const [hx, hy, ha] = json.hp;
  const box = json.box;
  if (!parts.length || typeof hx !== "number" || typeof hy !== "number" || box.length !== 4 || box.some((v) => typeof v !== "number")) return null;
  return { parts, hp: [hx, hy, typeof ha === "number" ? ha : null], box };
}
function skitourFeatures(item, trace) {
  const properties = { id: item.id };
  if (item.difSki) properties.g = item.difSki;
  if (item.orientation) properties.o = item.orientation;
  if (item.denivele != null) properties.d = item.denivele;
  return trace.parts.map((line) => ({ type: "line", coords: line.flat(), properties }));
}
function skitourEntry(t, trace) {
  if (!t.depart && !trace) return null;
  const head = [t.id, t.nom, t.orientation, t.denivele, t.difSki, t.expo, t.difficulte, t.massifId, t.departNom, t.departAlt, t.depart?.[0] ?? null, t.depart?.[1] ?? null];
  return trace ? [...head, ...trace.hp, ...trace.box] : head;
}
function buildSkitourIndex(items2, traces2) {
  const massifs = {};
  const entries = [];
  let sansPosition = 0;
  for (const t of [...items2].sort((a, b) => a.id - b.id)) {
    const e = skitourEntry(t, traces2.get(t.id) ?? null);
    if (!e) {
      sansPosition++;
      continue;
    }
    if (t.massifId != null && t.massif) massifs[t.massifId] = t.massif;
    entries.push(e);
  }
  return {
    json: { version: SKITOUR_INDEX_VERSION, mention: SKITOUR_CREDIT, licence: `${SKITOUR_LICENCE.name} (${SKITOUR_LICENCE.url})`, source: SKITOUR_SITE, massifs, topos: entries },
    topos: entries.length,
    sansPosition
  };
}
function skitourGpxPlan(items2, cache2) {
  return items2.filter((t) => t.hasGpx).map((t) => ({ id: t.id, at: cache2[t.id]?.at ?? -1 })).sort((a, b) => a.at - b.at || a.id - b.id).map((t) => t.id);
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
var utf8 = new TextEncoder();
function geometryCommands(f) {
  const out = [];
  let cx = 0;
  let cy = 0;
  const cmd = (id, count2) => count2 << 3 | id;
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
  if (typeof v === "string") w.bytes(1, utf8.encode(v));
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
function packed(field, values, w) {
  const inner = new Writer();
  for (const v of values) inner.varint(v);
  w.bytes(field, inner.result());
}
function encodeLayer(layer) {
  const w = new Writer();
  w.tag(15, 0);
  w.varint(2);
  w.bytes(1, utf8.encode(layer.name));
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
    if (tags.length) packed(2, tags, fw);
    fw.tag(3, 0);
    fw.varint(f.type);
    packed(4, geom, fw);
    features2.push(fw.result());
  }
  for (const f of features2) w.bytes(2, f);
  for (const k of keys) w.bytes(3, utf8.encode(k));
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

// scripts/skitour-build.ts
var args = process.argv.slice(2);
var outDir = args[0];
var opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : void 0;
};
if (!outDir || outDir.startsWith("--")) {
  console.error("Usage : node outils/skitour.mjs <dossier de sortie> [--precedent <dossier>] [--liste <fichier.json>] [--gpx <dossier>]");
  process.exit(1);
}
var precedent = opt("--precedent");
var listFile = opt("--liste");
var gpxDir = opt("--gpx");
var maxMinutes = Number(process.env.SKITOUR_MAX_MINUTES) > 0 ? Number(process.env.SKITOUR_MAX_MINUTES) : 150;
var UA = "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees; contact@soulane.app)";
var LIST_PAUSE_MS = 1100;
var LIST_MAX_PAGES = 300;
var GPX_PAUSE_MS = 1e3;
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var t0 = Date.now();
async function readList() {
  if (listFile) return parseSkitourList(JSON.parse(readFileSync(listFile, "utf8")));
  const key = (process.env.SKITOUR_API_KEY ?? "").trim();
  if (!key) throw new Error("Cl\xE9 absente : secret SKITOUR_API_KEY du d\xE9p\xF4t.");
  const byId2 = /* @__PURE__ */ new Map();
  let calls = 0;
  for (let page = 1; page <= LIST_MAX_PAGES; page++) {
    let json;
    for (let i = 0; ; i++) {
      calls++;
      try {
        const r = await fetch(skitourListUrl(page), { headers: { cle: key, "User-Agent": UA }, signal: AbortSignal.timeout(6e4) });
        if (!r.ok) throw new Error(`r\xE9ponse ${r.status}`);
        json = await r.json();
        break;
      } catch (e) {
        if (i >= 2) throw new Error(`Liste des topos, page ${page} : ${String(e)}`, { cause: e });
        await sleep(3e4);
      }
    }
    const list = parseSkitourList(json);
    if (Array.isArray(json) && json.length === 0) break;
    for (const t of list) byId2.set(t.id, t);
    await sleep(LIST_PAUSE_MS);
  }
  console.log(`Liste : ${byId2.size} topos, ${calls} appels \xE0 l'API.`);
  return [...byId2.values()];
}
var items = await readList();
var previousCache = precedent && existsSync(join(precedent, SKITOUR_CACHE_FILE)) ? JSON.parse(readFileSync(join(precedent, SKITOUR_CACHE_FILE), "utf8")) : {};
var byId = new Map(items.map((t) => [t.id, t]));
function previousTrace(id) {
  if (!precedent) return null;
  const f = join(precedent, "traces", `${id}.json`);
  if (!existsSync(f)) return null;
  try {
    return readSkitourTrace(JSON.parse(readFileSync(f, "utf8")));
  } catch {
    return null;
  }
}
var traces = /* @__PURE__ */ new Map();
var cache = {};
var count = { telecharges: 0, inchanges: 0, non_verifies: 0, sans_fichier: 0, illisibles: 0, erreurs: 0 };
var plan = skitourGpxPlan(items, previousCache);
var deadline = Date.now() + maxMinutes * 6e4;
function traceFrom(text, id) {
  const parts = readGpxParts(text);
  return parts ? skitourTraceOf(parts, byId.get(id)?.depart ?? null) : null;
}
for (const id of plan) {
  const old = previousCache[id];
  const keepOld = () => {
    const prev = previousTrace(id);
    if (prev) {
      traces.set(id, prev);
      if (old) cache[id] = old;
    }
  };
  if (gpxDir) {
    const f = join(gpxDir, `${id}.gpx`);
    if (!existsSync(f)) {
      count.sans_fichier++;
      continue;
    }
    const t = traceFrom(readFileSync(f, "utf8"), id);
    if (t) {
      traces.set(id, t);
      cache[id] = { at: Date.now() };
      count.telecharges++;
    } else count.illisibles++;
    continue;
  }
  if (Date.now() > deadline) {
    count.non_verifies++;
    keepOld();
    continue;
  }
  const started = Date.now();
  try {
    const known = old && previousTrace(id) != null;
    const headers = { "User-Agent": UA };
    if (known && old.etag) headers["If-None-Match"] = old.etag;
    if (known && old.modified) headers["If-Modified-Since"] = old.modified;
    const r = await fetch(skitourGpxUrl(id), { headers, signal: AbortSignal.timeout(6e4) });
    if (r.status === 304) {
      keepOld();
      if (old) cache[id] = { ...old, at: Date.now() };
      count.inchanges++;
    } else if (r.status === 404) {
      count.sans_fichier++;
    } else if (!r.ok) {
      throw new Error(`r\xE9ponse ${r.status}`);
    } else {
      const t = traceFrom(await r.text(), id);
      if (t) {
        traces.set(id, t);
        cache[id] = { ...r.headers.get("etag") ? { etag: r.headers.get("etag") } : {}, ...r.headers.get("last-modified") ? { modified: r.headers.get("last-modified") } : {}, at: Date.now() };
        count.telecharges++;
      } else {
        count.illisibles++;
        keepOld();
      }
    }
  } catch (e) {
    count.erreurs++;
    console.warn(`GPX ${id} : ${String(e)}`);
    keepOld();
  }
  await sleep(Math.max(0, GPX_PAUSE_MS - (Date.now() - started)));
}
console.log(`GPX : ${JSON.stringify(count)} (${plan.length} annonc\xE9s)`);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "traces"), { recursive: true });
var digests = [];
var features = [];
var km = 0;
var tracePoints = 0;
var traceOctets = 0;
var multiParts = 0;
var metersOf = (l) => l.reduce((m, p, i) => i ? m + Math.hypot((p[0] - l[i - 1][0]) * 111320 * Math.cos(p[1] * Math.PI / 180), (p[1] - l[i - 1][1]) * 110574) : 0, 0);
for (const id of [...traces.keys()].sort((a, b) => a - b)) {
  const t = traces.get(id);
  const item = byId.get(id);
  features.push(...skitourFeatures(item, t));
  for (const line of t.parts) {
    km += metersOf(line) / 1e3;
    tracePoints += line.length;
  }
  if (t.parts.length > 1) multiParts++;
  const text = encodeSkitourTrace(t);
  writeFileSync(join(outDir, "traces", `${id}.json`), text);
  traceOctets += text.length;
  digests.push(`traces/${id}.json ${createHash("sha256").update(text).digest("hex")}`);
}
var stats = {};
var total = 0;
for (const z of SKITOUR_ZOOMS) {
  const tiles = encodeTiles(tileFeatures(features, [z], { buffer: 64, tolerance: 0 }), SKITOUR_LAYER);
  let bytes = 0;
  for (const [key, b] of tiles) {
    const [zz, x, y] = key.split("/");
    mkdirSync(join(outDir, zz, x), { recursive: true });
    writeFileSync(join(outDir, zz, x, `${y}.pbf`), b);
    bytes += b.length;
    digests.push(`${key} ${createHash("sha256").update(b).digest("hex")}`);
  }
  stats[z] = { tuiles: tiles.size, octets: bytes };
  total += bytes;
  console.log(`zoom ${z} : ${tiles.size} tuiles, ${(bytes / 1048576).toFixed(1)} Mo`);
}
var index = buildSkitourIndex(items, traces);
var indexBytes = Buffer.from(JSON.stringify(index.json));
writeFileSync(join(outDir, SKITOUR_INDEX_FILE), indexBytes);
digests.push(`${SKITOUR_INDEX_FILE} ${createHash("sha256").update(indexBytes).digest("hex")}`);
console.log(`${SKITOUR_INDEX_FILE} : ${index.topos} topos (${index.sansPosition} sans position), ${(indexBytes.length / 1024).toFixed(0)} Ko`);
console.log(`Trac\xE9s : ${traces.size}, ${multiParts} en plusieurs morceaux, ${tracePoints} points, ${(traceOctets / 1048576).toFixed(1)} Mo`);
writeFileSync(join(outDir, SKITOUR_CACHE_FILE), JSON.stringify(cache));
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
      source: `${SKITOUR_SITE} (topoguide collaboratif : liste des topos et leurs GPX ; ni sorties, ni photos)`,
      mention: SKITOUR_CREDIT,
      licence: `${SKITOUR_LICENCE.name} (${SKITOUR_LICENCE.url})`,
      zooms: SKITOUR_ZOOMS,
      topos: index.topos,
      liste: items.length,
      sans_position: index.sansPosition,
      traces: traces.size,
      traces_morceaux: multiParts,
      points: tracePoints,
      km: Math.round(km),
      gpx: count,
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`Tuiles ${(total / 1048576).toFixed(1)} Mo, trac\xE9s ${(traceOctets / 1048576).toFixed(1)} Mo, en ${Math.round((Date.now() - t0) / 1e3)} s`);
