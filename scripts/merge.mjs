// Merges scraped /tmp/players.json into src/data/schools.ts:
// overwrites ovr/offOvr/defOvr with teamcrafters CFB27 values and attaches
// top 5 offense/defense players. Keeps colors, stadium, rivals, stars, etc.
import { readFileSync, writeFileSync } from 'node:fs'

const players = JSON.parse(readFileSync('/tmp/players.json', 'utf8'))
const src = readFileSync('src/data/schools.ts', 'utf8')

// Extract the array literal and eval it as plain JS.
const start = src.indexOf('export const SCHOOLS')
const open = src.indexOf('[', start)
const close = src.indexOf('\n]', open)
const arrText = src.slice(open, close + 2)
const schools = eval(`(${arrText})`)

let missing = []
for (const s of schools) {
  const p = players[s.name]
  if (!p) {
    // Preserve any existing data; only ensure new fields exist.
    missing.push(s.name)
    s.outlook = s.outlook ?? 50
    s.topOffense = s.topOffense || []
    s.topDefense = s.topDefense || []
    s.topSpeed = s.topSpeed || []
    s.roster = s.roster || []
    continue
  }
  if (p.conference) s.conference = p.conference // authoritative 2026 alignment
  s.ovr = p.ovr
  s.offOvr = p.offOvr
  s.defOvr = p.defOvr
  s.outlook = p.outlook
  s.topOffense = p.topOffense
  s.topDefense = p.topDefense
  s.topSpeed = p.topSpeed
  s.roster = p.roster
}
if (missing.length) console.log('NO PLAYER DATA:', missing.join(', '))

const FIELD_ORDER = [
  'name', 'abbr', 'conference', 'stars', 'ovr', 'offOvr', 'defOvr', 'outlook',
  'primaryColor', 'secondaryColor', 'state', 'stadium', 'rivals', 'mascot',
  'topOffense', 'topDefense', 'topSpeed', 'roster',
]

const j = (v) => JSON.stringify(v)
const plist = (arr) =>
  '[' +
  arr.map((p) => `{ name: ${j(p.name)}, pos: ${j(p.pos)}, ovr: ${p.ovr}, yr: ${j(p.yr)} }`).join(', ') +
  ']'
const slist = (arr) =>
  '[' +
  arr.map((p) => `{ name: ${j(p.name)}, pos: ${j(p.pos)}, spd: ${p.spd}, yr: ${j(p.yr)} }`).join(', ') +
  ']'
const rlist = (arr) =>
  '[\n' +
  arr
    .map(
      (p) =>
        `      { name: ${j(p.name)}, pos: ${j(p.pos)}, ovr: ${p.ovr}, num: ${p.num}, yr: ${j(p.yr)} }`,
    )
    .join(',\n') +
  '\n    ]'

function emitSchool(s) {
  const parts = []
  for (const k of FIELD_ORDER) {
    if (k === 'rivals') parts.push(`rivals: [${s.rivals.map(j).join(', ')}]`)
    else if (k === 'topOffense' || k === 'topDefense') parts.push(`${k}: ${plist(s[k])}`)
    else if (k === 'topSpeed') parts.push(`topSpeed: ${slist(s[k])}`)
    else if (k === 'roster') parts.push(`roster: ${rlist(s[k])}`)
    else parts.push(`${k}: ${j(s[k])}`)
  }
  return `  {\n    ${parts.join(',\n    ')},\n  }`
}

const header = `export interface Player {
  name: string
  pos: string
  ovr?: number
  num?: number
  spd?: number
  yr?: string
}

export interface School {
  name: string
  abbr: string
  conference: string
  stars: number
  ovr: number
  offOvr: number
  defOvr: number
  outlook: number
  primaryColor: string
  secondaryColor: string
  state: string
  stadium: string
  rivals: string[]
  mascot: string
  topOffense: Player[]
  topDefense: Player[]
  topSpeed: Player[]
  roster: Player[]
}

// Team ratings and rosters sourced from teamcrafters.net CFB 27 launch ratings.
// Conferences reflect the 2025-26 realignment. Stars are a curated 0.5-5 tier.
export const SCHOOLS: School[] = [
`

const footer = `
]

export const CONFERENCES = Array.from(new Set(SCHOOLS.map((s) => s.conference))).sort()
export const STATES = Array.from(new Set(SCHOOLS.map((s) => s.state))).sort()
`

writeFileSync('src/data/schools.ts', header + schools.map(emitSchool).join(',\n') + footer)
console.log(`Wrote ${schools.length} schools.`)
