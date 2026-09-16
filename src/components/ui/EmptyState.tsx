interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '🌲', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3
        className="text-xl font-semibold mb-2 text-[#2C2C2C]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#888] max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
