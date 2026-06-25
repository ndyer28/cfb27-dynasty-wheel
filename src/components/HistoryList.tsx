import type { School } from '../data/schools'
import styles from './HistoryList.module.css'

export interface HistoryEntry {
  school: School
  at: number
}

interface HistoryListProps {
  entries: HistoryEntry[]
  onPick: (school: School) => void
  onClear: () => void
}

export function HistoryList({ entries, onPick, onClear }: HistoryListProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <h2>Spin history</h2>
        {entries.length > 0 && (
          <button className={styles.clear} onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>No spins yet. Give the wheel a whirl to pick your dynasty team.</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((e, i) => (
            <li key={e.at}>
              <button className={styles.item} onClick={() => onPick(e.school)}>
                <span className={styles.swatch} style={{ background: e.school.primaryColor, borderColor: e.school.secondaryColor }} />
                <span className={styles.name}>{e.school.name}</span>
                <span className={styles.ovr}>{e.school.ovr}</span>
                <span className={styles.idx}>#{entries.length - i}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
