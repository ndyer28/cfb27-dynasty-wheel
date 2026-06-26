import { useEffect, useState } from 'react'
import { ATTR_GROUPS, attrColor, formatHeight, type PlayerDetail } from '../data/playerTypes'
import styles from './PlayerModal.module.css'

interface PlayerModalProps {
  pid: number | null
  accent: string
  onClose: () => void
}

// Lazy-load the heavy details file (served as a static asset) once, on first
// player click — keeps it out of the JS bundle and out of tsc's type graph.
let cache: Record<string, PlayerDetail> | null = null
async function loadDetails(): Promise<Record<string, PlayerDetail>> {
  if (!cache) {
    const res = await fetch(`${import.meta.env.BASE_URL}playerDetails.json`)
    cache = (await res.json()) as Record<string, PlayerDetail>
  }
  return cache
}

export function PlayerModal({ pid, accent, onClose }: PlayerModalProps) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pid == null) {
      setDetail(null)
      return
    }
    let active = true
    setLoading(true)
    loadDetails().then((all) => {
      if (!active) return
      setDetail(all[String(pid)] ?? null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [pid])

  if (pid == null) return null

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading || !detail ? (
          <div className={styles.loading}>{loading ? 'Loading ratings…' : 'Player not found.'}</div>
        ) : (
          <>
            <div className={styles.head} style={{ background: accent }}>
              <div className={styles.ovrBadge}>
                <span>{detail.ovr}</span>
                <small>OVR</small>
              </div>
              <div className={styles.headInfo}>
                <div className={styles.posTag}>
                  {detail.pos} · {detail.posLabel}
                </div>
                <h2 className={styles.name}>{detail.name}</h2>
                <div className={styles.bio}>
                  {detail.team} · #{detail.num} · {detail.yr}
                  {detail.ht ? ` · ${formatHeight(detail.ht)}` : ''}
                  {detail.wt ? `, ${detail.wt} lbs` : ''}
                  {detail.home ? ` · ${detail.home}` : ''}
                </div>
              </div>
            </div>

            <div className={styles.body}>
              {ATTR_GROUPS.map((g) => {
                const rows = g.attrs.filter(([k]) => detail.attrs[k] != null)
                if (rows.length === 0) return null
                return (
                  <div key={g.title} className={styles.group}>
                    <h3 className={styles.groupTitle}>{g.title}</h3>
                    {rows.map(([k, label]) => {
                      const v = detail.attrs[k]
                      return (
                        <div key={k} className={styles.attr}>
                          <span className={styles.attrLabel}>{label}</span>
                          <div className={styles.attrBarWrap}>
                            <div
                              className={styles.attrBar}
                              style={{ width: `${v}%`, background: attrColor(v) }}
                            />
                          </div>
                          <span className={styles.attrVal}>{v}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
