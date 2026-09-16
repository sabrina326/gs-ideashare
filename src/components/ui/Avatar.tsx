interface AvatarProps {
  initials: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
}

export function Avatar({ initials, size = 'sm', className = '' }: AvatarProps) {
  return (
    <span
      className={`avatar ${sizeMap[size]} ${className}`}
      aria-label={`Avatar for ${initials}`}
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  )
}
