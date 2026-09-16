import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <span className="text-6xl mb-4 block" aria-hidden="true">🏕️</span>
      <h1
        className="text-3xl font-semibold mb-3 text-[#2C2C2C]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Meeting not found
      </h1>
      <p className="text-[#888] mb-6">
        This plan may have been removed or the link is incorrect.
      </p>
      <Link href="/" className="btn-primary">
        Back to all plans
      </Link>
    </div>
  )
}
