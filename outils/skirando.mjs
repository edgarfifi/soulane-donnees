// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des itinéraires de ski de rando des Alpes françaises et des Pyrénées de Soulane à partir des
// fichiers lissés publiés par la Fondation Petzl en collaboration avec Skitourenguru GmbH (CC BY-ND 4.0, géométrie
// non modifiée : projection et découpage en tuiles seulement) :
//   node outils/skirando.mjs <dossier de sortie> [<alpes.zip> <pyrenees.zip>]

// scripts/skirando-build.ts
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { inflateRawSync } from "node:zlib";

// src/shared/core/lambert93.ts
var DEG = Math.PI / 180;
var A = 6378137;
var E = 0.08181919104281579;
var LON0 = 3 * DEG;
var FE = 7e5;
var FN = 66e5;
var m = (la) => Math.cos(la) / Math.sqrt(1 - E * E * Math.sin(la) ** 2);
var t = (la) => Math.tan(Math.PI / 4 - la / 2) / ((1 - E * Math.sin(la)) / (1 + E * Math.sin(la))) ** (E / 2);
var N = (Math.log(m(44 * DEG)) - Math.log(m(49 * DEG))) / (Math.log(t(44 * DEG)) - Math.log(t(49 * DEG)));
var AF = A * m(44 * DEG) / (N * t(44 * DEG) ** N);
var RHO0 = AF * t(46.5 * DEG) ** N;
function lambert93ToLngLat(e, n) {
  const dx = e - FE;
  const dy = RHO0 - (n - FN);
  const rho = Math.sqrt(dx * dx + dy * dy);
  const tp = (rho / AF) ** (1 / N);
  let phi = Math.PI / 2 - 2 * Math.atan(tp);
  for (let i = 0; i < 12; i++) {
    const s = E * Math.sin(phi);
    const next = Math.PI / 2 - 2 * Math.atan(tp * ((1 - s) / (1 + s)) ** (E / 2));
    if (Math.abs(next - phi) < 1e-13) {
      phi = next;
      break;
    }
    phi = next;
  }
  return [(Math.atan2(dx, dy) / N + LON0) / DEG, phi / DEG];
}

// src/shared/core/wkb.ts
var LINESTRING = 2;
var MULTILINESTRING = 5;
var COLLECTION = 7;
function wkbLines(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lines = [];
  let o = 0;
  const need = (n) => {
    if (o + n > bytes.byteLength) throw new Error("WKB tronqu\xE9");
  };
  const geom = (depth) => {
    if (depth > 4) throw new Error("WKB trop imbriqu\xE9");
    need(5);
    const le = dv.getUint8(o) === 1;
    o += 1;
    let type = dv.getUint32(o, le);
    o += 4;
    let dims = 2;
    if (type & 2147483648) dims++;
    if (type & 1073741824) dims++;
    if (type & 536870912) {
      need(4);
      o += 4;
    }
    type &= 268435455;
    if (type >= 1e3 && type < 4e3) {
      const k = Math.floor(type / 1e3);
      dims += k === 3 ? 2 : 1;
      type %= 1e3;
    }
    const count = () => {
      need(4);
      const n = dv.getUint32(o, le);
      o += 4;
      return n;
    };
    if (type === LINESTRING) {
      const n = count();
      need(n * dims * 8);
      const pts = new Array(n * 2);
      for (let i = 0; i < n; i++) {
        pts[i * 2] = dv.getFloat64(o, le);
        pts[i * 2 + 1] = dv.getFloat64(o + 8, le);
        o += dims * 8;
      }
      lines.push(pts);
    } else if (type === MULTILINESTRING || type === COLLECTION) {
      const n = count();
      for (let i = 0; i < n; i++) geom(depth + 1);
    } else throw new Error(`G\xE9om\xE9trie WKB inattendue (type ${type})`);
  };
  geom(0);
  return lines;
}

// src/shared/core/skiRoutes.ts
var SKITOURENGURU_PUBLIC = "https://download.skitourenguru.com/public/";
var SKI_ROUTE_REGIONS = [
  { id: "alpes", dir: "France-Alps", file: "France-Alps-Segments-Smoothed-FootSectionsIncluded.sqlite", box: [5.2, 43.7, 7.9, 46.6] },
  { id: "pyrenees", dir: "France-Pyrenees", file: "France-Pyrenees-Segments-Smoothed-FootSectionsIncluded.sqlite", box: [-1.9, 42.2, 3.2, 43.3] }
];
var SKI_ROUTES_BOX = [
  Math.min(...SKI_ROUTE_REGIONS.map((r) => r.box[0])),
  Math.min(...SKI_ROUTE_REGIONS.map((r) => r.box[1])),
  Math.max(...SKI_ROUTE_REGIONS.map((r) => r.box[2])),
  Math.max(...SKI_ROUTE_REGIONS.map((r) => r.box[3]))
];
var SKI_ROUTE_ZOOMS = [8, 9, 10, 11, 12, 13, 14];
var SKI_ROUTE_LAYER = "itineraires";
var SKI_ROUTES_CREDIT = "Itin\xE9raires cr\xE9\xE9s et entretenus par la Fondation Petzl, en collaboration avec Skitourenguru GmbH (CC BY-ND 4.0)";
var ZIP_NAME = /^France-Ski-(\d{4})\.(\d{2})\.(\d{2})-([0-9a-f]{40})\.zip$/;
function listSkiZips(html) {
  const out = [];
  const re = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)\s+(\d+)\s+<A HREF="[^"]*">([^<]+)<\/A>/gi;
  for (const m2 of html.matchAll(re)) {
    const z = ZIP_NAME.exec(m2[8].trim());
    if (!z) continue;
    const h = Number(m2[4]) % 12 + (m2[6].toUpperCase() === "PM" ? 12 : 0);
    out.push({
      name: z[0],
      date: `${z[1]}-${z[2]}-${z[3]}`,
      revision: z[4],
      size: Number(m2[7]),
      at: Date.UTC(Number(m2[3]), Number(m2[1]) - 1, Number(m2[2]), h, Number(m2[5]))
    });
  }
  return out;
}
function latestSkiZip(html, until2) {
  let best = null;
  for (const z of listSkiZips(html)) {
    if (until2 && z.date > until2) continue;
    if (!best || z.date > best.date || z.date === best.date && z.at > best.at) best = z;
  }
  return best;
}
function isLambert93Wkt(wkt) {
  if (/AUTHORITY\["EPSG",\s*"2154"\]\s*\]\s*$/.test(wkt)) return true;
  if (!/Lambert_Conformal_Conic_2SP/i.test(wkt) || !/GRS\s*1980[^\]]*6378137\s*,\s*298\.257222101/i.test(wkt)) return false;
  const p = {};
  for (const m2 of wkt.matchAll(/PARAMETER\["([a-z_0-9]+)",\s*(-?[\d.]+)\]/gi)) p[m2[1].toLowerCase()] = Number(m2[2]);
  const sp = [p.standard_parallel_1, p.standard_parallel_2].sort((a, b) => a - b);
  return p.latitude_of_origin === 46.5 && p.central_meridian === 3 && sp[0] === 44 && sp[1] === 49 && p.false_easting === 7e5 && p.false_northing === 66e5;
}
function parseRevision(text) {
  const m2 = /^\s*(\d{4})\.(\d{2})\.(\d{2});([0-9a-f]{40})\s*$/.exec(text);
  return m2 ? { date: `${m2[1]}-${m2[2]}-${m2[3]}`, revision: m2[4] } : null;
}
function segmentPublishable(value) {
  return value === 0 || value === "0";
}
function skiRouteFeatures(row, project) {
  if (row.foot !== 0 && row.foot !== 1) throw new Error(`Colonne \xAB foot \xBB inattendue : ${String(row.foot)}`);
  const out = [];
  for (const line of wkbLines(row.geometry)) {
    if (line.length < 4) continue;
    const coords = new Array(line.length);
    for (let i = 0; i < line.length; i += 2) {
      const [lng, lat] = project(line[i], line[i + 1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error("Coordonn\xE9e invalide");
      coords[i] = lng;
      coords[i + 1] = lat;
    }
    out.push({ type: "line", coords, properties: { foot: row.foot } });
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
    let m2 = n;
    if (f.type === 3 && m2 > 1 && line[0] === line[(m2 - 1) * 2] && line[1] === line[(m2 - 1) * 2 + 1]) m2--;
    out.push(cmd(1, 1), zigzag(line[0] - cx), zigzag(line[1] - cy));
    cx = line[0];
    cy = line[1];
    out.push(cmd(2, m2 - 1));
    for (let i = 1; i < m2; i++) {
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
        const t3 = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
        const ex = px - t3 * dx;
        const ey = py - t3 * dy;
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

// src/shared/core/zipStore.ts
var TABLE = (() => {
  const t2 = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t2[i] = c >>> 0;
  }
  return t2;
})();
function crc32(data) {
  let c = 4294967295;
  for (let i = 0; i < data.length; i++) c = TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
  return (c ^ 4294967295) >>> 0;
}

// src/shared/core/zipRead.ts
var EOCD = 101010256;
var CENTRAL = 33639248;
var LOCAL = 67324752;
function zipEntries(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.byteLength - 22; i >= Math.max(0, bytes.byteLength - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Archive ZIP illisible (fin du r\xE9pertoire central introuvable)");
  const count = dv.getUint16(eocd + 10, true);
  let o = dv.getUint32(eocd + 16, true);
  if (count === 65535 || o === 4294967295) throw new Error("Archive ZIP64 non prise en charge");
  const dec = new TextDecoder();
  const out = [];
  for (let k = 0; k < count; k++) {
    if (o + 46 > bytes.byteLength || dv.getUint32(o, true) !== CENTRAL) throw new Error("R\xE9pertoire central du ZIP ab\xEEm\xE9");
    const nameLen = dv.getUint16(o + 28, true);
    const extraLen = dv.getUint16(o + 30, true);
    const commentLen = dv.getUint16(o + 32, true);
    out.push({
      method: dv.getUint16(o + 10, true),
      crc: dv.getUint32(o + 16, true),
      compressedSize: dv.getUint32(o + 20, true),
      size: dv.getUint32(o + 24, true),
      offset: dv.getUint32(o + 42, true),
      name: dec.decode(bytes.subarray(o + 46, o + 46 + nameLen))
    });
    o += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
function zipEntryBytes(bytes, entry, inflateRaw) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const o = entry.offset;
  if (o + 30 > bytes.byteLength || dv.getUint32(o, true) !== LOCAL) throw new Error(`En-t\xEAte local de ${entry.name} introuvable`);
  const start = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true);
  const end = start + entry.compressedSize;
  if (end > bytes.byteLength) throw new Error(`${entry.name} tronqu\xE9 dans l'archive`);
  const raw = bytes.subarray(start, end);
  let data;
  if (entry.method === 0) data = raw;
  else if (entry.method === 8) data = inflateRaw(raw);
  else throw new Error(`${entry.name} : compression ${entry.method} non prise en charge`);
  if (data.byteLength !== entry.size || crc32(data) !== entry.crc) throw new Error(`${entry.name} ab\xEEm\xE9 (taille ou CRC)`);
  return data;
}

// scripts/skirando-build.ts
var [outDir, ...zips] = process.argv.slice(2);
if (!outDir || zips.length !== 0 && zips.length !== SKI_ROUTE_REGIONS.length) {
  console.error("Usage : node outils/skirando.mjs <dossier de sortie> [<alpes.zip> <pyrenees.zip>]");
  process.exit(1);
}
var until = process.env.SKIRANDO_JUSQUA ?? "";
if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
  console.error(`SKIRANDO_JUSQUA doit \xEAtre une date AAAA-MM-JJ (re\xE7u : ${until}).`);
  process.exit(1);
}
var UA = "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees; contact@soulane.app)";
var t0 = Date.now();
async function fetchBytes(url) {
  let last = null;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(3e5) });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return new Uint8Array(await r.arrayBuffer());
    } catch (e) {
      last = e;
      if (i < 3) await new Promise((res) => setTimeout(res, 3e4 * (i + 1)));
    }
  }
  throw new Error(`${url} : ${String(last)}`);
}
async function regionZip(region, local) {
  if (local) return { name: local.split(/[\\/]/).pop() ?? local, bytes: new Uint8Array(readFileSync(local)) };
  const dirUrl = `${SKITOURENGURU_PUBLIC}${region.dir}/`;
  const listing = new TextDecoder().decode(await fetchBytes(dirUrl));
  const zip = latestSkiZip(listing, until || void 0);
  if (!zip) throw new Error(`Aucune version dans ${dirUrl}${until ? ` jusqu'au ${until}` : ""}`);
  const bytes = await fetchBytes(dirUrl + zip.name);
  if (bytes.byteLength !== zip.size) throw new Error(`${zip.name} : ${bytes.byteLength} octets re\xE7us, ${zip.size} annonc\xE9s`);
  console.log(`${region.id} : ${zip.name} (${(zip.size / 1048576).toFixed(1)} Mo)`);
  return { name: zip.name, bytes };
}
var tmp = mkdtempSync(join(tmpdir(), "skirando-"));
var features = [];
var regions = {};
var troncons = 0;
var kmSki = 0;
var kmFoot = 0;
try {
  for (const [i, region] of SKI_ROUTE_REGIONS.entries()) {
    const zip = await regionZip(region, zips[i]);
    const entries = zipEntries(zip.bytes);
    const entry = entries.find((e) => e.name === region.file);
    if (!entry) throw new Error(`${zip.name} sans ${region.file} (contenu : ${entries.map((e) => e.name).join(", ")})`);
    const rev = entries.find((e) => e.name === "Revision.txt");
    const version = rev ? parseRevision(new TextDecoder().decode(zipEntryBytes(zip.bytes, rev, inflateRawSync))) : null;
    const dbFile = join(tmp, region.file);
    writeFileSync(dbFile, zipEntryBytes(zip.bytes, entry, inflateRawSync));
    const db = new DatabaseSync(dbFile, { readOnly: true });
    try {
      const cols = db.prepare("SELECT f_table_name AS t, f_geometry_column AS g, geometry_format AS f, srid AS s FROM geometry_columns").all();
      if (cols.length !== 1 || String(cols[0].f).toUpperCase() !== "WKB") throw new Error(`${region.file} : table des g\xE9om\xE9tries inattendue`);
      const srs = db.prepare("SELECT srtext FROM spatial_ref_sys WHERE srid = ?").get(cols[0].s);
      if (!isLambert93Wkt(srs?.srtext ?? "")) throw new Error(`${region.file} : projection inattendue (${srs?.srtext ?? "inconnue"})`);
      const names = db.prepare(`PRAGMA table_info("${cols[0].t}")`).all().map((c) => c.name.toLowerCase());
      const hasPublish = names.includes("publish");
      const rows = db.prepare(`SELECT "${cols[0].g}" AS geometry, foot${hasPublish ? ", publish" : ""} FROM "${cols[0].t}"`).all();
      let withheld = 0;
      let west = Infinity;
      let south = Infinity;
      let east = -Infinity;
      let north = -Infinity;
      let n = 0;
      let ski = 0;
      let foot = 0;
      for (const row of rows) {
        if (!row.geometry) continue;
        if (hasPublish && !segmentPublishable(row.publish)) {
          withheld++;
          continue;
        }
        let len = 0;
        for (const l of wkbLines(row.geometry)) for (let k = 2; k < l.length; k += 2) len += Math.hypot(l[k] - l[k - 2], l[k + 1] - l[k - 1]);
        if (row.foot === 1) foot += len;
        else ski += len;
        for (const f of skiRouteFeatures(row, lambert93ToLngLat)) {
          for (let k = 0; k < f.coords.length; k += 2) {
            west = Math.min(west, f.coords[k]);
            east = Math.max(east, f.coords[k]);
            south = Math.min(south, f.coords[k + 1]);
            north = Math.max(north, f.coords[k + 1]);
          }
          features.push(f);
        }
        n++;
      }
      const [bw, bs, be, bn] = region.box;
      const outside = west < bw || south < bs || east > be || north > bn;
      if (outside) {
        console.warn(`\u26A0 ${region.id} : r\xE9seau hors de sa zone [${bw}, ${bs}, ${be}, ${bn}] (emprise ${[west, south, east, north].map((v) => v.toFixed(3)).join(", ")}) : \xE9largir SKI_ROUTE_REGIONS.`);
      }
      troncons += n;
      kmSki += ski / 1e3;
      kmFoot += foot / 1e3;
      regions[region.id] = {
        fichier: zip.name,
        ...version ? { version: version.date, revision: version.revision } : {},
        troncons: n,
        km_ski: Math.round(ski / 1e3),
        km_pied: Math.round(foot / 1e3),
        emprise: [west, south, east, north].map((v) => Math.round(v * 1e4) / 1e4),
        ...outside ? { hors_zone: true } : {},
        ...hasPublish ? { non_publies: withheld } : {}
      };
      console.log(`${region.id} : ${n} tron\xE7ons, ${Math.round(ski / 1e3)} km \xE0 ski, ${Math.round(foot / 1e3)} km \xE0 pied`);
      if (withheld) console.log(`${region.id} : ${withheld} tron\xE7ons marqu\xE9s \xAB \xE0 ne pas publier \xBB par leurs auteurs, laiss\xE9s de c\xF4t\xE9`);
    } finally {
      db.close();
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
rmSync(outDir, { recursive: true, force: true });
var stats = {};
var total = 0;
var digests = [];
for (const z of SKI_ROUTE_ZOOMS) {
  const tiles = encodeTiles(tileFeatures(features, [z], { buffer: 64, tolerance: 0 }), SKI_ROUTE_LAYER);
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
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      fabrique: (/* @__PURE__ */ new Date()).toISOString(),
      source: `${SKITOURENGURU_PUBLIC} (r\xE9seau liss\xE9, passages \xE0 pied compris)`,
      mention: SKI_ROUTES_CREDIT,
      licence: "CC BY-ND 4.0 (https://creativecommons.org/licenses/by-nd/4.0/deed.fr)",
      geometrie: "Non modifi\xE9e : projection Lambert-93 vers degr\xE9s et d\xE9coupage en tuiles seulement.",
      regions,
      zooms: SKI_ROUTE_ZOOMS,
      troncons,
      km: Math.round(kmSki + kmFoot),
      km_pied: Math.round(kmFoot),
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`Total ${(total / 1048576).toFixed(1)} Mo en ${Math.round((Date.now() - t0) / 1e3)} s`);
