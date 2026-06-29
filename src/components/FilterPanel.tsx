import { useMemo, useState } from 'react'
import { CONFERENCES, SCHOOLS } from '../data/schools'
import type { WeightMode } from '../utils/wheel'
import styles from './FilterPanel.module.css'

export interface Preset {
  label: string
  apply: () => void
}

interface FilterPanelProps {
  conferences: Set<string>
  toggleConference: (c: string) => void
  minStars: number
  maxStars: number
  setStarRange: (min: number, max: number) => void
  mode: WeightMode
  setMode: (m: WeightMode) => void
  presets: Preset[]
  poolCount: number
  totalCount: number
  onReset: () => void
  includedTeams: Set<string>
  toggleTeam: (name: string) => void
  clearTeams: () => void
}

const ALL_TEAMS = SCHOOLS.map((s) => s.name).sort()

const STAR_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
const MODE_LABELS: Record<WeightMode, string> = {
  equal: 'Equal odds',
  prestige: 'Favor blue bloods',
  underdog: 'Favor underdogs',
}

export function FilterPanel(props: FilterPanelProps) {
  const {
    conferences,
    toggleConference,
    minStars,
    maxStars,
    setStarRange,
    mode,
    setMode,
    presets,
    poolCount,
    totalCount,
    onReset,
    includedTeams,
    toggleTeam,
    clearTeams,
  } = props

  const [teamsOpen, setTeamsOpen] = useState(false)
  const [teamQuery, setTeamQuery] = useState('')
  const teamList = useMemo(() => {
    const q = teamQuery.trim().toLowerCase()
    return q ? ALL_TEAMS.filter((n) => n.toLowerCase().includes(q)) : ALL_TEAMS
  }, [teamQuery])

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <h2>Build your wheel</h2>
        <span className={styles.count}>
          {poolCount} / {totalCount} teams
        </span>
      </div>

      <section className={styles.section}>
        <label className={styles.label}>Quick presets</label>
        <div className={styles.presets}>
          {presets.map((p) => (
            <button key={p.label} className={styles.preset} onClick={p.apply}>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.confHead}>
          <label className={styles.label}>Specific teams</label>
          <button className={styles.teamsToggle} onClick={() => setTeamsOpen((o) => !o)}>
            {includedTeams.size > 0 ? `${includedTeams.size} selected` : teamsOpen ? 'Hide' : 'Choose'}
          </button>
        </div>
        {includedTeams.size > 0 && (
          <p className={styles.hint}>
            Using only your {includedTeams.size} picked team{includedTeams.size === 1 ? '' : 's'} —
            filters below are ignored.{' '}
            <button className={styles.clearLink} onClick={clearTeams}>
              clear
            </button>
          </p>
        )}
        {teamsOpen && (
          <>
            <input
              className={styles.search}
              type="text"
              placeholder="Find a team…"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
            />
            <div className={styles.teamList}>
              {teamList.map((n) => {
                const on = includedTeams.has(n)
                return (
                  <button
                    key={n}
                    className={`${styles.teamItem} ${on ? styles.teamItemOn : ''}`}
                    onClick={() => toggleTeam(n)}
                  >
                    <span className={styles.teamCheck}>{on ? '✓' : ''}</span>
                    {n}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className={styles.section}>
        <label className={styles.label}>
          Star rating: {minStars.toFixed(1)} – {maxStars.toFixed(1)} ★
        </label>
        <div className={styles.starRow}>
          <select
            className={styles.starSelect}
            value={minStars}
            onChange={(e) => setStarRange(Math.min(+e.target.value, maxStars), maxStars)}
          >
            {STAR_VALUES.map((v) => (
              <option key={v} value={v}>
                min {v.toFixed(1)}
              </option>
            ))}
          </select>
          <select
            className={styles.starSelect}
            value={maxStars}
            onChange={(e) => setStarRange(minStars, Math.max(+e.target.value, minStars))}
          >
            {STAR_VALUES.map((v) => (
              <option key={v} value={v}>
                max {v.toFixed(1)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.section}>
        <label className={styles.label}>Odds weighting</label>
        <div className={styles.modeRow}>
          {(Object.keys(MODE_LABELS) as WeightMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.mode} ${mode === m ? styles.modeActive : ''}`}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.confHead}>
          <label className={styles.label}>Conferences</label>
          <span className={styles.hint}>{conferences.size === 0 ? 'all' : `${conferences.size} selected`}</span>
        </div>
        <div className={styles.confGrid}>
          {CONFERENCES.map((c) => {
            const active = conferences.has(c)
            return (
              <button
                key={c}
                className={`${styles.conf} ${active ? styles.confActive : ''}`}
                onClick={() => toggleConference(c)}
              >
                {c}
              </button>
            )
          })}
        </div>
      </section>

      <button className={styles.reset} onClick={onReset}>
        Reset all filters
      </button>
    </aside>
  )
}
