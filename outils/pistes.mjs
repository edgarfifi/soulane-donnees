// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des pistes de ski de la carte d'hiver de Soulane à partir du fichier quotidien d'OpenSnowMap
// (© contributeurs OpenStreetMap, ODbL) :
//   node --max-old-space-size=8192 outils/pistes.mjs <planet_pistes.osm.gz> <dossier de sortie>

// scripts/pistes-build.ts
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createGunzip, inflateSync } from "node:zlib";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// src/shared/core/xmlText.ts
function codePointText(code) {
  if (!Number.isInteger(code) || code <= 0 || code > 1114111 || code >= 55296 && code <= 57343) return null;
  return String.fromCodePoint(code);
}
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
  iuml: String.fromCharCode(239),
  // 23/11/2026 (textes des gestionnaires d'espaces protégés, Biodiv'Sports) : lettres encore laissées en « &ugrave; »…
  ugrave: String.fromCharCode(249),
  oacute: String.fromCharCode(243),
  aacute: String.fromCharCode(225),
  uuml: String.fromCharCode(252),
  ouml: String.fromCharCode(246),
  oelig: String.fromCharCode(339),
  euro: String.fromCharCode(8364),
  bull: String.fromCharCode(8226),
  minus: String.fromCharCode(8722),
  // … et les CAPITALES (« &Eacute; » donnait « é ») : cherchées telles quelles avant la minuscule.
  Eacute: String.fromCharCode(201),
  Egrave: String.fromCharCode(200),
  Ecirc: String.fromCharCode(202),
  Agrave: String.fromCharCode(192),
  Acirc: String.fromCharCode(194),
  Ccedil: String.fromCharCode(199),
  Ocirc: String.fromCharCode(212),
  Icirc: String.fromCharCode(206),
  OElig: String.fromCharCode(338)
};

// src/shared/core/pisteData.ts
var PISTES_REGION = { west: -2.5, south: 41, east: 30, north: 49.5 };
function xmlAttr(line, name) {
  const key = " " + name + '="';
  const i = line.indexOf(key);
  if (i < 0) return null;
  const j = line.indexOf('"', i + key.length);
  if (j < 0) return null;
  return decodeXml(line.slice(i + key.length, j));
}
function decodeXml(s) {
  if (!s.includes("&")) return s;
  return s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (m, e) => {
    if (e === "lt") return "<";
    if (e === "gt") return ">";
    if (e === "amp") return "&";
    if (e === "quot") return '"';
    if (e === "apos") return "'";
    const code = e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return codePointText(code) ?? m;
  });
}
var KEEP = /* @__PURE__ */ new Set(["piste:type", "piste:difficulty", "piste:name", "name", "area", "landuse", "piste:grooming", "aerialway"]);
function keepTag(k) {
  return KEEP.has(k);
}
function relationGivesTags(type) {
  return type !== "site";
}
function mergeRelationTags(way, rel) {
  const out = { ...way };
  for (const k of ["piste:type", "piste:difficulty", "piste:name", "name"]) if (out[k] === void 0 && rel[k] !== void 0) out[k] = rel[k];
  return out;
}
var TYPES = ["downhill", "nordic", "skitour", "hike", "sled", "connection", "snow_park", "playground"];
function minzoomOf(types, polygon) {
  if (polygon) return 12;
  if (types.includes("downhill") || types.includes("skitour")) return 10;
  if (types.includes("nordic")) return 11;
  return 12;
}
function pisteFeature(tags2, coords, closed) {
  const raw = tags2["piste:type"];
  if (!raw || tags2.landuse === "winter_sports") return null;
  const types = raw.split(";").map((t) => t.trim()).filter((t) => TYPES.includes(t));
  if (!types.length || coords.length < 4) return null;
  const polygon = closed && coords.length >= 8 && (tags2.area === "yes" || types.includes("snow_park") || types.includes("playground"));
  const props = { "piste:type": types.join(";") };
  const diff = tags2["piste:difficulty"];
  if (diff) props["piste:difficulty"] = diff;
  const name = tags2["piste:name"] ?? tags2.name;
  if (name && name.length <= 80) props.name = name;
  if (tags2["piste:grooming"]) props["piste:grooming"] = tags2["piste:grooming"];
  return { type: polygon ? "polygon" : "line", coords, properties: props, minzoom: minzoomOf(types, polygon) };
}
var AERIALWAYS = ["cable_car", "gondola", "mixed_lift", "chair_lift", "drag_lift", "t-bar", "j-bar", "platter", "rope_tow", "magic_carpet"];
function aerialwayFeature(tags2, coords) {
  const kind2 = tags2.aerialway;
  if (!kind2 || !AERIALWAYS.includes(kind2) || tags2["piste:type"] || coords.length < 4) return null;
  const props = { aerialway: kind2 };
  if (tags2.name && tags2.name.length <= 80) props.name = tags2.name;
  return { type: "line", coords, properties: props, minzoom: kind2 === "cable_car" || kind2 === "gondola" ? 10 : 11 };
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
    const tags2 = [];
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
      tags2.push(ki, vi);
    }
    const fw = new Writer();
    if (tags2.length) packed(2, tags2, fw);
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

// src/shared/core/mvtRead.ts
var Reader = class _Reader {
  buf;
  end;
  pos;
  constructor(buf, start = 0, end = buf.length) {
    this.buf = buf;
    this.pos = start;
    this.end = end;
  }
  varint() {
    let v = 0;
    let mul = 1;
    for (; ; ) {
      if (this.pos >= this.end) throw new Error("MVT tronqu\xE9e");
      const b = this.buf[this.pos++];
      v += (b & 127) * mul;
      if (b < 128) return v;
      mul *= 128;
    }
  }
  skip(wire) {
    if (wire === 0) this.varint();
    else if (wire === 1) this.pos += 8;
    else if (wire === 2) this.pos += this.varint();
    else if (wire === 5) this.pos += 4;
    else throw new Error("MVT : type de champ inconnu " + wire);
  }
  /** Sous-lecteur du bloc de longueur connue qui suit. */
  /** Longueur du bloc qui suit, vérifiée (une tuile tronquée lève une erreur au lieu de lire au-delà). */
  len() {
    const len = this.varint();
    if (this.pos + len > this.end) throw new Error("MVT tronqu\xE9e");
    return len;
  }
  sub() {
    const len = this.len();
    const r = new _Reader(this.buf, this.pos, this.pos + len);
    this.pos += len;
    return r;
  }
  string() {
    const len = this.len();
    const s = new TextDecoder().decode(this.buf.subarray(this.pos, this.pos + len));
    this.pos += len;
    return s;
  }
  float() {
    const v = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 4).getFloat32(0, true);
    this.pos += 4;
    return v;
  }
  double() {
    const v = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 8).getFloat64(0, true);
    this.pos += 8;
    return v;
  }
  packed() {
    const r = this.sub();
    const out = [];
    while (r.pos < r.end) out.push(r.varint());
    return out;
  }
};
var zigzag2 = (v) => v % 2 === 1 ? -(v + 1) / 2 : v / 2;
function readValue(r) {
  let v = "";
  while (r.pos < r.end) {
    const tag = r.varint();
    const f = Math.floor(tag / 8);
    const w = tag & 7;
    if (f === 1) v = r.string();
    else if (f === 2) v = r.float();
    else if (f === 3) v = r.double();
    else if (f === 4 || f === 5) v = r.varint();
    else if (f === 6) v = zigzag2(r.varint());
    else if (f === 7) v = r.varint() !== 0;
    else r.skip(w);
  }
  return v;
}
function decodeGeometry(cmds, type) {
  const out = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let i = 0;
  while (i < cmds.length) {
    const c = cmds[i++];
    const id = c & 7;
    const count = c >> 3;
    if (id === 1 || id === 2) {
      for (let k = 0; k < count && i + 1 < cmds.length; k++) {
        x += zigzag2(cmds[i++]);
        y += zigzag2(cmds[i++]);
        if (id === 1) {
          cur = [x, y];
          out.push(cur);
        } else if (cur) cur.push(x, y);
      }
    } else if (id === 7) {
      if (type !== 3) cur?.push(cur[0], cur[1]);
    } else break;
  }
  return out;
}
function readMvt(data, names) {
  const out = {};
  const top = new Reader(data);
  while (top.pos < top.end) {
    const tag = top.varint();
    if (tag >> 3 !== 3 || (tag & 7) !== 2) {
      top.skip(tag & 7);
      continue;
    }
    const lr = top.sub();
    const scan = new Reader(lr.buf, lr.pos, lr.end);
    let wanted = false;
    while (scan.pos < scan.end) {
      const t = scan.varint();
      if (t >> 3 === 1 && (t & 7) === 2) {
        wanted = names.includes(scan.string());
        break;
      }
      scan.skip(t & 7);
    }
    if (!wanted) continue;
    let name = "";
    let extent = 4096;
    const keys = [];
    const values = [];
    const feats = [];
    while (lr.pos < lr.end) {
      const t = lr.varint();
      const f = t >> 3;
      const w = t & 7;
      if (f === 1) name = lr.string();
      else if (f === 2) feats.push(lr.sub());
      else if (f === 3) keys.push(lr.string());
      else if (f === 4) values.push(readValue(lr.sub()));
      else if (f === 5) extent = lr.varint();
      else lr.skip(w);
    }
    if (!names.includes(name)) continue;
    const features2 = [];
    for (const fr of feats) {
      let type = 0;
      let tags2 = [];
      let geom = [];
      while (fr.pos < fr.end) {
        const t = fr.varint();
        const f = t >> 3;
        const w = t & 7;
        if (f === 2) tags2 = fr.packed();
        else if (f === 3) type = fr.varint();
        else if (f === 4) geom = fr.packed();
        else fr.skip(w);
      }
      const properties = {};
      for (let k = 0; k + 1 < tags2.length; k += 2) {
        const key = keys[tags2[k]];
        if (key !== void 0 && values[tags2[k + 1]] !== void 0) properties[key] = values[tags2[k + 1]];
      }
      features2.push({ type, geometry: decodeGeometry(geom, type), properties });
    }
    out[name] = { extent, features: features2 };
  }
  return out;
}

// src/shared/core/skiRouteBounds.ts
function clipToTile(line, ext) {
  const out = [];
  let cur = null;
  for (let i = 0; i + 3 < line.length; i += 2) {
    const x0 = line[i];
    const y0 = line[i + 1];
    const dx = line[i + 2] - x0;
    const dy = line[i + 3] - y0;
    let t02 = 0;
    let t1 = 1;
    let inside = true;
    for (const [pp, q] of [
      [-dx, x0],
      [dx, ext - x0],
      [-dy, y0],
      [dy, ext - y0]
    ]) {
      if (pp === 0) {
        if (q < 0) inside = false;
      } else {
        const r = q / pp;
        if (pp < 0) t02 = Math.max(t02, r);
        else t1 = Math.min(t1, r);
      }
    }
    if (!inside || t02 > t1) {
      cur = null;
      continue;
    }
    const a = [x0 + dx * t02, y0 + dy * t02];
    const b = [x0 + dx * t1, y0 + dy * t1];
    if (!cur || cur[cur.length - 1][0] !== a[0] || cur[cur.length - 1][1] !== a[1]) {
      cur = [a];
      out.push(cur);
    }
    cur.push(b);
    if (t1 < 1) cur = null;
  }
  return out.filter((l) => l.length > 1);
}
var lngOf = (x, z) => x / 2 ** z * 360 - 180;
var latOf = (y, z) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** z))) * 180 / Math.PI;
function tileRouteParts(layer, z, x, y) {
  const acc = /* @__PURE__ */ new Map();
  if (!layer) return /* @__PURE__ */ new Map();
  const ext = layer.extent || 4096;
  const toLngLat = (l) => l.map(([px, py]) => [lngOf(x + px / ext, z), latOf(y + py / ext, z)]);
  for (const f of layer.features) {
    if (f.type !== 2) continue;
    const r = f.properties.r;
    if (typeof r !== "string" || !r) continue;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    let out = 0;
    for (const line of f.geometry)
      for (let i = 0; i + 1 < line.length; i += 2) {
        const px = line[i];
        const py = line[i + 1];
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
        const h = px < 0 ? 1 : px > ext ? 2 : 0;
        const v = py < 0 ? 4 : py > ext ? 8 : 0;
        out |= h | v;
        if (h && v) out |= (h | v) << 4;
      }
    if (!Number.isFinite(x0)) continue;
    const clipped = f.geometry.flatMap((line) => clipToTile(line, ext).map(toLngLat));
    for (const ref of r.split(",")) {
      if (!ref) continue;
      const a = acc.get(ref);
      if (!a) acc.set(ref, { x0, y0, x1, y1, out, lines: [...clipped] });
      else {
        a.lines.push(...clipped);
        a.x0 = Math.min(a.x0, x0);
        a.y0 = Math.min(a.y0, y0);
        a.x1 = Math.max(a.x1, x1);
        a.y1 = Math.max(a.y1, y1);
        a.out |= out;
      }
    }
  }
  const res = /* @__PURE__ */ new Map();
  for (const [ref, a] of acc) {
    const next = [];
    if (a.out & 1) next.push([-1, 0]);
    if (a.out & 2) next.push([1, 0]);
    if (a.out & 4) next.push([0, -1]);
    if (a.out & 8) next.push([0, 1]);
    if ((a.out & 80) === 80) next.push([-1, -1]);
    if ((a.out & 96) === 96) next.push([1, -1]);
    if ((a.out & 144) === 144) next.push([-1, 1]);
    if ((a.out & 160) === 160) next.push([1, 1]);
    res.set(ref, {
      box: [lngOf(x + a.x0 / ext, z), latOf(y + a.y1 / ext, z), lngOf(x + a.x1 / ext, z), latOf(y + a.y0 / ext, z)],
      next,
      lines: a.lines
    });
  }
  return res;
}
function chainSkiRoute(pieces, tolM = 3) {
  const parts = pieces.filter((p) => p.length > 1);
  if (!parts.length) return null;
  const lat0 = parts[0][0][1];
  const mx = 111320 * Math.cos(lat0 * Math.PI / 180);
  const my = 110574;
  const nodes = [];
  const grid = /* @__PURE__ */ new Map();
  const nodeOf = (c) => {
    const x = c[0] * mx;
    const y = c[1] * my;
    const gx = Math.floor(x / tolM);
    const gy = Math.floor(y / tolM);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const n of grid.get(`${gx + i}|${gy + j}`) ?? []) if (Math.hypot(nodes[n].x - x, nodes[n].y - y) <= tolM) return n;
    const id = nodes.length;
    nodes.push({ x, y });
    const k = `${gx}|${gy}`;
    const g = grid.get(k);
    if (g) g.push(id);
    else grid.set(k, [id]);
    return id;
  };
  const edges = parts.map((p) => ({ a: nodeOf(p[0]), b: nodeOf(p[p.length - 1]), p }));
  const adj = /* @__PURE__ */ new Map();
  edges.forEach((e, i) => {
    if (e.a === e.b) return;
    for (const n of [e.a, e.b]) {
      const l = adj.get(n);
      if (l) l.push(i);
      else adj.set(n, [i]);
    }
  });
  const ends = [...adj].filter(([, l]) => l.length === 1).map(([n]) => n);
  if (ends.length !== 2 || [...adj.values()].some((l) => l.length > 2)) return null;
  const used = /* @__PURE__ */ new Set();
  const out = [];
  let at = ends[0];
  for (; ; ) {
    const ei = (adj.get(at) ?? []).find((i) => !used.has(i));
    if (ei == null) break;
    used.add(ei);
    const e = edges[ei];
    const seg = e.a === at ? e.p : [...e.p].reverse();
    for (let k = out.length ? 1 : 0; k < seg.length; k++) out.push([seg[k][0], seg[k][1]]);
    at = e.a === at ? e.b : e.a;
  }
  const real = edges.filter((e) => e.a !== e.b).length;
  return used.size === real ? out : null;
}

// src/shared/core/pngRead.ts
var SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function pngUnfilter(data, height, stride, bpp) {
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const f = data[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const raw = data[src + x];
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst + x - stride] : 0;
      const c = x >= bpp && y > 0 ? out[dst + x - stride - bpp] : 0;
      out[dst + x] = raw + (f === 1 ? a : f === 2 ? b : f === 3 ? a + b >> 1 : f === 4 ? paeth(a, b, c) : 0) & 255;
    }
  }
  return out;
}
function decodePng(bytes, inflate) {
  if (bytes.length < 33 || SIGNATURE.some((v, i) => bytes[i] !== v)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let depth = 0;
  let type = 0;
  let palette = null;
  let trns = null;
  const idat = [];
  for (let p = 8; p + 12 <= bytes.length; ) {
    const len = view.getUint32(p);
    const name = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const body = bytes.subarray(p + 8, p + 8 + len);
    if (name === "IHDR") {
      width = view.getUint32(p + 8);
      height = view.getUint32(p + 12);
      depth = bytes[p + 16];
      type = bytes[p + 17];
      if (bytes[p + 20] !== 0) return null;
    } else if (name === "PLTE") palette = body;
    else if (name === "tRNS") trns = body;
    else if (name === "IDAT") idat.push(body);
    else if (name === "IEND") break;
    p += 12 + len;
  }
  const channels = type === 0 ? 1 : type === 2 ? 3 : type === 3 ? 1 : type === 4 ? 2 : type === 6 ? 4 : 0;
  if (!width || !height || !channels || !idat.length) return null;
  if (type === 3 ? ![1, 2, 4, 8].includes(depth) || !palette : depth !== 8) return null;
  const total2 = idat.reduce((n, c) => n + c.length, 0);
  const packed2 = new Uint8Array(total2);
  let o = 0;
  for (const c of idat) {
    packed2.set(c, o);
    o += c.length;
  }
  const stride = Math.ceil(width * channels * depth / 8);
  const raw = inflate(packed2);
  if (raw.length < height * (stride + 1)) return null;
  const px = pngUnfilter(raw, height, stride, Math.max(1, channels * depth >> 3));
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const d = (y * width + x) * 4;
      if (type === 3) {
        const byte = px[y * stride + (x * depth >> 3)];
        const i = depth === 8 ? byte : byte >> 8 - depth - (x * depth & 7) & (1 << depth) - 1;
        rgba[d] = palette[i * 3];
        rgba[d + 1] = palette[i * 3 + 1];
        rgba[d + 2] = palette[i * 3 + 2];
        rgba[d + 3] = trns && i < trns.length ? trns[i] : 255;
        continue;
      }
      const s = y * stride + x * channels;
      const grey = type === 0 || type === 4;
      rgba[d] = px[s];
      rgba[d + 1] = grey ? px[s] : px[s + 1];
      rgba[d + 2] = grey ? px[s] : px[s + 2];
      rgba[d + 3] = type === 4 ? px[s + 1] : type === 6 ? px[s + 3] : 255;
    }
  return { width, height, rgba };
}
function terrariumElevation(img, x, y) {
  const i = (Math.min(img.height - 1, Math.max(0, y)) * img.width + Math.min(img.width - 1, Math.max(0, x))) * 4;
  return img.rgba[i] * 256 + img.rgba[i + 1] + img.rgba[i + 2] / 256 - 32768;
}

// src/shared/core/geo.ts
var R_KM = 6371;
var D2R = Math.PI / 180;
var R2D = 180 / Math.PI;
function haversineKm(aLat, aLng, bLat, bLng) {
  const dLat = (bLat - aLat) * D2R;
  const dLng = (bLng - aLng) * D2R;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * D2R) * Math.cos(bLat * D2R) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(s));
}
var UTM_F = 1 / 298.257223563;

// src/shared/core/pisteInfo.ts
function pisteKindOf(type, difficulty, grooming) {
  const types = (type ?? "").split(";").map((t) => t.trim());
  const downhill = types.includes("downhill") || types.includes("connection");
  if (downhill) {
    if (difficulty === "freeride" || difficulty === "extreme") return "horspiste";
    return grooming === "backcountry" ? "nondamee" : "piste";
  }
  return types.includes("skitour") ? "rando" : null;
}
var LIFT_WORDS = {
  cable_car: "t\xE9l\xE9ph\xE9rique",
  gondola: "t\xE9l\xE9cabine",
  mixed_lift: "t\xE9l\xE9mix",
  chair_lift: "t\xE9l\xE9si\xE8ge",
  drag_lift: "t\xE9l\xE9ski",
  "t-bar": "t\xE9l\xE9ski",
  "j-bar": "t\xE9l\xE9ski",
  platter: "t\xE9l\xE9ski"
};
var liftWord = (aerialway) => LIFT_WORDS[aerialway] ?? null;
function liftLabel(word, name) {
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  if (!name) return cap;
  const bare = (s) => s.normalize("NFD").replace(new RegExp("\\p{M}", "gu"), "").toLowerCase();
  return /^(tele|tk|ts|tc|tph|tsd|funi|skilift|sesselbahn|seggiovia|funivia|gondel|.*bahn\b|.*lift\b)/.test(bare(name)) || bare(name).includes(bare(word)) ? name : `${cap} ${name}`;
}

// src/shared/core/pisteDeparts.ts
var meters = (a, b) => haversineKm(a[1], a[0], b[1], b[0]) * 1e3;
var LIFT_MIN_CLIMB_M = 150;
var DEPART_NEAR_M = 250;
var DEPART_LEVEL_M = 100;
var STATION_MERGE_M = 150;
var COVERED_M = 60;
var NEAR_DOMAIN_M = 1e3;
var PointGrid = class {
  /** `cellDeg` : côté d'une case en degrés (0,01° ≈ 1,1 km en latitude). */
  constructor(cellDeg = 0.01) {
    this.cellDeg = cellDeg;
  }
  cells = /* @__PURE__ */ new Map();
  key(x, y) {
    return `${x}:${y}`;
  }
  add(p, v) {
    const k = this.key(Math.floor(p[0] / this.cellDeg), Math.floor(p[1] / this.cellDeg));
    const c = this.cells.get(k);
    if (c) c.push({ p, v });
    else this.cells.set(k, [{ p, v }]);
  }
  /** Points à `radiusM` mètres au plus, le plus proche d'abord. */
  near(p, radiusM) {
    const ry = Math.ceil(radiusM / 111320 / this.cellDeg);
    const rx = Math.ceil(radiusM / (111320 * Math.max(0.2, Math.cos(p[1] * Math.PI / 180))) / this.cellDeg);
    const cx = Math.floor(p[0] / this.cellDeg);
    const cy = Math.floor(p[1] / this.cellDeg);
    const out = [];
    for (let x = cx - rx; x <= cx + rx; x++)
      for (let y = cy - ry; y <= cy + ry; y++)
        for (const e of this.cells.get(this.key(x, y)) ?? []) {
          const d = meters(p, e.p);
          if (d <= radiusM) out.push({ ...e, d });
        }
    return out.sort((a, b) => a.d - b.d);
  }
  /** Y a-t-il un point à `radiusM` mètres au plus ? */
  has(p, radiusM) {
    return this.near(p, radiusM).length > 0;
  }
};
function liftTop(coords, aerialway, name, zFirst, zLast) {
  const word = liftWord(aerialway);
  if (!word || coords.length < 4 || !Number.isFinite(zFirst) || !Number.isFinite(zLast)) return null;
  if (Math.abs(zFirst - zLast) < LIFT_MIN_CLIMB_M) return null;
  const n = coords.length;
  const top = zFirst > zLast ? [coords[0], coords[1]] : [coords[n - 2], coords[n - 1]];
  return { p: top, z: Math.round(Math.max(zFirst, zLast)), label: liftLabel(word, name) };
}
var round5 = (p) => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
function assignDepartures(tops, candidates) {
  const stations = [];
  const grid = new PointGrid();
  for (const t of [...tops].sort((a, b) => b.z - a.z)) {
    const hit = grid.near(t.p, STATION_MERGE_M)[0];
    if (hit) {
      const st = stations[hit.v];
      if (!st.names.includes(t.label)) st.names.push(t.label);
      continue;
    }
    grid.add(t.p, stations.length);
    stations.push({ p: round5(t.p), z: t.z, n: t.label, d: [], names: [t.label], seen: /* @__PURE__ */ new Set() });
  }
  for (const c of candidates) {
    const hit = grid.near(c.start, DEPART_NEAR_M).find((h) => c.z === null || Math.abs(c.z - stations[h.v].z) <= DEPART_LEVEL_M);
    if (!hit) continue;
    const st = stations[hit.v];
    const key = c.s === "osm" ? `osm|${c.kind}|${c.name || `${Math.round(c.start[0] * 3e3)},${Math.round(c.start[1] * 3e3)}`}` : `${c.s}|${c.id}`;
    if (st.seen.has(key)) continue;
    st.seen.add(key);
    st.d.push({ s: c.s, ...c.id ? { i: c.id } : {}, n: c.name, ...c.kind ? { k: c.kind } : {}, ...c.s === "osm" ? { p: round5(c.start) } : {} });
  }
  const order = { osm: 0, reseau: 1, skitour: 2 };
  return stations.filter((s) => s.d.length > 0).map(({ p, z, d, names }) => ({ p, z, n: names.slice(0, 3).join(" \xB7 "), d: d.sort((a, b) => order[a.s] - order[b.s] || a.n.localeCompare(b.n, "fr")) }));
}
function densify(line, stepM) {
  const out = [];
  if (!line.length) return out;
  out.push([line[0][0], line[0][1]]);
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const n = Math.max(1, Math.ceil(meters(a, b) / stepM));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}
function uncoveredParts(line, covered, stepM = 30, minM = 300, bridgeM = 150) {
  const pts = densify(line, stepM);
  if (pts.length < 2) return [];
  const free = pts.map((p) => !covered(p));
  const at = [0];
  for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + meters(pts[i - 1], pts[i]));
  for (let i = 0; i < pts.length; ) {
    if (free[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < pts.length && !free[j]) j++;
    if (i > 0 && j < pts.length && at[j] - at[i - 1] <= bridgeM) for (let k = i; k < j; k++) free[k] = true;
    i = j;
  }
  const out = [];
  for (let i = 0; i < pts.length; ) {
    if (!free[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < pts.length && free[j + 1]) j++;
    if (at[j] - at[i] >= minM) out.push(pts.slice(i, j + 1));
    i = j + 1;
  }
  return out;
}

// src/renderer/src/lib/countryBorders.ts
var FRANCE_RINGS = [
  [
    2.5218,
    51.0875,
    2.537,
    51.0646,
    2.557,
    51.0012,
    2.6084,
    50.9611,
    2.6117,
    50.9412,
    2.5769,
    50.9115,
    2.5967,
    50.8676,
    2.5867,
    50.8454,
    2.6204,
    50.8165,
    2.6919,
    50.8088,
    2.7066,
    50.7888,
    2.7438,
    50.7662,
    2.7682,
    50.7332,
    2.7867,
    50.7234,
    2.8869,
    50.6966,
    2.9302,
    50.7362,
    2.9714,
    50.7578,
    3.1033,
    50.7841,
    3.1292,
    50.7791,
    3.1462,
    50.7689,
    3.189,
    50.7151,
    3.2244,
    50.7052,
    3.2324,
    50.6959,
    3.2438,
    50.6721,
    3.2298,
    50.6554,
    3.2643,
    50.5702,
    3.271,
    50.5269,
    3.2999,
    50.5075,
    3.3611,
    50.4898,
    3.4292,
    50.5018,
    3.4771,
    50.5199,
    3.498,
    50.5119,
    3.4867,
    50.4927,
    3.4991,
    50.4868,
    3.5637,
    50.4865,
    3.6083,
    50.4765,
    3.6444,
    50.4455,
    3.6617,
    50.3193,
    3.6969,
    50.2982,
    3.7334,
    50.3372,
    3.755,
    50.3463,
    3.8402,
    50.3452,
    3.8959,
    50.3253,
    4.0033,
    50.3441,
    4.0979,
    50.2948,
    4.1253,
    50.2571,
    4.1437,
    50.2516,
    4.151,
    50.2563,
    4.1503,
    50.2695,
    4.1628,
    50.273,
    4.1976,
    50.2585,
    4.2013,
    50.2415,
    4.1679,
    50.2225,
    4.1527,
    50.2045,
    4.1258,
    50.1282,
    4.1806,
    50.1272,
    4.21,
    50.0602,
    4.1373,
    50.0251,
    4.1282,
    50.0058,
    4.1396,
    49.9745,
    4.1317,
    49.975,
    4.2011,
    49.953,
    4.2776,
    49.9602,
    4.4351,
    49.9323,
    4.6042,
    49.9802,
    4.6458,
    49.9845,
    4.6567,
    49.9891,
    4.6729,
    50.0164,
    4.6806,
    50.0483,
    4.6734,
    50.0662,
    4.6819,
    50.0839,
    4.7886,
    50.1534,
    4.8156,
    50.1613,
    4.8201,
    50.1464,
    4.8627,
    50.1476,
    4.8719,
    50.1398,
    4.8629,
    50.0841,
    4.846,
    50.0907,
    4.8272,
    50.0641,
    4.8267,
    50.036,
    4.7839,
    49.9583,
    4.7973,
    49.9443,
    4.8446,
    49.9317,
    4.8602,
    49.9133,
    4.8594,
    49.8917,
    4.8349,
    49.853,
    4.8492,
    49.8316,
    4.849,
    49.7942,
    4.8842,
    49.7841,
    4.971,
    49.7971,
    5.0263,
    49.7667,
    5.0819,
    49.7527,
    5.1364,
    49.7053,
    5.1694,
    49.6872,
    5.1925,
    49.6828,
    5.2592,
    49.6913,
    5.2994,
    49.6625,
    5.3064,
    49.6475,
    5.2938,
    49.6405,
    5.2907,
    49.6264,
    5.2979,
    49.6133,
    5.3217,
    49.6126,
    5.3349,
    49.6258,
    5.4021,
    49.6025,
    5.4502,
    49.5458,
    5.4499,
    49.5078,
    5.4561,
    49.4989,
    5.4777,
    49.4952,
    5.5476,
    49.5234,
    5.6023,
    49.5137,
    5.6197,
    49.5355,
    5.6446,
    49.5438,
    5.7103,
    49.5311,
    5.7463,
    49.5494,
    5.7907,
    49.5378,
    5.8396,
    49.4999,
    5.9281,
    49.4823,
    5.947,
    49.47,
    5.9607,
    49.4413,
    6.078,
    49.452,
    6.0998,
    49.4646,
    6.1073,
    49.4825,
    6.1426,
    49.4861,
    6.1361,
    49.4953,
    6.1936,
    49.4994,
    6.2494,
    49.4903,
    6.3253,
    49.4567,
    6.3539,
    49.4548,
    6.4027,
    49.4655,
    6.5117,
    49.4247,
    6.5188,
    49.4022,
    6.5777,
    49.3558,
    6.5734,
    49.3477,
    6.5556,
    49.3472,
    6.5501,
    49.338,
    6.5564,
    49.3264,
    6.6397,
    49.2712,
    6.6403,
    49.2528,
    6.6638,
    49.2439,
    6.6806,
    49.2075,
    6.7025,
    49.2136,
    6.7088,
    49.1978,
    6.701,
    49.1729,
    6.7138,
    49.1589,
    6.8218,
    49.1478,
    6.839,
    49.1628,
    6.8277,
    49.1956,
    6.8335,
    49.2095,
    6.9144,
    49.2067,
    7.0095,
    49.1817,
    7.009,
    49.1464,
    7.0205,
    49.119,
    7.0425,
    49.1076,
    7.0732,
    49.1203,
    7.0708,
    49.1361,
    7.0799,
    49.142,
    7.155,
    49.1144,
    7.2412,
    49.1139,
    7.2744,
    49.105,
    7.2971,
    49.1281,
    7.334,
    49.1342,
    7.351,
    49.1592,
    7.4105,
    49.1689,
    7.4148,
    49.1578,
    7.4761,
    49.1515,
    7.4827,
    49.1371,
    7.471,
    49.1283,
    7.5209,
    49.0837,
    7.6086,
    49.062,
    7.635,
    49.0378,
    7.6851,
    49.0428,
    7.7269,
    49.0357,
    7.7737,
    49.0481,
    7.8569,
    49.0323,
    7.9319,
    49.0348,
    8.0904,
    48.9792,
    8.2003,
    48.9586,
    8.1481,
    48.9037,
    8.0903,
    48.8075,
    8.0388,
    48.7908,
    8.0173,
    48.7618,
    7.9701,
    48.7573,
    7.9592,
    48.7214,
    7.8959,
    48.6765,
    7.8524,
    48.6587,
    7.8103,
    48.615,
    7.8017,
    48.5476,
    7.8135,
    48.5195,
    7.7765,
    48.4982,
    7.7383,
    48.4066,
    7.7507,
    48.3414,
    7.737,
    48.3267,
    7.7025,
    48.3112,
    7.6872,
    48.2529,
    7.6134,
    48.1792,
    7.6048,
    48.1526,
    7.5857,
    48.1297,
    7.5726,
    48.095,
    7.5757,
    48.0537,
    7.6189,
    48.0027,
    7.6211,
    47.9714,
    7.5849,
    47.9404,
    7.5789,
    47.9063,
    7.559,
    47.8827,
    7.562,
    47.8392,
    7.5429,
    47.8294,
    7.5259,
    47.7832,
    7.5378,
    47.7318,
    7.5119,
    47.7073,
    7.5179,
    47.675,
    7.5366,
    47.6652,
    7.5903,
    47.6079,
    7.586,
    47.5846,
    7.5263,
    47.5665,
    7.4827,
    47.5423,
    7.5052,
    47.533,
    7.5011,
    47.5173,
    7.4769,
    47.5149,
    7.4845,
    47.4929,
    7.4674,
    47.4819,
    7.4143,
    47.4902,
    7.4276,
    47.4707,
    7.4261,
    47.4558,
    7.4063,
    47.4382,
    7.3785,
    47.4306,
    7.3091,
    47.4327,
    7.2381,
    47.4168,
    7.1683,
    47.4436,
    7.1626,
    47.4599,
    7.1808,
    47.4883,
    7.1037,
    47.4963,
    7.0539,
    47.4904,
    7.0098,
    47.4992,
    6.9733,
    47.4891,
    6.991,
    47.4522,
    6.9685,
    47.4352,
    6.9261,
    47.4249,
    6.9245,
    47.406,
    6.884,
    47.3826,
    6.8666,
    47.3542,
    7.004,
    47.3681,
    7.0443,
    47.3405,
    7.0366,
    47.3295,
    6.9586,
    47.2906,
    6.9522,
    47.27,
    6.9562,
    47.2452,
    6.8883,
    47.2113,
    6.8403,
    47.1695,
    6.7748,
    47.1282,
    6.7448,
    47.1211,
    6.746,
    47.1039,
    6.6897,
    47.0783,
    6.6763,
    47.0624,
    6.6883,
    47.0438,
    6.6654,
    47.0213,
    6.5987,
    46.9865,
    6.4911,
    46.9634,
    6.4426,
    46.9442,
    6.4278,
    46.9091,
    6.4452,
    46.8826,
    6.4468,
    46.8577,
    6.4171,
    46.8022,
    6.4326,
    46.786,
    6.4292,
    46.7608,
    6.3379,
    46.7074,
    6.2663,
    46.6804,
    6.1184,
    46.5835,
    6.1215,
    46.5703,
    6.1457,
    46.5516,
    6.0642,
    46.4711,
    6.0676,
    46.4336,
    6.0542,
    46.4194,
    6.1082,
    46.3965,
    6.1351,
    46.3704,
    6.1364,
    46.3593,
    6.1007,
    46.3014,
    6.094,
    46.253,
    6.0897,
    46.2464,
    6.0429,
    46.2431,
    5.9829,
    46.2227,
    5.9585,
    46.212,
    5.9548,
    46.1999,
    5.9829,
    46.1708,
    5.9588,
    46.1305,
    6.0283,
    46.1479,
    6.0739,
    46.1492,
    6.1079,
    46.1386,
    6.1403,
    46.1502,
    6.1914,
    46.1917,
    6.2812,
    46.2401,
    6.276,
    46.2631,
    6.2523,
    46.2599,
    6.2376,
    46.2679,
    6.2141,
    46.3155,
    6.2195,
    46.3291,
    6.2691,
    46.375,
    6.3016,
    46.3945,
    6.3977,
    46.4082,
    6.4829,
    46.4486,
    6.547,
    46.4574,
    6.6137,
    46.4559,
    6.7627,
    46.4293,
    6.7871,
    46.4142,
    6.7821,
    46.3785,
    6.7504,
    46.3455,
    6.8277,
    46.2695,
    6.7922,
    46.2217,
    6.7657,
    46.1516,
    6.7743,
    46.1348,
    6.8539,
    46.1226,
    6.8692,
    46.1123,
    6.8486,
    46.085,
    6.8509,
    46.0496,
    6.8692,
    46.0441,
    6.8924,
    46.0556,
    6.9151,
    46.0486,
    6.9877,
    45.9931,
    7.0221,
    45.9253,
    6.9972,
    45.9113,
    6.9692,
    45.8698,
    6.949,
    45.8578,
    6.8735,
    45.8448,
    6.8644,
    45.8269,
    6.8434,
    45.8386,
    6.8008,
    45.8265,
    6.7827,
    45.7953,
    6.7959,
    45.7181,
    6.8431,
    45.6827,
    6.8826,
    45.6755,
    6.9186,
    45.6526,
    6.9634,
    45.6407,
    6.9695,
    45.6258,
    6.9529,
    45.5943,
    6.9698,
    45.567,
    6.9828,
    45.5111,
    7.072,
    45.47,
    7.0968,
    45.4354,
    7.1607,
    45.4109,
    7.1508,
    45.3832,
    7.0926,
    45.324,
    7.1084,
    45.2592,
    7.0812,
    45.2431,
    7.0555,
    45.2137,
    7.0297,
    45.2282,
    6.9587,
    45.2098,
    6.9138,
    45.1702,
    6.8735,
    45.1659,
    6.8682,
    45.1575,
    6.8767,
    45.1412,
    6.8441,
    45.1301,
    6.7364,
    45.1573,
    6.7022,
    45.1412,
    6.6674,
    45.1396,
    6.6027,
    45.1035,
    6.6366,
    45.0745,
    6.6397,
    45.0504,
    6.6517,
    45.0356,
    6.6972,
    45.0269,
    6.7235,
    45.0134,
    6.7279,
    44.9287,
    6.7454,
    44.9078,
    6.8471,
    44.8591,
    6.9327,
    44.8617,
    6.9828,
    44.847,
    7.0071,
    44.8221,
    6.9984,
    44.7938,
    7.019,
    44.7389,
    7.0552,
    44.6849,
    6.9828,
    44.6922,
    6.9599,
    44.6832,
    6.9415,
    44.667,
    6.9343,
    44.6467,
    6.9456,
    44.6254,
    6.8973,
    44.5754,
    6.8464,
    44.5475,
    6.8357,
    44.534,
    6.8388,
    44.5029,
    6.8613,
    44.4749,
    6.9178,
    44.4363,
    6.8772,
    44.4144,
    6.8661,
    44.3721,
    6.9212,
    44.3022,
    6.9592,
    44.2773,
    6.9828,
    44.2417,
    7.0461,
    44.2403,
    7.145,
    44.2072,
    7.2513,
    44.16,
    7.3093,
    44.1475,
    7.331,
    44.1253,
    7.3808,
    44.1229,
    7.5836,
    44.1607,
    7.6247,
    44.1801,
    7.6556,
    44.1761,
    7.6419,
    44.1436,
    7.6919,
    44.0846,
    7.6899,
    44.0673,
    7.6534,
    44.0397,
    7.6309,
    43.9935,
    7.5569,
    43.9441,
    7.4779,
    43.8655,
    7.5023,
    43.7922,
    7.4764,
    43.7845,
    7.4764,
    43.7646,
    7.4375,
    43.7434,
    7.407,
    43.7635,
    7.3875,
    43.7579,
    7.3305,
    43.6864,
    7.2573,
    43.6916,
    7.2285,
    43.6742,
    7.2318,
    43.6635,
    7.2038,
    43.6444,
    7.1967,
    43.6569,
    7.1516,
    43.6548,
    7.1366,
    43.6412,
    7.1262,
    43.6058,
    7.1389,
    43.554,
    7.1255,
    43.5478,
    7.1129,
    43.5645,
    7.0884,
    43.5687,
    7.0372,
    43.5363,
    7.0306,
    43.5479,
    6.9756,
    43.5469,
    6.9621,
    43.5401,
    6.9452,
    43.5273,
    6.9409,
    43.5125,
    6.9543,
    43.5001,
    6.9251,
    43.4728,
    6.9204,
    43.449,
    6.8982,
    43.438,
    6.894,
    43.4276,
    6.8711,
    43.4261,
    6.863,
    43.4394,
    6.8561,
    43.4287,
    6.8601,
    43.4159,
    6.8467,
    43.4126,
    6.8188,
    43.4161,
    6.7831,
    43.4086,
    6.7571,
    43.4227,
    6.7311,
    43.4078,
    6.7328,
    43.3821,
    6.7178,
    43.3669,
    6.7178,
    43.3506,
    6.6746,
    43.3464,
    6.6613,
    43.3223,
    6.5972,
    43.284,
    6.5909,
    43.2689,
    6.6117,
    43.2643,
    6.6724,
    43.2762,
    6.6934,
    43.273,
    6.698,
    43.2655,
    6.6854,
    43.248,
    6.6684,
    43.2395,
    6.6654,
    43.2213,
    6.6798,
    43.2016,
    6.6099,
    43.1734,
    6.5995,
    43.175,
    6.5933,
    43.1877,
    6.5399,
    43.1822,
    6.5267,
    43.1606,
    6.5057,
    43.151,
    6.4792,
    43.1561,
    6.4017,
    43.1469,
    6.3785,
    43.1361,
    6.3661,
    43.1186,
    6.3754,
    43.0908,
    6.3423,
    43.0908,
    6.3257,
    43.1042,
    6.2804,
    43.1187,
    6.2535,
    43.1209,
    6.1932,
    43.1088,
    6.1629,
    43.0926,
    6.1532,
    43.072,
    6.1528,
    43.0481,
    6.1854,
    43.0454,
    6.1801,
    43.0359,
    6.0885,
    43.0348,
    6.1321,
    43.0526,
    6.1291,
    43.0714,
    6.1097,
    43.0843,
    6.027,
    43.0782,
    6.0165,
    43.0989,
    5.9587,
    43.1022,
    5.9341,
    43.1136,
    5.9409,
    43.134,
    5.8794,
    43.1204,
    5.8963,
    43.1154,
    5.9106,
    43.0932,
    5.9514,
    43.08,
    5.9403,
    43.0709,
    5.8753,
    43.0688,
    5.8566,
    43.0448,
    5.819,
    43.0535,
    5.7819,
    43.0791,
    5.8181,
    43.0991,
    5.8115,
    43.1067,
    5.7834,
    43.1146,
    5.7761,
    43.1308,
    5.741,
    43.1321,
    5.6963,
    43.1469,
    5.6877,
    43.1688,
    5.6739,
    43.1799,
    5.6342,
    43.1872,
    5.6124,
    43.1604,
    5.5727,
    43.1691,
    5.525,
    43.2126,
    5.5042,
    43.2057,
    5.3703,
    43.2079,
    5.347,
    43.2159,
    5.3692,
    43.2704,
    5.3573,
    43.2803,
    5.3389,
    43.3343,
    5.2942,
    43.3555,
    5.2383,
    43.328,
    5.1252,
    43.3258,
    5.034,
    43.3355,
    5.0139,
    43.3579,
    5.0056,
    43.3816,
    5.0261,
    43.4093,
    5.0571,
    43.4221,
    5.1738,
    43.4283,
    5.2136,
    43.4578,
    5.2263,
    43.4803,
    5.2228,
    43.504,
    5.1655,
    43.4825,
    5.14,
    43.4858,
    5.1184,
    43.504,
    5.1057,
    43.533,
    5.0537,
    43.5382,
    5.0291,
    43.5586,
    5.0093,
    43.5176,
    5.0147,
    43.4987,
    5.0503,
    43.4767,
    5.0623,
    43.4516,
    5.0511,
    43.4293,
    5.0276,
    43.417,
    4.9985,
    43.4147,
    4.9285,
    43.4401,
    4.8682,
    43.4215,
    4.8503,
    43.4014,
    4.8675,
    43.3651,
    4.901,
    43.367,
    4.8558,
    43.3418,
    4.8333,
    43.382,
    4.7578,
    43.4223,
    4.7424,
    43.4487,
    4.7424,
    43.5245,
    4.7258,
    43.5568,
    4.6946,
    43.5791,
    4.7288,
    43.5279,
    4.7288,
    43.4562,
    4.7425,
    43.4226,
    4.823,
    43.3672,
    4.8203,
    43.3464,
    4.6659,
    43.3475,
    4.5923,
    43.3599,
    4.5663,
    43.3711,
    4.5655,
    43.3879,
    4.5857,
    43.4042,
    4.588,
    43.4169,
    4.5796,
    43.4301,
    4.513,
    43.4558,
    4.4094,
    43.4477,
    4.1817,
    43.4638,
    4.1328,
    43.487,
    4.1172,
    43.5105,
    4.1328,
    43.5328,
    4.1053,
    43.5519,
    4.0475,
    43.5561,
    3.953,
    43.5399,
    3.7399,
    43.4128,
    3.6222,
    43.3749,
    3.5897,
    43.3549,
    3.5134,
    43.2811,
    3.4924,
    43.2743,
    3.4524,
    43.2888,
    3.3854,
    43.2839,
    3.3177,
    43.2631,
    3.2443,
    43.2194,
    3.114,
    43.1063,
    3.0704,
    43.0269,
    3.039,
    42.9428,
    3.0418,
    42.9328,
    3.0547,
    42.9271,
    3.0561,
    42.9071,
    3.0405,
    42.7902,
    3.0418,
    42.6291,
    3.0518,
    42.5549,
    3.0661,
    42.5421,
    3.1374,
    42.5249,
    3.1459,
    42.515,
    3.1431,
    42.4921,
    3.1759,
    42.4565,
    3.181,
    42.4315,
    3.0861,
    42.4272,
    3.0536,
    42.4376,
    3.0296,
    42.4657,
    2.9831,
    42.4693,
    2.9661,
    42.461,
    2.9337,
    42.4702,
    2.9008,
    42.4513,
    2.8508,
    42.4484,
    2.7886,
    42.412,
    2.7081,
    42.4129,
    2.6904,
    42.4062,
    2.6403,
    42.3728,
    2.6622,
    42.339,
    2.5481,
    42.3522,
    2.532,
    42.3308,
    2.5148,
    42.3257,
    2.4456,
    42.352,
    2.4225,
    42.3837,
    2.3755,
    42.3893,
    2.2774,
    42.4286,
    2.1842,
    42.4118,
    2.137,
    42.4162,
    2.121,
    42.4106,
    2.104,
    42.3848,
    2.0517,
    42.3524,
    1.9957,
    42.3487,
    1.9637,
    42.3672,
    1.9275,
    42.4369,
    1.8698,
    42.4468,
    1.7927,
    42.4817,
    1.7122,
    42.4937,
    1.7106,
    42.5277,
    1.7217,
    42.5485,
    1.74,
    42.5616,
    1.7651,
    42.5634,
    1.7527,
    42.5767,
    1.7133,
    42.5895,
    1.722,
    42.6099,
    1.6083,
    42.6181,
    1.5431,
    42.6494,
    1.4668,
    42.6415,
    1.4514,
    42.6021,
    1.4293,
    42.5954,
    1.3611,
    42.6867,
    1.3382,
    42.6944,
    1.3426,
    42.7087,
    1.1959,
    42.7136,
    1.1515,
    42.7067,
    1.1343,
    42.716,
    1.1067,
    42.7596,
    1.0891,
    42.7713,
    0.9829,
    42.7804,
    0.9503,
    42.7961,
    0.9211,
    42.7844,
    0.8129,
    42.8316,
    0.7068,
    42.8466,
    0.6563,
    42.8384,
    0.6537,
    42.8027,
    0.6397,
    42.7747,
    0.6507,
    42.7634,
    0.6335,
    42.7448,
    0.6596,
    42.7299,
    0.6654,
    42.6987,
    0.6436,
    42.6845,
    0.4669,
    42.6904,
    0.4093,
    42.6823,
    0.3893,
    42.6851,
    0.3818,
    42.7001,
    0.3542,
    42.7175,
    0.336,
    42.7127,
    0.2902,
    42.6703,
    0.2754,
    42.6687,
    0.2384,
    42.7104,
    0.1692,
    42.7265,
    -0.0389,
    42.6851,
    -0.119,
    42.7169,
    -0.1231,
    42.7304,
    -0.1578,
    42.7607,
    -0.1614,
    42.7953,
    -0.2084,
    42.7839,
    -0.2351,
    42.7862,
    -0.247,
    42.8048,
    -0.3228,
    42.8425,
    -0.3352,
    42.825,
    -0.3517,
    42.8292,
    -0.4239,
    42.7907,
    -0.4545,
    42.7889,
    -0.5084,
    42.8075,
    -0.5339,
    42.808,
    -0.5356,
    42.7842,
    -0.569,
    42.7726,
    -0.5787,
    42.7773,
    -0.5829,
    42.7958,
    -0.6102,
    42.7991,
    -0.6095,
    42.8114,
    -0.6483,
    42.8498,
    -0.7004,
    42.8764,
    -0.7301,
    42.8775,
    -0.7403,
    42.8848,
    -0.7459,
    42.8939,
    -0.7409,
    42.9109,
    -0.7597,
    42.9465,
    -0.7864,
    42.9533,
    -0.8635,
    42.9431,
    -0.9432,
    42.9479,
    -0.9815,
    42.957,
    -1.0285,
    42.9867,
    -1.0797,
    42.9934,
    -1.1124,
    43.0083,
    -1.1499,
    43.0057,
    -1.2169,
    43.0393,
    -1.2937,
    43.0552,
    -1.3151,
    43.0829,
    -1.286,
    43.1092,
    -1.3086,
    43.1136,
    -1.3483,
    43.0931,
    -1.3661,
    43.0333,
    -1.4105,
    43.0309,
    -1.4571,
    43.0451,
    -1.4878,
    43.0818,
    -1.4258,
    43.1353,
    -1.3997,
    43.2067,
    -1.4035,
    43.2433,
    -1.4322,
    43.265,
    -1.4664,
    43.2608,
    -1.5081,
    43.2768,
    -1.559,
    43.2841,
    -1.574,
    43.2774,
    -1.5876,
    43.2516,
    -1.6219,
    43.247,
    -1.639,
    43.2557,
    -1.645,
    43.2924,
    -1.6549,
    43.2975,
    -1.683,
    43.3049,
    -1.7474,
    43.291,
    -1.7558,
    43.3185,
    -1.7969,
    43.3411,
    -1.7964,
    43.3744,
    -1.7941,
    43.386,
    -1.7755,
    43.3762,
    -1.7496,
    43.3892,
    -1.661,
    43.3997,
    -1.6378,
    43.4238,
    -1.5967,
    43.4425,
    -1.5621,
    43.4934,
    -1.4769,
    43.5801,
    -1.3461,
    44.0192,
    -1.2816,
    44.3022,
    -1.2473,
    44.5045,
    -1.2572,
    44.5561,
    -1.2308,
    44.5836,
    -1.2063,
    44.6479,
    -1.1865,
    44.6655,
    -1.1002,
    44.6553,
    -1.0447,
    44.6694,
    -1.0444,
    44.6846,
    -1.0692,
    44.7032,
    -1.0555,
    44.7032,
    -1.0653,
    44.7175,
    -1.1409,
    44.7681,
    -1.1722,
    44.7783,
    -1.2336,
    44.7069,
    -1.2604,
    44.6274,
    -1.1995,
    45.1208,
    -1.1579,
    45.2791,
    -1.14,
    45.4901,
    -1.0853,
    45.569,
    -1.0586,
    45.5696,
    -1.0623,
    45.5324,
    -1.0399,
    45.5073,
    -0.973,
    45.4705,
    -0.9153,
    45.4504,
    -0.7662,
    45.3261,
    -0.716,
    45.1345,
    -0.6822,
    45.0765,
    -0.6482,
    45.0449,
    -0.569,
    44.998,
    -0.5592,
    44.9761,
    -0.5565,
    44.9185,
    -0.5347,
    44.895,
    -0.5485,
    44.9495,
    -0.539,
    44.9765,
    -0.5504,
    44.9982,
    -0.5962,
    45.0246,
    -0.5394,
    45.0195,
    -0.4938,
    44.998,
    -0.519,
    45.0294,
    -0.6022,
    45.0535,
    -0.6378,
    45.0731,
    -0.656,
    45.0991,
    -0.7197,
    45.3611,
    -0.753,
    45.4241,
    -0.7955,
    45.4771,
    -0.8418,
    45.5146,
    -0.9835,
    45.587,
    -0.9909,
    45.6101,
    -1.0303,
    45.6229,
    -1.0838,
    45.6604,
    -1.1493,
    45.6789,
    -1.1942,
    45.7102,
    -1.2294,
    45.7048,
    -1.2473,
    45.7099,
    -1.2303,
    45.7924,
    -1.1638,
    45.8067,
    -1.1443,
    45.8061,
    -1.0572,
    45.7402,
    -0.9872,
    45.7174,
    -1.1254,
    45.8077,
    -1.1517,
    45.8681,
    -1.1125,
    45.8957,
    -1.0734,
    45.9044,
    -1.0704,
    45.9263,
    -1.0898,
    45.9508,
    -1.0692,
    45.9643,
    -1.0966,
    45.9854,
    -1.1107,
    46.0184,
    -1.073,
    46.0075,
    -1.0597,
    46.0158,
    -1.0487,
    46.0388,
    -1.0842,
    46.0565,
    -1.097,
    46.1015,
    -1.129,
    46.1158,
    -1.117,
    46.1282,
    -1.1521,
    46.1439,
    -1.1517,
    46.1562,
    -1.2002,
    46.1591,
    -1.2108,
    46.1745,
    -1.1852,
    46.1972,
    -1.1905,
    46.2163,
    -1.1796,
    46.2295,
    -1.1107,
    46.2592,
    -1.1027,
    46.272,
    -1.1107,
    46.3027,
    -1.1325,
    46.3241,
    -1.1772,
    46.3262,
    -1.2143,
    46.3107,
    -1.2132,
    46.2791,
    -1.2401,
    46.2842,
    -1.2774,
    46.3195,
    -1.3035,
    46.3239,
    -1.3702,
    46.3542,
    -1.4487,
    46.3434,
    -1.4655,
    46.39,
    -1.4814,
    46.4082,
    -1.5045,
    46.4193,
    -1.6256,
    46.4311,
    -1.6172,
    46.4435,
    -1.6335,
    46.4543,
    -1.6868,
    46.4609,
    -1.7203,
    46.4813,
    -1.7611,
    46.492,
    -1.7892,
    46.5329,
    -1.7817,
    46.4954,
    -1.7954,
    46.4945,
    -1.8048,
    46.5036,
    -1.8271,
    46.577,
    -1.8227,
    46.5944,
    -1.8387,
    46.5991,
    -1.8574,
    46.6353,
    -1.8998,
    46.6662,
    -1.9099,
    46.6918,
    -1.9565,
    46.7043,
    -1.9946,
    46.752,
    -2.0503,
    46.7921,
    -2.1188,
    46.82,
    -2.13,
    46.8547,
    -2.1288,
    46.8935,
    -2.0963,
    46.9165,
    -2.1022,
    46.9306,
    -2.0492,
    46.9575,
    -2.0083,
    47.0264,
    -1.9907,
    47.0354,
    -2.0038,
    47.07,
    -2.03,
    47.0921,
    -2.0902,
    47.1152,
    -2.2055,
    47.1291,
    -2.2411,
    47.1425,
    -2.2054,
    47.1612,
    -2.1652,
    47.1679,
    -2.1587,
    47.2045,
    -2.1721,
    47.2353,
    -2.1606,
    47.2712,
    -2.1277,
    47.2868,
    -2.0146,
    47.3001,
    -1.9991,
    47.2886,
    -1.9479,
    47.2794,
    -1.9325,
    47.2797,
    -1.9394,
    47.2864,
    -1.9171,
    47.2842,
    -1.8984,
    47.2734,
    -1.9189,
    47.2734,
    -1.9189,
    47.266,
    -1.8778,
    47.2455,
    -1.8363,
    47.2399,
    -1.8039,
    47.219,
    -1.727,
    47.2108,
    -1.7882,
    47.2256,
    -1.8359,
    47.2598,
    -1.9056,
    47.2939,
    -2.0101,
    47.3197,
    -2.1481,
    47.3132,
    -2.1796,
    47.3001,
    -2.2063,
    47.2734,
    -2.2784,
    47.2464,
    -2.3161,
    47.2517,
    -2.3714,
    47.2864,
    -2.4049,
    47.2864,
    -2.4192,
    47.266,
    -2.4484,
    47.2666,
    -2.542,
    47.3001,
    -2.542,
    47.307,
    -2.519,
    47.3046,
    -2.4761,
    47.2907,
    -2.4534,
    47.2933,
    -2.4362,
    47.307,
    -2.4806,
    47.3479,
    -2.4943,
    47.3417,
    -2.4889,
    47.3304,
    -2.5017,
    47.3206,
    -2.5033,
    47.3496,
    -2.5148,
    47.3649,
    -2.5564,
    47.3832,
    -2.4768,
    47.4157,
    -2.439,
    47.41,
    -2.4464,
    47.4025,
    -2.439,
    47.3963,
    -2.3918,
    47.4237,
    -2.4482,
    47.4306,
    -2.439,
    47.4448,
    -2.4889,
    47.4592,
    -2.4806,
    47.4782,
    -2.4947,
    47.4912,
    -2.4836,
    47.498,
    -2.3639,
    47.5062,
    -2.4254,
    47.5062,
    -2.5175,
    47.5284,
    -2.6217,
    47.5134,
    -2.632,
    47.5198,
    -2.5994,
    47.5291,
    -2.5768,
    47.5539,
    -2.5923,
    47.5436,
    -2.6383,
    47.5403,
    -2.6239,
    47.5372,
    -2.6178,
    47.5267,
    -2.6655,
    47.5335,
    -2.6671,
    47.5096,
    -2.6807,
    47.5042,
    -2.714,
    47.5124,
    -2.8171,
    47.4992,
    -2.8437,
    47.5124,
    -2.869,
    47.5422,
    -2.9093,
    47.5584,
    -2.8653,
    47.5666,
    -2.8506,
    47.5465,
    -2.8324,
    47.554,
    -2.8164,
    47.5465,
    -2.8096,
    47.5676,
    -2.794,
    47.5551,
    -2.7414,
    47.5513,
    -2.7202,
    47.5608,
    -2.7277,
    47.5676,
    -2.6886,
    47.6044,
    -2.684,
    47.623,
    -2.7065,
    47.6427,
    -2.6956,
    47.6234,
    -2.714,
    47.616,
    -2.6998,
    47.6092,
    -2.7086,
    47.6023,
    -2.7754,
    47.6291,
    -2.7345,
    47.6223,
    -2.7463,
    47.6339,
    -2.7891,
    47.6427,
    -2.7754,
    47.6365,
    -2.8477,
    47.6262,
    -2.8668,
    47.6072,
    -2.9194,
    47.5955,
    -2.9127,
    47.6092,
    -2.9399,
    47.6018,
    -2.9448,
    47.6241,
    -2.9331,
    47.6365,
    -2.958,
    47.6422,
    -2.9672,
    47.6638,
    -2.9747,
    47.6638,
    -2.9636,
    47.6026,
    -2.9331,
    47.5744,
    -2.9399,
    47.5608,
    -2.9945,
    47.5955,
    -2.9886,
    47.5823,
    -3.0034,
    47.5787,
    -3.0118,
    47.6072,
    -3.0217,
    47.5945,
    -3.0157,
    47.5812,
    -3.0424,
    47.5881,
    -3.0738,
    47.5765,
    -3.1037,
    47.5812,
    -3.0907,
    47.5881,
    -3.1233,
    47.5988,
    -3.1317,
    47.5881,
    -3.118,
    47.5812,
    -3.1289,
    47.5476,
    -3.1233,
    47.519,
    -3.0845,
    47.4782,
    -3.1317,
    47.4782,
    -3.1454,
    47.5161,
    -3.1317,
    47.5574,
    -3.1412,
    47.598,
    -3.1665,
    47.6223,
    -3.2006,
    47.6396,
    -3.1864,
    47.6806,
    -3.1112,
    47.7042,
    -3.118,
    47.7321,
    -3.1391,
    47.7247,
    -3.1391,
    47.7526,
    -3.1532,
    47.742,
    -3.1932,
    47.7464,
    -3.1697,
    47.7354,
    -3.1591,
    47.711,
    -3.2074,
    47.6973,
    -3.1932,
    47.6837,
    -3.2071,
    47.6791,
    -3.2242,
    47.6564,
    -3.2621,
    47.6837,
    -3.3583,
    47.6973,
    -3.3224,
    47.701,
    -3.2826,
    47.6911,
    -3.2985,
    47.7038,
    -3.3583,
    47.711,
    -3.3583,
    47.7185,
    -3.3451,
    47.7213,
    -3.3406,
    47.7395,
    -3.3173,
    47.739,
    -3.2826,
    47.7873,
    -3.3318,
    47.7525,
    -3.3832,
    47.737,
    -3.3645,
    47.7185,
    -3.4464,
    47.7046,
    -3.4607,
    47.7076,
    -3.4949,
    47.739,
    -3.5283,
    47.7799,
    -3.5393,
    47.7737,
    -3.6252,
    47.7799,
    -3.649,
    47.7936,
    -3.7062,
    47.7969,
    -3.7232,
    47.8134,
    -3.7754,
    47.7936,
    -3.7899,
    47.8032,
    -3.8517,
    47.801,
    -3.8865,
    47.8375,
    -3.8859,
    47.855,
    -3.9132,
    47.8625,
    -3.9351,
    47.8879,
    -3.9618,
    47.9,
    -3.9883,
    47.9035,
    -3.9792,
    47.883,
    -3.9865,
    47.8679,
    -4.0089,
    47.8513,
    -4.0292,
    47.855,
    -4.0112,
    47.8559,
    -4.0019,
    47.8693,
    -4.0316,
    47.8637,
    -4.0367,
    47.855,
    -4.0649,
    47.8708,
    -4.1066,
    47.8801,
    -4.1291,
    47.9076,
    -4.1322,
    47.9239,
    -4.1427,
    47.912,
    -4.1112,
    47.8693,
    -4.1527,
    47.855,
    -4.1716,
    47.877,
    -4.1856,
    47.8744,
    -4.1885,
    47.8621,
    -4.1739,
    47.855,
    -4.18,
    47.842,
    -4.1527,
    47.842,
    -4.1527,
    47.8345,
    -4.1852,
    47.8134,
    -4.2252,
    47.8024,
    -4.3718,
    47.8072,
    -4.3718,
    47.8345,
    -4.3476,
    47.8383,
    -4.3473,
    47.8629,
    -4.372,
    47.9158,
    -4.4346,
    47.9757,
    -4.5333,
    48.0263,
    -4.572,
    48.0059,
    -4.602,
    48.0256,
    -4.653,
    48.0263,
    -4.7281,
    48.0406,
    -4.7008,
    48.0748,
    -4.6837,
    48.0673,
    -4.3619,
    48.1157,
    -4.3048,
    48.1041,
    -4.2854,
    48.1154,
    -4.2757,
    48.1436,
    -4.2943,
    48.1671,
    -4.3024,
    48.1964,
    -4.3661,
    48.2152,
    -4.3793,
    48.2324,
    -4.4044,
    48.2261,
    -4.4576,
    48.249,
    -4.4855,
    48.2426,
    -4.5316,
    48.1831,
    -4.5575,
    48.1772,
    -4.5438,
    48.2051,
    -4.5636,
    48.2324,
    -4.5472,
    48.2526,
    -4.5541,
    48.2628,
    -4.6263,
    48.2665,
    -4.6263,
    48.2871,
    -4.5752,
    48.29,
    -4.5773,
    48.3075,
    -4.5595,
    48.3387,
    -4.5467,
    48.3468,
    -4.5301,
    48.3416,
    -4.5432,
    48.3047,
    -4.5155,
    48.2958,
    -4.4265,
    48.3,
    -4.389,
    48.2871,
    -4.2626,
    48.3,
    -4.2899,
    48.2938,
    -4.2694,
    48.2884,
    -4.1875,
    48.3,
    -4.1875,
    48.3075,
    -4.2188,
    48.3061,
    -4.2305,
    48.3099,
    -4.2347,
    48.3217,
    -4.2577,
    48.3113,
    -4.2757,
    48.3249,
    -4.3247,
    48.3217,
    -4.2694,
    48.3627,
    -4.3247,
    48.3485,
    -4.3247,
    48.3553,
    -4.3173,
    48.3553,
    -4.3173,
    48.3627,
    -4.3247,
    48.3627,
    -4.3377,
    48.3485,
    -4.3526,
    48.3527,
    -4.3842,
    48.3381,
    -4.4066,
    48.3354,
    -4.3992,
    48.3416,
    -4.4066,
    48.3485,
    -4.4537,
    48.3354,
    -4.3966,
    48.3878,
    -4.2899,
    48.4316,
    -4.359,
    48.4111,
    -4.4265,
    48.4037,
    -4.5206,
    48.3683,
    -4.5994,
    48.3502,
    -4.6905,
    48.3627,
    -4.6957,
    48.345,
    -4.7045,
    48.3416,
    -4.7684,
    48.3454,
    -4.7834,
    48.3764,
    -4.7648,
    48.3776,
    -4.7663,
    48.3904,
    -4.7834,
    48.4174,
    -4.7849,
    48.4362,
    -4.7681,
    48.4687,
    -4.7493,
    48.4726,
    -4.7493,
    48.4788,
    -4.7746,
    48.4913,
    -4.7646,
    48.5202,
    -4.722,
    48.5682,
    -4.7008,
    48.5607,
    -4.7082,
    48.5682,
    -4.6923,
    48.5755,
    -4.6425,
    48.5819,
    -4.5773,
    48.5682,
    -4.6077,
    48.603,
    -4.5946,
    48.6091,
    -4.5301,
    48.6017,
    -4.5575,
    48.6091,
    -4.5526,
    48.6165,
    -4.5636,
    48.6296,
    -4.4855,
    48.6296,
    -4.4066,
    48.6433,
    -4.4265,
    48.6501,
    -4.4265,
    48.6575,
    -4.3433,
    48.6789,
    -4.3173,
    48.678,
    -4.2991,
    48.6636,
    -4.3065,
    48.6415,
    -4.2421,
    48.6575,
    -4.1938,
    48.6501,
    -4.1938,
    48.6575,
    -4.213,
    48.6612,
    -4.1739,
    48.6911,
    -4.1315,
    48.6992,
    -4.0907,
    48.6911,
    -4.0793,
    48.6969,
    -4.064,
    48.6849,
    -4.0533,
    48.6955,
    -4.0565,
    48.7121,
    -3.974,
    48.7328,
    -3.9678,
    48.7296,
    -3.9727,
    48.7077,
    -3.961,
    48.7047,
    -3.9678,
    48.6911,
    -3.951,
    48.6794,
    -3.9547,
    48.6575,
    -3.9119,
    48.6812,
    -3.892,
    48.678,
    -3.9063,
    48.6644,
    -3.8517,
    48.6296,
    -3.8443,
    48.6501,
    -3.8579,
    48.6849,
    -3.8375,
    48.6706,
    -3.8371,
    48.7073,
    -3.8293,
    48.7185,
    -3.817,
    48.7121,
    -3.8101,
    48.7332,
    -3.7971,
    48.7212,
    -3.7319,
    48.719,
    -3.6866,
    48.6986,
    -3.6382,
    48.7047,
    -3.6385,
    48.6878,
    -3.5848,
    48.6828,
    -3.5705,
    48.688,
    -3.5845,
    48.7264,
    -3.5805,
    48.7332,
    -3.5283,
    48.7395,
    -3.5774,
    48.7742,
    -3.5815,
    48.7906,
    -3.5426,
    48.8078,
    -3.5153,
    48.8419,
    -3.4197,
    48.8214,
    -3.4333,
    48.8078,
    -3.3976,
    48.8073,
    -3.3718,
    48.8225,
    -3.2758,
    48.8494,
    -3.2595,
    48.8477,
    -3.2297,
    48.8723,
    -3.2136,
    48.8698,
    -3.2071,
    48.8554,
    -3.215,
    48.8179,
    -3.2279,
    48.8078,
    -3.2205,
    48.7941,
    -3.2087,
    48.8164,
    -3.1454,
    48.8624,
    -3.135,
    48.8592,
    -3.1037,
    48.8767,
    -3.0915,
    48.8713,
    -3.0837,
    48.8517,
    -3.0907,
    48.8357,
    -3.0771,
    48.8283,
    -3.1255,
    48.76,
    -3.118,
    48.76,
    -3.0655,
    48.824,
    -3.0287,
    48.8288,
    -3.0082,
    48.8214,
    -3.0157,
    48.8146,
    -3.0082,
    48.8078,
    -3.0424,
    48.7941,
    -3.0424,
    48.7879,
    -3.0037,
    48.7739,
    -2.9331,
    48.7674,
    -2.9331,
    48.7463,
    -2.9467,
    48.7332,
    -2.827,
    48.6575,
    -2.8114,
    48.6146,
    -2.813,
    48.5986,
    -2.714,
    48.5607,
    -2.7345,
    48.534,
    -2.7131,
    48.5301,
    -2.6824,
    48.509,
    -2.6761,
    48.5402,
    -2.62,
    48.5436,
    -2.5694,
    48.5887,
    -2.4595,
    48.6365,
    -2.4595,
    48.6433,
    -2.4875,
    48.6501,
    -2.4429,
    48.6591,
    -2.4211,
    48.657,
    -2.4123,
    48.6433,
    -2.3862,
    48.6501,
    -2.33,
    48.6804,
    -2.3161,
    48.6986,
    -2.3053,
    48.6796,
    -2.282,
    48.678,
    -2.282,
    48.6706,
    -2.3303,
    48.6296,
    -2.3127,
    48.6202,
    -2.251,
    48.6501,
    -2.2373,
    48.6159,
    -2.2192,
    48.6037,
    -2.2137,
    48.5819,
    -2.1955,
    48.5935,
    -2.1926,
    48.6159,
    -2.1741,
    48.583,
    -2.1591,
    48.5887,
    -2.1721,
    48.6017,
    -2.161,
    48.613,
    -2.137,
    48.618,
    -2.1243,
    48.6091,
    -2.1448,
    48.6365,
    -2.0524,
    48.6501,
    -2.022,
    48.5989,
    -2.0009,
    48.5887,
    -2.0083,
    48.575,
    -1.9764,
    48.5356,
    -1.9803,
    48.5136,
    -1.9394,
    48.534,
    -1.9673,
    48.5471,
    -1.9619,
    48.5549,
    -1.9803,
    48.5887,
    -1.953,
    48.575,
    -1.9694,
    48.5928,
    -2.0005,
    48.6013,
    -2.0287,
    48.6433,
    -2.0181,
    48.6603,
    -1.9877,
    48.6738,
    -1.9859,
    48.6879,
    -1.9394,
    48.6911,
    -1.9456,
    48.6986,
    -1.8437,
    48.7121,
    -1.8469,
    48.7034,
    -1.8363,
    48.6911,
    -1.8612,
    48.6642,
    -1.861,
    48.6409,
    -1.8382,
    48.6238,
    -1.796,
    48.6159,
    -1.644,
    48.6234,
    -1.5797,
    48.6433,
    -1.5006,
    48.6365,
    -1.3931,
    48.6524,
    -1.3566,
    48.6433,
    -1.3723,
    48.6606,
    -1.3946,
    48.6683,
    -1.4329,
    48.6706,
    -1.4433,
    48.6628,
    -1.4558,
    48.6834,
    -1.5027,
    48.6955,
    -1.5165,
    48.7252,
    -1.5536,
    48.7471,
    -1.5668,
    48.8222,
    -1.5788,
    48.8378,
    -1.6029,
    48.8419,
    -1.6029,
    48.8494,
    -1.5785,
    48.8626,
    -1.5637,
    48.9221,
    -1.557,
    48.9323,
    -1.5484,
    48.9238,
    -1.5428,
    48.9352,
    -1.547,
    48.9497,
    -1.5631,
    48.9576,
    -1.5458,
    49.0303,
    -1.5323,
    49.0351,
    -1.508,
    49.0275,
    -1.508,
    49.0337,
    -1.5497,
    49.0398,
    -1.5684,
    49.0327,
    -1.5795,
    49.0132,
    -1.5936,
    49.029,
    -1.5893,
    49.0821,
    -1.6034,
    49.084,
    -1.6077,
    49.1027,
    -1.5959,
    49.1285,
    -1.5695,
    49.1435,
    -1.5818,
    49.1498,
    -1.5893,
    49.1435,
    -1.6104,
    49.2159,
    -1.6027,
    49.2254,
    -1.5484,
    49.2193,
    -1.5484,
    49.2255,
    -1.6169,
    49.2382,
    -1.6247,
    49.2193,
    -1.6405,
    49.2315,
    -1.6571,
    49.2684,
    -1.6719,
    49.2801,
    -1.6582,
    49.2875,
    -1.6991,
    49.3135,
    -1.7067,
    49.3292,
    -1.6862,
    49.3292,
    -1.6862,
    49.3354,
    -1.6991,
    49.3559,
    -1.7067,
    49.3559,
    -1.7148,
    49.3385,
    -1.7755,
    49.3701,
    -1.768,
    49.3837,
    -1.8068,
    49.3769,
    -1.8165,
    49.3837,
    -1.8194,
    49.4521,
    -1.8437,
    49.4936,
    -1.8847,
    49.5309,
    -1.8784,
    49.5449,
    -1.8437,
    49.5718,
    -1.8395,
    49.6198,
    -1.8695,
    49.6617,
    -1.9456,
    49.678,
    -1.9352,
    49.7241,
    -1.9084,
    49.7264,
    -1.8673,
    49.7127,
    -1.8394,
    49.7154,
    -1.8246,
    49.7084,
    -1.8165,
    49.6916,
    -1.6172,
    49.6643,
    -1.6067,
    49.6501,
    -1.5729,
    49.6643,
    -1.5404,
    49.6578,
    -1.5115,
    49.6625,
    -1.4557,
    49.7022,
    -1.4095,
    49.7116,
    -1.2631,
    49.6955,
    -1.2278,
    49.6241,
    -1.2533,
    49.6123,
    -1.264,
    49.5893,
    -1.3014,
    49.5818,
    -1.3063,
    49.5581,
    -1.2616,
    49.4931,
    -1.1757,
    49.4152,
    -1.1722,
    49.3934,
    -1.1852,
    49.3664,
    -1.182,
    49.3562,
    -1.1517,
    49.3627,
    -1.1229,
    49.3454,
    -1.1034,
    49.349,
    -1.1138,
    49.3658,
    -1.1064,
    49.3795,
    -1.0723,
    49.3968,
    -0.9404,
    49.3923,
    -0.8221,
    49.3627,
    -0.6508,
    49.3559,
    -0.5834,
    49.3459,
    -0.5469,
    49.359,
    -0.4795,
    49.3428,
    -0.4111,
    49.3428,
    -0.3634,
    49.325,
    -0.3131,
    49.3173,
    -0.2195,
    49.2801,
    -0.1941,
    49.2952,
    -0.0338,
    49.3201,
    0.0129,
    49.3346,
    0.0631,
    49.3545,
    0.096,
    49.3837,
    0.1624,
    49.4152,
    0.4113,
    49.4521,
    0.4573,
    49.4674,
    0.4932,
    49.4936,
    0.4221,
    49.4644,
    0.3396,
    49.4567,
    0.2568,
    49.4641,
    0.1044,
    49.4936,
    0.0786,
    49.5155,
    0.0766,
    49.535,
    0.1309,
    49.6035,
    0.1709,
    49.6916,
    0.2359,
    49.7293,
    0.3875,
    49.7751,
    0.5967,
    49.8572,
    0.6748,
    49.8758,
    0.7609,
    49.8751,
    1.1726,
    49.961,
    1.2212,
    49.979,
    1.261,
    50.0075,
    1.3913,
    50.0752,
    1.4558,
    50.1236,
    1.4868,
    50.185,
    1.521,
    50.2147,
    1.5553,
    50.2177,
    1.6543,
    50.1866,
    1.6725,
    50.1925,
    1.6725,
    50.1994,
    1.6553,
    50.2005,
    1.6445,
    50.2124,
    1.665,
    50.2124,
    1.665,
    50.2198,
    1.6255,
    50.2243,
    1.61,
    50.2322,
    1.5939,
    50.2563,
    1.5415,
    50.2779,
    1.5515,
    50.3491,
    1.572,
    50.3757,
    1.6104,
    50.3707,
    1.6104,
    50.3769,
    1.5552,
    50.4048,
    1.5735,
    50.4454,
    1.5793,
    50.5331,
    1.6104,
    50.5482,
    1.5779,
    50.5886,
    1.5632,
    50.6783,
    1.5676,
    50.7167,
    1.6056,
    50.79,
    1.5806,
    50.8688,
    1.6048,
    50.881,
    1.6533,
    50.8891,
    1.7298,
    50.9439,
    1.9214,
    50.9968,
    2.134,
    51.02,
    2.3161,
    51.059,
    2.3845,
    51.0553,
    2.4661,
    51.0688
  ],
  [
    8.5658,
    42.2086,
    8.5741,
    42.2199,
    8.5453,
    42.2329,
    8.5495,
    42.2423,
    8.5863,
    42.2434,
    8.6878,
    42.2729,
    8.6887,
    42.281,
    8.6348,
    42.3048,
    8.6252,
    42.3192,
    8.6053,
    42.3105,
    8.5999,
    42.3219,
    8.6348,
    42.3389,
    8.6128,
    42.3524,
    8.5521,
    42.3389,
    8.5596,
    42.3464,
    8.5491,
    42.3771,
    8.5521,
    42.3867,
    8.5705,
    42.3818,
    8.5863,
    42.393,
    8.5986,
    42.3876,
    8.6187,
    42.4196,
    8.6595,
    42.4299,
    8.6614,
    42.4519,
    8.6768,
    42.4725,
    8.6571,
    42.48,
    8.6675,
    42.5097,
    8.6804,
    42.5211,
    8.7166,
    42.5307,
    8.7092,
    42.5792,
    8.7197,
    42.576,
    8.7235,
    42.5655,
    8.74,
    42.5723,
    8.7713,
    42.5581,
    8.787,
    42.562,
    8.8075,
    42.5851,
    8.8128,
    42.5996,
    8.8054,
    42.6064,
    8.843,
    42.6081,
    8.9065,
    42.6325,
    9.0183,
    42.6501,
    9.05,
    42.6622,
    9.053,
    42.6816,
    9.1178,
    42.732,
    9.1652,
    42.7352,
    9.2368,
    42.7226,
    9.2647,
    42.7089,
    9.2853,
    42.6748,
    9.2922,
    42.6748,
    9.3425,
    42.7491,
    9.333,
    42.7709,
    9.341,
    42.7901,
    9.3355,
    42.8076,
    9.3057,
    42.8393,
    9.333,
    42.8671,
    9.3263,
    42.8853,
    9.3303,
    42.9036,
    9.3602,
    42.9286,
    9.3602,
    42.9491,
    9.3434,
    42.9731,
    9.3467,
    43.0037,
    9.4224,
    43.0174,
    9.464,
    42.9901,
    9.4539,
    42.9638,
    9.4701,
    42.9423,
    9.4655,
    42.9235,
    9.4844,
    42.8324,
    9.4828,
    42.8023,
    9.4504,
    42.7089,
    9.4504,
    42.6536,
    9.4429,
    42.6406,
    9.4566,
    42.6344,
    9.4617,
    42.6198,
    9.4566,
    42.6064,
    9.4769,
    42.5792,
    9.5119,
    42.5655,
    9.4896,
    42.6126,
    9.5281,
    42.5635,
    9.5334,
    42.4562,
    9.5459,
    42.4351,
    9.5322,
    42.3737,
    9.5596,
    42.2946,
    9.5523,
    42.1702,
    9.5596,
    42.1466,
    9.5456,
    42.104,
    9.5186,
    42.0851,
    9.4032,
    41.9529,
    9.3943,
    41.848,
    9.403,
    41.7797,
    9.4016,
    41.7064,
    9.3722,
    41.6839,
    9.367,
    41.6742,
    9.3807,
    41.6742,
    9.3779,
    41.6564,
    9.3636,
    41.64,
    9.3452,
    41.6403,
    9.3467,
    41.6196,
    9.2922,
    41.6264,
    9.294,
    41.6176,
    9.2786,
    41.5984,
    9.2922,
    41.5916,
    9.3451,
    41.6045,
    9.3542,
    41.5954,
    9.3506,
    41.5812,
    9.3267,
    41.5611,
    9.2997,
    41.5533,
    9.282,
    41.5333,
    9.2647,
    41.5308,
    9.2699,
    41.5168,
    9.2647,
    41.5029,
    9.2791,
    41.4916,
    9.2647,
    41.4761,
    9.2708,
    41.4687,
    9.2107,
    41.4482,
    9.2233,
    41.4273,
    9.2107,
    41.4073,
    9.2503,
    41.4278,
    9.2232,
    41.3725,
    9.2067,
    41.3659,
    9.1691,
    41.3862,
    9.0964,
    41.4035,
    9.1073,
    41.4293,
    9.1213,
    41.4346,
    9.0666,
    41.4619,
    9.0798,
    41.4824,
    9.0387,
    41.4619,
    9.032,
    41.4687,
    9.0387,
    41.4761,
    9.0183,
    41.4687,
    9.001,
    41.4831,
    8.9357,
    41.4892,
    8.9069,
    41.5073,
    8.8836,
    41.5112,
    8.8737,
    41.5234,
    8.8396,
    41.5308,
    8.8533,
    41.5438,
    8.7918,
    41.5612,
    8.7964,
    41.5806,
    8.7781,
    41.5916,
    8.8018,
    41.6391,
    8.819,
    41.6326,
    8.8726,
    41.6511,
    8.8858,
    41.6709,
    8.9227,
    41.6946,
    8.7888,
    41.7126,
    8.7761,
    41.7224,
    8.7849,
    41.7425,
    8.6956,
    41.7294,
    8.703,
    41.7425,
    8.6551,
    41.7499,
    8.6963,
    41.7582,
    8.7175,
    41.772,
    8.7202,
    41.7917,
    8.7092,
    41.8045,
    8.7523,
    41.8098,
    8.7849,
    41.8244,
    8.7723,
    41.8404,
    8.7508,
    41.8455,
    8.7918,
    41.8591,
    8.7781,
    41.8728,
    8.8054,
    41.9069,
    8.7644,
    41.9343,
    8.6143,
    41.9008,
    8.6073,
    41.9138,
    8.6187,
    41.9305,
    8.6144,
    41.9441,
    8.5863,
    41.969,
    8.655,
    41.9787,
    8.6688,
    41.9963,
    8.6561,
    42.0029,
    8.6646,
    42.0145,
    8.7434,
    42.0441,
    8.745,
    42.0566,
    8.7235,
    42.0721,
    8.6992,
    42.1093,
    8.6609,
    42.1055,
    8.6477,
    42.122,
    8.5863,
    42.1335,
    8.5938,
    42.1466,
    8.5596,
    42.154,
    8.5938,
    42.1671,
    8.5938,
    42.1745,
    8.5658,
    42.1745,
    8.5818,
    42.1945
  ],
  [
    -1.2194,
    45.9439,
    -1.2244,
    45.935,
    -1.1852,
    45.916,
    -1.1761,
    45.8987,
    -1.1842,
    45.8563,
    -1.2092,
    45.8142,
    -1.2269,
    45.8198,
    -1.2604,
    45.8818,
    -1.3402,
    45.9387,
    -1.3783,
    45.976,
    -1.3717,
    45.9953,
    -1.4049,
    46.0532,
    -1.3399,
    46.0378,
    -1.2738,
    45.9976,
    -1.2476,
    46.0018,
    -1.2336,
    45.9917,
    -1.2305,
    45.9582
  ]
];

// src/renderer/src/lib/swissBorder.ts
var SWISS_RINGS = [
  [
    10.4538,
    46.8644,
    10.4449,
    46.8232,
    10.4172,
    46.7989,
    10.4287,
    46.7556,
    10.4166,
    46.743,
    10.3997,
    46.7355,
    10.3944,
    46.7008,
    10.3692,
    46.6724,
    10.3775,
    46.6533,
    10.3956,
    46.6388,
    10.4382,
    46.6357,
    10.4591,
    46.6236,
    10.4666,
    46.6043,
    10.4659,
    46.5785,
    10.4579,
    46.5537,
    10.444,
    46.5377,
    10.4259,
    46.5353,
    10.3543,
    46.5483,
    10.3195,
    46.546,
    10.2954,
    46.5511,
    10.2759,
    46.5655,
    10.2347,
    46.5753,
    10.2303,
    46.5862,
    10.2357,
    46.6067,
    10.2338,
    46.618,
    10.2179,
    46.627,
    10.1921,
    46.6268,
    10.0878,
    46.6044,
    10.0712,
    46.5644,
    10.0328,
    46.533,
    10.0281,
    46.4839,
    10.0353,
    46.4711,
    10.044,
    46.467,
    10.0263,
    46.4463,
    10.0421,
    46.4327,
    10.1334,
    46.414,
    10.1408,
    46.4029,
    10.1332,
    46.3811,
    10.105,
    46.3614,
    10.0924,
    46.3381,
    10.0918,
    46.329,
    10.1049,
    46.3094,
    10.1461,
    46.2803,
    10.1589,
    46.2624,
    10.1458,
    46.2433,
    10.1179,
    46.2311,
    10.0757,
    46.22,
    10.0427,
    46.2205,
    10.0418,
    46.2431,
    10.0317,
    46.2601,
    9.9776,
    46.2981,
    9.964,
    46.3561,
    9.9184,
    46.3712,
    9.8554,
    46.367,
    9.7681,
    46.3386,
    9.7201,
    46.3509,
    9.7093,
    46.3424,
    9.7084,
    46.3117,
    9.6931,
    46.2971,
    9.6743,
    46.2918,
    9.5597,
    46.2927,
    9.5365,
    46.2986,
    9.5153,
    46.3086,
    9.5026,
    46.3207,
    9.4826,
    46.3568,
    9.4444,
    46.3753,
    9.4346,
    46.4983,
    9.4107,
    46.4889,
    9.3955,
    46.4694,
    9.3846,
    46.4664,
    9.3516,
    46.4855,
    9.3508,
    46.4979,
    9.331,
    46.5015,
    9.2823,
    46.4974,
    9.2632,
    46.4851,
    9.2458,
    46.461,
    9.238,
    46.4365,
    9.2476,
    46.423,
    9.2609,
    46.4167,
    9.2604,
    46.3797,
    9.2752,
    46.3314,
    9.269,
    46.3094,
    9.2397,
    46.267,
    9.2248,
    46.2312,
    9.2042,
    46.2136,
    9.1813,
    46.2041,
    9.1632,
    46.1723,
    9.0906,
    46.1382,
    9.0721,
    46.1189,
    9.0682,
    46.106,
    9.0703,
    46.0834,
    9.0592,
    46.0618,
    9.0277,
    46.0531,
    9.0021,
    46.0393,
    8.9978,
    46.0279,
    9.0156,
    45.9931,
    8.9827,
    45.972,
    8.9805,
    45.9644,
    8.9934,
    45.9543,
    9.0108,
    45.9267,
    9.0517,
    45.9155,
    9.0631,
    45.899,
    9.0593,
    45.882,
    9.0344,
    45.8481,
    9.0024,
    45.8207,
    8.9396,
    45.8348,
    8.9,
    45.8264,
    8.9138,
    45.8661,
    8.9121,
    45.8834,
    8.871,
    45.9471,
    8.8577,
    45.9571,
    8.8004,
    45.9785,
    8.7679,
    45.9831,
    8.791,
    46.0187,
    8.8196,
    46.0429,
    8.8344,
    46.0664,
    8.8089,
    46.0897,
    8.7471,
    46.0944,
    8.7239,
    46.1095,
    8.6951,
    46.0952,
    8.6775,
    46.0958,
    8.6018,
    46.1228,
    8.5387,
    46.1876,
    8.5103,
    46.2079,
    8.4565,
    46.2248,
    8.4381,
    46.2354,
    8.4272,
    46.2514,
    8.4232,
    46.2758,
    8.4266,
    46.3016,
    8.4429,
    46.3534,
    8.4458,
    46.4124,
    8.4416,
    46.4349,
    8.4279,
    46.4487,
    8.3992,
    46.4522,
    8.3434,
    46.4439,
    8.3163,
    46.4337,
    8.295,
    46.418,
    8.2866,
    46.4054,
    8.297,
    46.3976,
    8.2975,
    46.3875,
    8.2815,
    46.3701,
    8.2417,
    46.3541,
    8.1926,
    46.3092,
    8.1719,
    46.2992,
    8.1069,
    46.2855,
    8.0873,
    46.2718,
    8.0731,
    46.2536,
    8.0999,
    46.2356,
    8.1295,
    46.196,
    8.1323,
    46.1594,
    8.1106,
    46.127,
    8.0669,
    46.1006,
    8.0354,
    46.0965,
    8.0253,
    46.0911,
    8.0182,
    46.0809,
    8.0107,
    46.0297,
    7.9858,
    45.9993,
    7.8982,
    45.9819,
    7.8838,
    45.9739,
    7.8729,
    45.9594,
    7.8702,
    45.9404,
    7.8496,
    45.9397,
    7.8437,
    45.9192,
    7.8312,
    45.9145,
    7.7801,
    45.9181,
    7.732,
    45.9304,
    7.7063,
    45.9257,
    7.694,
    45.9287,
    7.6737,
    45.9503,
    7.643,
    45.9663,
    7.5411,
    45.9841,
    7.5244,
    45.9781,
    7.5037,
    45.9567,
    7.453,
    45.9459,
    7.3938,
    45.9157,
    7.3618,
    45.9078,
    7.2867,
    45.9134,
    7.1837,
    45.8805,
    7.1535,
    45.8765,
    7.0902,
    45.8805,
    7.0669,
    45.8902,
    7.0152,
    45.9333,
    6.9877,
    45.9931,
    6.9151,
    46.0486,
    6.8924,
    46.0556,
    6.8692,
    46.0441,
    6.8509,
    46.0496,
    6.8531,
    46.0761,
    6.8486,
    46.085,
    6.8682,
    46.1047,
    6.8692,
    46.1123,
    6.8539,
    46.1226,
    6.7743,
    46.1348,
    6.7657,
    46.1516,
    6.7749,
    46.1859,
    6.7922,
    46.2217,
    6.8277,
    46.2695,
    6.8049,
    46.2966,
    6.7695,
    46.3227,
    6.7504,
    46.3455,
    6.7557,
    46.3571,
    6.7821,
    46.3785,
    6.7892,
    46.3952,
    6.7871,
    46.4142,
    6.7777,
    46.4241,
    6.7627,
    46.4293,
    6.6137,
    46.4559,
    6.547,
    46.4574,
    6.4829,
    46.4486,
    6.3977,
    46.4082,
    6.3016,
    46.3945,
    6.2691,
    46.375,
    6.2195,
    46.3291,
    6.2141,
    46.3155,
    6.2376,
    46.2679,
    6.2523,
    46.2599,
    6.269,
    46.2652,
    6.276,
    46.2631,
    6.2812,
    46.2401,
    6.2554,
    46.2211,
    6.1914,
    46.1917,
    6.1403,
    46.1502,
    6.1079,
    46.1386,
    6.0739,
    46.1492,
    6.0283,
    46.1479,
    5.9829,
    46.1404,
    5.9588,
    46.1305,
    5.9829,
    46.1708,
    5.9548,
    46.1999,
    5.9585,
    46.212,
    6.0429,
    46.2431,
    6.0619,
    46.2412,
    6.0897,
    46.2464,
    6.1007,
    46.3014,
    6.1364,
    46.3593,
    6.1351,
    46.3704,
    6.1082,
    46.3965,
    6.0542,
    46.4194,
    6.0657,
    46.427,
    6.0676,
    46.4336,
    6.0602,
    46.4599,
    6.0642,
    46.4711,
    6.1457,
    46.5516,
    6.1215,
    46.5703,
    6.1184,
    46.5835,
    6.2663,
    46.6804,
    6.3379,
    46.7074,
    6.3742,
    46.7336,
    6.4074,
    46.7457,
    6.4292,
    46.7608,
    6.4326,
    46.786,
    6.4171,
    46.8022,
    6.4468,
    46.8577,
    6.4452,
    46.8826,
    6.4278,
    46.9091,
    6.4426,
    46.9442,
    6.4911,
    46.9634,
    6.5987,
    46.9865,
    6.6654,
    47.0213,
    6.6883,
    47.0438,
    6.6763,
    47.0624,
    6.6897,
    47.0783,
    6.746,
    47.1039,
    6.7448,
    47.1211,
    6.7748,
    47.1282,
    6.8403,
    47.1695,
    6.8593,
    47.1909,
    6.8883,
    47.2113,
    6.9562,
    47.2452,
    6.9522,
    47.27,
    6.9586,
    47.2906,
    6.9774,
    47.3037,
    6.9919,
    47.306,
    7.0065,
    47.3194,
    7.0366,
    47.3295,
    7.0443,
    47.3405,
    7.004,
    47.3681,
    6.9856,
    47.3621,
    6.8666,
    47.3542,
    6.884,
    47.3826,
    6.8988,
    47.3957,
    6.9245,
    47.406,
    6.9261,
    47.4249,
    6.9685,
    47.4352,
    6.991,
    47.4522,
    6.9733,
    47.4891,
    7.0098,
    47.4992,
    7.0539,
    47.4904,
    7.1037,
    47.4963,
    7.1537,
    47.4864,
    7.1808,
    47.4883,
    7.1626,
    47.4599,
    7.1683,
    47.4436,
    7.2194,
    47.4285,
    7.2381,
    47.4168,
    7.3091,
    47.4327,
    7.3785,
    47.4306,
    7.4063,
    47.4382,
    7.4261,
    47.4558,
    7.4293,
    47.4651,
    7.4144,
    47.484,
    7.4143,
    47.4902,
    7.426,
    47.4925,
    7.4674,
    47.4819,
    7.4845,
    47.4929,
    7.4859,
    47.4984,
    7.4769,
    47.5149,
    7.5011,
    47.5173,
    7.5052,
    47.533,
    7.4827,
    47.5423,
    7.5503,
    47.5755,
    7.637,
    47.595,
    7.6597,
    47.5966,
    7.6465,
    47.5715,
    7.6359,
    47.5646,
    7.6097,
    47.5647,
    7.6614,
    47.5462,
    7.6834,
    47.5443,
    7.7667,
    47.556,
    7.7855,
    47.5632,
    7.8197,
    47.5953,
    7.8337,
    47.5905,
    7.8982,
    47.5878,
    7.9043,
    47.5836,
    7.9122,
    47.5606,
    8.0423,
    47.5606,
    8.0872,
    47.5674,
    8.1139,
    47.5878,
    8.1621,
    47.6038,
    8.179,
    47.6158,
    8.233,
    47.622,
    8.2886,
    47.6158,
    8.3063,
    47.5922,
    8.3541,
    47.581,
    8.4489,
    47.5843,
    8.4618,
    47.6061,
    8.4924,
    47.6198,
    8.5224,
    47.6219,
    8.5607,
    47.5894,
    8.5741,
    47.5924,
    8.5806,
    47.6002,
    8.5803,
    47.639,
    8.5936,
    47.6426,
    8.5951,
    47.6348,
    8.6016,
    47.6326,
    8.6073,
    47.6563,
    8.5682,
    47.6629,
    8.5197,
    47.6574,
    8.4761,
    47.6404,
    8.4583,
    47.6399,
    8.412,
    47.661,
    8.3913,
    47.6655,
    8.3977,
    47.6763,
    8.3921,
    47.6995,
    8.4379,
    47.7232,
    8.4455,
    47.7432,
    8.4636,
    47.7639,
    8.5516,
    47.7793,
    8.5423,
    47.795,
    8.5582,
    47.8012,
    8.6016,
    47.7946,
    8.6076,
    47.7623,
    8.6174,
    47.7573,
    8.6298,
    47.7628,
    8.635,
    47.7846,
    8.6441,
    47.791,
    8.657,
    47.7881,
    8.6819,
    47.7587,
    8.7131,
    47.7574,
    8.7198,
    47.7473,
    8.7004,
    47.7235,
    8.7126,
    47.7087,
    8.7171,
    47.6946,
    8.7699,
    47.6951,
    8.7617,
    47.7013,
    8.7707,
    47.7209,
    8.7976,
    47.72,
    8.8302,
    47.7072,
    8.8561,
    47.6907,
    8.8377,
    47.6878,
    8.8378,
    47.6808,
    8.8817,
    47.6561,
    8.9062,
    47.6518,
    8.9454,
    47.6543,
    8.9818,
    47.6622,
    8.9977,
    47.6738,
    9.0166,
    47.6789,
    9.1834,
    47.6704,
    9.1969,
    47.6561,
    9.2732,
    47.6501,
    9.5475,
    47.5345,
    9.555,
    47.5109,
    9.5845,
    47.4807,
    9.6217,
    47.4692,
    9.6503,
    47.4521,
    9.6495,
    47.4097,
    9.6398,
    47.3945,
    9.601,
    47.3613,
    9.5874,
    47.3278,
    9.5533,
    47.2999,
    9.5046,
    47.2437,
    9.4874,
    47.21,
    9.485,
    47.1763,
    9.5119,
    47.1294,
    9.5124,
    47.108,
    9.5029,
    47.0947,
    9.4759,
    47.0732,
    9.477,
    47.0639,
    9.5606,
    47.0524,
    9.5812,
    47.0569,
    9.5999,
    47.0535,
    9.6691,
    47.0562,
    9.858,
    47.0155,
    9.8563,
    47.0041,
    9.8706,
    46.9988,
    9.8624,
    46.9398,
    9.8751,
    46.9274,
    9.8999,
    46.9144,
    10.0069,
    46.8908,
    10.0456,
    46.8656,
    10.1113,
    46.8471,
    10.1578,
    46.8516,
    10.2014,
    46.8668,
    10.2117,
    46.877,
    10.2199,
    46.9058,
    10.2351,
    46.9233,
    10.2957,
    46.9227,
    10.2962,
    46.9414,
    10.3137,
    46.9643,
    10.3389,
    46.9841,
    10.3679,
    46.9955,
    10.379,
    46.9955,
    10.3947,
    46.9854,
    10.4156,
    46.9624,
    10.4585,
    46.9366,
    10.4638,
    46.9197,
    10.4514,
    46.8858,
    10.4538,
    46.8644
  ],
  [
    9.5212,
    47.2628,
    9.5471,
    47.243,
    9.5404,
    47.2291,
    9.5629,
    47.1977,
    9.5521,
    47.1669,
    9.5818,
    47.1549,
    9.6056,
    47.1323,
    9.6157,
    47.1068,
    9.6088,
    47.0808,
    9.5812,
    47.0569,
    9.5606,
    47.0524,
    9.477,
    47.0639,
    9.4759,
    47.0732,
    9.5029,
    47.0947,
    9.5124,
    47.108,
    9.5119,
    47.1294,
    9.485,
    47.1763,
    9.4874,
    47.21,
    9.5046,
    47.2437,
    9.5212,
    47.2628
  ]
];

// scripts/pistes-build.ts
var [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error("Usage : node --max-old-space-size=6144 scripts/pistes.mjs <planet_pistes.osm.gz> <dossier de sortie>");
  process.exit(1);
}
var ZOOMS = [10, 11, 12, 13, 14];
var M = 0.5;
var R2 = { west: PISTES_REGION.west - M, east: PISTES_REGION.east + M, south: PISTES_REGION.south - M, north: PISTES_REGION.north + M };
var ids = new Float64Array(1 << 22);
var lons = new Float64Array(1 << 22);
var lats = new Float64Array(1 << 22);
var nn = 0;
function addNode(id, lon, lat) {
  if (nn === ids.length) {
    const grow = (a) => {
      const b = new Float64Array(a.length * 2);
      b.set(a);
      return b;
    };
    ids = grow(ids);
    lons = grow(lons);
    lats = grow(lats);
  }
  ids[nn] = id;
  lons[nn] = lon;
  lats[nn] = lat;
  nn++;
}
function findNode(id) {
  let lo = 0;
  let hi = nn - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    const v = ids[mid];
    if (v === id) return mid;
    if (v < id) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
var ways = /* @__PURE__ */ new Map();
var relations = [];
var kind = null;
var curId = 0;
var refs = [];
var members = [];
var tags = {};
var relType = null;
var lines = 0;
var t0 = Date.now();
var rl = createInterface({ input: createReadStream(input).pipe(createGunzip()), crlfDelay: Infinity });
for await (const raw of rl) {
  lines++;
  const l = raw.trimStart();
  if (l.startsWith("<node ")) {
    const lat = Number(xmlAttr(l, "lat"));
    const lon = Number(xmlAttr(l, "lon"));
    if (lon >= R2.west && lon <= R2.east && lat >= R2.south && lat <= R2.north) addNode(Number(xmlAttr(l, "id")), lon, lat);
    kind = l.endsWith("/>") ? null : "node";
  } else if (l.startsWith("<way ")) {
    kind = "way";
    curId = Number(xmlAttr(l, "id"));
    refs = [];
    tags = {};
  } else if (l.startsWith("<nd ")) {
    refs.push(Number(xmlAttr(l, "ref")));
  } else if (l.startsWith("<tag ")) {
    if (kind === "way" || kind === "relation") {
      const k = xmlAttr(l, "k");
      const v = xmlAttr(l, "v");
      if (k && v !== null && keepTag(k)) tags[k] = v;
      if (kind === "relation" && k === "type") relType = v;
    }
  } else if (l.startsWith("</way>")) {
    const coords = [];
    let all = true;
    for (const r of refs) {
      const i = findNode(r);
      if (i < 0) {
        all = false;
        continue;
      }
      coords.push(lons[i], lats[i]);
    }
    if (coords.length >= 4) ways.set(curId, { coords, closed: all && refs.length > 3 && refs[0] === refs[refs.length - 1], tags });
    kind = null;
  } else if (l.startsWith("<relation ")) {
    kind = "relation";
    members = [];
    tags = {};
    relType = null;
  } else if (l.startsWith("<member ")) {
    if (xmlAttr(l, "type") === "way") members.push(Number(xmlAttr(l, "ref")));
  } else if (l.startsWith("</relation>")) {
    if (tags["piste:type"] && relationGivesTags(relType)) relations.push({ tags, members });
    kind = null;
  } else if (l.startsWith("</node>")) kind = null;
  if (lines % 5e6 === 0) console.log(`${(lines / 1e6).toFixed(0)} M lignes \xB7 ${nn} n\u0153uds \xB7 ${ways.size} chemins \xB7 ${Math.round((Date.now() - t0) / 1e3)} s`);
}
console.log(`Lu : ${nn} n\u0153uds, ${ways.size} chemins, ${relations.length} relations de pistes (${Math.round((Date.now() - t0) / 1e3)} s)`);
for (const rel of relations) {
  for (const m of rel.members) {
    const w = ways.get(m);
    if (w) w.tags = mergeRelationTags(w.tags, rel.tags);
  }
}
var features = [];
var pistes = 0;
var lifts = 0;
for (const w of ways.values()) {
  const f = pisteFeature(w.tags, w.coords, w.closed);
  if (f) {
    features.push(f);
    pistes++;
    continue;
  }
  const a = aerialwayFeature(w.tags, w.coords);
  if (a) {
    features.push(a);
    lifts++;
  }
}
console.log(`${pistes} pistes et ${lifts} remont\xE9es \xE0 tuiler`);
var CACHE = process.env.PISTES_CACHE ?? "";
var OFFLINE = process.env.PISTES_SANS_RESEAU === "1";
var UA = { "User-Agent": "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees)" };
async function download(url, name) {
  const file = CACHE ? join(CACHE, name) : "";
  if (file && existsSync(file)) {
    const b = readFileSync(file);
    return b.length ? new Uint8Array(b) : null;
  }
  let out = null;
  for (let i = 0; i < 3 && !OFFLINE; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(3e4) });
      if (r.ok) out = new Uint8Array(await r.arrayBuffer());
      if (r.ok || r.status === 404 || r.status === 204) break;
    } catch {
    }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  if (file) {
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, out ?? new Uint8Array(0));
  }
  return out;
}
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}
var tileX = (lng, z) => (lng + 180) / 360 * 2 ** z;
var tileY = (lat, z) => {
  const r = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z;
};
var png = (b) => {
  try {
    return b ? decodePng(b, (d) => new Uint8Array(inflateSync(d))) : null;
  } catch {
    return null;
  }
};
var TileImages = class {
  constructor(z, url, prefix) {
    this.z = z;
    this.url = url;
    this.prefix = prefix;
  }
  tiles = /* @__PURE__ */ new Map();
  async load(points) {
    const want = /* @__PURE__ */ new Set();
    for (const p of points) want.add(`${Math.floor(tileX(p[0], this.z))}/${Math.floor(tileY(p[1], this.z))}`);
    const todo = [...want].filter((k) => !this.tiles.has(k));
    let done = 0;
    await pool(todo, 12, async (k) => {
      const [x, y] = k.split("/").map(Number);
      this.tiles.set(k, png(await download(this.url(this.z, x, y), `${this.prefix}-${this.z}-${x}-${y}.png`)));
      if (++done % 200 === 0) console.log(`  ${this.prefix} : ${done}/${todo.length} tuiles`);
    });
  }
  /** L'image et le pixel sous un point, ou null. */
  at(p) {
    const X = tileX(p[0], this.z);
    const Y = tileY(p[1], this.z);
    const img = this.tiles.get(`${Math.floor(X)}/${Math.floor(Y)}`);
    return img ? { img, x: Math.floor(X % 1 * img.width), y: Math.floor(Y % 1 * img.height) } : null;
  }
  get count() {
    return this.tiles.size;
  }
};
var inFlat = (p, rings) => rings.some((r) => {
  let inside = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
    if (r[i + 1] > p[1] !== r[j + 1] > p[1] && p[0] < (r[j] - r[i]) * (p[1] - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) inside = !inside;
  return inside;
});
var pairs = (c) => {
  const out = [];
  for (let i = 0; i + 1 < c.length; i += 2) out.push([c[i], c[i + 1]]);
  return out;
};
var departs = null;
var horsSource = 0;
if (!OFFLINE) {
  const t1 = Date.now();
  const liftWays = [];
  const wild = [];
  for (const w of ways.values()) {
    if (w.tags.aerialway && !w.tags["piste:type"] && liftWord(w.tags.aerialway) && w.coords.length >= 4) liftWays.push(w);
    else if (!(w.closed && w.tags.area === "yes")) {
      const kind2 = pisteFeature(w.tags, w.coords, w.closed) ? pisteKindOf(w.tags["piste:type"], w.tags["piste:difficulty"], w.tags["piste:grooming"]) : null;
      if (kind2 && kind2 !== "piste") wild.push({ w, kind: kind2 });
    }
  }
  const ends = (c) => [
    [c[0], c[1]],
    [c[c.length - 2], c[c.length - 1]]
  ];
  const reseauDir = process.env.PISTES_SKIRANDO ?? "";
  const reseau = new PointGrid(2e-3);
  const routes = /* @__PURE__ */ new Map();
  let routeNames = {};
  if (reseauDir && existsSync(join(reseauDir, "11"))) {
    for (const x of readdirSync(join(reseauDir, "11")))
      for (const f of readdirSync(join(reseauDir, "11", x))) {
        const y = Number(f.replace(".pbf", ""));
        const layer = readMvt(new Uint8Array(readFileSync(join(reseauDir, "11", x, f))), ["itineraires"]).itineraires;
        if (!layer) continue;
        for (const [ref, part] of tileRouteParts(layer, 11, Number(x), y)) {
          const list = routes.get(ref) ?? [];
          list.push(...part.lines);
          routes.set(ref, list);
        }
        const ext = layer.extent || 4096;
        for (const ft of layer.features)
          if (ft.type === 2)
            for (const g of ft.geometry)
              for (const l of clipToTile(g, ext))
                for (const q of densify(l.map(([px, py]) => [(Number(x) + px / ext) / 2048 * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + py / ext) / 2048))) * 180 / Math.PI]), 25)) reseau.add(q, 1);
      }
    try {
      const raw = JSON.parse(readFileSync(join(reseauDir, "itineraires.json"), "utf8"));
      routeNames = Array.isArray(raw.itineraires) ? Object.fromEntries(raw.itineraires) : raw.itineraires ?? {};
    } catch {
    }
  }
  const routeLines = /* @__PURE__ */ new Map();
  for (const [ref, pieces] of routes) {
    const line = chainSkiRoute(pieces);
    if (line && line.length > 1) routeLines.set(ref, line);
  }
  console.log(`R\xE9seau officiel : ${routeLines.size} itin\xE9raires${reseauDir ? "" : " (PISTES_SKIRANDO absent : France saut\xE9e)"}`);
  const skitourFile = process.env.PISTES_SKITOUR ?? "";
  const topoStarts = [];
  if (skitourFile && existsSync(skitourFile)) {
    try {
      const raw = JSON.parse(readFileSync(skitourFile, "utf8"));
      for (const t of raw.topos ?? []) {
        const [id, name, , , , , , , , alt, lng, lat] = t;
        if (typeof lng !== "number" || typeof lat !== "number") continue;
        topoStarts.push({ id: String(id), name: String(name ?? ""), start: [lng, lat], alt: typeof alt === "number" && alt > 0 ? alt : null });
      }
    } catch {
    }
  }
  const topos = topoStarts.length;
  const relief = new TileImages(11, (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, "relief");
  const need = [];
  for (const w of liftWays) need.push(...ends(w.coords));
  for (const { w } of wild) need.push(...ends(w.coords));
  for (const l of routeLines.values()) need.push(l[0], l[l.length - 1]);
  for (const t of topoStarts) need.push(t.start);
  await relief.load(need);
  const ele = (p) => {
    const h = relief.at(p);
    return h ? terrariumElevation(h.img, h.x, h.y) : NaN;
  };
  console.log(`Relief : ${relief.count} tuiles (${Math.round((Date.now() - t1) / 1e3)} s)`);
  const tops = [];
  const domain = new PointGrid(0.02);
  for (const w of liftWays) {
    const [a, b] = ends(w.coords);
    domain.add(a, 1);
    domain.add(b, 1);
    const t = liftTop(w.coords, w.tags.aerialway, w.tags.name ?? "", ele(a), ele(b));
    if (t) tops.push(t);
  }
  const cands = [];
  for (const { w, kind: kind2 } of wild) {
    const [a, b] = ends(w.coords);
    const za = ele(a);
    const zb = ele(b);
    if (!Number.isFinite(za) || !Number.isFinite(zb)) continue;
    const high = za >= zb;
    const start = (kind2 === "rando" ? !high : high) ? a : b;
    cands.push({ s: "osm", id: "", name: w.tags["piste:name"] ?? w.tags.name ?? "", kind: kind2, start, z: Math.round(start === a ? za : zb) });
  }
  for (const [ref, line] of routeLines) {
    const a = line[0];
    const b = line[line.length - 1];
    const za = ele(a);
    const zb = ele(b);
    if (!Number.isFinite(za) || !Number.isFinite(zb)) continue;
    const start = za <= zb ? a : b;
    const nm = routeNames[ref];
    cands.push({ s: "reseau", id: ref, name: nm ? nm[1] : ref, start, z: Math.round(Math.min(za, zb)) });
  }
  for (const t of topoStarts) {
    const z = ele(t.start);
    cands.push({ s: "skitour", id: t.id, name: t.name, start: t.start, z: Number.isFinite(z) ? Math.round(z) : t.alt });
  }
  const gares = assignDepartures(tops, cands);
  if (tops.length) departs = { v: 1, fabrique: (/* @__PURE__ */ new Date()).toISOString(), gares };
  console.log(`D\xE9parts : ${tops.length} gares d'arriv\xE9e, ${cands.length} trac\xE9s (dont ${routeLines.size} du r\xE9seau, ${topos} topos) \u2192 ${gares.length} gares avec ${gares.reduce((n, g) => n + g.d.length, 0)} d\xE9parts`);
  const inFR = [];
  const inCH = [];
  for (const { w, kind: kind2 } of wild) {
    if (kind2 !== "rando") continue;
    const line = pairs(w.coords);
    if (!line.some((q) => domain.has(q, NEAR_DOMAIN_M))) continue;
    if (line.every((q) => inFlat(q, FRANCE_RINGS))) inFR.push({ w, line });
    else if (line.every((q) => inFlat(q, SWISS_RINGS))) inCH.push({ w, line });
  }
  const addParts = (w, parts) => {
    for (const part of parts) {
      const f = pisteFeature(w.tags, part.flat(), false);
      if (!f) continue;
      f.properties.hs = 1;
      features.push(f);
      horsSource++;
    }
  };
  if (routeLines.size) for (const { w, line } of inFR) addParts(w, uncoveredParts(line, (q) => reseau.has(q, COVERED_M)));
  const swiss = new TileImages(14, (z, x, y) => `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo-karto.skitouren/default/current/3857/${z}/${x}/${y}.png`, "swisstopo");
  await swiss.load(inCH.flatMap(({ line }) => densify(line, 200)));
  const inked = (q) => {
    const h = swiss.at(q);
    if (!h) return null;
    const r = Math.round(COVERED_M / (40075016686e-3 * Math.cos(q[1] * Math.PI / 180) / 2 ** 14 / h.img.width));
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const px = h.x + dx;
        const py = h.y + dy;
        if (px >= 0 && py >= 0 && px < h.img.width && py < h.img.height && h.img.rgba[(py * h.img.width + px) * 4 + 3] > 60) return true;
      }
    return false;
  };
  if (swiss.count) for (const { w, line } of inCH) addParts(w, uncoveredParts(line, (q) => inked(q) !== false));
  console.log(`Itin\xE9raires \xE0 ski hors source officielle : ${inFR.length} en France et ${inCH.length} en Suisse pr\xE8s d'un domaine \u2192 ${horsSource} parties ajout\xE9es (${Math.round((Date.now() - t1) / 1e3)} s)`);
}
rmSync(outDir, { recursive: true, force: true });
var stats = {};
var total = 0;
var digests = [];
for (const z of ZOOMS) {
  const tiles = encodeTiles(tileFeatures(features, [z], { buffer: 64, tolerance: 4 }), "pistes");
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
if (departs) digests.push(`departs ${createHash("sha256").update(JSON.stringify(departs.gares)).digest("hex")}`);
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  outil = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex").slice(0, 12);
} catch {
}
if (departs) writeFileSync(join(outDir, "departs.json"), JSON.stringify(departs));
var sourceDate = process.env.PISTES_SOURCE_DATE ? new Date(process.env.PISTES_SOURCE_DATE) : null;
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      fabrique: (/* @__PURE__ */ new Date()).toISOString(),
      source: "OpenSnowMap planet_pistes (\xA9 contributeurs OpenStreetMap, ODbL)",
      ...sourceDate && !isNaN(sourceDate.getTime()) ? { source_date: sourceDate.toISOString() } : {},
      region: PISTES_REGION,
      zooms: ZOOMS,
      pistes,
      remontees: lifts,
      tuiles: stats,
      empreinte,
      ...departs ? { departs: { gares: departs.gares.length, departs: departs.gares.reduce((n, g) => n + g.d.length, 0), hors_source: horsSource } } : {},
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`Total ${(total / 1048576).toFixed(1)} Mo en ${Math.round((Date.now() - t0) / 1e3)} s`);
