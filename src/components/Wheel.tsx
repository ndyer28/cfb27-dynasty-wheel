import { useMemo } from 'react'
import type { Slice } from '../utils/wheel'
import { wedgePath, polar, readableText } from '../utils/wheel'
import styles from './Wheel.module.css'

interface WheelProps {
  slices: Slice[]
  rotation: number
  spinning: boolean
  spinDurationMs: number
  onSpinEnd: () => void
}

const SIZE = 520
const CX = SIZE / 2
const CY = SIZE / 2
const R = SIZE / 2 - 8

export function Wheel({ slices, rotation, spinning, spinDurationMs, onSpinEnd }: WheelProps) {
  // Only render slice labels when slices are wide enough to read.
  const labeled = useMemo(() => {
    return slices.map((slice) => {
      const sweep = slice.endAngle - slice.startAngle
      const showLabel = sweep >= 3.2
      const labelRadius = R * 0.66
      const pos = polar(CX, CY, labelRadius, slice.midAngle)
      return { ...slice, showLabel, pos, sweep }
    })
  }, [slices])

  return (
    <div className={styles.wheelWrap}>
      <div className={styles.pointer} aria-hidden />
      <svg
        className={styles.wheel}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${spinDurationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
        }}
        onTransitionEnd={() => spinning && onSpinEnd()}
      >
        <circle cx={CX} cy={CY} r={R + 6} className={styles.rim} />
        {labeled.map((slice) => {
          const txt = readableText(slice.school.primaryColor)
          return (
            <g key={slice.school.name}>
              <path
                d={wedgePath(CX, CY, R, slice.startAngle, slice.endAngle)}
                fill={slice.school.primaryColor}
                stroke={slice.school.secondaryColor}
                strokeWidth={slice.sweep >= 6 ? 1.5 : 0.5}
              />
              {slice.showLabel && (
                <text
                  x={slice.pos.x}
                  y={slice.pos.y}
                  fill={txt}
                  fontSize={slice.sweep >= 9 ? 13 : 10}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${slice.midAngle}, ${slice.pos.x}, ${slice.pos.y})`}
                >
                  {slice.school.abbr}
                </text>
              )}
            </g>
          )
        })}
        <circle cx={CX} cy={CY} r={34} className={styles.hub} />
        <circle cx={CX} cy={CY} r={34} className={styles.hubRing} />
        <text x={CX} y={CY} className={styles.hubText} textAnchor="middle" dominantBaseline="middle">
          CFB
        </text>
      </svg>
    </div>
  )
}
