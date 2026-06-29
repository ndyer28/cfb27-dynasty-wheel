import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { School } from '../data/schools'
import { buildSlices, pickWeightedIndex, type WeightMode } from '../utils/wheel'
import styles from './Reel.module.css'

const ROW = 56
const WINDOW = 308
const CENTER = WINDOW / 2 - ROW / 2
const MIN_ROWS = 80 // ensures a long, fast roll even for small filtered pools
const TAIL = 4 // rows kept after the winner so it can center

interface ReelProps {
  pool: School[]
  mode: WeightMode
  spinToken: number // increment to trigger a spin
  onLand: (school: School) => void
}

function weightedPick(pool: School[], mode: WeightMode): School {
  const slices = buildSlices(pool, mode)
  return slices[pickWeightedIndex(slices)].school
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Strip = the whole pool shuffled (every team rolls through at least once),
// repeated enough to stay long for small pools. Winner sits near the end.
function buildStrip(pool: School[], winner: School | null): { rows: School[]; target: number } {
  const reps = Math.max(1, Math.ceil(MIN_ROWS / Math.max(1, pool.length)))
  let rows: School[] = []
  for (let r = 0; r < reps; r++) rows = rows.concat(shuffle(pool))
  const target = rows.length - TAIL
  if (winner) rows[target] = winner
  return { rows, target }
}

export function Reel({ pool, mode, spinToken, onLand }: ReelProps) {
  const reelRef = useRef<HTMLDivElement>(null)
  const [strip, setStrip] = useState<School[]>(() => buildStrip(pool, null).rows)
  const targetRef = useRef(0)
  const pendingWinner = useRef<School | null>(null)
  const onLandRef = useRef(onLand)
  onLandRef.current = onLand

  // rest position on mount
  useLayoutEffect(() => {
    place(reelRef.current, 4, false)
  }, [])

  // trigger a spin when the token changes
  useEffect(() => {
    if (spinToken === 0 || pool.length === 0) return
    const winner = weightedPick(pool, mode)
    pendingWinner.current = winner
    const { rows, target } = buildStrip(pool, winner)
    targetRef.current = target
    setStrip(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken])

  // animate once the new strip has rendered
  useLayoutEffect(() => {
    const winner = pendingWinner.current
    if (!winner) return
    pendingWinner.current = null
    const el = reelRef.current
    if (!el) return

    place(el, 1, false) // start at the very top so it rolls through the whole pool
    void el.offsetHeight // force reflow
    const exactY = CENTER - targetRef.current * ROW

    requestAnimationFrame(() => {
      el.style.transition = 'transform 1.9s cubic-bezier(0.07, 0.8, 0.1, 1)'
      el.style.transform = `translateY(${exactY + 18}px)` // fast roll, decelerate just short
    })
    // magnetic snap: pull the last 18px to dead-center with a springy settle
    const snap = setTimeout(() => {
      el.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.5, 0.5, 1)'
      el.style.transform = `translateY(${exactY}px)`
    }, 1900)
    const land = setTimeout(() => onLandRef.current(winner), 2220)
    return () => {
      clearTimeout(snap)
      clearTimeout(land)
    }
  }, [strip])

  return (
    <div className={styles.machine}>
      <div className={styles.window} style={{ height: WINDOW }}>
        <div ref={reelRef} className={styles.reel}>
          {strip.map((s, i) => (
            <div key={i} className={styles.row} style={{ height: ROW }}>
              <span
                className={styles.swatch}
                style={{ background: s.primaryColor, borderColor: s.secondaryColor }}
              />
              <span className={styles.abbr}>{s.abbr}</span>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.ovr}>{s.ovr}</span>
            </div>
          ))}
        </div>
        <div className={styles.band} style={{ top: CENTER, height: ROW }} aria-hidden />
        <div className={styles.markerL} style={{ top: CENTER + ROW / 2 }} aria-hidden>
          ▶
        </div>
        <div className={styles.markerR} style={{ top: CENTER + ROW / 2 }} aria-hidden>
          ◀
        </div>
      </div>
    </div>
  )
}

function place(el: HTMLDivElement | null, idx: number, anim: boolean) {
  if (!el) return
  el.style.transition = anim ? 'transform 3s cubic-bezier(0.1, 0.72, 0.12, 1)' : 'none'
  el.style.transform = `translateY(${CENTER - idx * ROW}px)`
}
