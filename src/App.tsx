import { useEffect, useMemo, useRef, useState } from 'react'
import { SCHOOLS, type School } from './data/schools'
import { buildSlices, pickWeightedIndex, type WeightMode } from './utils/wheel'
import { Wheel } from './components/Wheel'
import { Reel } from './components/Reel'
import { FilterPanel, type Preset } from './components/FilterPanel'
import { ResultModal } from './components/ResultModal'
import { HistoryList, type HistoryEntry } from './components/HistoryList'
import { BrowsePanel } from './components/BrowsePanel'
import { PlayerModal } from './components/PlayerModal'
import { PlayerFinder } from './components/PlayerFinder'
import styles from './App.module.css'

const SPIN_MS = 5200
const EXTRA_TURNS = 6
const POINTER_DEG = 270 // 12 o'clock in the wheel's coordinate system
const HISTORY_KEY = 'cfb27-wheel-history'
const PICKER_KEY = 'cfb27-picker-mode'
const TAB_KEY = 'cfb27-tab'

type PickerMode = 'wheel' | 'reel'
type Tab = 'picker' | 'players' | 'ratings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'picker', label: 'Slot Wheel' },
  { id: 'players', label: 'Player Search' },
  { id: 'ratings', label: 'Overall Ratings' },
]

export default function App() {
  const [conferences, setConferences] = useState<Set<string>>(new Set())
  const [minStars, setMinStars] = useState(0.5)
  const [maxStars, setMaxStars] = useState(5)
  const [mode, setMode] = useState<WeightMode>('equal')
  const [includedTeams, setIncludedTeams] = useState<Set<string>>(new Set())
  const [playerView, setPlayerView] = useState<{ pid: number; accent: string } | null>(null)

  const [picker, setPicker] = useState<PickerMode>(
    () => (localStorage.getItem(PICKER_KEY) as PickerMode) || 'reel',
  )
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem(TAB_KEY) as Tab) || 'picker')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [reelToken, setReelToken] = useState(0)
  const [winner, setWinner] = useState<School | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const pendingWinner = useRef<School | null>(null)

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem(PICKER_KEY, picker)
  }, [picker])

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab)
  }, [tab])

  const pool = useMemo(() => {
    // A specific-team selection overrides the filters entirely.
    if (includedTeams.size > 0) return SCHOOLS.filter((s) => includedTeams.has(s.name))
    return SCHOOLS.filter((s) => {
      if (conferences.size > 0 && !conferences.has(s.conference)) return false
      if (s.stars < minStars || s.stars > maxStars) return false
      return true
    })
  }, [conferences, minStars, maxStars, includedTeams])

  const slices = useMemo(() => buildSlices(pool, mode), [pool, mode])

  function commitWinner(w: School) {
    setWinner(w)
    setModalOpen(true)
    setHistory((h) => [{ school: w, at: Date.now() }, ...h].slice(0, 30))
  }

  function spin() {
    if (spinning || slices.length === 0) return
    setWinner(null)
    setModalOpen(false)
    setSpinning(true)

    if (picker === 'reel') {
      setReelToken((t) => t + 1)
      return
    }

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

    setRotation(target)
  }

  function onSpinEnd() {
    setSpinning(false)
    const w = pendingWinner.current
    if (w) commitWinner(w)
  }

  function onReelLand(w: School) {
    setSpinning(false)
    commitWinner(w)
  }

  function toggleConference(c: string) {
    setConferences((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  function toggleTeam(name: string) {
    setIncludedTeams((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function resetFilters() {
    setConferences(new Set())
    setMinStars(0.5)
    setMaxStars(5)
    setMode('equal')
    setIncludedTeams(new Set())
  }

  const presets: Preset[] = [
    {
      label: 'Blue Bloods',
      apply: () => {
        setConferences(new Set())
        setMinStars(5)
        setMaxStars(5)
        setMode('equal')
      },
    },
    {
      label: 'Power 4',
      apply: () => {
        setConferences(new Set(['SEC', 'Big Ten', 'ACC', 'Big 12']))
        setMinStars(0.5)
        setMaxStars(5)
      },
    },
    {
      label: 'Group of 5',
      apply: () => {
        setConferences(new Set(['American', 'CUSA', 'MAC', 'Mountain West', 'Sun Belt', 'Pac-12', 'Independent']))
        setMinStars(0.5)
        setMaxStars(5)
      },
    },
    {
      label: 'Rebuild',
      apply: () => {
        setConferences(new Set())
        setMinStars(0.5)
        setMaxStars(2)
        setMode('equal')
      },
    },
    {
      label: 'Underdogs',
      apply: () => {
        setConferences(new Set())
        setMinStars(0.5)
        setMaxStars(5)
        setMode('underdog')
      },
    },
  ]

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
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

      <nav className={styles.tabs} role="tablist" aria-label="Pages">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? styles.tabOn : styles.tab}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'picker' && (
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
          presets={presets}
          poolCount={pool.length}
          totalCount={SCHOOLS.length}
          onReset={resetFilters}
          includedTeams={includedTeams}
          toggleTeam={toggleTeam}
          clearTeams={() => setIncludedTeams(new Set())}
        />

        <section className={styles.stage}>
          <div className={styles.modeToggle} role="tablist" aria-label="Picker style">
            <button
              className={picker === 'wheel' ? styles.modeOn : styles.modeOff}
              onClick={() => !spinning && setPicker('wheel')}
              role="tab"
              aria-selected={picker === 'wheel'}
            >
              Wheel
            </button>
            <button
              className={picker === 'reel' ? styles.modeOn : styles.modeOff}
              onClick={() => !spinning && setPicker('reel')}
              role="tab"
              aria-selected={picker === 'reel'}
            >
              Slot reel
            </button>
          </div>

          {slices.length === 0 ? (
            <div className={styles.empty}>
              <h3>No teams match your filters</h3>
              <p>Loosen the star range or conference selection to fill the picker.</p>
            </div>
          ) : picker === 'wheel' ? (
            <Wheel
              slices={slices}
              rotation={rotation}
              spinning={spinning}
              spinDurationMs={SPIN_MS}
              onSpinEnd={onSpinEnd}
            />
          ) : (
            <Reel pool={pool} mode={mode} spinToken={reelToken} onLand={onReelLand} />
          )}

          <button
            className={styles.spinBtn}
            onClick={spin}
            disabled={spinning || slices.length === 0}
          >
            {spinning
              ? 'Spinning…'
              : slices.length === 1
                ? 'Reveal team'
                : `${picker === 'reel' ? 'Spin the reel' : 'Spin the wheel'} · ${pool.length} teams`}
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
      )}

      {tab === 'players' && (
        <PlayerFinder onOpenPlayer={(pid, accent) => setPlayerView({ pid, accent })} />
      )}

      {tab === 'ratings' && (
        <BrowsePanel
          onPick={(s) => {
            setWinner(s)
            setModalOpen(true)
          }}
        />
      )}

      {modalOpen && (
        <ResultModal
          school={winner}
          onClose={() => setModalOpen(false)}
          onRespin={() => {
            setModalOpen(false)
            spin()
          }}
          onOpenPlayer={(pid, accent) => setPlayerView({ pid, accent })}
        />
      )}

      <PlayerModal
        pid={playerView?.pid ?? null}
        accent={playerView?.accent ?? 'var(--accent)'}
        onClose={() => setPlayerView(null)}
      />
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
