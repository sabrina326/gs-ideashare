import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserMeetings,
  fetchUserFavorites,
  fetchUserCompleted,
} from '@/lib/queries'
import { ProfileDashboard } from '@/components/profile/ProfileDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Dashboard — GS IdeaShare',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all three tabs in parallel
  const [myMeetings, favorites, completed] = await Promise.all([
    fetchUserMeetings(supabase, user.id),
    fetchUserFavorites(supabase, user.id),
    fetchUserCompleted(supabase, user.id),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProfileDashboard
        profile={profile}
        myMeetings={myMeetings}
        favorites={favorites}
        completed={completed}
        userId={user.id}
      />
    </div>
  )
}
