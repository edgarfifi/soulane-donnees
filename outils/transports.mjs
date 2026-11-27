// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Fabrique les tuiles et l'index du calque « Train, car et skibus » de Soulane à partir des horaires théoriques (GTFS) des
// réseaux des zones de montagne (transport.data.gouv.fr, opentransportdata.swiss, ÖBB ; licences relues à chaque fois) :
//   node --max-old-space-size=6144 outils/transports.mjs <dossier de sortie> [--seulement id1,id2]

// scripts/transports-build.ts
import { createHash } from "node:crypto";
import { closeSync, createReadStream, createWriteStream, existsSync, fstatSync, mkdirSync, mkdtempSync, openSync, readSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createInflateRaw } from "node:zlib";
import { fileURLToPath } from "node:url";

// src/shared/core/transit.ts
var TRANSIT_INDEX_FILE = "index.json";
var TRANSIT_INDEX_VERSION = 1;
var TRANSIT_LINES_LAYER = "lignes";
var TRANSIT_STOPS_LAYER = "arrets";
var TRANSIT_ZOOMS = [8, 9, 10, 11, 12, 13];
var TRANSIT_MODE_COLOR = { train: "2b3a55", car: "1f6f8b", cable: "8a3b6b", tram: "4a6b2f" };
function modeOfRouteType(t) {
  if (!Number.isFinite(t)) return null;
  if (t === 2 || t >= 100 && t < 200) return "train";
  if (t === 3 || t === 11 || t >= 200 && t < 300 || t >= 700 && t < 800 || t === 800) return "car";
  if (t === 5 || t === 6 || t === 7 || t >= 1300 && t < 1500) return "cable";
  if (t === 0 || t >= 900 && t < 1e3) return "tram";
  return null;
}
var TRANSIT_ZONES = [
  { id: "alpes-ouest", label: "Alpes fran\xE7aises et italiennes", box: [5.2, 43.85, 8.3, 46.42] },
  { id: "alpes-suisses", label: "Alpes suisses (ouest)", box: [6.8, 46, 8.3, 46.86] },
  { id: "alpes-centrales", label: "Alpes suisses et autrichiennes", box: [8.3, 46, 10.5, 47.15] },
  { id: "alpes-est", label: "Alpes autrichiennes", box: [9.5, 46.35, 15.9, 47.85] },
  { id: "jura", label: "Jura", box: [5.4, 46.2, 7.1, 47.3] },
  { id: "vosges", label: "Vosges", box: [6.6, 47.75, 7.45, 48.5] },
  { id: "massif-central", label: "Massif central", box: [2.3, 44.6, 3.95, 45.75] },
  { id: "pyrenees", label: "Pyr\xE9n\xE9es", box: [-1.8, 42.4, 2.6, 43.12] },
  { id: "corse", label: "Corse", box: [8.5, 41.35, 9.6, 43.05] }
];
function inTransitZone(lng, lat) {
  return TRANSIT_ZONES.some(({ box: [w, s, e, n] }) => lng >= w && lng <= e && lat >= s && lat <= n);
}
var TDG_LICENCES = {
  lov2: { name: "Licence Ouverte 2.0 (Etalab)", url: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" },
  "fr-lo": { name: "Licence Ouverte (Etalab)", url: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/" },
  "odc-odbl": { name: "ODbL 1.0", url: "https://opendatacommons.org/licenses/odbl/1-0/" }
};
var tdg = (id, nom, slug, horaires) => ({ id, nom, pays: "fr", source: { tdg: slug }, ...horaires ? { horaires } : {} });
var TRANSIT_FEEDS = [
  // Trains et cars de toute la France (filtrés à la zone de montagne).
  tdg("sncf", "SNCF (TER, Intercit\xE9s, TGV)", "horaires-sncf", "https://www.sncf-connect.com/"),
  // Alpes du Nord : cars des départements, navettes des stations, réseaux des vallées.
  tdg("cars-region-73", "Cars R\xE9gion Savoie", "reseau-interurbain-cars-region-savoie-73", "https://www.oura.com/"),
  tdg("cars-region-74", "Cars R\xE9gion Haute-Savoie", "reseau-interurbain-cars-region-haute-savoie-74", "https://www.oura.com/"),
  tdg("cars-region-38", "Cars R\xE9gion Is\xE8re", "reseau-interurbain-cars-region-isere-38-1", "https://www.oura.com/"),
  tdg("cars-region-01", "Cars R\xE9gion Ain", "reseau-interurbain-cars-region-ain-01", "https://www.oura.com/"),
  tdg("cars-region-26", "Cars R\xE9gion Dr\xF4me", "reseau-interurbain-cars-region-drome-26", "https://www.oura.com/"),
  tdg("cars-region-express", "Cars R\xE9gion Express", "reseau-interurbain-cars-region-express", "https://www.oura.com/"),
  tdg("transaltitude", "Transaltitude (Is\xE8re)", "desserte-des-stations-de-ski-iseroises-transaltitude-38", "https://www.transaltitude.fr/fr/liste-des-stations-horaire-et-tarifs/"),
  tdg("chamonix", "Chamonix Mobilit\xE9", "gtfs-reseau-chamonix-mobilite", "https://www.chamonix-mobilite.com/bus"),
  tdg("sibra", "Sibra (Annecy)", "offre-de-transports-sibra-a-annecy-gtfs"),
  tdg("aravis", "Aravis Bus", "aravis-bus-hiver-2025-2026"),
  tdg("giffre", "Navettes du Giffre", "les-navettes-du-giffre-horaires-hiver-2023-2024"),
  tdg("thonon", "Star\u2019t (Thonon)", "start-horaires-du-reseau-de-lagglomeration-de-thonon", "https://www.star-t.fr/se-deplacer/lignes-et-horaires"),
  tdg("albertville", "TRA Mobilit\xE9 (Albertville)", "tra-mobilite-horaires-du-reseau-dalbertville", "https://savoie.transdev.com/les-horaires/"),
  tdg("courchevel", "Skibus Courchevel", "skibus-courchevel-hiver"),
  tdg("courchevel-cable", "C\xE2bles de Courchevel", "transport-urbain-par-cable-hiver-2025-26", "https://www.mairie-courchevel.com/services-et-infos-pratiques/transports-stationnement/transport-urbain-par-cable.html"),
  tdg("belleville", "Skibus Vall\xE9e des Belleville", "skibus-vallee-des-belleville"),
  tdg("meribus", "M\xE9ribus", "meribus-ete", "https://www.meribel.net/informations-pratiques/navettes-meribus/"),
  tdg("valmorel", "Valmobus", "horaires-theoriques-et-temps-reel-de-la-station-de-ski-valmorel-gtfs-gtfs-rt"),
  tdg("tignes", "Navettes de Tignes", "navettes-tignes"),
  tdg("val-isere", "Navettes de Val d\u2019Is\xE8re", "navettes-val-disere"),
  tdg("bourg-st-maurice", "Navettes de Bourg-Saint-Maurice", "navettes-bourg-saint-maurice"),
  tdg("arcs-funiculaire", "Funiculaire des Arcs", "funiculaire-des-arcs"),
  tdg("rosiere", "Navettes de La Rosi\xE8re", "navettes-la-rosiere", "https://www.mairie-montvalezan.fr/mobilite-transport/"),
  tdg("saisies", "Navette Col\u2019ette (Les Saisies)", "navette-colette-savoie-les-saisies"),
  tdg("alpe-huez", "Navettes de l\u2019Alpe d\u2019Huez", "horaires-theoriques-et-temps-reel-des-navettes-hivernales-de-lalpe-dhuez-gtfs-gtfs-rt"),
  tdg("deux-alpes", "Navettes des 2 Alpes", "gtfs-les-2alpes-saison-hiver-2025-2026", "https://www.autocars-resalp.com/lignes-horaires/navettes-station-2-alpes"),
  tdg("eau-dolle", "T\xE9l\xE9cabine Eau d\u2019Olle Express", "telecabine-eau-dolle-express-allemond-oz"),
  tdg("bastille", "T\xE9l\xE9ph\xE9rique de la Bastille", "horaires-theoriques-du-telepherique-de-la-bastille", "https://bastille-grenoble.fr/horaires/"),
  // Alpes du Sud.
  tdg("zou-express", "ZOU ! Express", "lignes-des-reseaux-transport-zou-provence-alpes-cote-d-azur-express-3-3", "https://zou.maregionsud.fr/fiches-horaires"),
  tdg("zou-proximite", "ZOU ! Proximit\xE9", "lignes-des-reseaux-transport-zou-provence-alpes-cote-d-azur-proximite-3-3", "https://zou.maregionsud.fr/fiches-horaires"),
  tdg("zou-trains", "Trains ZOU !", "trains-zou-en-provence-alpes-cote-dazur", "https://zou.maregionsud.fr/fiches-horaires"),
  tdg("lignes-azur", "Lignes d\u2019Azur", "donnees-statiques-et-dynamiques-du-reseau-de-transport-lignes-dazur"),
  tdg("altigo", "Altigo (Brian\xE7onnais)", "donnees-de-transport-en-commun-reseau-altigo-communaute-de-communes-du-brianconnais-format-gtfs", "https://www.monaltigo.fr/reseau-et-horaires"),
  tdg("queyras", "Navettes du Guillestrois et du Queyras", "reseau-de-transports-collectifs-de-la-ccgq", "https://www.ccguillestroisqueyras.fr/vivre/deplacements/"),
  tdg("ecrins", "Bus du Pays des \xC9crins", "transports-en-commun-pays-des-ecrins"),
  tdg("vai-stations", "Navettes des stations (Va\xEF)", "navettes-stations-hiver-2025-2026-reseau-vai"),
  tdg("vai-embrun", "Va\xEF Embrun", "reseau-vai-embrun"),
  tdg("gap", "L\u2019Agglo en Bus (Gap)", "horaires-theoriques-et-temps-reels-du-reseau-de-transports-lagglo-en-bus-communaute-dagglomeration-gap-tallard-durance"),
  // Pyrénées.
  tdg("lio", "liO Occitanie", "reseau-lio-occitanie", "https://www.lio-occitanie.fr/horaires-et-plans/"),
  tdg("pyr-atl", "Cars des Pyr\xE9n\xE9es-Atlantiques", "arrets-horaires-et-parcours-theoriques-des-reseaux-naq-pat-nva-m-1"),
  tdg("tlp", "TLP Mobilit\xE9s (Tarbes, Lourdes)", "horaires-theoriques-du-reseau-tarbes-lourdes-tlp-mobilites-gtfs", "https://www.tlp-mobilites.com/horaires-et-plans-des-lignes-de-bus/"),
  tdg("la-mongie", "Navettes Bagn\xE8res-de-Bigorre, La Mongie", "horaires-theoriques-et-temps-reel-des-navettes-de-la-ligne-bagneres-la-mongie-gtfs-gtfs-rt"),
  tdg("arrens", "Ligne Arrens-Marsous, Lourdes", "tad-arrens-marsous-lourdes"),
  tdg("foix", "L\u2019Agglobus (Foix)", "reseau-lagglo-bus-de-lagglo-foix-varilhes", "https://lagglobus.fr/horaires-des-lignes/"),
  // Massif central, Vosges, Jura.
  tdg("cars-region-63", "Cars R\xE9gion Puy-de-D\xF4me", "reseau-interurbain-cars-region-puy-de-dome-63", "https://www.oura.com/"),
  tdg("cars-region-15", "Cars R\xE9gion Cantal", "reseau-interurbain-cars-region-cantal-15", "https://www.oura.com/"),
  tdg("cars-region-43", "Cars R\xE9gion Haute-Loire", "reseau-interurbain-cars-region-haute-loire-43", "https://www.oura.com/"),
  tdg("fluo-68", "Fluo Grand Est (Haut-Rhin)", "offre-de-transport-du-reseau-fluo-grand-est-haut-rhin-68", "https://www.fluo.grandest.fr/fiches-horaires"),
  tdg("fluo-88", "Fluo Grand Est (Vosges)", "offre-de-transport-du-reseau-fluo-grand-est-vosges-88", "https://www.fluo.grandest.fr/fiches-horaires"),
  tdg("mobigo", "Mobigo (Bourgogne-Franche-Comt\xE9)", "reseau-de-transport-interurbain-mobigo-en-bourgogne-franche-comte", "https://www.viamobigo.fr/fr/horaires/23"),
  // Corse.
  tdg("corse-cars", "Cars de Corse", "gtfs-transport-via-strada"),
  tdg("corse-train", "Chemins de fer de la Corse", "gtfs-transport-horaires-chemins-de-fer-corse-1", "https://cf-corse.corsica/horaires/"),
  tdg("restonica", "Navette de la Restonica", "gtfs-transport-via-corsica-corte-a-la-vallee-de-la-restonica-ligne-c13", "https://www.isula.corsica/Navetta-Restonica-C13_a4624.html"),
  // Suisse : tout le pays (trains, cars postaux, téléphériques), filtré à la zone de montagne. Conditions d'utilisation
  // d'opentransportdata.swiss : données libres (aussi pour un usage commercial), traitées et republiées, à condition de citer
  // la source et de les tenir à jour aussi souvent que la source (chaque semaine).
  {
    id: "suisse",
    nom: "Transports publics suisses",
    pays: "ch",
    source: {
      url: "https://data.opentransportdata.swiss/fr/dataset/timetable-{annee}-gtfs2020/permalink",
      licence: { name: "Conditions d\u2019utilisation d\u2019opentransportdata.swiss", url: "https://opentransportdata.swiss/fr/terms-of-use/" },
      producteur: "opentransportdata.swiss"
    },
    horaires: "https://www.sbb.ch/fr",
    sansExploitants: "SNCF|Soci\xE9t\xE9 Nationale des Chemins de fer Fran\xE7ais"
  },
  // Autriche : horaires des trains de l'ÖBB, CC BY 4.0 (les cars Postbus n'y sont pas).
  {
    id: "oebb",
    nom: "\xD6BB (trains)",
    pays: "at",
    source: {
      url: "https://static.web.oebb.at/open-data/soll-fahrplan-gtfs/GTFS_Fahrplan_{annee}.zip",
      licence: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
      producteur: "\xD6BB-Personenverkehr AG (data.oebb.at)"
    },
    horaires: "https://fahrplan.oebb.at/"
  }
];
var SCHEDULE_PAGES = new Set(TRANSIT_FEEDS.map((f) => f.horaires).filter((u) => !!u));
function yearCandidates(url, now = /* @__PURE__ */ new Date()) {
  if (!url.includes("{annee}")) return [url];
  const y = now.getUTCFullYear();
  return [y + 1, y].map((a) => url.split("{annee}").join(String(a)));
}
function cleanStopName(name) {
  const s = name.replace(/\s+/g, " ").trim();
  if (!s) return s;
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3 || letters !== letters.toUpperCase()) return s;
  const small = /* @__PURE__ */ new Set(["de", "du", "des", "la", "le", "les", "et", "\xE0", "au", "aux", "sur", "sous", "en", "d'", "l'"]);
  return s.toLowerCase().split(/(\s+|-|')/).map((w, i) => i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join("");
}
function cleanColor(c) {
  const s = (c ?? "").trim().replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(s) ? s : null;
}
var lum = (hex) => {
  const n = parseInt(hex, 16);
  const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
function contrastRatio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function readableText(bg, fg) {
  if (fg && /^[0-9a-f]{6}$/i.test(fg) && contrastRatio(bg, fg) >= 3) return fg.toLowerCase();
  return contrastRatio(bg, "000000") >= contrastRatio(bg, "ffffff") ? "000000" : "ffffff";
}
function splitCsvLine(line) {
  if (!line.includes('"')) return line.split(",");
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}
function stopKey(name) {
  return name.normalize("NFD").replace(new RegExp("\\p{M}+", "gu"), "").toLowerCase().replace(/\b(gare( sncf| routiere)?|station|bahnhof|bf)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}
function mergeStops(stops, sameNameM = 80, anyM = 12) {
  const cell = 2e-3;
  const grid = /* @__PURE__ */ new Map();
  const out = [];
  const keys = stops.map((s) => stopKey(s.name));
  stops.forEach((s, i) => {
    const cx = Math.floor(s.lng / cell);
    const cy = Math.floor(s.lat / cell);
    let found = -1;
    const cos = Math.cos(s.lat * Math.PI / 180);
    for (let dx = -1; dx <= 1 && found < 0; dx++) {
      for (let dy = -1; dy <= 1 && found < 0; dy++) {
        for (const j of grid.get(`${cx + dx}/${cy + dy}`) ?? []) {
          const t = stops[j];
          const d = Math.hypot((t.lng - s.lng) * 111320 * cos, (t.lat - s.lat) * 110574);
          if (d <= anyM || d <= sameNameM && keys[j] === keys[i] && keys[i] !== "") {
            found = j;
            break;
          }
        }
      }
    }
    out.push(found >= 0 ? out[found] : i);
    const k = `${cx}/${cy}`;
    const l = grid.get(k);
    if (l) l.push(i);
    else grid.set(k, [i]);
  });
  return out;
}
function zoneRuns(coords) {
  const n = coords.length >> 1;
  const runs = [];
  let cur = [];
  const inside = (i) => inTransitZone(coords[i * 2], coords[i * 2 + 1]);
  for (let i = 0; i + 1 < n; i++) {
    if (inside(i) || inside(i + 1)) {
      if (!cur.length) cur.push(coords[i * 2], coords[i * 2 + 1]);
      cur.push(coords[i * 2 + 2], coords[i * 2 + 3]);
    } else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length >= 4) runs.push(cur);
  return runs;
}
function mainMode(modes) {
  const set = new Set(modes);
  return set.has("train") ? "train" : set.has("cable") ? "cable" : set.has("tram") ? "tram" : "car";
}
var STOP_MINZOOM = { train: 9, cable: 11, tram: 12, car: 12 };
var LINE_MINZOOM = { train: 8, cable: 10, tram: 11, car: 10 };
var APPROX_MAX_HOP_M = { train: 12e3, cable: 6e3, tram: 4e3, car: 8e3 };
function splitLongHops(coords, maxM) {
  const out = [];
  let cur = [];
  for (let i = 0; i + 1 < coords.length; i += 2) {
    if (cur.length) {
      const [lng0, lat0] = [cur[cur.length - 2], cur[cur.length - 1]];
      const k = Math.cos((lat0 + coords[i + 1]) / 2 * (Math.PI / 180));
      const dx = (coords[i] - lng0) * k * 111320;
      const dy = (coords[i + 1] - lat0) * 110574;
      if (Math.hypot(dx, dy) > maxM) {
        if (cur.length >= 4) out.push(cur);
        cur = [];
      }
    }
    cur.push(coords[i], coords[i + 1]);
  }
  if (cur.length >= 4) out.push(cur);
  return out;
}
var APPROX_LINE_MINZOOM = { train: 8, cable: 12, tram: 12, car: 12 };

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

// scripts/transports-build.ts
var args = process.argv.slice(2);
var outDir = args[0];
var opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : void 0;
};
if (!outDir || outDir.startsWith("--")) {
  console.error("Usage : node outils/transports.mjs <dossier de sortie> [--seulement id1,id2] [--cache <dossier>]");
  process.exit(1);
}
var only = opt("--seulement")?.split(",");
var cacheDir = opt("--cache");
var UA = "Soulane-donnees (+https://github.com/edgarfifi/soulane-donnees; contact@soulane.app)";
var t0 = Date.now();
var secs = () => `${Math.round((Date.now() - t0) / 1e3)} s`;
var STALL_MS = 12e4;
async function download(url, file) {
  for (let i = 1; ; i++) {
    const ctl = new AbortController();
    let dog;
    const feed = () => {
      clearTimeout(dog);
      dog = setTimeout(() => ctl.abort(new Error(`aucune donn\xE9e re\xE7ue pendant ${STALL_MS / 1e3} s`)), STALL_MS);
    };
    try {
      feed();
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctl.signal, redirect: "follow" });
      if (!r.ok || !r.body) throw new Error(`r\xE9ponse ${r.status}`);
      const watch = new Transform({
        transform(chunk, _enc, cb) {
          feed();
          cb(null, chunk);
        }
      });
      await pipeline(Readable.fromWeb(r.body), watch, createWriteStream(file));
      return;
    } catch (e) {
      const why = ctl.signal.aborted ? String(ctl.signal.reason) : String(e);
      if (i >= 3) throw new Error(`${url} : t\xE9l\xE9chargement impossible (${why})`, { cause: e });
      console.log(`${url} : essai ${i} rat\xE9 (${why}), nouvel essai dans 30 s`);
      await new Promise((res) => setTimeout(res, 3e4));
    } finally {
      clearTimeout(dog);
    }
  }
}
var tdgList = null;
async function tdgDataset(slug) {
  if (!tdgList) {
    const r = await fetch("https://transport.data.gouv.fr/api/datasets", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(18e4) });
    if (!r.ok) throw new Error(`liste de transport.data.gouv.fr : r\xE9ponse ${r.status}`);
    const all = await r.json();
    tdgList = new Map(all.filter((d2) => typeof d2.slug === "string").map((d2) => [d2.slug, d2]));
  }
  const d = tdgList.get(slug);
  if (!d) throw new Error(`jeu ${slug} : absent de transport.data.gouv.fr`);
  return d;
}
async function tdgResources(slug) {
  const d = await tdgDataset(slug);
  const licence = TDG_LICENCES[d.licence ?? ""];
  if (!licence) throw new Error(`jeu ${slug} : licence \xAB ${d.licence} \xBB non accept\xE9e`);
  const gtfs = (d.resources ?? []).filter((x) => x.format === "GTFS" && (typeof x.url === "string" || typeof x.original_url === "string"));
  const files = [];
  const seen = /* @__PURE__ */ new Set();
  for (const x of [...gtfs.filter((r) => r.is_available !== false), ...gtfs.filter((r) => r.is_available === false)]) {
    const urls = [...new Set([x.url, x.original_url].filter((u) => typeof u === "string" && /^https?:\/\//.test(u)))].filter((u) => !seen.has(u));
    if (!urls.length) continue;
    for (const u of urls) seen.add(u);
    files.push({ urls, optional: x.is_available === false });
  }
  if (!files.length) throw new Error(`jeu ${slug} : aucun GTFS`);
  return { files, licence };
}
async function downloadFeedFile(f, file) {
  let last = null;
  for (const u of f.urls) {
    try {
      await download(u, file);
      return true;
    } catch (e) {
      last = e;
      rmSync(file, { force: true });
    }
  }
  if (f.optional) {
    console.log(`Fichier dit indisponible, et il l'est : ${f.urls.join(", ")} (${String(last)})`);
    return false;
  }
  throw last instanceof Error ? last : new Error(String(last));
}
async function firstAvailable(urls) {
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { "User-Agent": UA, Range: "bytes=0-0" }, redirect: "follow", signal: AbortSignal.timeout(6e4) });
      await r.body?.cancel();
      if (r.ok) return u;
    } catch {
    }
  }
  throw new Error(`aucune adresse ne r\xE9pond : ${urls.join(", ")}`);
}
function zipEntries(file) {
  const fd = openSync(file, "r");
  try {
    const size = fstatSync(fd).size;
    const tailLen = Math.min(size, 65557);
    const tail = Buffer.alloc(tailLen);
    readSync(fd, tail, 0, tailLen, size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 101010256) {
      eocd = i;
      break;
    }
    if (eocd < 0) throw new Error("pas un zip");
    let cdSize = tail.readUInt32LE(eocd + 12);
    let cdOff = tail.readUInt32LE(eocd + 16);
    let count = tail.readUInt16LE(eocd + 10);
    if (cdOff === 4294967295 || count === 65535) {
      const loc = eocd - 20;
      if (loc >= 0 && tail.readUInt32LE(loc) === 117853008) {
        const z64 = Number(tail.readBigUInt64LE(loc + 8));
        const rec = Buffer.alloc(56);
        readSync(fd, rec, 0, 56, z64);
        count = Number(rec.readBigUInt64LE(32));
        cdSize = Number(rec.readBigUInt64LE(40));
        cdOff = Number(rec.readBigUInt64LE(48));
      }
    }
    const cd = Buffer.alloc(cdSize);
    readSync(fd, cd, 0, cdSize, cdOff);
    const out = /* @__PURE__ */ new Map();
    let p = 0;
    for (let n = 0; n < count && p + 46 <= cd.length; n++) {
      if (cd.readUInt32LE(p) !== 33639248) break;
      const method = cd.readUInt16LE(p + 10);
      let compSize = cd.readUInt32LE(p + 20);
      let usize = cd.readUInt32LE(p + 24);
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const commentLen = cd.readUInt16LE(p + 32);
      let local = cd.readUInt32LE(p + 42);
      const name = cd.toString("utf8", p + 46, p + 46 + nameLen);
      let e = p + 46 + nameLen;
      const end = e + extraLen;
      while (e + 4 <= end) {
        const id = cd.readUInt16LE(e);
        const len = cd.readUInt16LE(e + 2);
        if (id === 1) {
          let q = e + 4;
          if (usize === 4294967295) {
            usize = Number(cd.readBigUInt64LE(q));
            q += 8;
          }
          if (compSize === 4294967295) {
            compSize = Number(cd.readBigUInt64LE(q));
            q += 8;
          }
          if (local === 4294967295) local = Number(cd.readBigUInt64LE(q));
        }
        e += 4 + len;
      }
      const lh = Buffer.alloc(30);
      readSync(fd, lh, 0, 30, local);
      const offset = local + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
      out.set(name.split("/").pop(), { name, method, compSize, offset });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  } finally {
    closeSync(fd);
  }
}
async function readCsv(file, entries, name, cols, onRow) {
  const e = entries.get(name);
  if (!e) return false;
  const raw = createReadStream(file, { start: e.offset, end: e.offset + e.compSize - 1 });
  const stream = e.method === 8 ? raw.pipe(createInflateRaw()) : raw;
  let head = null;
  let rest = "";
  const dec = new TextDecoder("utf-8");
  const handle = (line) => {
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line) return;
    const f = splitCsvLine(line);
    if (!head) {
      const names = f.map((h) => h.replace(/^\uFEFF/, "").trim());
      head = cols.map((c) => names.indexOf(c));
      return;
    }
    const row = {};
    cols.forEach((c, i) => {
      const k = head[i];
      row[c] = k >= 0 ? (f[k] ?? "").trim() : "";
    });
    onRow(row);
  };
  for await (const chunk of stream) {
    const text = rest + dec.decode(chunk, { stream: true });
    const lines = text.split("\n");
    rest = lines.pop() ?? "";
    for (const l of lines) handle(l);
  }
  handle(rest + dec.decode());
  return true;
}
async function readFeed(feed, file, source, licence) {
  const entries = zipEntries(file);
  const agencies = /* @__PURE__ */ new Map();
  await readCsv(file, entries, "agency.txt", ["agency_id", "agency_name", "agency_url"], (r) => agencies.set(r.agency_id, { name: r.agency_name, url: r.agency_url }));
  const stops = /* @__PURE__ */ new Map();
  const parents = /* @__PURE__ */ new Map();
  await readCsv(file, entries, "stops.txt", ["stop_id", "stop_name", "stop_lat", "stop_lon", "location_type", "parent_station"], (r) => {
    const lat = Number(r.stop_lat);
    const lng = Number(r.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 && lng === 0) return;
    const lt = r.location_type || "0";
    if (lt !== "0" && lt !== "1") return;
    stops.set(r.stop_id, { lng, lat, name: cleanStopName(r.stop_name), shown: r.stop_id });
    if (lt === "0" && r.parent_station) parents.set(r.stop_id, r.parent_station);
  });
  for (const [id, p] of parents) if (stops.has(p)) stops.get(id).shown = p;
  const shownIn = (id) => {
    const s = stops.get(id);
    if (!s) return null;
    const sh = stops.get(s.shown) ?? s;
    return inTransitZone(sh.lng, sh.lat) ? s.shown : null;
  };
  const routes = /* @__PURE__ */ new Map();
  const skip = feed.sansExploitants ? new RegExp(feed.sansExploitants, "i") : null;
  await readCsv(file, entries, "routes.txt", ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_color", "route_text_color"], (r) => {
    const mode = modeOfRouteType(Number(r.route_type));
    if (!mode) return;
    if (skip && skip.test(agencies.get(r.agency_id)?.name ?? "")) return;
    const color = cleanColor(r.route_color) ?? TRANSIT_MODE_COLOR[mode];
    const text = readableText(color, cleanColor(r.route_text_color));
    routes.set(r.route_id, { agency: r.agency_id, short: r.route_short_name, long: r.route_long_name, mode, color, text, stops: /* @__PURE__ */ new Set(), patterns: /* @__PURE__ */ new Map(), shapes: /* @__PURE__ */ new Set(), start: "", end: "" });
  });
  const services = /* @__PURE__ */ new Map();
  const widen = (id, a, b) => {
    const cur2 = services.get(id);
    if (!cur2) services.set(id, [a, b]);
    else services.set(id, [a < cur2[0] ? a : cur2[0], b > cur2[1] ? b : cur2[1]]);
  };
  await readCsv(file, entries, "calendar.txt", ["service_id", "start_date", "end_date"], (r) => {
    if (/^\d{8}$/.test(r.start_date) && /^\d{8}$/.test(r.end_date)) widen(r.service_id, r.start_date, r.end_date);
  });
  await readCsv(file, entries, "calendar_dates.txt", ["service_id", "date", "exception_type"], (r) => {
    if (r.exception_type === "1" && /^\d{8}$/.test(r.date)) widen(r.service_id, r.date, r.date);
  });
  const trips = /* @__PURE__ */ new Map();
  await readCsv(file, entries, "trips.txt", ["trip_id", "route_id", "service_id", "shape_id"], (r) => {
    if (routes.has(r.route_id)) trips.set(r.trip_id, { route: r.route_id, service: r.service_id, shape: r.shape_id });
  });
  let curTrip = "";
  let cur = [];
  let rows = 0;
  const flush = () => {
    const t = trips.get(curTrip);
    if (!t || cur.length < 2) return;
    cur.sort((a, b) => a.seq - b.seq);
    const shown = cur.map((c) => stops.get(c.stop)?.shown ?? c.stop);
    const inside = shown.map((s) => shownIn(s));
    if (!inside.some(Boolean)) return;
    const route = routes.get(t.route);
    for (const s of inside) if (s) route.stops.add(s);
    const per = services.get(t.service);
    if (per) {
      if (!route.start || per[0] < route.start) route.start = per[0];
      if (!route.end || per[1] > route.end) route.end = per[1];
    }
    if (t.shape) route.shapes.add(t.shape);
    else {
      const key = shown.join("|");
      const p = route.patterns.get(key);
      if (p) p.n++;
      else route.patterns.set(key, { stops: shown, n: 1 });
    }
  };
  await readCsv(file, entries, "stop_times.txt", ["trip_id", "stop_id", "stop_sequence"], (r) => {
    rows++;
    if (r.trip_id !== curTrip) {
      flush();
      curTrip = r.trip_id;
      cur = [];
    }
    if (trips.has(r.trip_id)) cur.push({ seq: Number(r.stop_sequence), stop: r.stop_id });
  });
  flush();
  trips.clear();
  const wanted = /* @__PURE__ */ new Set();
  for (const r of routes.values()) for (const s of r.shapes) wanted.add(s);
  const shapes = /* @__PURE__ */ new Map();
  if (wanted.size) {
    await readCsv(file, entries, "shapes.txt", ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"], (r) => {
      if (!wanted.has(r.shape_id)) return;
      const lat = Number(r.shape_pt_lat);
      const lng = Number(r.shape_pt_lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const l = shapes.get(r.shape_id) ?? [];
      l.push({ seq: Number(r.shape_pt_sequence), lng, lat });
      shapes.set(r.shape_id, l);
    });
  }
  const result = { networks: [], lines: [], stops: [] };
  const netKeys = /* @__PURE__ */ new Map();
  const netOf = (agencyId) => {
    const a = agencies.get(agencyId) ?? (agencies.size === 1 ? [...agencies.values()][0] : void 0);
    const key = `${feed.id}:${feed.pays === "fr" ? "" : a?.name ?? ""}`;
    if (!netKeys.has(key)) {
      const url = feed.horaires ?? "";
      const name = feed.pays === "fr" ? feed.nom : a?.name?.trim() || feed.nom;
      result.networks.push({ key, net: { n: name, u: url, s: source, l: licence } });
      netKeys.set(key, key);
    }
    return key;
  };
  const routeLine = /* @__PURE__ */ new Map();
  for (const [id, r] of routes) {
    if (!r.stops.size) continue;
    const geoms = [];
    const coordsOf = (ids) => ids.flatMap((s) => {
      const st = stops.get(s);
      return st ? [st.lng, st.lat] : [];
    });
    for (const sh of r.shapes) {
      const pts = shapes.get(sh);
      if (pts && pts.length >= 2) {
        pts.sort((a, b) => a.seq - b.seq);
        geoms.push(...zoneRuns(pts.flatMap((p) => [p.lng, p.lat])));
      }
    }
    const approx = [];
    if (!geoms.length) {
      const pats = [...r.patterns.values()].sort((a, b) => b.n - a.n || b.stops.length - a.stops.length).slice(0, 6);
      for (const p of pats) for (const run of zoneRuns(coordsOf(p.stops))) approx.push(...splitLongHops(run, APPROX_MAX_HOP_M[r.mode]));
    }
    routeLine.set(id, result.lines.length);
    result.lines.push({
      net: netOf(r.agency),
      line: { n: r.short || "", l: r.long || "", c: r.color, t: r.text, m: r.mode, d: [r.start, r.end] },
      geoms,
      approx
    });
  }
  const shownLines = /* @__PURE__ */ new Map();
  for (const [id, r] of routes) {
    const li = routeLine.get(id);
    if (li == null) continue;
    for (const s of r.stops) {
      const set = shownLines.get(s) ?? /* @__PURE__ */ new Set();
      set.add(li);
      shownLines.set(s, set);
    }
  }
  for (const [s, set] of shownLines) {
    const st = stops.get(s);
    if (st) result.stops.push({ lng: st.lng, lat: st.lat, name: st.name || feed.nom, lines: [...set] });
  }
  console.log(`  ${feed.id} : ${rows} passages lus, ${result.lines.length} lignes, ${result.stops.length} arr\xEAts dans la zone (${secs()})`);
  return result;
}
var work = cacheDir ?? mkdtempSync(join(tmpdir(), "transports-"));
mkdirSync(work, { recursive: true });
var index = { v: TRANSIT_INDEX_VERSION, fabrique: (/* @__PURE__ */ new Date()).toISOString(), reseaux: [], lignes: [], arrets: [] };
var allStops = [];
var lineGeoms = [];
var lineApprox = [];
var perFeed = {};
var netIndex = /* @__PURE__ */ new Map();
var lineByKey = /* @__PURE__ */ new Map();
for (const feed of TRANSIT_FEEDS) {
  if (only && !only.includes(feed.id)) continue;
  try {
    let files;
    let source;
    let licence;
    if ("tdg" in feed.source) {
      const res = await tdgResources(feed.source.tdg);
      files = res.files;
      source = "transport.data.gouv.fr";
      licence = res.licence.name;
    } else {
      files = [{ urls: [await firstAvailable(yearCandidates(feed.source.url))], optional: false }];
      source = feed.source.producteur;
      licence = feed.source.licence.name;
    }
    let arrets = 0;
    let lignes = 0;
    let read = 0;
    for (const [n, f] of files.entries()) {
      const file = join(work, `${feed.id}-${n}.zip`);
      if (!cacheDir || !existsSync(file)) {
        if (!await downloadFeedFile(f, file)) continue;
      }
      read++;
      const r = await readFeed(feed, file, source, licence);
      if (!cacheDir) rmSync(file, { force: true });
      const lineIdx = [];
      for (const { key, net } of r.networks) {
        if (!netIndex.has(key)) {
          netIndex.set(key, index.reseaux.length);
          index.reseaux.push(net);
        }
      }
      for (const l of r.lines) {
        const k = netIndex.get(l.net);
        const key = `${k}|${l.line.n}|${l.line.l}|${l.line.m}|${l.line.c}`;
        const same = lineByKey.get(key);
        if (same != null) {
          const cur = index.lignes[same];
          const d = l.line.d;
          if (d[0] && (!cur.d[0] || d[0] < cur.d[0])) cur.d[0] = d[0];
          if (d[1] && (!cur.d[1] || d[1] > cur.d[1])) cur.d[1] = d[1];
          lineGeoms[same].push(...l.geoms);
          lineApprox[same].push(...l.approx);
          lineIdx.push(same);
          continue;
        }
        lineByKey.set(key, index.lignes.length);
        lineIdx.push(index.lignes.length);
        index.lignes.push({ ...l.line, d: [l.line.d[0], l.line.d[1]], k });
        lineGeoms.push(l.geoms);
        lineApprox.push(l.approx);
      }
      for (const s of r.stops) allStops.push({ ...s, lines: s.lines.map((i) => lineIdx[i]) });
      arrets += r.stops.length;
      lignes += r.lines.length;
    }
    if (!read) throw new Error(`aucun des ${files.length} fichiers GTFS ne r\xE9pond`);
    perFeed[feed.id] = { arrets, lignes, source: read > 1 ? `${read} fichiers` : void 0 };
  } catch (e) {
    console.warn(`\u2718 ${feed.id} : ${String(e)}`);
    perFeed[feed.id] = { arrets: 0, lignes: 0, erreur: String(e).slice(0, 200) };
  }
}
if (!cacheDir) rmSync(work, { recursive: true, force: true });
var groups = mergeStops(allStops);
var merged = /* @__PURE__ */ new Map();
for (let i = 0; i < allStops.length; i++) {
  const g = groups[i];
  let k = merged.get(g);
  if (k == null) {
    k = index.arrets.length;
    merged.set(g, k);
    const s = allStops[g];
    index.arrets.push([Math.round(s.lng * 1e5), Math.round(s.lat * 1e5), s.name, []]);
  }
  const row = index.arrets[k];
  for (const l of allStops[i].lines) if (!row[3].includes(l)) row[3].push(l);
}
for (const a of index.arrets) a[3].sort((x, y) => x - y);
var lineFeatures = [];
index.lignes.forEach((l, i) => {
  const seen = /* @__PURE__ */ new Set();
  for (const g of lineGeoms[i]) {
    const sig = g.map((v) => v.toFixed(5)).join(",");
    if (seen.has(sig)) continue;
    seen.add(sig);
    if (g.length < 4) continue;
    lineFeatures.push({ type: "line", coords: g, properties: { m: l.m, c: `#${l.c}`, n: l.n }, minzoom: LINE_MINZOOM[l.m] });
  }
  if (seen.size) return;
  for (const g of lineApprox[i]) {
    const sig = g.map((v) => v.toFixed(5)).join(",");
    if (seen.has(sig) || g.length < 4) continue;
    seen.add(sig);
    lineFeatures.push({ type: "line", coords: g, properties: { m: l.m, c: `#${l.c}`, n: l.n, a: 1 }, minzoom: APPROX_LINE_MINZOOM[l.m] });
  }
});
var stopFeatures = index.arrets.map((a, i) => {
  const mode = mainMode(a[3].map((l) => index.lignes[l].m));
  return { lng: a[0] / 1e5, lat: a[1] / 1e5, minzoom: STOP_MINZOOM[mode], properties: { i, n: a[2], m: mode } };
});
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
var digests = [];
var stats = {};
var EXTENT = 4096;
for (const z of TRANSIT_ZOOMS) {
  const lines = tileFeatures(lineFeatures, [z], { buffer: 64, tolerance: 2 });
  const points = /* @__PURE__ */ new Map();
  const scale = 2 ** z;
  for (const s of stopFeatures) {
    if (z < s.minzoom) continue;
    const r = Math.max(-85, Math.min(85, s.lat)) * Math.PI / 180;
    const wx = (s.lng + 180) / 360 * scale;
    const wy = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * scale;
    const tx = Math.floor(wx);
    const ty = Math.floor(wy);
    const key = `${z}/${tx}/${ty}`;
    const l = points.get(key) ?? [];
    l.push({ type: 1, geometry: [[Math.round((wx - tx) * EXTENT), Math.round((wy - ty) * EXTENT)]], properties: s.properties });
    points.set(key, l);
  }
  let bytes = 0;
  let count = 0;
  for (const key of /* @__PURE__ */ new Set([...lines.keys(), ...points.keys()])) {
    const b = encodeMvt([
      { name: TRANSIT_LINES_LAYER, extent: EXTENT, features: lines.get(key) ?? [] },
      { name: TRANSIT_STOPS_LAYER, extent: EXTENT, features: points.get(key) ?? [] }
    ]);
    const [zz, x, y] = key.split("/");
    mkdirSync(join(outDir, zz, x), { recursive: true });
    writeFileSync(join(outDir, zz, x, `${y}.pbf`), b);
    bytes += b.length;
    count++;
    digests.push(`${key} ${createHash("sha256").update(b).digest("hex")}`);
  }
  stats[z] = { tuiles: count, octets: bytes };
  console.log(`zoom ${z} : ${count} tuiles, ${(bytes / 1048576).toFixed(1)} Mo`);
}
var indexBytes = Buffer.from(JSON.stringify(index));
writeFileSync(join(outDir, TRANSIT_INDEX_FILE), indexBytes);
digests.push(`${TRANSIT_INDEX_FILE} ${createHash("sha256").update(JSON.stringify({ ...index, fabrique: "" })).digest("hex")}`);
digests.sort();
var empreinte = createHash("sha256").update(digests.join("\n")).digest("hex");
var outil = "";
try {
  const f = fileURLToPath(import.meta.url);
  outil = createHash("sha256").update(Buffer.from(f)).digest("hex").slice(0, 12);
} catch {
}
writeFileSync(
  join(outDir, "manifeste.json"),
  JSON.stringify(
    {
      fabrique: index.fabrique,
      source: "Horaires th\xE9oriques (GTFS) : transport.data.gouv.fr, opentransportdata.swiss, \xD6BB",
      mention: "Donn\xE9es de transport : transport.data.gouv.fr (Licence Ouverte, ODbL), opentransportdata.swiss, \xD6BB-Personenverkehr AG (CC BY 4.0)",
      licence: "ODbL 1.0 (base d\xE9riv\xE9e de jeux sous Licence Ouverte, ODbL et CC BY 4.0)",
      zooms: TRANSIT_ZOOMS,
      arrets: index.arrets.length,
      lignes: index.lignes.length,
      reseaux_index: index.reseaux.length,
      reseaux: perFeed,
      tuiles: stats,
      empreinte,
      ...outil ? { outil } : {}
    },
    null,
    1
  )
);
console.log(`index : ${index.reseaux.length} r\xE9seaux, ${index.lignes.length} lignes, ${index.arrets.length} arr\xEAts, ${(indexBytes.length / 1048576).toFixed(2)} Mo ; ${secs()}`);
