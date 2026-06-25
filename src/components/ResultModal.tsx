import type { School, Player } from '../data/schools'
import { readableText } from '../utils/wheel'
import styles from './ResultModal.module.css'

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
  if (!school) return null
  const txt = readableText(school.primaryColor)

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
            <RosterCol title="Top offense" players={school.topOffense} />
            <RosterCol title="Top defense" players={school.topDefense} />
          </div>

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
    </div>
  )
}

function RosterCol({ title, players }: { title: string; players: Player[] }) {
  return (
    <div className={styles.roster}>
      <span className={styles.rosterTitle}>{title}</span>
      <ul className={styles.rosterList}>
        {players.map((p) => (
          <li key={`${p.name}-${p.pos}`} className={styles.player}>
            <span className={styles.playerPos}>{p.pos}</span>
            <span className={styles.playerName}>{p.name}</span>
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
