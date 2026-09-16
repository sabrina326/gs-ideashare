import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MeetingWithDetails, ScoutLevel } from '@/types/database'

type DB = SupabaseClient<Database>

export interface FeedFilters {
  search?: string
  levels?: ScoutLevel[]
  meetingType?: 'all' | 'regular' | 'field-trip'
  sort?: 'newest' | 'popular'
}

/**
 * Fetch meetings with author, media, links, and upvote counts.
 * Optionally filter by search query, scout levels, and meeting type.
 */
export async function fetchMeetings(
  supabase: DB,
  filters: FeedFilters = {},
  currentUserId?: string
): Promise<MeetingWithDetails[]> {
  const { search, levels, meetingType, sort = 'newest' } = filters

  let query = supabase
    .from('meetings')
    .select(`
      *,
      author:profiles!author_id(*),
      media:meeting_media(*),
      links:meeting_links(*)
    `)

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (levels && levels.length > 0) {
    query = query.overlaps('levels', levels)
  }

  if (meetingType && meetingType !== 'all') {
    query = query.eq('meeting_type', meetingType)
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  if (!data) return []

  // Fetch upvote counts for all returned meetings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meetingIds = (data as any[]).map((m: { id: string }) => m.id)
  const upvoteCounts = await fetchUpvoteCounts(supabase, meetingIds)

  // Fetch per-user state if logged in
  let userUpvotes = new Set<string>()
  let userFavorites = new Set<string>()
  let userCompleted = new Set<string>()

  if (currentUserId) {
    const [uvRes, favRes, compRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('upvotes') as any).select('meeting_id').eq('user_id', currentUserId).in('meeting_id', meetingIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('favorites') as any).select('meeting_id').eq('user_id', currentUserId).in('meeting_id', meetingIds),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('completed') as any).select('meeting_id').eq('user_id', currentUserId).in('meeting_id', meetingIds),
    ])
    userUpvotes = new Set((uvRes.data ?? []).map((r: { meeting_id: string }) => r.meeting_id))
    userFavorites = new Set((favRes.data ?? []).map((r: { meeting_id: string }) => r.meeting_id))
    userCompleted = new Set((compRes.data ?? []).map((r: { meeting_id: string }) => r.meeting_id))
  }

  const meetings = (data as MeetingWithDetails[]).map(m => ({
    ...m,
    upvote_count: upvoteCounts[m.id] ?? 0,
    user_has_upvoted: userUpvotes.has(m.id),
    user_has_favorited: userFavorites.has(m.id),
    user_has_completed: userCompleted.has(m.id),
  }))

  // Client-side sort by popularity (upvotes) if requested
  if (sort === 'popular') {
    meetings.sort((a, b) => b.upvote_count - a.upvote_count)
  }

  return meetings
}

/**
 * Fetch a single meeting by ID with all details including comments.
 */
export async function fetchMeetingById(
  supabase: DB,
  id: string,
  currentUserId?: string
): Promise<MeetingWithDetails | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      author:profiles!author_id(*),
      media:meeting_media(*),
      links:meeting_links(*),
      comments(
        *,
        author:profiles!author_id(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const upvoteCounts = await fetchUpvoteCounts(supabase, [id])

  let user_has_upvoted = false
  let user_has_favorited = false
  let user_has_completed = false

  if (currentUserId) {
    const [uvRes, favRes, compRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('upvotes') as any).select('meeting_id').eq('user_id', currentUserId).eq('meeting_id', id).maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('favorites') as any).select('meeting_id').eq('user_id', currentUserId).eq('meeting_id', id).maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('completed') as any).select('meeting_id').eq('user_id', currentUserId).eq('meeting_id', id).maybeSingle(),
    ])
    user_has_upvoted = !!uvRes.data
    user_has_favorited = !!favRes.data
    user_has_completed = !!compRes.data
  }

  return {
    ...(data as MeetingWithDetails),
    upvote_count: upvoteCounts[id] ?? 0,
    user_has_upvoted,
    user_has_favorited,
    user_has_completed,
  }
}

/**
 * Fetch upvote counts for a list of meeting IDs.
 * Returns a map of { meetingId: count }.
 */
async function fetchUpvoteCounts(
  supabase: DB,
  meetingIds: string[]
): Promise<Record<string, number>> {
  if (meetingIds.length === 0) return {}

  const { data } = await supabase
    .from('upvotes')
    .select('meeting_id')
    .in('meeting_id', meetingIds)

  const counts: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    counts[row.meeting_id] = (counts[row.meeting_id] ?? 0) + 1
  }
  return counts
}

/**
 * Fetch meetings the user has created.
 */
export async function fetchUserMeetings(
  supabase: DB,
  userId: string
): Promise<MeetingWithDetails[]> {
  return fetchMeetings(
    supabase,
    { sort: 'newest' },
    userId
  ).then(ms => ms.filter(m => m.author_id === userId))
}

/**
 * Fetch meetings the user has favorited.
 */
export async function fetchUserFavorites(
  supabase: DB,
  userId: string
): Promise<MeetingWithDetails[]> {
  const { data: favRows } = await supabase
    .from('favorites')
    .select('meeting_id')
    .eq('user_id', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = (favRows as any[] ?? []).map((r: { meeting_id: string }) => r.meeting_id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('meetings')
    .select(`
      *,
      author:profiles!author_id(*),
      media:meeting_media(*),
      links:meeting_links(*)
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (!data) return []
  const counts = await fetchUpvoteCounts(supabase, ids)

  return (data as MeetingWithDetails[]).map(m => ({
    ...m,
    upvote_count: counts[m.id] ?? 0,
    user_has_favorited: true,
  }))
}

/**
 * Fetch meetings the user has marked as completed.
 */
export async function fetchUserCompleted(
  supabase: DB,
  userId: string
): Promise<MeetingWithDetails[]> {
  const { data: compRows } = await supabase
    .from('completed')
    .select('meeting_id')
    .eq('user_id', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = (compRows as any[] ?? []).map((r: { meeting_id: string }) => r.meeting_id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('meetings')
    .select(`
      *,
      author:profiles!author_id(*),
      media:meeting_media(*),
      links:meeting_links(*)
    `)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (!data) return []
  const counts = await fetchUpvoteCounts(supabase, ids)

  return (data as MeetingWithDetails[]).map(m => ({
    ...m,
    upvote_count: counts[m.id] ?? 0,
    user_has_completed: true,
  }))
}
