import { useEffect, useState } from 'react'
import type { School, Player } from '../data/schools'
import { readableText } from '../utils/wheel'
import { rebuildDifficulty } from '../utils/rebuild'
import { PlayerModal } from './PlayerModal'
import styles from './ResultModal.module.css'

const POSITION_GROUPS: { label: string; pos: string[] }[] = [
  { label: 'Quarterbacks', pos: ['QB'] },
  { label: 'Running Backs', pos: ['HB', 'FB'] },
  { label: 'Wide Receivers', pos: ['WR'] },
  { label: 'Tight Ends', pos: ['TE'] },
  { label: 'Offensive Line', pos: ['LT', 'LG', 'C', 'RG', 'RT'] },
  { label: 'Defensive Line', pos: ['LE', 'RE', 'DT'] },
  { label: 'Linebackers', pos: ['MLB', 'LOLB', 'ROLB'] },
  { label: 'Secondary', pos: ['CB', 'FS', 'SS'] },
  { label: 'Special Teams', pos: ['K', 'P', 'LS'] },
]

interface ResultModalProps {
  school: School | null
  onClose: () => void
  onRespin: () => void
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <span className={styles.stars} aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <span key={i} className={styles.starFull}>★</span>
        if (i === full && half) return <span key={i} className={styles.starHalf}>★</span>
        return <span key={i} className={styles.starEmpty}>★</span>
      })}
    </span>
  )
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.rating}>
      <div className={styles.ratingBar}>
        <div className={styles.ratingFill} style={{ width: `${value}%` }} />
      </div>
      <div className={styles.ratingMeta}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export function ResultModal({ school, onClose, onRespin }: ResultModalProps) {
  const [showFull, setShowFull] = useState(false)
  const [playerPid, setPlayerPid] = useState<number | null>(null)
  useEffect(() => {
    setShowFull(false)
    setPlayerPid(null)
  }, [school])
  if (!school) return null
  const txt = readableText(school.primaryColor)
  const openPlayer = (pid?: number) => pid != null && setPlayerPid(pid)

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div
          className={styles.banner}
          style={{
            background: `linear-gradient(135deg, ${school.primaryColor} 0%, ${school.primaryColor} 55%, ${school.secondaryColor} 160%)`,
            color: txt,
          }}
        >
          <div className={styles.bannerTag}>Your dynasty team</div>
          <h2 className={styles.bannerName}>{school.name}</h2>
          <div className={styles.bannerMascot}>{school.mascot}</div>
          <Stars value={school.stars} />
        </div>

        <div className={styles.body}>
          {showFull ? (
            <FullRoster school={school} onBack={() => setShowFull(false)} onPlayer={openPlayer} />
          ) : (
            <>
              <div className={styles.ovrRow}>
                <div className={styles.ovrBig}>
                  <span>{school.ovr}</span>
                  <small>OVR</small>
                </div>
                <div className={styles.ratings}>
                  <Rating label="Offense" value={school.offOvr} />
                  <Rating label="Defense" value={school.defOvr} />
                </div>
              </div>

              <RebuildMeter school={school} />

              <div className={styles.facts}>
                <Fact k="Conference" v={school.conference} />
                <Fact k="State" v={school.state} />
                <Fact k="Stadium" v={school.stadium} />
                <Fact k="Mascot" v={school.mascot} />
              </div>

              <div className={styles.rivals}>
                <span className={styles.rivalLabel}>Rivals</span>
                <div className={styles.rivalChips}>
                  {school.rivals.map((r) => (
                    <span key={r} className={styles.rivalChip}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.rosters}>
                <RosterCol title="Top offense" players={school.topOffense} onPlayer={openPlayer} />
                <RosterCol title="Top defense" players={school.topDefense} onPlayer={openPlayer} />
              </div>

              {school.topSpeed.length > 0 && (
                <div className={styles.roster}>
                  <span className={styles.rosterTitle}>Fastest players</span>
                  <ul className={styles.rosterList}>
                    {school.topSpeed.map((p) => (
                      <li
                        key={`${p.name}-${p.pos}`}
                        className={`${styles.player} ${styles.clickable}`}
                        onClick={() => openPlayer(p.pid)}
                      >
                        <span className={styles.playerPos}>{p.pos}</span>
                        <span className={styles.playerName}>{p.name}</span>
                        <span className={styles.playerYr}>{p.yr}</span>
                        <span className={styles.playerSpd}>
                          {p.spd} <small>SPD</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {school.roster.length > 0 && (
                <button className={styles.fullToggle} onClick={() => setShowFull(true)}>
                  View full roster ratings · {school.roster.length} players ›
                </button>
              )}
            </>
          )}

          <div className={styles.actions}>
            <button className={styles.respin} onClick={onRespin}>
              Spin again
            </button>
            <button className={styles.lock} onClick={onClose}>
              Lock it in
            </button>
          </div>
        </div>
      </div>

      <PlayerModal pid={playerPid} accent={school.primaryColor} onClose={() => setPlayerPid(null)} />
    </div>
  )
}

function RebuildMeter({ school }: { school: School }) {
  const r = rebuildDifficulty(school)
  return (
    <div className={styles.rebuild}>
      <div className={styles.rebuildHead}>
        <span className={styles.rebuildLabel}>Rebuild difficulty</span>
        <span className={styles.rebuildTier} style={{ color: r.color }}>
          {r.label}
        </span>
      </div>
      <div className={styles.pips}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={styles.pip}
            style={{ background: i < r.level ? r.color : 'var(--bg-alt)' }}
          />
        ))}
      </div>
      <div className={styles.rebuildMeta}>
        <span>2-yr outlook {school.outlook}% returning</span>
        <span>·</span>
        <span>{school.ovr} OVR</span>
        <span>·</span>
        <span>{school.stars}★</span>
      </div>
    </div>
  )
}

function FullRoster({
  school,
  onBack,
  onPlayer,
}: {
  school: School
  onBack: () => void
  onPlayer: (pid?: number) => void
}) {
  return (
    <div className={styles.full}>
      <div className={styles.fullHead}>
        <button className={styles.backBtn} onClick={onBack}>
          ‹ Summary
        </button>
        <span className={styles.fullTitle}>{school.name} — full roster</span>
      </div>
      <div className={styles.fullScroll}>
        {POSITION_GROUPS.map((g) => {
          const players = school.roster.filter((p) => g.pos.includes(p.pos))
          if (players.length === 0) return null
          return (
            <div key={g.label} className={styles.group}>
              <div className={styles.groupHead}>
                <span>{g.label}</span>
                <span className={styles.groupCount}>{players.length}</span>
              </div>
              <ul className={styles.rosterList}>
                {players.map((p) => (
                  <li
                    key={`${p.name}-${p.num}`}
                    className={`${styles.player} ${styles.clickable}`}
                    onClick={() => onPlayer(p.pid)}
                  >
                    <span className={styles.playerNum}>#{p.num}</span>
                    <span className={styles.playerPos}>{p.pos}</span>
                    <span className={styles.playerName}>{p.name}</span>
                    <span className={styles.playerYr}>{p.yr}</span>
                    <span className={styles.playerOvr}>{p.ovr}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RosterCol({
  title,
  players,
  onPlayer,
}: {
  title: string
  players: Player[]
  onPlayer: (pid?: number) => void
}) {
  return (
    <div className={styles.roster}>
      <span className={styles.rosterTitle}>{title}</span>
      <ul className={styles.rosterList}>
        {players.map((p) => (
          <li
            key={`${p.name}-${p.pos}`}
            className={`${styles.player} ${styles.clickable}`}
            onClick={() => onPlayer(p.pid)}
          >
            <span className={styles.playerPos}>{p.pos}</span>
            <span className={styles.playerName}>{p.name}</span>
            <span className={styles.playerYr}>{p.yr}</span>
            <span className={styles.playerOvr}>{p.ovr}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.fact}>
      <span className={styles.factK}>{k}</span>
      <span className={styles.factV}>{v}</span>
    </div>
  )
}
