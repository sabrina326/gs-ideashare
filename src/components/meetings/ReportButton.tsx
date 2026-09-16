'use client'

interface ReportButtonProps {
  subject: string
  className?: string
}

/**
 * A small flag/report button that opens a pre-filled mailto link.
 * Stops click propagation so it doesn't trigger parent Link navigation.
 */
export function ReportButton({ subject, className = '' }: ReportButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    window.location.href = `mailto:gsideashare@gmail.com?subject=${encodeURIComponent(subject)}`
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Report: ${subject}`}
      title="Report this content"
      className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[#ccc] hover:text-[#888] ${className}`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </button>
  )
}
