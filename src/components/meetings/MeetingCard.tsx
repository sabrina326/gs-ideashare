import Link from 'next/link'
import Image from 'next/image'
import { LevelBadgeList } from '@/components/ui/LevelBadge'
import { Avatar } from '@/components/ui/Avatar'
import { getThumbnailUrl } from '@/lib/storage'
import { ReportButton } from './ReportButton'
import type { MeetingWithDetails } from '@/types/database'

interface MeetingCardProps {
  meeting: MeetingWithDetails
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const thumbnail = getThumbnailUrl(meeting.media)
  const isFieldTrip = meeting.meeting_type === 'field-trip'
  const authorInitials =
    meeting.author.avatar_initials ||
    meeting.author.display_name.slice(0, 2).toUpperCase()

  const costLabel =
    meeting.cost === 0
      ? 'Free'
      : `$${Number(meeting.cost).toFixed(meeting.cost % 1 === 0 ? 0 : 2)}`

  return (
    <div className="card group transition-all duration-200 relative">
      <Link
        href={`/meetings/${meeting.id}`}
        className="block focus-visible:outline-2 focus-visible:outline-[#2D7A4C] focus-visible:outline-offset-2 focus-visible:rounded-2xl"
        aria-label={`View meeting idea: ${meeting.title}`}
      >
        {/* Thumbnail */}
        <div className="relative h-44 bg-[#e8f5ee] overflow-hidden rounded-t-2xl">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={`Photo for ${meeting.title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <ThumbnailPlaceholder />
          )}

          {/* Field trip badge overlay */}
          {isFieldTrip && (
            <span
              className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: '#2D7A4C', fontFamily: 'var(--font-body)' }}
            >
              🚌 Field Trip
            </span>
          )}

          {/* Cost badge */}
          <span
            className="absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(250,246,241,0.95)',
              color: meeting.cost === 0 ? '#2D7A4C' : '#2C2C2C',
              fontFamily: 'var(--font-body)',
              border: '1px solid #e5ddd3',
            }}
          >
            {costLabel}
          </span>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Scout levels */}
          <LevelBadgeList levels={meeting.levels} max={3} className="mb-2" />

          {/* Title */}
          <h3
            className="text-base font-semibold text-[#2C2C2C] leading-snug mb-1 line-clamp-2 group-hover:text-[#2D7A4C] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {meeting.title}
          </h3>

          {/* Field trip town */}
          {isFieldTrip && meeting.field_trip_town && (
            <p className="text-xs text-[#888] mb-1 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {meeting.field_trip_town}
            </p>
          )}

          {/* Description preview */}
          {meeting.description && (
            <p className="text-sm text-[#666] line-clamp-2 mb-3">
              {meeting.description}
            </p>
          )}

          {/* Footer: author + upvotes */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#f0e8da]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar initials={authorInitials} size="xs" />
              <span className="text-xs text-[#888] truncate" style={{ fontFamily: 'var(--font-body)' }}>
                {meeting.author.display_name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-[#888] shrink-0">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span>{meeting.upvote_count}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Report button — sits outside the Link to avoid nested interactive elements */}
      <ReportButton
        subject={`Report: ${meeting.title}`}
        className="absolute bottom-3.5 right-12"
      />
    </div>
  )
}

/** Gradient placeholder shown when there's no uploaded photo */
function ThumbnailPlaceholder() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #2D7A4C 0%, #3d9960 40%, #C9A97A 100%)',
      }}
      aria-hidden="true"
    >
      {/* Campground / tent icon */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky stars */}
        <circle cx="14" cy="12" r="1.5" fill="white" opacity="0.7" />
        <circle cx="50" cy="9"  r="1.5" fill="white" opacity="0.7" />
        <circle cx="44" cy="17" r="1"   fill="white" opacity="0.5" />
        <circle cx="20" cy="20" r="1"   fill="white" opacity="0.5" />

        {/* Moon */}
        <path
          d="M54 14 a6 6 0 1 1-6 6 4.5 4.5 0 0 0 6-6z"
          fill="white"
          opacity="0.8"
        />

        {/* Ground */}
        <rect x="4" y="46" width="56" height="3" rx="1.5" fill="white" opacity="0.25" />

        {/* Main tent */}
        <path
          d="M32 10 L8 46 h48 Z"
          fill="white"
          opacity="0.18"
        />
        <path
          d="M32 10 L8 46 h48 Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />

        {/* Tent door */}
        <path
          d="M32 28 L24 46 h16 Z"
          fill="#C9A97A"
          opacity="0.85"
        />

        {/* Tent pole line */}
        <line x1="32" y1="10" x2="32" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

        {/* Campfire */}
        <ellipse cx="32" cy="52" rx="5" ry="1.5" fill="white" opacity="0.2" />
        <path d="M30 51 Q32 46 34 51" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M31 51 Q32 48 33 51" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      <span
        className="text-xs font-semibold tracking-wide"
        style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}
      >
        No photo yet
      </span>
    </div>
  )
}
