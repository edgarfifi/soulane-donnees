// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des couloirs d'avalanche de France de Soulane à partir de la Carte de localisation des phénomènes
// d'avalanche (CLPA © INRAE / ministère de la Transition écologique), lue dans le service WFS de l'INRAE (géométrie non
// modifiée : découpage en tuiles seulement) :
//   node --max-old-space-size=6144 outils/clpa.mjs <dossier de sortie> [<dossier des réponses du WFS>]

// scripts/clpa-build.ts
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
  const features = [];
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
    features.push(fw.result());
  }
  for (const f of features) w.bytes(2, f);
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
function tileFeatures(features, zooms, opts = {}) {
  const extent = opts.extent ?? 4096;
  const buffer = opts.buffer ?? 64;
  const tol = opts.tolerance ?? 4;
  const out = /* @__PURE__ */ new Map();
  const push = (key, f) => {
    const l = out.get(key);
    if (l) l.push(f);
    else out.set(key, [f]);
  };
  for (const f of features) {
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

// src/shared/core/clpa.ts
var CLPA_WFS = "https://carto-service.inrae.fr/geoserver/siavalanches/wfs";
var CLPA_HTTPS_BASE = "https://soulane.app/donnees/clpa/";
var CLPA_MANIFEST_URL = `${CLPA_HTTPS_BASE}manifeste.json`;
var CLPA_CREDIT = "CLPA \xA9 INRAE / minist\xE8re de la Transition \xE9cologique";
var CLPA_ZOOMS = [10, 11, 12, 13, 14];
var CLPA_NUMBERS_MINZOOM = 12;
var CLPA_ZONES_LAYER = "zones";
var CLPA_LINES_LAYER = "lignes";
var CLPA_ARROWS_LAYER = "fleches";
var CLPA_NUMBERS_LAYER = "numeros";
var CLPA_PHOTO = 1;
var CLPA_WITNESS = 2;
var CLPA_SETS = [
  { id: "zonpi", type: "siavalanches:clpa_zonpi", origin: CLPA_PHOTO, geom: "zone", codes: [1, 2, 3] },
  { id: "zont", type: "siavalanches:clpa_zont", origin: CLPA_WITNESS, geom: "zone", codes: [1, 2, 3, 4] },
  { id: "linpi", type: "siavalanches:clpa_linpi", origin: CLPA_PHOTO, geom: "ligne", codes: [1, 4, 7, 10] },
  { id: "lint", type: "siavalanches:clpa_lint", origin: CLPA_WITNESS, geom: "ligne", codes: [2, 5, 8, 11] }
];
var CLPA_LINE_ARROW = [7, 8, 10, 11];
function clpaWfsUrl(set) {
  return `${CLPA_WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${set.type}&outputFormat=application/json&srsName=EPSG:4326`;
}
var CLPA_REGIONS = [
  { id: "alpes", box: [5.4, 43.7, 8, 46.7] },
  { id: "pyrenees", box: [-1.2, 42.1, 2.8, 43.4] }
];
var CLPA_BOX = [
  Math.min(...CLPA_REGIONS.map((r) => r.box[0])),
  Math.min(...CLPA_REGIONS.map((r) => r.box[1])),
  Math.max(...CLPA_REGIONS.map((r) => r.box[2])),
  Math.max(...CLPA_REGIONS.map((r) => r.box[3]))
];
function inClpaArea(lng, lat) {
  return CLPA_REGIONS.some((r) => lng >= r.box[0] && lng <= r.box[2] && lat >= r.box[1] && lat <= r.box[3]);
}
var isNum = (v) => typeof v === "number" && Number.isFinite(v);
var isDate8 = (v) => isNum(v) && v >= 19700101 && v <= 20991231 && v % 100 >= 1 && v % 100 <= 31 && Math.floor(v / 100) % 100 >= 1 && Math.floor(v / 100) % 100 <= 12;
function flat(points) {
  if (!Array.isArray(points)) return null;
  const out = [];
  for (const p of points) {
    if (!Array.isArray(p) || !isNum(p[0]) || !isNum(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 85) return null;
    out.push(p[0], p[1]);
  }
  return out;
}
function clpaFileVersion(layer) {
  const m = typeof layer === "string" ? /_(\d{8})$/.exec(layer) : null;
  const v = m ? Number(m[1]) : 0;
  return isDate8(v) ? v : 0;
}
function readClpaCollection(json, set) {
  const c = json;
  if (!c || c.type !== "FeatureCollection" || !Array.isArray(c.features)) throw new Error(`${set.id} : la r\xE9ponse n'est pas une collection d'objets`);
  const crs = c.crs?.properties?.name;
  if (crs !== void 0 && !/(EPSG::?4326|CRS84)$/.test(String(crs))) throw new Error(`${set.id} : projection inattendue (${String(crs)})`);
  if (isNum(c.numberMatched) && c.numberMatched !== c.features.length) {
    throw new Error(`${set.id} : r\xE9ponse tronqu\xE9e (${c.features.length} objets re\xE7us sur ${c.numberMatched})`);
  }
  const out = { zones: [], lines: [], total: c.features.length, skipped: {}, broken: 0, lastUpdate: 0, fileVersion: 0, departments: [], bbox: [Infinity, Infinity, -Infinity, -Infinity] };
  const deps = /* @__PURE__ */ new Set();
  const grow = (pts) => {
    for (let i = 0; i < pts.length; i += 2) {
      out.bbox[0] = Math.min(out.bbox[0], pts[i]);
      out.bbox[2] = Math.max(out.bbox[2], pts[i]);
      out.bbox[1] = Math.min(out.bbox[1], pts[i + 1]);
      out.bbox[3] = Math.max(out.bbox[3], pts[i + 1]);
    }
  };
  for (const f of c.features) {
    const p = f?.properties ?? {};
    const code = isNum(p.CODE) ? p.CODE : Number.NaN;
    if (isDate8(p.DDMAJ)) out.lastUpdate = Math.max(out.lastUpdate, p.DDMAJ);
    out.fileVersion = Math.max(out.fileVersion, clpaFileVersion(p.layer));
    if (isNum(p.DEP)) deps.add(p.DEP);
    if (!set.codes.includes(code)) {
      const k = Number.isNaN(code) ? "?" : String(code);
      out.skipped[k] = (out.skipped[k] ?? 0) + 1;
      continue;
    }
    const g = f.geometry;
    const coords = g?.coordinates;
    if (set.geom === "zone") {
      const polys = g?.type === "Polygon" ? [coords] : g?.type === "MultiPolygon" && Array.isArray(coords) ? coords : null;
      let ok = !!polys && polys.length > 0;
      const zones2 = [];
      for (const poly of polys ?? []) {
        const rings = Array.isArray(poly) ? poly.map(flat) : null;
        if (!rings || !rings.length || rings.some((r) => !r || r.length < 6)) {
          ok = false;
          break;
        }
        zones2.push({ rings, origin: set.origin, code, num: set.origin === CLPA_WITNESS && isNum(p.NUM) && p.NUM > 0 ? Math.round(p.NUM) : 0 });
      }
      if (!ok) {
        out.broken++;
        continue;
      }
      for (const z of zones2) {
        grow(z.rings[0]);
        out.zones.push(z);
      }
    } else {
      const parts = g?.type === "LineString" ? [coords] : g?.type === "MultiLineString" && Array.isArray(coords) ? coords : null;
      const lines2 = parts?.map(flat);
      if (!lines2 || !lines2.length || lines2.some((l) => !l || l.length < 4)) {
        out.broken++;
        continue;
      }
      for (const l of lines2) {
        grow(l);
        out.lines.push({ coords: l, origin: set.origin, code });
      }
    }
  }
  out.departments = [...deps].sort((a, b) => a - b);
  return out;
}
function roundRing(pts) {
  const q = [];
  for (let i = 0; i < pts.length; i += 2) {
    const x = Math.round(pts[i]);
    const y = Math.round(pts[i + 1]);
    if (q.length && q[q.length - 2] === x && q[q.length - 1] === y) continue;
    q.push(x, y);
  }
  while (q.length >= 4 && q[0] === q[q.length - 2] && q[1] === q[q.length - 1]) q.length -= 2;
  return q;
}
function reversePairs2(p) {
  for (let i = 0, j = p.length - 2; i < j; i += 2, j -= 2) {
    const x = p[i];
    const y = p[i + 1];
    p[i] = p[j];
    p[i + 1] = p[j + 1];
    p[j] = x;
    p[j + 1] = y;
  }
}
function tileClpaZones(zones2, zooms, opts = {}) {
  const out = /* @__PURE__ */ new Map();
  for (const zone of zones2) {
    const world = zone.rings.map((r) => {
      const w = new Float64Array(r.length);
      for (let i = 0; i < r.length; i += 2) {
        const [x, y] = mercator(r[i], r[i + 1]);
        w[i] = x;
        w[i + 1] = y;
      }
      return w;
    });
    const properties = { s: zone.origin, c: zone.code };
    for (const z of zooms) {
      const extent = opts.extent ?? clpaExtent(z);
      const buffer = opts.buffer ?? extent / 64;
      const scale = 2 ** z * extent;
      const outer = world[0];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < outer.length; i += 2) {
        minX = Math.min(minX, outer[i] * scale);
        maxX = Math.max(maxX, outer[i] * scale);
        minY = Math.min(minY, outer[i + 1] * scale);
        maxY = Math.max(maxY, outer[i + 1] * scale);
      }
      const tmax = 2 ** z - 1;
      const tx0 = Math.max(0, Math.floor((minX - buffer) / extent));
      const tx1 = Math.min(tmax, Math.floor((maxX + buffer) / extent));
      const ty0 = Math.max(0, Math.floor((minY - buffer) / extent));
      const ty1 = Math.min(tmax, Math.floor((maxY + buffer) / extent));
      for (let tx = tx0; tx <= tx1; tx++) {
        for (let ty = ty0; ty <= ty1; ty++) {
          const rect = { west: -buffer, east: extent + buffer, south: -buffer, north: extent + buffer };
          const geometry = [];
          for (const [k, w] of world.entries()) {
            const local = [];
            for (let i = 0; i < w.length; i += 2) local.push(w[i] * scale - tx * extent, w[i + 1] * scale - ty * extent);
            const q = roundRing(clipRingToRect(local, rect));
            const area = q.length >= 6 ? signedArea(q) : 0;
            if (area === 0) {
              if (k === 0) break;
              continue;
            }
            if (k === 0 ? area < 0 : area > 0) reversePairs2(q);
            geometry.push(q);
          }
          if (!geometry.length) continue;
          const key = `${z}/${tx}/${ty}`;
          const l = out.get(key);
          const f = { type: 3, geometry, properties };
          if (l) l.push(f);
          else out.set(key, [f]);
        }
      }
    }
  }
  return out;
}
function clpaExtent(z) {
  return z >= 12 ? 4096 : z === 11 ? 2048 : 1024;
}
function clpaBuffer(z) {
  return clpaExtent(z) / 64;
}
function tileClpaLines(lines2, zooms) {
  const features = lines2.map((l) => ({ type: "line", coords: l.coords, properties: { s: l.origin, c: l.code } }));
  const out = /* @__PURE__ */ new Map();
  for (const z of zooms) for (const [k, v] of tileFeatures(features, [z], { extent: clpaExtent(z), buffer: clpaBuffer(z), tolerance: 0 })) out.set(k, v);
  return out;
}
function tilePoints(points, zooms) {
  const out = /* @__PURE__ */ new Map();
  for (const p of points) {
    const [wx, wy] = mercator(p.lng, p.lat);
    for (const z of zooms) {
      if (p.minzoom !== void 0 && z < p.minzoom) continue;
      const n = 2 ** z;
      const extent = clpaExtent(z);
      const tx = Math.min(n - 1, Math.max(0, Math.floor(wx * n)));
      const ty = Math.min(n - 1, Math.max(0, Math.floor(wy * n)));
      const key = `${z}/${tx}/${ty}`;
      const f = { type: 1, geometry: [[Math.round((wx * n - tx) * extent), Math.round((wy * n - ty) * extent)]], properties: p.properties };
      const l = out.get(key);
      if (l) l.push(f);
      else out.set(key, [f]);
    }
  }
  return out;
}
function endBearing(coords) {
  const n = coords.length;
  if (n < 4) return null;
  const [ex, ey] = mercator(coords[n - 2], coords[n - 1]);
  for (let i = n - 4; i >= 0; i -= 2) {
    const [px, py] = mercator(coords[i], coords[i + 1]);
    if (px === ex && py === ey) continue;
    const deg = Math.atan2(ex - px, py - ey) * 180 / Math.PI;
    return Math.round((deg + 360) % 360 * 10) / 10;
  }
  return null;
}
function tileClpaArrows(lines2, zooms) {
  const pts = [];
  for (const l of lines2) {
    if (!CLPA_LINE_ARROW.includes(l.code)) continue;
    const a = endBearing(l.coords);
    if (a === null) continue;
    pts.push({ lng: l.coords[l.coords.length - 2], lat: l.coords[l.coords.length - 1], properties: { s: l.origin, c: l.code, a } });
  }
  return tilePoints(pts, zooms);
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i];
    const yi = ring[i + 1];
    const xj = ring[j];
    const yj = ring[j + 1];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function zoneLabelPoint(rings) {
  const outer = rings[0];
  if (!outer || outer.length < 6) return null;
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = outer.length - 2; i < outer.length; j = i, i += 2) {
    const k = outer[j] * outer[i + 1] - outer[i] * outer[j + 1];
    a += k;
    cx += (outer[j] + outer[i]) * k;
    cy += (outer[j + 1] + outer[i + 1]) * k;
  }
  if (a === 0) return null;
  cx /= 3 * a;
  cy /= 3 * a;
  const inside = (x, y) => inRing(x, y, outer) && !rings.slice(1).some((h) => inRing(x, y, h));
  if (inside(cx, cy)) return [cx, cy];
  const xs = [];
  for (const r of rings) {
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const yi = r[i + 1];
      const yj = r[j + 1];
      if (yi > cy !== yj > cy) xs.push((r[j] - r[i]) * (cy - yi) / (yj - yi) + r[i]);
    }
  }
  xs.sort((p, q) => p - q);
  let best = null;
  let width = 0;
  for (let i = 0; i + 1 < xs.length; i++) {
    const mid = (xs[i] + xs[i + 1]) / 2;
    if (xs[i + 1] - xs[i] > width && inside(mid, cy)) {
      width = xs[i + 1] - xs[i];
      best = [mid, cy];
    }
  }
  return best;
}
function tileClpaNumbers(zones2, zooms) {
  const pts = [];
  for (const z of zones2) {
    if (!z.num) continue;
    const p = zoneLabelPoint(z.rings);
    if (p) pts.push({ lng: p[0], lat: p[1], properties: { n: z.num }, minzoom: CLPA_NUMBERS_MINZOOM });
  }
  return tilePoints(pts, zooms);
}
function clpaIsoDate(d) {
  if (!isDate8(d)) return "";
  const s = String(d);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

// scripts/clpa-build.ts
var [outDir, localDir] = process.argv.slice(2);
if (!outDir) {
  console.error("Usage : node outils/clpa.mjs <dossier de sortie> [<dossier des r\xE9ponses du WFS>]");
  process.exit(1);
}
var UA = "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees; contact@soulane.app)";
var t0 = Date.now();
async function fetchJson(url) {
  let last = null;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6e5) });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return JSON.parse(await r.text());
    } catch (e) {
      last = e;
      if (i < 3) await new Promise((res) => setTimeout(res, 6e4 * (i + 1)));
    }
  }
  throw new Error(`${url} : ${String(last)}`);
}
var zones = [];
var lines = [];
var couches = {};
var departements = /* @__PURE__ */ new Set();
var version = 0;
var maj = 0;
var horsLegende = 0;
var illisibles = 0;
var horsZone = 0;
for (const set of CLPA_SETS) {
  const json = localDir ? JSON.parse(readFileSync(join(localDir, `clpa_${set.id}.json`), "utf8")) : await fetchJson(clpaWfsUrl(set));
  const r = readClpaCollection(json, set);
  const kept = set.geom === "zone" ? r.zones.length : r.lines.length;
  if (!kept) throw new Error(`${set.id} : aucun objet lisible`);
  const skipped = Object.values(r.skipped).reduce((s2, n2) => s2 + n2, 0);
  if (skipped > r.total * 0.05) throw new Error(`${set.id} : ${skipped} objets sur ${r.total} ont un code hors de la l\xE9gende (${JSON.stringify(r.skipped)})`);
  if (r.broken > r.total * 0.01) throw new Error(`${set.id} : ${r.broken} objets illisibles sur ${r.total}`);
  const [w, s, e, n] = r.bbox;
  const outside = !inClpaArea(w, s) || !inClpaArea(e, n);
  let out = 0;
  if (outside) {
    for (const z of r.zones) if (!inClpaArea(z.rings[0][0], z.rings[0][1])) out++;
    for (const l of r.lines) if (!inClpaArea(l.coords[0], l.coords[1])) out++;
  }
  if (out) console.warn(`\u26A0 ${set.id} : ${out} objets hors des zones ${CLPA_REGIONS.map((x) => x.id).join(", ")} : \xE9largir CLPA_REGIONS.`);
  horsZone += out;
  zones.push(...r.zones);
  lines.push(...r.lines);
  for (const d of r.departments) departements.add(d);
  version = Math.max(version, r.fileVersion);
  maj = Math.max(maj, r.lastUpdate);
  horsLegende += skipped;
  illisibles += r.broken;
  couches[set.id] = {
    couche: set.type,
    recus: r.total,
    gardes: kept,
    ...skipped ? { hors_legende: r.skipped } : {},
    ...r.broken ? { illisibles: r.broken } : {},
    ...r.fileVersion ? { version: clpaIsoDate(r.fileVersion) } : {},
    ...r.lastUpdate ? { maj: clpaIsoDate(r.lastUpdate) } : {},
    emprise: r.bbox.map((v) => Math.round(v * 1e4) / 1e4)
  };
  console.log(`${set.id} : ${r.total} objets re\xE7us, ${kept} gard\xE9s${skipped ? `, ${skipped} hors de la l\xE9gende (${JSON.stringify(r.skipped)})` : ""}${r.broken ? `, ${r.broken} illisibles` : ""}`);
}
if (!version) throw new Error("Version des fichiers de la CLPA introuvable (nom du fichier d\u2019origine des objets)");
rmSync(outDir, { recursive: true, force: true });
var stats = {};
var total = 0;
var digests = [];
var none = [];
for (const z of CLPA_ZOOMS) {
  const zz = tileClpaZones(zones, [z]);
  const ll = tileClpaLines(lines, [z]);
  const aa = tileClpaArrows(lines, [z]);
  const nn = tileClpaNumbers(zones, [z]);
  let bytes = 0;
  let count = 0;
  for (const key of /* @__PURE__ */ new Set([...zz.keys(), ...ll.keys(), ...aa.keys(), ...nn.keys()])) {
    const b = encodeMvt(
      [
        { name: CLPA_ZONES_LAYER, extent: clpaExtent(z), features: zz.get(key) ?? none },
        { name: CLPA_LINES_LAYER, extent: clpaExtent(z), features: ll.get(key) ?? none },
        { name: CLPA_ARROWS_LAYER, extent: clpaExtent(z), features: aa.get(key) ?? none },
        { name: CLPA_NUMBERS_LAYER, extent: clpaExtent(z), features: nn.get(key) ?? none }
      ].filter((l) => l.features.length)
    );
    const [, x, y] = key.split("/");
    mkdirSync(join(outDir, String(z), x), { recursive: true });
    writeFileSync(join(outDir, String(z), x, `${y}.pbf`), b);
    bytes += b.length;
    count++;
    digests.push(`${key} ${createHash("sha256").update(b).digest("hex")}`);
  }
  stats[z] = { tuiles: count, octets: bytes };
  total += bytes;
  console.log(`zoom ${z} : ${count} tuiles, ${(bytes / 1048576).toFixed(1)} Mo`);
}
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  outil = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex").slice(0, 12);
} catch {
}
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      fabrique: (/* @__PURE__ */ new Date()).toISOString(),
      source: `${CLPA_WFS} (Carte de localisation des ph\xE9nom\xE8nes d'avalanche : zones et lignes, photo-interpr\xE9tation et t\xE9moignages)`,
      mention: CLPA_CREDIT,
      droit: "Informations publiques (code des relations entre le public et l\u2019administration, articles L. 321-1 et suivants) : source et date de mise \xE0 jour cit\xE9es, sens non d\xE9natur\xE9.",
      geometrie: "Non modifi\xE9e : d\xE9coupage en tuiles et arrondi \xE0 leur grille seulement (aucune simplification).",
      // Version des fichiers de l'INRAE (lue dans les objets) et dernière mise à jour d'un objet.
      version: clpaIsoDate(version),
      ...maj ? { maj: clpaIsoDate(maj) } : {},
      couches,
      zones: zones.length,
      lignes: lines.length,
      numeros: zones.filter((z) => z.num).length,
      departements: [...departements].sort((a, b) => a - b),
      ...horsLegende ? { hors_legende: horsLegende } : {},
      ...illisibles ? { illisibles } : {},
      ...horsZone ? { hors_zone: horsZone } : {},
      zooms: CLPA_ZOOMS,
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`${zones.length} zones, ${lines.length} lignes, version du ${clpaIsoDate(version)} ; total ${(total / 1048576).toFixed(1)} Mo en ${Math.round((Date.now() - t0) / 1e3)} s`);
