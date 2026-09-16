'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import type { CommentWithAuthor } from '@/types/database'

interface CommentsSectionProps {
  meetingId: string
  meetingTitle: string
  meetingAuthorId: string
  initialComments: CommentWithAuthor[]
  currentUserId?: string
  isAdmin?: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function CommentsSection({
  meetingId,
  meetingTitle,
  meetingAuthorId,
  initialComments,
  currentUserId,
  isAdmin = false,
}: CommentsSectionProps) {
  const router = useRouter()
  const supabase = createClient()
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    if (!currentUserId) {
      router.push(`/auth/login?redirectTo=/meetings/${meetingId}`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: comment, error: insertError } = await (supabase.from('comments') as any)
        .insert({
          meeting_id: meetingId,
          author_id: currentUserId,
          text: text.trim(),
        })
        .select()
        .single()

      if (insertError || !comment) throw new Error(insertError?.message ?? 'Failed to post comment')

      const newComment: CommentWithAuthor = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(comment as any),
        author: profile ?? {
          id: currentUserId,
          display_name: 'You',
          avatar_initials: null,
          town: null,
          is_admin: false,
          created_at: new Date().toISOString(),
        },
      }

      setComments(prev => [...prev, newComment])
      setText('')

      // Send in-app notification to the meeting author (skip if commenting on own post)
      if (meetingAuthorId && meetingAuthorId !== currentUserId) {
        const commenterName = (profile as any)?.display_name ?? 'Someone'
        // Fire and forget — don't block the UI if this fails
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(supabase.from('notifications') as any).insert({
          user_id: meetingAuthorId,
          type: 'comment',
          meeting_id: meetingId,
          commenter_name: commenterName,
          meeting_title: meetingTitle,
          is_read: false,
        }).then(() => {})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post comment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (confirmDeleteId !== commentId) {
      setConfirmDeleteId(commentId)
      return
    }
    setDeletingId(commentId)
    try {
      await supabase.from('comments').delete().eq('id', commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <section aria-label="Comments">
      <h2 className="section-title mb-5">
        Comments{' '}
        {comments.length > 0 && (
          <span className="text-base font-normal text-[#aaa]">({comments.length})</span>
        )}
      </h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p
          className="text-sm text-[#aaa] mb-6"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          No comments yet. Be the first to share your experience!
        </p>
      ) : (
        <ul className="space-y-4 mb-6">
          {comments.map(comment => {
            const initials =
              comment.author.avatar_initials ||
              comment.author.display_name.slice(0, 2).toUpperCase()
            const isConfirming = confirmDeleteId === comment.id
            const isDeleting = deletingId === comment.id

            return (
              <li key={comment.id} className="flex gap-3 group/comment">
                <Avatar initials={initials} size="sm" className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span
                      className="text-sm font-semibold text-[#2C2C2C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {comment.author.display_name}
                    </span>
                    <span
                      className="text-xs text-[#aaa]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {timeAgo(comment.created_at)}
                    </span>

                    {/* Report button — always visible */}
                    <a
                      href={`mailto:gsideashare@gmail.com?subject=${encodeURIComponent(`Report: Comment on ${meetingTitle}`)}&body=${encodeURIComponent(`Comment by ${comment.author.display_name}:\n\n"${comment.text}"`)}`}
                      className="ml-auto text-xs text-[#ddd] hover:text-[#aaa] transition-colors flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 focus:opacity-100"
                      style={{ fontFamily: 'var(--font-body)' }}
                      aria-label="Report this comment"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      Report
                    </a>

                    {/* Admin delete button */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={isDeleting}
                          aria-label={isConfirming ? 'Confirm delete comment' : 'Delete comment (admin)'}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            isConfirming
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-red-200 text-red-500 hover:border-red-500 hover:bg-red-50'
                          }`}
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {isDeleting ? 'Deleting…' : isConfirming ? 'Confirm' : 'Delete'}
                        </button>
                        {isConfirming && !isDeleting && (
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-[#aaa] hover:text-[#555] underline"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <p
                    className="text-sm text-[#444] leading-relaxed break-words"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {comment.text}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="comment-input" className="label">
          {currentUserId ? 'Add a comment' : 'Sign in to comment'}
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            id="comment-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              currentUserId
                ? 'Share how the meeting went, tips, or variations…'
                : 'Sign in to leave a comment'
            }
            disabled={!currentUserId || submitting}
            rows={3}
            className="input-field flex-1 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            maxLength={1000}
            aria-required="true"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          {currentUserId ? (
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={submitting}
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          ) : (
            <a href={`/auth/login?redirectTo=/meetings/${meetingId}`} className="btn-secondary text-sm px-5 py-2">
              Sign in to comment
            </a>
          )}

          {text.length > 0 && (
            <span className="text-xs text-[#aaa]">{text.length}/1000</span>
          )}
        </div>
      </form>
    </section>
  )
}
