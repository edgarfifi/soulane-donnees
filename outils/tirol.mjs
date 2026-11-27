// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles des zones de protection de la forêt et de la faune du Tyrol de Soulane à partir des données ouvertes du
// Land Tirol sur ArcGIS Online (Datenquelle: Land Tirol - data.tirol.gv.at ; CC0 ; géométrie non modifiée : découpage en
// tuiles seulement) :
//   node outils/tirol.mjs <dossier de sortie> [<dossier des réponses déjà téléchargées>]

// scripts/tirol-build.ts
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

// src/shared/core/copies.ts
var zoomsFrom = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
var COPY_SETS = {
  // Land Tirol : zones de protection de la forêt et de la faune (Wald- und Wildschutzzonen) et périmètres de leurs projets
  // (programme « Bergwelt Tirol, Miteinander Erleben »), zones de tranquillité réglementées (Wildruheflächen). 346 zones.
  tirol: {
    id: "tirol",
    base: "https://soulane.app/donnees/tirol/",
    layer: "zones",
    zooms: zoomsFrom(8, 14),
    regions: [{ id: "tirol", box: [10.05, 46.6, 13, 47.8] }],
    credit: "Datenquelle: Land Tirol - data.tirol.gv.at"
  },
  // Agence européenne pour l'environnement : sites Natura 2000 (fin 2024), sans la France (couches PatriNat de l'IGN).
  "natura-eu": {
    id: "natura-eu",
    base: "https://soulane.app/donnees/natura-eu/",
    layer: "natura",
    zooms: zoomsFrom(7, 13),
    regions: [
      { id: "alpes", box: [5, 43.6, 17, 48.6] },
      { id: "pyrenees", box: [-2.6, 41.9, 3.4, 43.5] }
    ],
    credit: "Natura 2000 \xA9 DG ENV, diffus\xE9 par l\u2019Agence europ\xE9enne pour l\u2019environnement (CC BY 4.0)"
  },
  // Agence européenne pour l'environnement : aires protégées nationales (CDDA), sans la France.
  "cdda-eu": {
    id: "cdda-eu",
    base: "https://soulane.app/donnees/cdda-eu/",
    layer: "cdda",
    zooms: zoomsFrom(7, 13),
    regions: [
      { id: "alpes", box: [5, 43.6, 17, 48.6] },
      { id: "pyrenees", box: [-2.6, 41.9, 3.4, 43.5] }
    ],
    credit: "Aires prot\xE9g\xE9es nationales \xA9 Agence europ\xE9enne pour l\u2019environnement (CDDA, CC BY 4.0)"
  }
};
var COPY_IDS = Object.keys(COPY_SETS);
function copyExtent(z) {
  return z >= 12 ? 4096 : z === 11 ? 2048 : 1024;
}
function openRing(r) {
  const n = r.length;
  if (n >= 4 && r[0] === r[n - 2] && r[1] === r[n - 1]) return r.slice(0, n - 2);
  return r.slice();
}
function clipZonesToRegions(zones2, regions) {
  const out = [];
  for (const z of zones2) {
    if (!z.rings.length) continue;
    const o = z.rings[0];
    let w = Infinity;
    let s = Infinity;
    let e = -Infinity;
    let n = -Infinity;
    for (let i = 0; i < o.length; i += 2) {
      w = Math.min(w, o[i]);
      e = Math.max(e, o[i]);
      s = Math.min(s, o[i + 1]);
      n = Math.max(n, o[i + 1]);
    }
    for (const { box } of regions) {
      if (e < box[0] || w > box[2] || n < box[1] || s > box[3]) continue;
      if (w >= box[0] && e <= box[2] && s >= box[1] && n <= box[3]) {
        out.push(z);
        continue;
      }
      const rect = { west: box[0], south: box[1], east: box[2], north: box[3] };
      const outer = clipRingToRect(openRing(o), rect);
      if (outer.length < 6) continue;
      const rings = [outer];
      for (const h of z.rings.slice(1)) {
        const c = clipRingToRect(openRing(h), rect);
        if (c.length >= 6) rings.push(c);
      }
      out.push({ rings, properties: z.properties });
    }
  }
  return out;
}
function merc(lng, lat) {
  const r = Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180;
  return [(lng + 180) / 360, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2];
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
function tileCopyZones(zones2, zooms, opts = {}) {
  const out = /* @__PURE__ */ new Map();
  const extentOf = opts.extent ?? copyExtent;
  for (const zone of zones2) {
    if (!zone.rings.length) continue;
    const world = zone.rings.map((r) => {
      const p = openRing(r);
      const w = new Float64Array(p.length);
      for (let i = 0; i < p.length; i += 2) {
        const [x, y] = merc(p[i], p[i + 1]);
        w[i] = x;
        w[i + 1] = y;
      }
      return w;
    });
    for (const z of zooms) {
      const extent = extentOf(z);
      const buffer = extent / 64;
      const scale = 2 ** z * extent;
      const tol = opts.tolerance?.(z) ?? 0;
      const scaled = world.map((w) => {
        const pts = [];
        for (let i = 0; i < w.length; i++) pts.push(w[i] * scale);
        if (tol <= 0 || pts.length < 8) return pts;
        const closed = simplifyLine([...pts, pts[0], pts[1]], tol);
        closed.length -= 2;
        return closed.length >= 6 ? closed : pts;
      });
      const outer = scaled[0];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < outer.length; i += 2) {
        minX = Math.min(minX, outer[i]);
        maxX = Math.max(maxX, outer[i]);
        minY = Math.min(minY, outer[i + 1]);
        maxY = Math.max(maxY, outer[i + 1]);
      }
      if (maxX - minX < 1 && maxY - minY < 1) continue;
      const tmax = 2 ** z - 1;
      const tx0 = Math.max(0, Math.floor((minX - buffer) / extent));
      const tx1 = Math.min(tmax, Math.floor((maxX + buffer) / extent));
      const ty0 = Math.max(0, Math.floor((minY - buffer) / extent));
      const ty1 = Math.min(tmax, Math.floor((maxY + buffer) / extent));
      const rect = { west: -buffer, east: extent + buffer, south: -buffer, north: extent + buffer };
      for (let tx = tx0; tx <= tx1; tx++) {
        for (let ty = ty0; ty <= ty1; ty++) {
          const geometry = [];
          for (const [k, w] of scaled.entries()) {
            const local = [];
            for (let i = 0; i < w.length; i += 2) local.push(w[i] - tx * extent, w[i + 1] - ty * extent);
            const q = roundRing(clipRingToRect(local, rect));
            const area = q.length >= 6 ? signedArea(q) : 0;
            if (area === 0) {
              if (k === 0) break;
              continue;
            }
            if (k === 0 ? area < 0 : area > 0) reversePairs(q);
            geometry.push(q);
          }
          if (!geometry.length) continue;
          const key = `${z}/${tx}/${ty}`;
          const f = { type: 3, geometry, properties: zone.properties };
          const l = out.get(key);
          if (l) l.push(f);
          else out.set(key, [f]);
        }
      }
    }
  }
  return out;
}
function zoneVertexCount(zones2) {
  let n = 0;
  for (const z of zones2) for (const r of z.rings) n += r.length >> 1;
  return n;
}

// src/shared/core/tirolZones.ts
var AGOL = "https://services3.arcgis.com/hG7UfxX49PQ8XkXh/arcgis/rest/services";
var TIROL_SCHUTZZONE = 1;
var TIROL_PROJEKT = 2;
var TIROL_WILDRUHE = 3;
var TIROL_SCHUTZGUT = { SGBiAu: 1, SGGaSt: 2, SGRot: 3, SGOsw: 4 };
var TIROL_SERVICES = [
  { name: "Wald_und_Wildschutzzonen", cls: TIROL_SCHUTZZONE, min: 200 },
  { name: "Wald_Wildschutzzonen_Projektgrenzen", cls: TIROL_PROJEKT, min: 15 },
  { name: "Wildruheflaechen_Tirol", cls: TIROL_WILDRUHE, min: 35 }
];
var TIROL_DATA_PAGE = "https://www.data.gv.at/katalog/dataset/73113a73-15e0-4950-91d8-ee5e82402c9f";
function tirolLayerUrl(s) {
  return `${AGOL}/${s.name}/FeatureServer/0`;
}
function tirolQueryUrl(s) {
  return `${tirolLayerUrl(s)}/query?where=1%3D1&outFields=*&outSR=4326&returnGeometry=true&f=geojson`;
}
function tirolCountUrl(s) {
  return `${tirolLayerUrl(s)}/query?where=1%3D1&returnCountOnly=true&f=json`;
}
var isNum = (v) => typeof v === "number" && Number.isFinite(v);
function flatRing(r) {
  if (!Array.isArray(r) || r.length < 4) return null;
  const out = [];
  for (const p of r) {
    if (!Array.isArray(p) || !isNum(p[0]) || !isNum(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) return null;
    out.push(p[0], p[1]);
  }
  return out;
}
var text = (v) => typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : null;
function readTirolGeojson(json, cls) {
  const r = { zones: [], total: 0, broken: 0, updated: 0, truncated: false };
  if (!json || typeof json !== "object") throw new Error("R\xE9ponse illisible (pas un objet GeoJSON).");
  const fc = json;
  if (fc.error) throw new Error(`Le service r\xE9pond une erreur : ${JSON.stringify(fc.error).slice(0, 200)}`);
  if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) throw new Error("R\xE9ponse illisible (pas une FeatureCollection).");
  r.truncated = fc.properties?.exceededTransferLimit === true || fc.exceededTransferLimit === true;
  for (const f of fc.features) {
    r.total++;
    const p = f.properties ?? {};
    const g = f.geometry;
    const polys = g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" && Array.isArray(g.coordinates) ? g.coordinates : null;
    if (!polys) {
      r.broken++;
      continue;
    }
    const properties = { k: cls };
    if (cls === TIROL_SCHUTZZONE) properties.s = TIROL_SCHUTZGUT[String(p.OBJEKT ?? "")] ?? 0;
    const name = text(p.ORTSBEZEICHNUNG) ?? text(p.NAME) ?? text(p.BEZEICHNUNG);
    if (name) properties.n = name;
    if (isNum(p.UPDATETIMESTAMP)) r.updated = Math.max(r.updated, p.UPDATETIMESTAMP);
    let ok = false;
    for (const poly of polys) {
      if (!Array.isArray(poly) || !poly.length) continue;
      const rings = poly.map(flatRing);
      if (!rings[0]) continue;
      r.zones.push({ rings: rings.filter((x) => x !== null), properties });
      ok = true;
    }
    if (!ok) r.broken++;
  }
  return r;
}
function readTirolCount(json) {
  const c = json?.count;
  return isNum(c) ? c : null;
}

// scripts/tirol-build.ts
var [outDir, localDir] = process.argv.slice(2);
if (!outDir) {
  console.error("Usage : node outils/tirol.mjs <dossier de sortie> [<dossier des r\xE9ponses d\xE9j\xE0 t\xE9l\xE9charg\xE9es>]");
  process.exit(1);
}
var SET = COPY_SETS.tirol;
var UA = "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees; contact@soulane.app)";
var t0 = Date.now();
async function fetchJson(url) {
  let last = null;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(3e5) });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return JSON.parse(await r.text());
    } catch (e) {
      last = e;
      if (i < 3) await new Promise((res) => setTimeout(res, 3e4 * (i + 1)));
    }
  }
  throw new Error(`${url} : ${String(last)}`);
}
var isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
var zones = [];
var couches = {};
var updated = 0;
for (const s of TIROL_SERVICES) {
  const json = localDir ? JSON.parse(readFileSync(join(localDir, `${s.name}.geojson`), "utf8")) : await fetchJson(tirolQueryUrl(s));
  const r = readTirolGeojson(json, s.cls);
  const announced = localDir ? r.total : readTirolCount(await fetchJson(tirolCountUrl(s)));
  if (r.truncated) throw new Error(`${s.name} : r\xE9ponse coup\xE9e par le service (plus de zones que sa limite).`);
  if (announced !== null && announced !== r.total) throw new Error(`${s.name} : ${r.total} zones re\xE7ues, ${announced} annonc\xE9es.`);
  if (r.total < s.min) throw new Error(`${s.name} : seulement ${r.total} zones (au moins ${s.min} attendues).`);
  if (r.broken > r.total * 0.02) throw new Error(`${s.name} : ${r.broken} zones illisibles sur ${r.total}.`);
  zones.push(...r.zones);
  updated = Math.max(updated, r.updated);
  couches[s.name] = { classe: s.cls, recues: r.total, morceaux: r.zones.length, ...r.broken ? { illisibles: r.broken } : {}, ...r.updated ? { maj: isoDay(r.updated) } : {}, source: tirolLayerUrl(s) };
  console.log(`${s.name} : ${r.total} zones (${r.zones.length} polygones)${r.broken ? `, ${r.broken} illisibles` : ""}`);
}
var kept = clipZonesToRegions(zones, SET.regions);
if (kept.length < zones.length) console.warn(`\u26A0 ${zones.length - kept.length} polygones hors de la r\xE9gion du jeu, non repris.`);
rmSync(outDir, { recursive: true, force: true });
var stats = {};
var digests = [];
var total = 0;
for (const z of SET.zooms) {
  const tiles = tileCopyZones(kept, [z]);
  let bytes = 0;
  for (const [key, features] of tiles) {
    const b = encodeMvt([{ name: SET.layer, extent: copyExtent(z), features }]);
    const [, x, y] = key.split("/");
    mkdirSync(join(outDir, String(z), x), { recursive: true });
    writeFileSync(join(outDir, String(z), x, `${y}.pbf`), b);
    bytes += b.length;
    digests.push(`${key} ${createHash("sha256").update(b).digest("hex")}`);
  }
  stats[z] = { tuiles: tiles.size, octets: bytes };
  total += bytes;
  console.log(`zoom ${z} : ${tiles.size} tuiles, ${(bytes / 1024).toFixed(0)} Ko`);
}
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  outil = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex").slice(0, 12);
} catch {
}
var classes = {};
for (const z of kept) classes[String(z.properties.k)] = (classes[String(z.properties.k)] ?? 0) + 1;
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      jeu: SET.id,
      fabrique: (/* @__PURE__ */ new Date()).toISOString(),
      source: `Land Tirol, donn\xE9es ouvertes (${TIROL_DATA_PAGE}) : services ${TIROL_SERVICES.map((s) => s.name).join(", ")} d'ArcGIS Online`,
      mention: SET.credit,
      droit: "CC0 1.0 (ArcGIS Online, data.gv.at) ; mention de la source donn\xE9e comme pour CC BY 4.0.",
      geometrie: "Non modifi\xE9e : d\xE9coupage en tuiles et arrondi \xE0 leur grille seulement (aucune simplification).",
      // Le jour de la lecture (le Land refait ses services chaque jour ; une date de dernière modification pourrait reculer
      // quand une zone est retirée, et le robot refuserait de publier) ; la dernière zone modifiée, à part (`maj`).
      version: isoDay(Date.now()),
      ...updated ? { maj: isoDay(updated) } : {},
      couches,
      zones: kept.length,
      classes,
      sommets: zoneVertexCount(kept),
      zooms: SET.zooms,
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`${kept.length} zones ; total ${(total / 1048576).toFixed(2)} Mo en ${Math.round((Date.now() - t0) / 1e3)} s`);
