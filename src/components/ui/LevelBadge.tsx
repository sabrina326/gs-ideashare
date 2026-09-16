import { type ScoutLevel, LEVEL_COLORS } from '@/types/database'

interface LevelBadgeProps {
  level: ScoutLevel
  className?: string
}

export function LevelBadge({ level, className = '' }: LevelBadgeProps) {
  return (
    <span className={`level-badge ${LEVEL_COLORS[level]} ${className}`}>
      {level}
    </span>
  )
}

interface LevelBadgeListProps {
  levels: ScoutLevel[]
  max?: number
  className?: string
}

export function LevelBadgeList({ levels, max = 3, className = '' }: LevelBadgeListProps) {
  const visible = levels.slice(0, max)
  const rest = levels.length - visible.length

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visible.map(level => (
        <LevelBadge key={level} level={level} />
      ))}
      {rest > 0 && (
        <span className="level-badge bg-gray-100 text-gray-600">
          +{rest}
        </span>
      )}
    </div>
  )
}
