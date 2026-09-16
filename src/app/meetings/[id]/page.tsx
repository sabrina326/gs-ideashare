import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchMeetingById } from '@/lib/queries'
import { MeetingDetail } from '@/components/meetings/MeetingDetail'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const meeting = await fetchMeetingById(supabase, id)
  if (!meeting) return { title: 'Meeting Not Found — GS IdeaShare' }
  return {
    title: `${meeting.title} — GS IdeaShare`,
    description: meeting.description ?? undefined,
  }
}

export default async function MeetingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const meeting = await fetchMeetingById(supabase, id, user?.id)

  if (!meeting) notFound()

  // Check if the current user is an admin
  let isAdmin = false
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = (profile as { is_admin: boolean } | null)?.is_admin ?? false
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <MeetingDetail meeting={meeting} currentUserId={user?.id} isAdmin={isAdmin} />
    </div>
  )
}
