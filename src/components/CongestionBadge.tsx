import type { CongestionLevel } from '@shared/types'

const LABELS: Record<CongestionLevel, string> = {
  UNKNOWN: '混雑状況不明',
  EMPTY: '空席あり',
  MODERATE: 'やや混雑',
  FULL: '満席',
}

const COLORS: Record<CongestionLevel, string> = {
  UNKNOWN: '#9ca3af',
  EMPTY: '#16a34a',
  MODERATE: '#d97706',
  FULL: '#dc2626',
}

export function CongestionBadge({ level }: { level: CongestionLevel }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: COLORS[level],
      }}
    >
      {LABELS[level]}
    </span>
  )
}
