// Relief HD : UN PAQUET (tuile z12) raccordé et assemblé SEUL, à partir des parties brutes de ses 16 tuiles z14 et de
// l'anneau de leurs voisines (6 × 6 tuiles au plus), sur une machine du workflow « Relief HD » ou sur place (27/11/2026).
//
//   node relief-hd/paquet-cloud.mjs <outil> <parties brutes> <travail> <sortie> <x12>/<y12>
//
// <outil> : paquet-raccords.mjs (paquet-build.ts du dépôt de l'app, regroupé par esbuild, raccords compris).
// <parties brutes> : 14_<x>_<y>.{z14,noeuds,journal.json} et les 16_<X>_<Y>.arb des blocs, sortis de tuile14.py.
// Sortie : <sortie>/12/<x12>/<y12>.srm, <y12>-<n>.srm, <y12>.sra et un manifest.json de ce seul paquet.
//
// Pourquoi un paquet tout seul suffit : les raccords d'une tuile ne dépendent que de ses 8 voisines (essai du 27/11/2026 :
// tuile 8486/5870 raccordée dans un carré 3 × 3 = octet pour octet celle du grand calcul du pilote, 224 tuiles). Le
// paquet se raccorde donc avec l'anneau de ses voisines, seules ses 16 tuiles réécrites (RACCORDS_TUILES), comme
// pilote/assembler2.sh sur le poste de Soulane : nœuds raccordés, .z14 et journaux bruts, arbres bruts.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [outil, parties, travail, sortie, paquet] = process.argv.slice(2)
if (!paquet || !/^\d+\/\d+$/.test(paquet)) {
  console.error('usage : node paquet-cloud.mjs <outil> <parties brutes> <travail> <sortie> <x12>/<y12>')
  process.exit(2)
}
const [px, py] = paquet.split('/').map(Number)
const lier = (src, dst) => {
  try {
    linkSync(src, dst)
  } catch {
    copyFileSync(src, dst)
  }
}
const lancer = (args, env = {}) => {
  const r = spawnSync(process.execPath, [resolve(outil), ...args], { stdio: 'inherit', env: { ...process.env, ...env } })
  if (r.status !== 0) {
    console.error(`ÉCHEC : ${args[0]} (code ${r.status})`)
    process.exit(1)
  }
}

const union = join(travail, 'union')
const racc = join(travail, 'raccords')
const compo = join(travail, 'composition')
for (const d of [union, racc, compo]) {
  rmSync(d, { recursive: true, force: true })
  mkdirSync(d, { recursive: true })
}
mkdirSync(sortie, { recursive: true })

// 1. Union : les tuiles du carré 6 × 6 (paquet + anneau) qui existent.
const interieur = []
let anneau = 0
for (let y = 4 * py - 1; y <= 4 * py + 4; y++)
  for (let x = 4 * px - 1; x <= 4 * px + 4; x++) {
    const t = `${x}_${y}`
    if (!existsSync(join(parties, `14_${t}.noeuds`))) continue
    for (const ext of ['z14', 'noeuds', 'journal.json']) {
      const f = join(parties, `14_${t}.${ext}`)
      if (existsSync(f)) lier(f, join(union, `14_${t}.${ext}`))
    }
    if (x >> 2 === px && y >> 2 === py) interieur.push(t)
    else anneau++
  }
console.log(`paquet ${paquet} : ${interieur.length} tuiles à lui, ${anneau} voisines`)
if (!interieur.length) {
  console.log('aucune tuile : rien à faire')
  process.exit(0)
}

// 2. Raccords : seules les tuiles du paquet sont réécrites, les voisines servent de bord.
lancer(['raccords', union, racc], { RACCORDS_TUILES: interieur.join(',') })

// 3. Composition : nœuds raccordés, .z14 et journaux bruts, arbres bruts des blocs du paquet.
for (const t of interieur) {
  lier(join(racc, `14_${t}.noeuds`), join(compo, `14_${t}.noeuds`))
  for (const ext of ['z14', 'journal.json']) {
    const f = join(parties, `14_${t}.${ext}`)
    if (existsSync(f)) lier(f, join(compo, `14_${t}.${ext}`))
  }
}
let arbres = 0
for (const f of readdirSync(parties)) {
  const m = /^16_(\d+)_(\d+)\.arb$/.exec(f)
  if (m && +m[1] >> 4 === px && +m[2] >> 4 === py) {
    lier(join(parties, f), join(compo, f))
    arbres++
  }
}
console.log(`composition : ${interieur.length} tuiles, ${arbres} blocs d'arbres`)

// 4. Assemblage du paquet (z13, z12, index, paquet d'arbres).
lancer(['assemble', compo, sortie, paquet])
