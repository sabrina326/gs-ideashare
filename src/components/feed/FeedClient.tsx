'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchMeetings, type FeedFilters } from '@/lib/queries'
import { MeetingCard } from '@/components/meetings/MeetingCard'
import { MeetingCardGridSkeleton } from '@/components/meetings/MeetingCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { SCOUT_LEVELS, type ScoutLevel, type MeetingWithDetails } from '@/types/database'
import Link from 'next/link'

interface FeedClientProps {
  initialMeetings: MeetingWithDetails[]
  userId?: string
}

const MEETING_TYPE_OPTIONS = [
  { value: 'all', label: 'All Ideas' },
  { value: 'regular', label: '🏠 Regular Meetings' },
  { value: 'field-trip', label: '🚌 Field Trips' },
] as const

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most upvoted' },
] as const

export function FeedClient({ initialMeetings, userId }: FeedClientProps) {
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>(initialMeetings)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<ScoutLevel[]>([])
  const [meetingType, setMeetingType] = useState<FeedFilters['meetingType']>('all')
  const [sort, setSort] = useState<FeedFilters['sort']>('newest')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const loadMeetings = useCallback(
    (filters: FeedFilters) => {
      startTransition(async () => {
        try {
          const results = await fetchMeetings(supabase, filters, userId)
          setMeetings(results)
        } catch {
          // Keep existing results on error
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  )

  // Re-fetch whenever any filter changes
  useEffect(() => {
    loadMeetings({
      search: debouncedSearch || undefined,
      levels: selectedLevels.length ? selectedLevels : undefined,
      meetingType,
      sort,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedLevels, meetingType, sort])

  function toggleLevel(level: ScoutLevel) {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  function clearFilters() {
    setSearch('')
    setSelectedLevels([])
    setMeetingType('all')
    setSort('newest')
  }

  const hasActiveFilters =
    debouncedSearch || selectedLevels.length > 0 || meetingType !== 'all' || sort !== 'newest'

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-5 max-w-xl">
        <label htmlFor="meeting-search" className="sr-only">Search meeting ideas</label>
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          id="meeting-search"
          type="search"
          placeholder="Search by title or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 pr-4"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-[#aaa] hover:text-[#555]"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Meeting type */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by meeting type">
          {MEETING_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMeetingType(opt.value as FeedFilters['meetingType'])}
              className={`filter-chip ${meetingType === opt.value ? 'active' : ''}`}
              aria-pressed={meetingType === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Scout levels */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by scout level">
          {SCOUT_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`filter-chip ${selectedLevels.includes(level) ? 'active' : ''}`}
              aria-pressed={selectedLevels.includes(level)}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Sort + clear row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-[#888]" style={{ fontFamily: 'var(--font-body)' }}>
              Sort:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={e => setSort(e.target.value as FeedFilters['sort'])}
              className="input-field py-1.5 px-3 text-sm w-auto"
              style={{ width: 'auto' }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#888] hover:text-[#2D7A4C] underline transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Clear filters
              </button>
            )}

            <p className="text-sm text-[#aaa]" style={{ fontFamily: 'var(--font-body)' }} aria-live="polite">
              {isPending ? 'Loading…' : `${meetings.length} meeting idea${meetings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isPending ? (
        <MeetingCardGridSkeleton count={6} />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No meeting ideas found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to share a meeting idea!'
          }
          action={
            !hasActiveFilters ? (
              <Link href="/create" className="btn-primary mt-2">
                Share a Meeting Idea
              </Link>
            ) : (
              <button onClick={clearFilters} className="btn-secondary mt-2">
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  )
}
