import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchMeetingById } from '@/lib/queries'
import { CreateMeetingForm } from '@/components/meetings/CreateMeetingForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Share a Meeting Idea — GS IdeaShare',
}

interface Props {
  searchParams: Promise<{ edit?: string }>
}

export default async function CreatePage({ searchParams }: Props) {
  const { edit: editId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const redirectTo = editId ? `/create?edit=${editId}` : '/create'
    redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Edit mode — fetch the existing meeting and verify ownership (or admin)
  let editMeeting = null
  if (editId) {
    const meeting = await fetchMeetingById(supabase, editId)

    if (!meeting) redirect('/')

    const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin ?? false
    const isAuthor = meeting.author_id === user.id

    // Only the author or an admin may edit
    if (!isAuthor && !isAdmin) redirect(`/meetings/${editId}`)

    editMeeting = meeting
  }

  const isEditing = !!editMeeting

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1
        className="text-3xl font-semibold mb-1 text-[#2C2C2C]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {isEditing ? 'Edit Meeting Idea' : 'Share a Meeting Idea'}
      </h1>
      <p className="text-sm text-[#888] mb-8" style={{ fontFamily: 'var(--font-body)' }}>
        {isEditing
          ? 'Update the details below and save your changes.'
          : 'Help fellow troop leaders by sharing what worked for your troop 🍪'}
      </p>
      <CreateMeetingForm
        userId={user.id}
        profile={profile}
        editMeeting={editMeeting}
      />
    </div>
  )
}
