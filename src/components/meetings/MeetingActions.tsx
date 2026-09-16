'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MeetingActionsProps {
  meetingId: string
  meetingTitle: string
  initialUpvoteCount: number
  initialUpvoted: boolean
  initialFavorited: boolean
  initialCompleted: boolean
  currentUserId?: string
  isAdmin?: boolean
}

export function MeetingActions({
  meetingId,
  meetingTitle,
  initialUpvoteCount,
  initialUpvoted,
  initialFavorited,
  initialCompleted,
  currentUserId,
  isAdmin = false,
}: MeetingActionsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [upvoteCount, setUpvoteCount] = useState(initialUpvoteCount)
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState<'upvote' | 'favorite' | 'completed' | 'delete' | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  function requireAuth() {
    router.push(`/auth/login?redirectTo=/meetings/${meetingId}`)
  }

  async function toggleUpvote() {
    if (!currentUserId) { requireAuth(); return }
    if (loading) return

    const next = !upvoted
    setUpvoted(next)
    setUpvoteCount(c => c + (next ? 1 : -1))
    setLoading('upvote')

    try {
      if (next) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('upvotes') as any).insert({ user_id: currentUserId, meeting_id: meetingId })
      } else {
        await supabase.from('upvotes').delete()
          .eq('user_id', currentUserId).eq('meeting_id', meetingId)
      }
    } catch {
      setUpvoted(!next)
      setUpvoteCount(c => c + (next ? -1 : 1))
    } finally {
      setLoading(null)
    }
  }

  async function toggleFavorite() {
    if (!currentUserId) { requireAuth(); return }
    if (loading) return

    const next = !favorited
    setFavorited(next)
    setLoading('favorite')

    try {
      if (next) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('favorites') as any).insert({ user_id: currentUserId, meeting_id: meetingId })
      } else {
        await supabase.from('favorites').delete()
          .eq('user_id', currentUserId).eq('meeting_id', meetingId)
      }
    } catch {
      setFavorited(!next)
    } finally {
      setLoading(null)
    }
  }

  async function toggleCompleted() {
    if (!currentUserId) { requireAuth(); return }
    if (loading) return

    const next = !completed
    setCompleted(next)
    setLoading('completed')

    try {
      if (next) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('completed') as any).insert({ user_id: currentUserId, meeting_id: meetingId })
      } else {
        await supabase.from('completed').delete()
          .eq('user_id', currentUserId).eq('meeting_id', meetingId)
      }
    } catch {
      setCompleted(!next)
    } finally {
      setLoading(null)
    }
  }

  async function handleDeleteMeeting() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setLoading('delete')
    try {
      await supabase.from('meetings').delete().eq('id', meetingId)
      router.push('/')
      router.refresh()
    } catch {
      setLoading(null)
      setDeleteConfirm(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Meeting actions">

      {/* Upvote */}
      <button
        onClick={toggleUpvote}
        disabled={loading === 'upvote'}
        aria-pressed={upvoted}
        aria-label={`${upvoted ? 'Remove upvote' : 'Upvote this meeting idea'} (${upvoteCount})`}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
          upvoted
            ? 'border-[#2D7A4C] bg-[#2D7A4C] text-white'
            : 'border-[#e5ddd3] bg-white text-[#555] hover:border-[#2D7A4C] hover:text-[#2D7A4C]'
        }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={upvoted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={loading === 'upvote' ? 'opacity-50' : ''}
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span>{upvoteCount}</span>
        <span className="hidden sm:inline">{upvoted ? 'Upvoted' : 'Upvote'}</span>
      </button>

      {/* Favorite */}
      <button
        onClick={toggleFavorite}
        disabled={loading === 'favorite'}
        aria-pressed={favorited}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
          favorited
            ? 'border-rose-400 bg-rose-50 text-rose-500'
            : 'border-[#e5ddd3] bg-white text-[#555] hover:border-rose-400 hover:text-rose-400'
        }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={favorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={loading === 'favorite' ? 'opacity-50' : ''}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="hidden sm:inline">{favorited ? 'Saved' : 'Save'}</span>
        <span className="sm:hidden">❤️</span>
      </button>

      {/* Completed */}
      <button
        onClick={toggleCompleted}
        disabled={loading === 'completed'}
        aria-pressed={completed}
        aria-label={completed ? 'Mark as not completed' : 'Mark as completed'}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
          completed
            ? 'border-[#C9A97A] bg-[#f5edd9] text-[#a8854f]'
            : 'border-[#e5ddd3] bg-white text-[#555] hover:border-[#C9A97A] hover:text-[#a8854f]'
        }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={loading === 'completed' ? 'opacity-50' : ''}
        >
          {completed ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>
          )}
        </svg>
        <span className="hidden sm:inline">{completed ? 'Done!' : 'Mark done'}</span>
        <span className="sm:hidden">✅</span>
      </button>

      {/* ── Admin: Delete meeting ── */}
      {isAdmin && (
        <button
          onClick={handleDeleteMeeting}
          disabled={loading === 'delete'}
          aria-label={deleteConfirm ? 'Confirm delete this meeting' : 'Delete this meeting (admin)'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all ${
            deleteConfirm
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-red-300 bg-white text-red-600 hover:border-red-600 hover:bg-red-50'
          }`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          {loading === 'delete'
            ? 'Deleting…'
            : deleteConfirm
              ? 'Confirm Delete'
              : 'Delete'}
        </button>
      )}
      {deleteConfirm && !loading && (
        <button
          onClick={() => setDeleteConfirm(false)}
          className="text-xs text-[#aaa] hover:text-[#555] underline self-center"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Cancel
        </button>
      )}

      {/* Login nudge for logged-out users */}
      {!currentUserId && (
        <p
          className="w-full text-xs text-[#aaa] mt-1"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <a href="/auth/login" className="underline hover:text-[#2D7A4C]">Sign in</a> to upvote, save, or mark as done.
        </p>
      )}

      {/* Report link — visible to all */}
      <a
        href={`mailto:gsideashare@gmail.com?subject=${encodeURIComponent(`Report: ${meetingTitle}`)}`}
        className="flex items-center gap-1.5 text-xs text-[#bbb] hover:text-[#888] transition-colors ml-auto self-center"
        style={{ fontFamily: 'var(--font-body)' }}
        aria-label={`Report meeting: ${meetingTitle}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Report
      </a>
    </div>
  )
}
