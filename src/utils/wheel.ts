import type { School } from '../data/schools'

// Weighting modes change the relative size of each wheel slice.
export type WeightMode = 'equal' | 'prestige' | 'underdog'

// Returns the slice weight for a school under the given mode.
export function weightFor(school: School, mode: WeightMode): number {
  switch (mode) {
    case 'equal':
      return 1
    case 'prestige':
      // Higher-rated programs get bigger slices (more likely to land).
      return Math.pow(school.stars, 2)
    case 'underdog':
      // Lower-rated programs get bigger slices.
      return Math.pow(5.5 - school.stars, 2)
  }
}

export interface Slice {
  school: School
  startAngle: number // degrees, 0 = pointing right, increasing clockwise
  endAngle: number
  midAngle: number
  weight: number
}

// Builds the ordered slices that fill the 360-degree wheel.
export function buildSlices(schools: School[], mode: WeightMode): Slice[] {
  const total = schools.reduce((sum, s) => sum + weightFor(s, mode), 0)
  let cursor = 0
  return schools.map((school) => {
    const weight = weightFor(school, mode)
    const sweep = (weight / total) * 360
    const startAngle = cursor
    const endAngle = cursor + sweep
    cursor = endAngle
    return { school, startAngle, endAngle, midAngle: (startAngle + endAngle) / 2, weight }
  })
}

// Picks a winning slice index respecting slice weights.
export function pickWeightedIndex(slices: Slice[]): number {
  const total = slices.reduce((sum, s) => sum + s.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < slices.length; i++) {
    r -= slices[i].weight
    if (r <= 0) return i
  }
  return slices.length - 1
}

// SVG arc path for a wheel slice (donut not needed — full pie wedge).
export function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// Decides black/white label text for contrast against a background hex color.
export function readableText(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111111' : '#FFFFFF'
}
