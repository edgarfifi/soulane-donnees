// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des pistes de ski de la carte d'hiver de Soulane à partir du fichier quotidien d'OpenSnowMap
// (© contributeurs OpenStreetMap, ODbL) :
//   node --max-old-space-size=8192 outils/pistes.mjs <planet_pistes.osm.gz> <dossier de sortie>

// scripts/pistes-build.ts
import { createHash } from "node:crypto";
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// src/shared/core/xmlText.ts
function codePointText(code) {
  if (!Number.isInteger(code) || code <= 0 || code > 1114111 || code >= 55296 && code <= 57343) return null;
  return String.fromCodePoint(code);
}

// src/shared/core/pisteData.ts
var PISTES_REGION = { west: -2.5, south: 41, east: 17.5, north: 49.5 };
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
  } else if (l.startsWith("<member ")) {
    if (xmlAttr(l, "type") === "way") members.push(Number(xmlAttr(l, "ref")));
  } else if (l.startsWith("</relation>")) {
    if (tags["piste:type"]) relations.push({ tags, members });
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
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  outil = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex").slice(0, 12);
} catch {
}
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
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`Total ${(total / 1048576).toFixed(1)} Mo en ${Math.round((Date.now() - t0) / 1e3)} s`);
