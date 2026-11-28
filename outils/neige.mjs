// FICHIER GÉNÉRÉ par scripts/pistes-outil.mjs (dépôt de l'app Soulane) : ne pas le modifier ici.
// Calque « Neige prévue » de Soulane : grille de la neige fraîche prévue (prochaines 24 et 48 heures) selon l'altitude, à
// partir de la prévision AROME de Météo-France (Licence Ouverte 2.0) lue par outils/neige-extraire.py :
//   node outils/neige.mjs <dossier extrait> <dossier de sortie>

// scripts/neige-build.ts
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// src/shared/core/snowForecast.ts
var SNOW_LEVEL_STEP = 300;
var SNOW_LEVELS = 17;
var WET_BULB_LAPSE = 6e-3;
var AIR_LAPSE = 65e-4;
var SNOW_PHASE_MID = 0.5;
var SNOW_PHASE_WIDTH = 0.6;
function wetBulbC(tC, rh) {
  const r = Math.min(99, Math.max(5, rh));
  return tC * Math.atan(0.151977 * Math.sqrt(r + 8.313659)) + Math.atan(tC + r) - Math.atan(r - 1.676331) + 391838e-8 * r ** 1.5 * Math.atan(0.023101 * r) - 4.686035;
}
function snowFraction(twC) {
  const x = (twC - SNOW_PHASE_MID) / SNOW_PHASE_WIDTH;
  if (x > 12) return 0;
  if (x < -12) return 1;
  return 1 / (1 + Math.exp(x));
}
function wetBulbForFraction(f) {
  const p = Math.min(0.98, Math.max(0.02, f));
  return SNOW_PHASE_MID + SNOW_PHASE_WIDTH * Math.log(1 / p - 1);
}
var TW_SOLID = wetBulbForFraction(0.98);
var TW_LIQUID = wetBulbForFraction(0.02);
function freshSnowCmPerMm(tC) {
  const rho = 67.92 + 51.25 * Math.exp(Math.min(0, tC) / 2.59);
  return 100 / rho;
}
var MISSING = 9e3;
var SnowAccumulator = class _SnowAccumulator {
  constructor(cells) {
    this.cells = cells;
    this.acc = new Float32Array(cells * SNOW_LEVELS);
  }
  acc;
  /** Température humide « équivalente » sur le relief du modèle : celle qui redonne SA part de neige. */
  static anchoredWetBulb(solid, tw2m) {
    if (!Number.isFinite(solid)) return tw2m;
    if (solid >= 0.98) return Math.min(tw2m, TW_SOLID);
    if (solid <= 0.02) return Math.max(tw2m, TW_LIQUID);
    return wetBulbForFraction(solid);
  }
  /**
   * Part de neige à `dz` mètres au-dessus du relief du modèle (au-dessous si négatif), EXACTEMENT sa part `solid` sur son
   * relief. Quand il ne donne que de la pluie (ou que de la neige), la température humide équivalente est bornée
   * (`anchoredWetBulb`) et la courbe en S laissait 2 % de neige sur son relief et dessous (ou 2 % de pluie) : de la neige
   * sous une pluie franche, cumulée heure après heure (29pf, 28/11/2026 : 1 042 cm au lieu de 50 sur les heures de pluie
   * seule de la prévision du 27/11 à 18 h UTC, et 207 cases du 25/11 à plus de 1 cm là où le modèle en donne moins de
   * 0,5). La courbe est donc redressée de part et d'autre du relief : dessous, ramenée à zéro en proportion ; dessus,
   * l'écart à « tout en neige » ramené de même. Sa forme (la distance de la limite) ne change pas, et dans le cas du
   * mélange (le plus courant) elle est inchangée. Part inconnue : la courbe telle quelle.
   */
  static levelFraction(solid, tw, dz) {
    const g = snowFraction(tw - WET_BULB_LAPSE * dz);
    if (!Number.isFinite(solid)) return g;
    const g0 = snowFraction(tw);
    if (dz <= 0) return g0 > 0 ? g * (solid / g0) : 0;
    return g0 < 1 ? 1 - (1 - g) * ((1 - solid) / (1 - g0)) : 1;
  }
  /** Ajoute une heure. Une valeur manquante (hors du domaine) ne compte pas. */
  addHour(h) {
    const acc = this.acc;
    for (let c = 0; c < this.cells; c++) {
      const p = h.precip[c];
      if (!(p > 5e-3) || p > MISSING) continue;
      const z = h.z[c];
      const tw2 = h.tw[c];
      const t2 = h.t[c];
      if (!Number.isFinite(tw2) || !Number.isFinite(t2) || !Number.isFinite(z) || z > MISSING) continue;
      const solid = h.solid[c];
      const tw = _SnowAccumulator.anchoredWetBulb(solid, tw2);
      const base = c * SNOW_LEVELS;
      for (let k = 0; k < SNOW_LEVELS; k++) {
        const dz = k * SNOW_LEVEL_STEP - z;
        const f = _SnowAccumulator.levelFraction(solid, tw, dz);
        if (f > 1e-3) acc[base + k] += p * f * freshSnowCmPerMm(t2 - AIR_LAPSE * dz);
      }
    }
  }
};
var MAGIC = [83, 78, 80, 49];
function quantizeCm(cm) {
  if (!(cm >= 0.5)) return 0;
  if (cm <= 100) return Math.round(cm);
  return Math.min(254, 100 + Math.round((cm - 100) / 2));
}
function dequantize(q) {
  return q <= 100 ? q : 100 + (q - 100) * 2;
}
var DEQ = Float32Array.from({ length: 256 }, (_, q) => dequantize(q));
var SNOW_TOP_MARGIN = 1500;
function snowTopLevels(oro, ni, nj) {
  const top = new Uint8Array(ni * nj);
  for (let j = 0; j < nj; j++) {
    for (let i = 0; i < ni; i++) {
      let m = -Infinity;
      for (let dj = -1; dj <= 1; dj++) {
        const jj = j + dj;
        if (jj < 0 || jj >= nj) continue;
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          if (ii < 0 || ii >= ni) continue;
          const v = oro[jj * ni + ii];
          if (v < 9e3 && v > m) m = v;
        }
      }
      const z = Number.isFinite(m) ? Math.max(0, m) + SNOW_TOP_MARGIN : (SNOW_LEVELS - 1) * SNOW_LEVEL_STEP;
      top[j * ni + i] = Math.min(SNOW_LEVELS - 1, Math.ceil(z / SNOW_LEVEL_STEP));
    }
  }
  return top;
}
function encodeSnowGrid(header, windows, top) {
  if (windows.length !== header.windows.length) throw new Error("Grille de neige : autant de cumuls que de fen\xEAtres");
  const cells = header.ni * header.nj;
  const head = new TextEncoder().encode(JSON.stringify(header));
  const plane = cells * SNOW_LEVELS;
  const out = new Uint8Array(8 + head.length + windows.length * plane);
  out.set(MAGIC, 0);
  new DataView(out.buffer).setUint32(4, head.length, true);
  out.set(head, 8);
  let o = 8 + head.length;
  for (const cm of windows) {
    for (let c = 0; c < cells; c++) {
      const t = top ? top[c] : SNOW_LEVELS - 1;
      let prev = 0;
      let q = 0;
      for (let k = 0; k < SNOW_LEVELS; k++) {
        if (k <= t) q = quantizeCm(cm[c * SNOW_LEVELS + k]);
        out[o + k * cells + c] = q - prev & 255;
        prev = q;
      }
    }
    o += plane;
  }
  return out;
}

// scripts/neige-build.ts
var START_H = 3;
function readF32(dir, name, cells) {
  const p = join(dir, name);
  if (!existsSync(p)) return null;
  const b = readFileSync(p);
  if (b.length !== cells * 4) throw new Error(`${name} : taille inattendue`);
  return new Float32Array(b.buffer, b.byteOffset, cells);
}
var iso = (ms) => new Date(ms).toISOString().replace(".000Z", "Z");
function main() {
  const [src, out] = process.argv.slice(2);
  if (!src || !out) throw new Error("Usage : node outils/neige.mjs <dossier extrait> <dossier de sortie>");
  const meta = JSON.parse(readFileSync(join(src, "meta.json"), "utf8"));
  const cells = meta.ni * meta.nj;
  const oro = readF32(src, "oro.f32", cells);
  if (!oro) throw new Error("Relief du mod\xE8le absent");
  const last = Math.max(...meta.hours);
  if (last < START_H + 24) throw new Error(`Pr\xE9vision trop courte (${last} h)`);
  const end48 = Math.min(START_H + 48, last);
  const run = Date.parse(meta.run);
  const acc = new SnowAccumulator(cells);
  let acc24 = null;
  const hour = {
    precip: new Float32Array(cells),
    solid: new Float32Array(cells),
    tw: new Float32Array(cells),
    t: new Float32Array(cells),
    z: oro
  };
  let modelCm = 0;
  const need = (name, h) => {
    const a = readF32(src, `${name}_${h}.f32`, cells);
    if (!a) throw new Error(`Champ ${name} de l'heure ${h} absent`);
    return a.slice();
  };
  let prev = { tp: need("tp", START_H), sn: need("sn", START_H), gr: need("gr", START_H), t2: need("t2", START_H), rh: need("rh", START_H) };
  const cellModel = new Float32Array(cells);
  for (let h = START_H + 1; h <= end48; h++) {
    const cur = { tp: need("tp", h), sn: need("sn", h), gr: need("gr", h), t2: need("t2", h), rh: need("rh", h) };
    for (let c = 0; c < cells; c++) {
      const p = cur.tp[c] - prev.tp[c];
      const ok = cur.tp[c] < 9e3 && p > 0;
      hour.precip[c] = ok ? p : 0;
      const tC = (cur.t2[c] + prev.t2[c]) / 2 - 273.15;
      hour.t[c] = tC;
      hour.tw[c] = ok ? wetBulbC(tC, (cur.rh[c] + prev.rh[c]) / 2) : 0;
      const s = cur.sn[c] - prev.sn[c] + (cur.gr[c] - prev.gr[c]);
      hour.solid[c] = ok && cur.sn[c] < 9e3 && cur.gr[c] < 9e3 ? Math.min(1, Math.max(0, s / p)) : NaN;
      if (ok && s > 0 && Number.isFinite(hour.solid[c])) cellModel[c] += Math.min(s, p) * freshSnowCmPerMm(tC);
    }
    acc.addHour(hour);
    if (h === START_H + 24) acc24 = acc.acc.slice();
    prev = cur;
  }
  if (!acc24) throw new Error("Fen\xEAtre de 24 h incompl\xE8te");
  let ours = 0;
  let maxOro48 = 0;
  let visModel = 0;
  let visOurs = 0;
  for (let c = 0; c < cells; c++) {
    const zk = Math.max(0, oro[c]) / SNOW_LEVEL_STEP;
    const k = Math.min(SNOW_LEVELS - 2, Math.floor(zk));
    const t = Math.min(1, zk - k);
    const base = c * SNOW_LEVELS;
    const v = acc.acc[base + k] * (1 - t) + acc.acc[base + k + 1] * t;
    if (v > maxOro48) maxOro48 = v;
    if (cellModel[c] > 0) {
      modelCm += cellModel[c];
      ours += v;
    }
    if (cellModel[c] >= 1) {
      visModel += cellModel[c];
      visOurs += v;
    }
  }
  const from = run + START_H * 36e5;
  const windows = [
    { id: "24", from: iso(from), to: iso(from + 24 * 36e5) },
    { id: "48", from: iso(from), to: iso(run + end48 * 36e5) }
  ];
  const header = {
    v: 1,
    ni: meta.ni,
    nj: meta.nj,
    lat0: meta.lat0,
    lon0: meta.lon0,
    dlat: meta.dlat,
    dlon: meta.dlon,
    levels: SNOW_LEVELS,
    step: SNOW_LEVEL_STEP,
    run: iso(run),
    model: meta.model,
    windows
  };
  const raw = encodeSnowGrid(header, [acc24, acc.acc], snowTopLevels(oro, meta.ni, meta.nj));
  const gz = gzipSync(raw, { level: 9 });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "neige.bin.gz"), gz);
  const manifest = {
    jeu: "neige-prevue",
    prevision: header.run,
    modele: meta.model,
    fenetres: windows,
    fabrique: (/* @__PURE__ */ new Date()).toISOString(),
    octets: gz.length,
    brut: raw.length,
    empreinte: createHash("md5").update(gz).digest("hex"),
    // Plus forte neige fraîche en 48 h sur le relief du modèle (le vrai relief peut monter plus haut).
    maxCmReliefModele: Math.round(maxOro48),
    // Rapport entre notre courbe lue sur le relief du modèle et sa neige (1 = mêmes cumuls) : un contrôle de la méthode.
    controle: modelCm > 0 ? { neigeModeleCm: Math.round(modelCm), neigeSoulaneCm: Math.round(ours), rapport: Math.round(ours / modelCm * 100) / 100 } : null,
    // Le même sur les cases à neige visible du modèle (information, ne bloque rien).
    controleVisible: visModel > 0 ? { neigeModeleCm: Math.round(visModel), neigeSoulaneCm: Math.round(visOurs), rapport: Math.round(visOurs / visModel * 1e3) / 1e3 } : null
  };
  const doubts = [];
  if (gz.length > 6 * 1024 * 1024) doubts.push(`fichier de ${(gz.length / 1048576).toFixed(1)} Mo`);
  if (manifest.maxCmReliefModele > 400) doubts.push(`${manifest.maxCmReliefModele} cm en 48 h sur le relief du mod\xE8le`);
  if (manifest.controle && manifest.controle.neigeModeleCm > 2e3 && (manifest.controle.rapport < 0.85 || manifest.controle.rapport > 1.2))
    doubts.push(
      `contr\xF4le \xE0 ${manifest.controle.rapport} (attendu : 1)` + (manifest.controleVisible ? `, ${manifest.controleVisible.rapport} sur la neige visible` : "")
    );
  if (doubts.length) throw new Error(`Grille suspecte, pas publi\xE9e : ${doubts.join(" ; ")}`);
  writeFileSync(join(out, "manifeste.json"), JSON.stringify(manifest, null, 1));
  console.log(
    `Neige pr\xE9vue ${header.run} : ${(gz.length / 1024).toFixed(0)} Ko (brut ${(raw.length / 1024).toFixed(0)} Ko), au plus ${manifest.maxCmReliefModele} cm en 48 h sur le relief du mod\xE8le` + (manifest.controle ? ` ; contr\xF4le : ${manifest.controle.rapport} (1 = comme le mod\xE8le)` : "") + (manifest.controleVisible ? ` ; sur la neige visible : ${manifest.controleVisible.rapport}` : "")
  );
}
main();
