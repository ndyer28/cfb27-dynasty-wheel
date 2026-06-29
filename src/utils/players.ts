import { SCHOOLS } from '../data/schools'

export interface IndexedPlayer {
  pid: number
  name: string
  team: string
  teamAbbr: string
  accent: string
  pos: string
  ovr: number
  yr: string
  cls: string // FR | SO | JR | SR
  spd: number
  tp: number
  str: number
  tkl: number
}

const POS_ORDER = [
  'QB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT',
  'LE', 'RE', 'DT', 'LOLB', 'MLB', 'ROLB', 'CB', 'FS', 'SS', 'K', 'P',
]

// Flatten every team's roster into one searchable index.
export const PLAYER_INDEX: IndexedPlayer[] = SCHOOLS.flatMap((s) =>
  s.roster.map((p) => ({
    pid: p.pid ?? 0,
    name: p.name,
    team: s.name,
    teamAbbr: s.abbr,
    accent: s.primaryColor,
    pos: p.pos,
    ovr: p.ovr ?? 0,
    yr: p.yr ?? '',
    cls: (p.yr ?? '').split(' ').pop() || '',
    spd: p.spd ?? 0,
    tp: p.tp ?? 0,
    str: p.str ?? 0,
    tkl: p.tkl ?? 0,
  })),
)

export const POSITIONS: string[] = Array.from(new Set(PLAYER_INDEX.map((p) => p.pos))).sort(
  (a, b) => {
    const ia = POS_ORDER.indexOf(a)
    const ib = POS_ORDER.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  },
)

export const CLASSES = ['FR', 'SO', 'JR', 'SR'] as const
