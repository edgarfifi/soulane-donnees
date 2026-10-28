/* global process, console, fetch, AbortSignal, setTimeout */
// Vérifie puis publie une fabrication du dépôt edgarfifi/soulane-donnees (lancé chaque semaine par ses workflows). Tenu
// dans le dépôt de l'app Soulane (scripts/soulane-donnees/).
//   node outils/publier.mjs <dossier des tuiles>                 pistes de ski (outils/pistes.mjs, .github/workflows/pistes.yml)
//   JEU=skirando node outils/publier.mjs <dossier des tuiles>    itinéraires de ski de rando (outils/skirando.mjs, skirando.yml)
// 1. Compare le manifeste neuf à celui de la version publiée :
//    - même empreinte (mêmes tuiles) : rien à publier ;
//    - chiffres trop éloignés (fichier tronqué, région manquante…) : ARRÊT sans publier, en erreur (GitHub prévient par
//      e-mail) ; FORCER=1 publie quand même (relance à la main, case « forcer »).
// 2. Publie :
//    - PISTES : archive pistes.tar.gz + manifeste.json en nouvelle version « pistes-AAAAMMJJ » (la dernière = « Latest » :
//      soulane.app la reprend à sa construction suivante), les 8 plus récentes gardées ;
//    - ITINÉRAIRES : dans la version FIXE « skirando » (jamais « Latest » : le lien des pistes ne bouge pas), une archive
//      à nom unique (skirando-AAAAMMJJ-<empreinte>.tar.gz, jamais remplacée) puis manifeste.json, qui la nomme (seul
//      fichier remplacé, quelques centaines d'octets) ; les 3 archives les plus récentes gardées.
// 3. Écrit etat.json (pistes) ou etat-skirando.json (dernier passage, résultat) : le workflow le commite, ce qui garde aussi
//    son planning actif.
// Sorties pour le workflow (GITHUB_OUTPUT) : publie=1|0, version=<étiquette ou archive>.
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Limites des écarts acceptés avec la fois précédente (une semaine de cartographie bouge de moins de 1 %). */
export const LIMITS = { minPistes: 100000, pistes: 0.05, tuiles: 0.05, octets: 0.15 }
/** Versions des pistes gardées dans le dépôt (les plus récentes). */
export const KEEP = 8

/** Itinéraires de ski de rando : un réseau tenu à la main par la Fondation Petzl, qui GRANDIT par massif (Pyrénées :
 *  +15 % en une version le 06/10/2026, +1,6 % du tout) ; une baisse est plus suspecte (export partiel, région perdue).
 *  `down` / `up` : écart relatif accepté à la baisse / à la hausse. */
export const SKI_LIMITS = {
  minTroncons: 8000,
  minParRegion: { alpes: 5000, pyrenees: 300 },
  /** Itinéraires de l'index (départ, arrivée, difficulté ; depuis le 28/10/2026) : 4 563 dans les Alpes, 467 dans les
   *  Pyrénées ce jour-là. */
  minItinerairesParRegion: { alpes: 3500, pyrenees: 300 },
  troncons: { down: 0.08, up: 0.4 },
  itineraires: { down: 0.08, up: 0.4 },
  km: { down: 0.08, up: 0.4 },
  tuiles: { down: 0.08, up: 0.4 },
  octets: { down: 0.15, up: 0.6 }
}
/** Version FIXE des itinéraires et archives gardées dedans. */
export const SKI_RELEASE = 'skirando'
export const SKI_KEEP = 3

const pct = (a, b) => `${a >= b ? '+' : '−'}${((Math.abs(a - b) / Math.max(1, b)) * 100).toFixed(1)} %`
const gap = (a, b) => Math.abs(a - b) / Math.max(1, b)

/**
 * Décision PURE (pistes) à partir du manifeste précédent (null : première fois) et du neuf.
 * `fresh` : les tuiles diffèrent de la version publiée ; `ok` : rien d'anormal ; `errors` : pourquoi on s'arrête.
 */
export function compareManifests(prev, next, limits = LIMITS) {
  const errors = []
  if (!next || typeof next.pistes !== 'number' || !next.tuiles || !Array.isArray(next.zooms)) {
    return { fresh: false, ok: false, errors: ['Manifeste neuf illisible.'] }
  }
  if (prev && prev.empreinte && prev.empreinte === next.empreinte) return { fresh: false, ok: true, errors: [] }
  if (next.pistes < limits.minPistes) errors.push(`Seulement ${next.pistes} pistes (au moins ${limits.minPistes} attendues).`)
  for (const z of next.zooms) if (!(next.tuiles[z]?.tuiles > 0)) errors.push(`Aucune tuile au zoom ${z}.`)
  if (prev && typeof prev.pistes === 'number') {
    if (gap(next.pistes, prev.pistes) > limits.pistes) errors.push(`${next.pistes} pistes contre ${prev.pistes} la fois précédente (${pct(next.pistes, prev.pistes)}).`)
    // Remontées mécaniques (dans les tuiles depuis le 20/10/2026) : comparées quand les deux fabrications les comptent.
    if (typeof prev.remontees === 'number' && typeof next.remontees === 'number' && gap(next.remontees, prev.remontees) > limits.pistes) {
      errors.push(`${next.remontees} remontées contre ${prev.remontees} la fois précédente (${pct(next.remontees, prev.remontees)}).`)
    }
    for (const [z, p] of Object.entries(prev.tuiles ?? {})) {
      const n = next.tuiles[z]
      if (!n) {
        errors.push(`Zoom ${z} absent (présent la fois précédente).`)
        continue
      }
      if (gap(n.tuiles, p.tuiles) > limits.tuiles) errors.push(`Zoom ${z} : ${n.tuiles} tuiles contre ${p.tuiles} (${pct(n.tuiles, p.tuiles)}).`)
      if (gap(n.octets, p.octets) > limits.octets) errors.push(`Zoom ${z} : ${n.octets} octets contre ${p.octets} (${pct(n.octets, p.octets)}).`)
    }
  }
  return { fresh: true, ok: errors.length === 0, errors }
}

/** Écart hors des limites asymétriques `lim` ({ down, up }) ? */
const outOf = (n, p, lim) => (n < p ? (p - n) / Math.max(1, p) > lim.down : (n - p) / Math.max(1, p) > lim.up)

/** Décision PURE (itinéraires de ski de rando), mêmes réponses que compareManifests. */
export function compareSkiManifests(prev, next, limits = SKI_LIMITS) {
  const errors = []
  if (!next || typeof next.troncons !== 'number' || typeof next.km !== 'number' || !next.tuiles || !Array.isArray(next.zooms) || !next.regions) {
    return { fresh: false, ok: false, errors: ['Manifeste neuf illisible.'] }
  }
  if (prev && prev.empreinte && prev.empreinte === next.empreinte) return { fresh: false, ok: true, errors: [] }
  if (next.troncons < limits.minTroncons) errors.push(`Seulement ${next.troncons} tronçons (au moins ${limits.minTroncons} attendus).`)
  for (const [r, min] of Object.entries(limits.minParRegion)) {
    const n = next.regions[r]?.troncons
    if (!(n >= min)) errors.push(`Région ${r} : ${n ?? 0} tronçons (au moins ${min} attendus).`)
  }
  // Index des itinéraires : exigé dès qu'une version publiée en avait un (une fabrication qui le perdrait laisserait les
  // apps sans départ ni arrivée au toucher des lignes).
  const wantsIndex = typeof next.itineraires === 'number' || typeof prev?.itineraires === 'number'
  if (wantsIndex) {
    for (const [r, min] of Object.entries(limits.minItinerairesParRegion ?? {})) {
      const n = next.regions[r]?.itineraires
      if (!(n >= min)) errors.push(`Région ${r} : ${n ?? 0} itinéraires (au moins ${min} attendus).`)
    }
  }
  for (const z of next.zooms) if (!(next.tuiles[z]?.tuiles > 0)) errors.push(`Aucune tuile au zoom ${z}.`)
  if (prev && typeof prev.troncons === 'number') {
    if (outOf(next.troncons, prev.troncons, limits.troncons)) errors.push(`${next.troncons} tronçons contre ${prev.troncons} la fois précédente (${pct(next.troncons, prev.troncons)}).`)
    if (typeof prev.itineraires === 'number' && typeof next.itineraires === 'number' && outOf(next.itineraires, prev.itineraires, limits.itineraires)) {
      errors.push(`${next.itineraires} itinéraires contre ${prev.itineraires} la fois précédente (${pct(next.itineraires, prev.itineraires)}).`)
    }
    if (typeof prev.km === 'number' && outOf(next.km, prev.km, limits.km)) errors.push(`${next.km} km contre ${prev.km} la fois précédente (${pct(next.km, prev.km)}).`)
    for (const [z, p] of Object.entries(prev.tuiles ?? {})) {
      const n = next.tuiles[z]
      if (!n) {
        errors.push(`Zoom ${z} absent (présent la fois précédente).`)
        continue
      }
      if (outOf(n.tuiles, p.tuiles, limits.tuiles)) errors.push(`Zoom ${z} : ${n.tuiles} tuiles contre ${p.tuiles} (${pct(n.tuiles, p.tuiles)}).`)
      if (outOf(n.octets, p.octets, limits.octets)) errors.push(`Zoom ${z} : ${n.octets} octets contre ${p.octets} (${pct(n.octets, p.octets)}).`)
    }
  }
  return { fresh: true, ok: errors.length === 0, errors }
}

/** Étiquette d'une version neuve des pistes : pistes-AAAAMMJJ (date de fabrication), suffixée si elle existe déjà. */
export function releaseTag(fabrique, existing) {
  const base = `pistes-${String(fabrique).slice(0, 10).replace(/-/g, '')}`
  let tag = base
  for (let i = 2; existing.includes(tag); i++) tag = `${base}-${i}`
  return tag
}

/** Nom (unique, jamais remplacé) de l'archive d'une fabrication des itinéraires. */
export function skiArchiveName(fabrique, empreinte) {
  return `skirando-${String(fabrique).slice(0, 10).replace(/-/g, '')}-${String(empreinte).slice(0, 12)}.tar.gz`
}

/** Archives à retirer de la version des itinéraires (les plus anciennes au-delà de `keep`, jamais `current`). PUR. */
export function skiArchivesToDrop(names, current, keep = SKI_KEEP) {
  const archives = names.filter((n) => /^skirando-\d{8}-[0-9a-f]+\.tar\.gz$/.test(n) && n !== current).sort().reverse()
  return archives.slice(Math.max(0, keep - 1))
}

function tools() {
  const repo = process.env.GITHUB_REPOSITORY || 'edgarfifi/soulane-donnees'
  const gh = (args, quiet = false) => {
    const r = spawnSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', quiet ? 'pipe' : 'inherit'] })
    return { ok: r.status === 0, out: r.stdout ?? '' }
  }
  const output = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`)
  const summary = (lines) => process.env.GITHUB_STEP_SUMMARY && appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
  return { repo, gh, output, summary, force: process.env.FORCER === '1', dry: process.env.ESSAI === '1' }
}

function publishPistes(dir) {
  const { repo, gh, output, summary, force, dry } = tools()
  const next = JSON.parse(readFileSync(join(dir, 'manifeste.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'pistes-'))
  const total = Object.values(next.tuiles).reduce((s, t) => s + t.tuiles, 0)
  const state = (result, extra = {}) =>
    writeFileSync(
      'etat.json',
      JSON.stringify(
        { verifie: new Date().toISOString(), resultat: result, pistes: next.pistes, remontees: next.remontees ?? null, tuiles: total, source_date: next.source_date ?? null, empreinte: next.empreinte, ...extra },
        null,
        1
      ) + '\n'
    )

  try {
    // Versions des pistes déjà publiées, la plus récente d'abord.
    const list = gh(['release', 'list', '--repo', repo, '--limit', '100', '--json', 'tagName,createdAt'])
    if (!list.ok) throw new Error('Liste des versions illisible.')
    const releases = JSON.parse(list.out || '[]')
      .filter((r) => r.tagName.startsWith('pistes-'))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    let prev = null
    if (releases.length) {
      const tag = releases[0].tagName
      // Manifeste publié à part (depuis l'automatisation), sinon celui de l'archive (versions d'avant).
      if (gh(['release', 'download', tag, '--repo', repo, '--pattern', 'manifeste.json', '--dir', tmp], true).ok) {
        prev = JSON.parse(readFileSync(join(tmp, 'manifeste.json'), 'utf8'))
      } else if (gh(['release', 'download', tag, '--repo', repo, '--pattern', 'pistes.tar.gz', '--dir', tmp]).ok) {
        // « ./manifeste.json » ou « manifeste.json » selon le tar qui a fait l'archive.
        for (const name of ['./manifeste.json', 'manifeste.json']) {
          if (spawnSync('tar', ['-xzf', 'pistes.tar.gz', name], { cwd: tmp, stdio: 'ignore' }).status === 0) break
        }
        if (existsSync(join(tmp, 'manifeste.json'))) prev = JSON.parse(readFileSync(join(tmp, 'manifeste.json'), 'utf8'))
      }
      if (!prev) throw new Error(`Manifeste de ${tag} illisible : impossible de comparer.`)
      console.log(`Version précédente : ${tag} (${prev.pistes} pistes, fabriquée le ${String(prev.fabrique).slice(0, 10)}).`)
    }

    const d = compareManifests(prev, next)
    const lifts = typeof next.remontees === 'number' ? `, ${next.remontees} remontées` : ''
    const head = `**${next.pistes} pistes**${lifts}, ${total} tuiles (fichier d'OpenSnowMap du ${String(next.source_date ?? next.fabrique).slice(0, 10)})`
    if (!d.fresh && d.ok) {
      console.log('Mêmes tuiles que la version publiée : rien à publier.')
      summary([`## Pistes : inchangées`, head])
      state('inchange', { version: releases[0]?.tagName ?? null })
      output('publie', '0')
      return
    }
    if (!d.ok && !force) {
      console.error('Fabrication refusée, rien n’est publié :\n- ' + d.errors.join('\n- '))
      summary([`## Pistes : refusées, rien n'est publié`, head, '', ...d.errors.map((e) => `- ${e}`), '', 'Relancer à la main avec « forcer » si ces écarts sont normaux.'])
      state('refuse', { erreurs: d.errors, version: releases[0]?.tagName ?? null })
      output('publie', '0')
      process.exitCode = 1
      return
    }
    if (d.errors.length) console.log('Écarts acceptés (forcer) :\n- ' + d.errors.join('\n- '))

    const tag = releaseTag(next.fabrique, releases.map((r) => r.tagName))
    if (dry) {
      console.log(`ESSAI : ${tag} serait publiée ; versions retirées : ${releases.slice(KEEP - 1).map((r) => r.tagName).join(', ') || 'aucune'}.`)
      return
    }
    const archive = join(tmp, 'pistes.tar.gz')
    rmSync(archive, { force: true })
    const t = spawnSync('tar', ['-czf', archive, '-C', dir, '.'], { stdio: 'inherit' })
    if (t.status !== 0) throw new Error('Archive impossible.')
    const notes = [
      `Tuiles vectorielles (MVT, couche « pistes ») des pistes de ski (et des remontées mécaniques) des cartes de Soulane, zooms ${next.zooms.join(', ')}, fabriquées le ${String(next.fabrique).slice(0, 10)} à partir du fichier d'OpenSnowMap du ${String(next.source_date ?? next.fabrique).slice(0, 10)}.`,
      `${next.pistes} pistes${lifts}, ${total} tuiles : Alpes, Pyrénées, Jura, Vosges, Massif central, Corse.`,
      "Source : fichier des pistes d'OpenSnowMap. Données © contributeurs OpenStreetMap, base de données sous licence ODbL (https://www.openstreetmap.org/copyright)."
    ].join('\n\n')
    const c = gh(['release', 'create', tag, archive, join(dir, 'manifeste.json'), '--repo', repo, '--title', `Pistes ${String(next.fabrique).slice(0, 10)}`, '--notes', notes, '--latest'])
    if (!c.ok) throw new Error('Publication impossible.')
    console.log(`✔ ${tag} publiée.`)

    // Les plus anciennes s'en vont (avec leur étiquette) : on en garde KEEP.
    for (const r of releases.slice(KEEP - 1)) {
      if (gh(['release', 'delete', r.tagName, '--repo', repo, '--yes', '--cleanup-tag']).ok) console.log(`Ancienne version retirée : ${r.tagName}`)
    }
    summary([`## Pistes : ${tag} publiée`, head, ...(d.errors.length ? ['', 'Écarts acceptés (forcer) :', ...d.errors.map((e) => `- ${e}`)] : [])])
    state('publie', { version: tag })
    output('publie', '1')
    output('version', tag)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

/** Texte de la version des itinéraires (licence CC BY-ND 4.0 : auteurs, licence, avertissement, géométrie non modifiée). */
export function skiReleaseNotes(m) {
  const regions = Object.entries(m.regions ?? {})
    .map(
      ([id, r]) =>
        `- ${id === 'alpes' ? 'Alpes' : 'Pyrénées'} : ${r.troncons} tronçons${typeof r.itineraires === 'number' ? `, ${r.itineraires} itinéraires` : ''}, ${r.km_ski} km à ski et ${r.km_pied} km à pied, version du ${r.version ?? '?'} (${r.fichier})` +
        (r.non_publies ? ` ; ${r.non_publies} tronçons marqués « à ne pas publier » par leurs auteurs, laissés de côté` : '') +
        (r.itineraires_non_publies ? ` ; ${r.itineraires_non_publies} itinéraires marqués « à ne pas publier », laissés de côté` : '')
    )
    .join('\n')
  return [
    `Tuiles vectorielles (MVT, couche « itineraires », zooms ${m.zooms.join(', ')}) des itinéraires de ski de randonnée des Alpes françaises et des Pyrénées, telles que les dessine l'app Soulane (https://soulane.app). Fabriquées le ${String(m.fabrique).slice(0, 10)} ; dernière archive : ${m.archive}.`,
    regions,
    `${m.mention}. Source : https://download.skitourenguru.com/public/ (réseau lissé, passages à pied compris, et les itinéraires qui l'empruntent). Licence : Creative Commons Attribution - Pas de modification 4.0 International (https://creativecommons.org/licenses/by-nd/4.0/deed.fr).`,
    "Géométrie non modifiée : seulement projetée (Lambert-93 vers degrés) et découpée en tuiles, les modifications techniques que permet la licence (section 2(a)(4)). Propriété « foot » : 1 = passage à pied, 0 = à ski. Propriété « r » : les itinéraires qui empruntent le tronçon (« A12 » = itinéraire 12 des Alpes, « P4645 » = 4645 des Pyrénées), dont itineraires.json donne le départ, l'arrivée et la difficulté donnée par un expert (codes 1 à 18 de leur spécification, F à EX), tels que dans leurs fichiers.",
    "Avertissement des auteurs : ils ne garantissent ni l'exhaustivité ni l'exactitude des données et déclinent toute responsabilité à ce sujet. Un itinéraire n'est pas une invitation à y aller : conditions, neige et danger d'avalanche à évaluer sur place."
  ].join('\n\n')
}

function publishSkirando(dir) {
  const { repo, gh, output, summary, force, dry } = tools()
  const next = JSON.parse(readFileSync(join(dir, 'manifeste.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'skirando-'))
  const total = Object.values(next.tuiles ?? {}).reduce((s, t) => s + t.tuiles, 0)
  const versions = Object.fromEntries(Object.entries(next.regions ?? {}).map(([id, r]) => [id, r.version ?? null]))
  const state = (result, extra = {}) =>
    writeFileSync(
      'etat-skirando.json',
      JSON.stringify({ verifie: new Date().toISOString(), resultat: result, troncons: next.troncons, ...(typeof next.itineraires === 'number' ? { itineraires: next.itineraires } : {}), km: next.km, tuiles: total, versions, empreinte: next.empreinte, ...extra }, null, 1) + '\n'
    )
  try {
    const view = gh(['release', 'view', SKI_RELEASE, '--repo', repo, '--json', 'assets'], true)
    const assets = view.ok ? JSON.parse(view.out || '{}').assets?.map((a) => a.name) ?? [] : []
    let prev = null
    if (view.ok && assets.includes('manifeste.json')) {
      if (!gh(['release', 'download', SKI_RELEASE, '--repo', repo, '--pattern', 'manifeste.json', '--dir', tmp], true).ok) throw new Error('Manifeste publié illisible : impossible de comparer.')
      prev = JSON.parse(readFileSync(join(tmp, 'manifeste.json'), 'utf8'))
      console.log(`Version publiée : ${prev.archive} (${prev.troncons} tronçons, fabriquée le ${String(prev.fabrique).slice(0, 10)}).`)
    }
    const d = compareSkiManifests(prev, next)
    const head = `**${next.troncons} tronçons**${typeof next.itineraires === 'number' ? `, ${next.itineraires} itinéraires` : ''}, ${next.km} km dont ${next.km_pied} à pied, ${total} tuiles (versions ${Object.entries(versions).map(([k, v]) => `${k} ${v}`).join(', ')})`
    if (!d.fresh && d.ok) {
      console.log('Mêmes tuiles que la version publiée : rien à publier.')
      summary(['## Itinéraires ski de rando : inchangés', head])
      state('inchange', { archive: prev?.archive ?? null })
      output('publie', '0')
      return
    }
    if (!d.ok && !force) {
      console.error('Fabrication refusée, rien n’est publié :\n- ' + d.errors.join('\n- '))
      summary(["## Itinéraires ski de rando : refusés, rien n'est publié", head, '', ...d.errors.map((e) => `- ${e}`), '', 'Relancer à la main avec « forcer » si ces écarts sont normaux.'])
      state('refuse', { erreurs: d.errors, archive: prev?.archive ?? null })
      output('publie', '0')
      process.exitCode = 1
      return
    }
    if (d.errors.length) console.log('Écarts acceptés (forcer) :\n- ' + d.errors.join('\n- '))
    const name = skiArchiveName(next.fabrique, next.empreinte)
    const pointer = { ...next, archive: name }
    const drop = skiArchivesToDrop(assets, name)
    if (dry) {
      console.log(`ESSAI : ${name} serait publiée dans « ${SKI_RELEASE} » ; archives retirées : ${drop.join(', ') || 'aucune'}.`)
      return
    }
    const archive = join(tmp, name)
    if (spawnSync('tar', ['-czf', archive, '-C', dir, '.'], { stdio: 'inherit' }).status !== 0) throw new Error('Archive impossible.')
    const manifest = join(tmp, 'manifeste.json')
    writeFileSync(manifest, JSON.stringify(pointer, null, 1))
    if (!view.ok) {
      // Première fois : la version fixe, JAMAIS « Latest » (le lien « dernière version » des pistes ne bouge pas).
      const c = gh(['release', 'create', SKI_RELEASE, '--repo', repo, '--title', 'Itinéraires de ski de rando (France)', '--notes', skiReleaseNotes(pointer), '--latest=false'])
      if (!c.ok) throw new Error('Création de la version impossible.')
    }
    // L'archive d'abord (nom neuf), puis le manifeste qui la nomme : un lecteur voit toujours une paire complète.
    if (!gh(['release', 'upload', SKI_RELEASE, archive, '--repo', repo]).ok) throw new Error('Envoi de l’archive impossible.')
    if (!gh(['release', 'upload', SKI_RELEASE, manifest, '--repo', repo, '--clobber']).ok) throw new Error('Envoi du manifeste impossible.')
    gh(['release', 'edit', SKI_RELEASE, '--repo', repo, '--notes', skiReleaseNotes(pointer)])
    for (const old of drop) if (gh(['release', 'delete-asset', SKI_RELEASE, old, '--repo', repo, '--yes']).ok) console.log(`Ancienne archive retirée : ${old}`)
    console.log(`✔ ${name} publiée.`)
    summary([`## Itinéraires ski de rando : ${name} publiée`, head, ...(d.errors.length ? ['', 'Écarts acceptés (forcer) :', ...d.errors.map((e) => `- ${e}`)] : [])])
    state('publie', { archive: name })
    output('publie', '1')
    output('version', name)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

/** Après publication : le lien de lecture de soulane.app renvoie bien ce manifeste. */
export async function checkLatest(repo, empreinte, tries = 6, url = `https://github.com/${repo}/releases/latest/download/manifeste.json`) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (r.ok && (await r.json()).empreinte === empreinte) return true
    } catch {
      // réessayé
    }
    await new Promise((res) => setTimeout(res, 10000))
  }
  return false
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? '')
  const ski = process.env.JEU === 'skirando'
  if (!existsSync(join(dir, 'manifeste.json'))) {
    console.error('Usage : [JEU=skirando] node outils/publier.mjs <dossier des tuiles> (avec son manifeste.json)')
    process.exit(2)
  }
  if (ski) publishSkirando(dir)
  else publishPistes(dir)
  if (!process.exitCode && process.env.GITHUB_OUTPUT && existsSync(process.env.GITHUB_OUTPUT)) {
    const out = readFileSync(process.env.GITHUB_OUTPUT, 'utf8')
    if (/^publie=1$/m.test(out)) {
      const repo = process.env.GITHUB_REPOSITORY || 'edgarfifi/soulane-donnees'
      const empreinte = JSON.parse(readFileSync(join(dir, 'manifeste.json'), 'utf8')).empreinte
      const url = ski ? `https://github.com/${repo}/releases/download/${SKI_RELEASE}/manifeste.json` : undefined
      const ok = await checkLatest(repo, empreinte, 6, url)
      if (!ok) {
        console.error('La version publiée ne renvoie pas ce manifeste.')
        process.exitCode = 1
      } else console.log('✔ Lien de lecture vérifié.')
    }
  }
}
