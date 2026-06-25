import { useEffect, useMemo, useRef, useState } from 'react'
import { SCHOOLS, type School } from './data/schools'
import { buildSlices, pickWeightedIndex, type WeightMode } from './utils/wheel'
import { Wheel } from './components/Wheel'
import { FilterPanel, type Preset } from './components/FilterPanel'
import { ResultModal } from './components/ResultModal'
import { HistoryList, type HistoryEntry } from './components/HistoryList'
import styles from './App.module.css'

const SPIN_MS = 5200
const EXTRA_TURNS = 6
const POINTER_DEG = 270 // 12 o'clock in the wheel's coordinate system
const HISTORY_KEY = 'cfb27-wheel-history'

export default function App() {
  const [conferences, setConferences] = useState<Set<string>>(new Set())
  const [minStars, setMinStars] = useState(0.5)
  const [maxStars, setMaxStars] = useState(5)
  const [mode, setMode] = useState<WeightMode>('equal')
  const [search, setSearch] = useState('')

  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<School | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const pendingWinner = useRef<School | null>(null)

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const pool = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SCHOOLS.filter((s) => {
      if (conferences.size > 0 && !conferences.has(s.conference)) return false
      if (s.stars < minStars || s.stars > maxStars) return false
      if (q && !s.name.toLowerCase().includes(q) && !s.abbr.toLowerCase().includes(q)) return false
      return true
    })
  }, [conferences, minStars, maxStars, search])

  const slices = useMemo(() => buildSlices(pool, mode), [pool, mode])

  function spin() {
    if (spinning || slices.length === 0) return
    const idx = pickWeightedIndex(slices)
    const slice = slices[idx]
    pendingWinner.current = slice.school

    // Land somewhere within the slice (not always dead center) under the pointer.
    const sweep = slice.endAngle - slice.startAngle
    const jitter = (Math.random() - 0.5) * sweep * 0.7
    const aim = slice.midAngle + jitter
    const base = ((POINTER_DEG - aim) % 360 + 360) % 360

    const currentMod = ((rotation % 360) + 360) % 360
    const delta = ((base - currentMod) % 360 + 360) % 360
    const target = rotation + delta + EXTRA_TURNS * 360

    setWinner(null)
    setModalOpen(false)
    setSpinning(true)
    setRotation(target)
  }

  function onSpinEnd() {
    setSpinning(false)
    const w = pendingWinner.current
    if (!w) return
    setWinner(w)
    setModalOpen(true)
    setHistory((h) => [{ school: w, at: Date.now() }, ...h].slice(0, 30))
  }

  function toggleConference(c: string) {
    setConferences((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  function resetFilters() {
    setConferences(new Set())
    setMinStars(0.5)
    setMaxStars(5)
    setSearch('')
    setMode('equal')
  }

  const presets: Preset[] = [
    {
      label: '⭐ Blue bloods (5★)',
      apply: () => {
        setConferences(new Set())
        setMinStars(5)
        setMaxStars(5)
        setMode('equal')
        setSearch('')
      },
    },
    {
      label: 'Power 4',
      apply: () => {
        setConferences(new Set(['SEC', 'Big Ten', 'ACC', 'Big 12']))
        setMinStars(0.5)
        setMaxStars(5)
        setSearch('')
      },
    },
    {
      label: 'Group of 5 grind',
      apply: () => {
        setConferences(new Set(['American', 'Conference USA', 'MAC', 'Mountain West', 'Sun Belt', 'Pac-12', 'Independent']))
        setMinStars(0.5)
        setMaxStars(5)
        setSearch('')
      },
    },
    {
      label: 'Rebuild (≤2★)',
      apply: () => {
        setConferences(new Set())
        setMinStars(0.5)
        setMaxStars(2)
        setMode('equal')
        setSearch('')
      },
    },
    {
      label: 'Underdog odds',
      apply: () => {
        setConferences(new Set())
        setMinStars(0.5)
        setMaxStars(5)
        setMode('underdog')
        setSearch('')
      },
    },
  ]

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🏈</span>
          <div>
            <h1>Dynasty Wheel</h1>
            <p>EA College Football 27 · pick your team, start your dynasty</p>
          </div>
        </div>
        <div className={styles.headerStat}>
          <strong>134</strong>
          <span>FBS programs</span>
        </div>
      </header>

      <main className={styles.layout}>
        <FilterPanel
          conferences={conferences}
          toggleConference={toggleConference}
          minStars={minStars}
          maxStars={maxStars}
          setStarRange={(min, max) => {
            setMinStars(min)
            setMaxStars(max)
          }}
          mode={mode}
          setMode={setMode}
          search={search}
          setSearch={setSearch}
          presets={presets}
          poolCount={pool.length}
          totalCount={SCHOOLS.length}
          onReset={resetFilters}
        />

        <section className={styles.stage}>
          {slices.length === 0 ? (
            <div className={styles.empty}>
              <h3>No teams match your filters</h3>
              <p>Loosen the star range or conference selection to fill the wheel.</p>
            </div>
          ) : (
            <Wheel
              slices={slices}
              rotation={rotation}
              spinning={spinning}
              spinDurationMs={SPIN_MS}
              onSpinEnd={onSpinEnd}
            />
          )}

          <button
            className={styles.spinBtn}
            onClick={spin}
            disabled={spinning || slices.length === 0}
          >
            {spinning ? 'Spinning…' : slices.length === 1 ? 'Reveal team' : `Spin the wheel · ${pool.length} teams`}
          </button>

          {winner && !modalOpen && (
            <button className={styles.reopen} onClick={() => setModalOpen(true)}>
              View {winner.name} again
            </button>
          )}
        </section>

        <HistoryList
          entries={history}
          onPick={(s) => {
            setWinner(s)
            setModalOpen(true)
          }}
          onClear={() => setHistory([])}
        />
      </main>

      {modalOpen && (
        <ResultModal
          school={winner}
          onClose={() => setModalOpen(false)}
          onRespin={() => {
            setModalOpen(false)
            spin()
          }}
        />
      )}
    </div>
  )
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
