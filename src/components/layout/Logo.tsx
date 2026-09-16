import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 26, text: 'text-2xl' },
    lg: { icon: 36, text: 'text-4xl' },
  }
  const { icon, text } = sizes[size]

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 no-underline ${className}`}
      aria-label="GS IdeaShare home"
    >
      {/* Campground tent icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Tent body */}
        <path
          d="M16 4L3 24h26L16 4z"
          fill="#2D7A4C"
          opacity="0.15"
        />
        <path
          d="M16 4L3 24h26L16 4z"
          stroke="#2D7A4C"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Tent door */}
        <path
          d="M16 14l-4 10h8l-4-10z"
          fill="#C9A97A"
          stroke="#C9A97A"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Ground line */}
        <line
          x1="2"
          y1="24"
          x2="30"
          y2="24"
          stroke="#2D7A4C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Stars */}
        <circle cx="6" cy="8" r="1" fill="#C9A97A" />
        <circle cx="26" cy="10" r="1" fill="#C9A97A" />
        <circle cx="22" cy="5" r="0.75" fill="#C9A97A" />
      </svg>

      <span
        className={`${text} leading-none select-none`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span style={{ color: '#2C2C2C' }}>GS </span>
        <span style={{ color: '#2D7A4C' }}>Idea</span>
        <span style={{ color: '#2C2C2C' }}>Share</span>
      </span>
    </Link>
  )
}
