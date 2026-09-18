import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchMeetings } from '@/lib/queries'
import { FeedClient } from '@/components/feed/FeedClient'
import { MeetingCardGridSkeleton } from '@/components/meetings/MeetingCardSkeleton'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch initial meetings server-side for fast first paint
  const initialMeetings = await fetchMeetings(supabase, { sort: 'newest' }, user?.id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1
          className="text-4xl md:text-5xl font-semibold mb-3 text-[#2C2C2C]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span style={{ color: '#2C2C2C' }}>GS </span>
          <span style={{ color: '#2D7A4C' }}>Idea</span>
          <span style={{ color: '#2C2C2C' }}>Share</span>
          <br />
          <span className="text-3xl md:text-4xl">
            Meeting ideas,{' '}
            <span style={{ color: '#2D7A4C' }}>shared by leaders</span>
            <br />
            for leaders 🌲
          </span>
        </h1>
        <p
          className="text-base text-[#666] max-w-xl mx-auto"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Browse, filter, and save Girl Scout meeting ideas from troop leaders
          across your area. Free to use, free to share.
        </p>

        {/* Join CTA — only show to visitors who aren't signed in */}
        {!user && (
          <div
            className="mt-6 max-w-lg mx-auto rounded-2xl px-6 py-4"
            style={{ background: '#e8f5ee', fontFamily: 'var(--font-body)' }}
          >
            <p className="text-sm text-[#2C2C2C] mb-3">
              <span className="font-semibold">Join for free</span> to share your own meeting ideas, leave comments, save your favorites, and get notified when leaders respond to your posts! 🏕️
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/auth/signup" className="btn-primary text-sm px-5 py-2">
                Join Free — It Takes 30 Seconds
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Feed with client-side filtering */}
      <Suspense fallback={<MeetingCardGridSkeleton count={6} />}>
        <FeedClient initialMeetings={initialMeetings} userId={user?.id} />
      </Suspense>
    </div>
  )
}
