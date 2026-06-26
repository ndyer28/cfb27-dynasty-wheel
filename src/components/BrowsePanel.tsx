import { useMemo, useState } from 'react'
import { SCHOOLS, CONFERENCES, type School } from '../data/schools'
import { rebuildDifficulty } from '../utils/rebuild'
import styles from './BrowsePanel.module.css'

interface BrowsePanelProps {
  onPick: (school: School) => void
}

export function BrowsePanel({ onPick }: BrowsePanelProps) {
  const [conf, setConf] = useState<string | null>(null)

  const byConf = useMemo(() => {
    const map = new Map<string, School[]>()
    for (const c of CONFERENCES) map.set(c, [])
    for (const s of SCHOOLS) map.get(s.conference)!.push(s)
    for (const list of map.values()) list.sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    return map
  }, [])

  return (
    <section className={styles.panel}>
      <div className={styles.head}>
        <h2>Browse every team</h2>
        <p>{conf ? `${byConf.get(conf)!.length} teams` : 'Pick a conference, then a team to see its card.'}</p>
      </div>

      {conf === null ? (
        <div className={styles.confGrid}>
          {CONFERENCES.map((c) => (
            <button key={c} className={styles.confCard} onClick={() => setConf(c)}>
              <span className={styles.confName}>{c}</span>
              <span className={styles.confCount}>{byConf.get(c)!.length} teams ›</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button className={styles.back} onClick={() => setConf(null)}>
            ‹ All conferences
          </button>
          <div className={styles.confTitle}>{conf}</div>
          <div className={styles.teamGrid}>
            {byConf.get(conf)!.map((s) => {
              const r = rebuildDifficulty(s)
              return (
                <button key={s.name} className={styles.teamCard} onClick={() => onPick(s)}>
                  <span className={styles.swatch} style={{ background: s.primaryColor, borderColor: s.secondaryColor }} />
                  <span className={styles.teamInfo}>
                    <span className={styles.teamName}>{s.name}</span>
                    <span className={styles.teamSub}>
                      {s.stars}★ · <span style={{ color: r.color }}>{r.label}</span>
                    </span>
                  </span>
                  <span className={styles.teamOvr}>{s.ovr}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
