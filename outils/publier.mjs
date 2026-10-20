/* global process, console, fetch, AbortSignal, setTimeout */
// Vérifie puis publie les tuiles des pistes fabriquées par outils/pistes.mjs (dépôt edgarfifi/soulane-donnees, lancé
// chaque semaine par .github/workflows/pistes.yml). Tenu dans le dépôt de l'app Soulane (scripts/soulane-donnees/).
//   node outils/publier.mjs <dossier des tuiles>
// 1. Compare le manifeste neuf à celui de la dernière version publiée :
//    - même empreinte (mêmes tuiles) : rien à publier ;
//    - chiffres trop éloignés (fichier d'OpenSnowMap tronqué, région manquante…) : ARRÊT sans publier, en erreur
//      (GitHub prévient par e-mail) ; FORCER=1 publie quand même (relance à la main, case « forcer »).
// 2. Publie l'archive pistes.tar.gz + manifeste.json en nouvelle version « pistes-AAAAMMJJ » (la dernière = « Latest » :
//    soulane.app la reprend à sa construction suivante) et garde les 8 plus récentes.
// 3. Écrit etat.json (dernier passage, résultat) : le workflow le commite, ce qui garde aussi son planning actif.
// Sorties pour le workflow (GITHUB_OUTPUT) : publie=1|0, version=<étiquette>.
import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Limites des écarts acceptés avec la fois précédente (une semaine de cartographie bouge de moins de 1 %). */
export const LIMITS = { minPistes: 100000, pistes: 0.05, tuiles: 0.05, octets: 0.15 }
/** Versions des pistes gardées dans le dépôt (les plus récentes). */
export const KEEP = 8

const pct = (a, b) => `${a >= b ? '+' : '−'}${((Math.abs(a - b) / Math.max(1, b)) * 100).toFixed(1)} %`
const gap = (a, b) => Math.abs(a - b) / Math.max(1, b)

/**
 * Décision PURE à partir du manifeste précédent (null : première fois) et du neuf.
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

/** Étiquette d'une version neuve : pistes-AAAAMMJJ (date de fabrication), suffixée si elle existe déjà. */
export function releaseTag(fabrique, existing) {
  const base = `pistes-${String(fabrique).slice(0, 10).replace(/-/g, '')}`
  let tag = base
  for (let i = 2; existing.includes(tag); i++) tag = `${base}-${i}`
  return tag
}

function main() {
  const dir = resolve(process.argv[2] ?? '')
  if (!existsSync(join(dir, 'manifeste.json'))) {
    console.error('Usage : node outils/publier.mjs <dossier des tuiles> (avec son manifeste.json)')
    process.exit(2)
  }
  const repo = process.env.GITHUB_REPOSITORY || 'edgarfifi/soulane-donnees'
  const force = process.env.FORCER === '1'
  // ESSAI=1 : tout sauf publier et retirer des versions (essai sur un ordinateur).
  const dry = process.env.ESSAI === '1'
  const next = JSON.parse(readFileSync(join(dir, 'manifeste.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'pistes-'))
  const gh = (args, quiet = false) => {
    const r = spawnSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', quiet ? 'pipe' : 'inherit'] })
    return { ok: r.status === 0, out: r.stdout ?? '' }
  }
  const output = (k, v) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`)
  const summary = (lines) => process.env.GITHUB_STEP_SUMMARY && appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
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

/** Après publication : la « dernière version » renvoie bien ce manifeste (lien utilisé par soulane.app). */
export async function checkLatest(repo, empreinte, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`https://github.com/${repo}/releases/latest/download/manifeste.json`, { signal: AbortSignal.timeout(20000) })
      if (r.ok && (await r.json()).empreinte === empreinte) return true
    } catch {
      // réessayé
    }
    await new Promise((res) => setTimeout(res, 10000))
  }
  return false
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
  if (!process.exitCode && process.env.GITHUB_OUTPUT && existsSync(process.env.GITHUB_OUTPUT)) {
    const out = readFileSync(process.env.GITHUB_OUTPUT, 'utf8')
    if (/^publie=1$/m.test(out)) {
      const ok = await checkLatest(process.env.GITHUB_REPOSITORY || 'edgarfifi/soulane-donnees', JSON.parse(readFileSync(join(resolve(process.argv[2]), 'manifeste.json'), 'utf8')).empreinte)
      if (!ok) {
        console.error('La dernière version publiée ne renvoie pas ce manifeste.')
        process.exitCode = 1
      } else console.log('✔ Lien « dernière version » vérifié.')
    }
  }
}
