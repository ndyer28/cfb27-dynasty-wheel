// Rebuilds schools.ts from EA-official player data (100% accurate) and emits
// playerDetails.json (pid -> full 54-attribute record) for the player modal.
import { readFileSync, writeFileSync } from 'node:fs'

const ea = JSON.parse(readFileSync('/tmp/ea_players.json', 'utf8'))
const src = readFileSync('src/data/schools.ts', 'utf8')
const open = src.indexOf('[', src.indexOf('export const SCHOOLS'))
const SCHOOLS = eval(`(${src.slice(open, src.indexOf('\n]', open) + 2)})`)

const OFF = new Set(['QB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'])
const DEF = new Set(['LE', 'RE', 'DT', 'MLB', 'LOLB', 'ROLB', 'CB', 'FS', 'SS'])
const YOUNG = new Set(['Freshman', 'Sophomore'])
const CLASS_ABBR = { Freshman: 'FR', Sophomore: 'SO', Junior: 'JR', Senior: 'SR' }
const yrOf = (p) => (p.redshirt === 'Redshirted' ? 'RS ' : '') + (CLASS_ABBR[p.schoolYear] || '')

const details = {}

for (const s of SCHOOLS) {
  const team = ea[s.name]
  if (!team) {
    console.log('NO EA DATA:', s.name)
    continue
  }
  const players = team.players.map((p) => ({ ...p, yr: yrOf(p), spd: p.attrs.speed ?? 0 }))

  // recompute team ratings from EA rosters (top 11 starters per side)
  const avgTop = (set) => {
    const u = players.filter((p) => set.has(p.pos)).sort((a, b) => b.ovr - a.ovr).slice(0, 11)
    return u.length ? Math.round(u.reduce((t, p) => t + p.ovr, 0) / u.length) : 0
  }
  s.offOvr = avgTop(OFF)
  s.defOvr = avgTop(DEF)
  s.ovr = Math.round((s.offOvr + s.defOvr) / 2)
  const totO = players.reduce((t, p) => t + p.ovr, 0)
  const yng = players.filter((p) => YOUNG.has(p.schoolYear)).reduce((t, p) => t + p.ovr, 0)
  s.outlook = totO ? Math.round((yng / totO) * 100) : 0

  const top = (set) =>
    players
      .filter((p) => set.has(p.pos))
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((p) => ({ name: p.name, pos: p.pos, ovr: p.ovr, yr: p.yr, pid: p.pid }))
  s.topOffense = top(OFF)
  s.topDefense = top(DEF)
  s.topSpeed = players
    .slice()
    .sort((a, b) => b.spd - a.spd || b.ovr - a.ovr || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((p) => ({ name: p.name, pos: p.pos, spd: p.spd, yr: p.yr, pid: p.pid }))
  s.roster = players
    .slice()
    .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    .map((p) => ({ name: p.name, pos: p.pos, ovr: p.ovr, num: p.num, yr: p.yr, pid: p.pid }))

  // full detail records
  for (const p of players) {
    details[p.pid] = {
      name: p.name, pos: p.pos, posLabel: p.posLabel, team: s.name, ovr: p.ovr, num: p.num,
      yr: p.yr, ht: p.height, wt: p.weight, home: [p.homeTown, p.homeState].filter(Boolean).join(', '),
      attrs: p.attrs,
    }
  }
}

writeFileSync('public/playerDetails.json', JSON.stringify(details))

// ---- emit schools.ts ----
const j = (v) => JSON.stringify(v)
const FIELD = [
  'name', 'abbr', 'conference', 'stars', 'ovr', 'offOvr', 'defOvr', 'outlook',
  'primaryColor', 'secondaryColor', 'state', 'stadium', 'rivals', 'mascot',
  'topOffense', 'topDefense', 'topSpeed', 'roster',
]
const pl = (a) =>
  '[' + a.map((p) => `{ name: ${j(p.name)}, pos: ${j(p.pos)}, ovr: ${p.ovr}, yr: ${j(p.yr)}, pid: ${p.pid} }`).join(', ') + ']'
const sl = (a) =>
  '[' + a.map((p) => `{ name: ${j(p.name)}, pos: ${j(p.pos)}, spd: ${p.spd}, yr: ${j(p.yr)}, pid: ${p.pid} }`).join(', ') + ']'
const rl = (a) =>
  '[\n' + a.map((p) => `      { name: ${j(p.name)}, pos: ${j(p.pos)}, ovr: ${p.ovr}, num: ${p.num}, yr: ${j(p.yr)}, pid: ${p.pid} }`).join(',\n') + '\n    ]'

function emit(s) {
  const parts = []
  for (const k of FIELD) {
    if (k === 'rivals') parts.push(`rivals: [${s.rivals.map(j).join(', ')}]`)
    else if (k === 'topOffense' || k === 'topDefense') parts.push(`${k}: ${pl(s[k])}`)
    else if (k === 'topSpeed') parts.push(`topSpeed: ${sl(s[k])}`)
    else if (k === 'roster') parts.push(`roster: ${rl(s[k])}`)
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
  pid?: number
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

// Player ratings sourced from EA's official CFB 27 ratings site (authoritative).
// Team off/def/ovr recomputed from top-11 starters; outlook from returning Fr/So.
export const SCHOOLS: School[] = [
`
const footer = `
]

export const CONFERENCES = Array.from(new Set(SCHOOLS.map((s) => s.conference))).sort()
export const STATES = Array.from(new Set(SCHOOLS.map((s) => s.state))).sort()
`

writeFileSync('src/data/schools.ts', header + SCHOOLS.map(emit).join(',\n') + footer)
const n = Object.keys(details).length
console.log(`Wrote ${SCHOOLS.length} schools, ${n} player detail records (${(JSON.stringify(details).length / 1e6).toFixed(1)}MB).`)
