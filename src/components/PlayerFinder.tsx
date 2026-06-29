import { useMemo, useState } from 'react'
import { PLAYER_INDEX, POSITIONS, CLASSES } from '../utils/players'
import styles from './PlayerFinder.module.css'

interface PlayerFinderProps {
  onOpenPlayer: (pid: number, accent: string) => void
}

const LIMIT = 60

function MinSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.slider}>
      <div className={styles.sliderHead}>
        <span>{label}</span>
        <strong>{value === 0 ? 'any' : `${value}+`}</strong>
      </div>
      <input
        type="range"
        min={0}
        max={99}
        step={1}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  )
}

export function PlayerFinder({ onOpenPlayer }: PlayerFinderProps) {
  const [q, setQ] = useState('')
  const [classes, setClasses] = useState<Set<string>>(new Set())
  const [pos, setPos] = useState('')
  const [minOvr, setMinOvr] = useState(0)
  const [minSpd, setMinSpd] = useState(0)
  const [minTp, setMinTp] = useState(0)
  const [minStr, setMinStr] = useState(0)
  const [minTkl, setMinTkl] = useState(0)

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    const out = PLAYER_INDEX.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query)) return false
      if (classes.size > 0 && !classes.has(p.cls)) return false
      if (pos && p.pos !== pos) return false
      if (p.ovr < minOvr) return false
      if (p.spd < minSpd) return false
      if (p.tp < minTp) return false
      if (p.str < minStr) return false
      if (p.tkl < minTkl) return false
      return true
    })
    out.sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    return out
  }, [q, classes, pos, minOvr, minSpd, minTp, minStr, minTkl])

  function toggleClass(c: string) {
    setClasses((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  function reset() {
    setQ('')
    setClasses(new Set())
    setPos('')
    setMinOvr(0)
    setMinSpd(0)
    setMinTp(0)
    setMinStr(0)
    setMinTkl(0)
  }

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <h2>Player search</h2>
        <span className={styles.count}>{results.length.toLocaleString()} players</span>
      </div>

      <input
        className={styles.search}
        type="text"
        placeholder="Search any player by name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className={styles.controls}>
        <div className={styles.field}>
          <label className={styles.label}>Class</label>
          <div className={styles.chips}>
            {CLASSES.map((c) => (
              <button
                key={c}
                className={`${styles.chip} ${classes.has(c) ? styles.chipOn : ''}`}
                onClick={() => toggleClass(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Position</label>
          <select className={styles.select} value={pos} onChange={(e) => setPos(e.target.value)}>
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.sliders}>
        <MinSlider label="Min overall" value={minOvr} onChange={setMinOvr} />
        <MinSlider label="Min speed" value={minSpd} onChange={setMinSpd} />
        <MinSlider label="Min throw power" value={minTp} onChange={setMinTp} />
        <MinSlider label="Min strength" value={minStr} onChange={setMinStr} />
        <MinSlider label="Min tackle" value={minTkl} onChange={setMinTkl} />
        <button className={styles.reset} onClick={reset}>
          Reset filters
        </button>
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>No players match these filters.</p>
      ) : (
        <ul className={styles.list}>
          {results.slice(0, LIMIT).map((p) => (
            <li key={p.pid}>
              <button className={styles.row} onClick={() => onOpenPlayer(p.pid, p.accent)}>
                <span className={styles.pos}>{p.pos}</span>
                <span className={styles.swatch} style={{ background: p.accent }} />
                <span className={styles.name}>{p.name}</span>
                <span className={styles.team}>{p.teamAbbr}</span>
                <span className={styles.yr}>{p.yr}</span>
                <span className={styles.ovr}>{p.ovr}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length > LIMIT && (
        <p className={styles.more}>Showing top {LIMIT}. Refine filters to narrow down.</p>
      )}
    </section>
  )
}
