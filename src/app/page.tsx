import { Suspense } from 'react'
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
      </section>

      {/* Feed with client-side filtering */}
      <Suspense fallback={<MeetingCardGridSkeleton count={6} />}>
        <FeedClient initialMeetings={initialMeetings} userId={user?.id} />
      </Suspense>
    </div>
  )
}
