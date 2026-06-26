import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { School } from '../data/schools'
import { buildSlices, pickWeightedIndex, type WeightMode } from '../utils/wheel'
import styles from './Reel.module.css'

const ROW = 56
const WINDOW = 308
const CENTER = WINDOW / 2 - ROW / 2
const STRIP_LEN = 48
const TARGET = STRIP_LEN - 4 // winner index; leaves rows below for centering

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

function buildStrip(pool: School[], winner: School | null): School[] {
  const strip: School[] = []
  for (let i = 0; i < STRIP_LEN; i++) strip.push(pool[Math.floor(Math.random() * pool.length)])
  if (winner) strip[TARGET] = winner
  return strip
}

export function Reel({ pool, mode, spinToken, onLand }: ReelProps) {
  const reelRef = useRef<HTMLDivElement>(null)
  const [strip, setStrip] = useState<School[]>(() => buildStrip(pool, null))
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
    setStrip(buildStrip(pool, winner))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken])

  // animate once the new strip has rendered
  useLayoutEffect(() => {
    const winner = pendingWinner.current
    if (!winner) return
    pendingWinner.current = null
    const el = reelRef.current
    if (!el) return

    place(el, 6, false) // jump near the top
    void el.offsetHeight // force reflow
    const exactY = CENTER - TARGET * ROW

    requestAnimationFrame(() => {
      el.style.transition = 'transform 3s cubic-bezier(0.1, 0.72, 0.12, 1)'
      el.style.transform = `translateY(${exactY + 20}px)` // decelerate to just short
    })
    // magnetic snap: pull the last 20px to dead-center with a springy settle
    const snap = setTimeout(() => {
      el.style.transition = 'transform 0.36s cubic-bezier(0.34, 1.45, 0.5, 1)'
      el.style.transform = `translateY(${exactY}px)`
    }, 3000)
    const land = setTimeout(() => onLandRef.current(winner), 3420)
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
