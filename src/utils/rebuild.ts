import type { School } from '../data/schools'

export interface RebuildRating {
  pct: number // 0 = easiest, 100 = hardest
  level: number // 1-5
  label: string
  color: string
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

// Rebuild difficulty blends current talent (OVR), program ceiling (stars), and
// the 2-year roster outlook (share of OVR from returning Fr/So). More talent +
// younger roster = easier rebuild; thin, senior-heavy rosters are brutal.
export function rebuildDifficulty(school: School): RebuildRating {
  const talent = clamp01((school.ovr - 70) / 22) // 70..92 -> 0..1
  const stars = clamp01((school.stars - 0.5) / 4.5) // 0.5..5 -> 0..1
  const youth = clamp01(school.outlook / 100) // returning-OVR share

  const ease = 0.45 * talent + 0.25 * stars + 0.3 * youth
  const difficulty = 1 - ease
  const pct = Math.round(difficulty * 100)

  let level: number
  let label: string
  if (pct < 25) {
    level = 1
    label = 'Easy'
  } else if (pct < 42) {
    level = 2
    label = 'Manageable'
  } else if (pct < 58) {
    level = 3
    label = 'Moderate'
  } else if (pct < 74) {
    level = 4
    label = 'Hard'
  } else {
    level = 5
    label = 'Brutal'
  }

  // green (easy) -> amber -> red (hard)
  const hue = Math.round((1 - difficulty) * 120) // 0=red, 120=green
  const color = `hsl(${hue}, 72%, 42%)`

  return { pct, level, label, color }
}
