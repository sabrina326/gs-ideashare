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
  const thumbData = getThumbnailUrl(meeting.media)
  const thumbnail = thumbData?.url ?? null
  const thumbPosition = thumbData?.position ?? 'center'
  const isFieldTrip = meeting.meeting_type === 'field-trip'
  const authorInitials =
    meeting.author.avatar_initials ||
    meeting.author.display_name.slice(0, 2).toUpperCase()

  const totalCost = meeting.cost ?? 0
  const numGirls = meeting.num_girls ?? 0
  const costPerGirl = numGirls > 0 ? totalCost / numGirls : 0
  const costLabel =
    totalCost === 0
      ? 'Free'
      : numGirls > 0
        ? `$${costPerGirl.toFixed(2)}/girl`
        : `$${totalCost.toFixed(totalCost % 1 === 0 ? 0 : 2)}`

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
              style={{ objectPosition: thumbPosition }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <ThumbnailPlaceholder title={meeting.title} isServiceProject={meeting.is_service_project} isFieldTrip={isFieldTrip} />
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

          {/* Service Project badge overlay */}
          {meeting.is_service_project && (
            <span
              className={`absolute ${isFieldTrip ? 'top-10' : 'top-2.5'} left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white`}
              style={{ background: '#D4637A', fontFamily: 'var(--font-body)' }}
            >
              🫶 Service Project
            </span>
          )}

          {/* Cost badge */}
          <span
            className="absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(250,246,241,0.95)',
              color: totalCost === 0 ? '#2D7A4C' : '#2C2C2C',
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

// Color palettes that rotate based on title hash
const PALETTES = [
  { from: '#2D7A4C', via: '#3d9960', to: '#1a5c36' },   // Forest greens
  { from: '#2D7A4C', via: '#5aaa6e', to: '#C9A97A' },   // Green to tan
  { from: '#3d6b5e', via: '#5a9c7a', to: '#2D7A4C' },   // Sage to forest
  { from: '#4a7c59', via: '#C9A97A', to: '#8b6f47' },    // Woodland
  { from: '#2D7A4C', via: '#6db585', to: '#1f5a37' },    // Mint forest
  { from: '#5a7247', via: '#8aad6e', to: '#C9A97A' },    // Meadow
]

// Camp-themed icons (SVG paths)
const ICONS = [
  // Pine tree
  `<path d="M32 8 L20 28 h6 L18 40 h28 L38 28 h6 Z" fill="white" opacity="0.15"/><rect x="29" y="40" width="6" height="8" rx="1" fill="white" opacity="0.12"/>`,
  // Campfire
  `<path d="M24 44 h16 M28 44 Q26 32 32 24 Q38 32 36 44" fill="none" stroke="white" stroke-width="2" opacity="0.2"/><path d="M30 44 Q30 36 32 28 Q34 36 34 44" fill="white" opacity="0.12"/>`,
  // Trefoil/clover
  `<circle cx="32" cy="24" r="8" fill="white" opacity="0.12"/><circle cx="24" cy="34" r="8" fill="white" opacity="0.12"/><circle cx="40" cy="34" r="8" fill="white" opacity="0.12"/>`,
  // Star
  `<path d="M32 12 L36 26 h14 L38 34 L42 48 L32 38 L22 48 L26 34 L14 26 h14 Z" fill="white" opacity="0.12"/>`,
  // Heart
  `<path d="M32 44 C20 36 12 26 12 20 a10 10 0 0 1 20-2 a10 10 0 0 1 20 2 c0 6-8 16-20 24z" fill="white" opacity="0.12"/>`,
  // Compass
  `<circle cx="32" cy="32" r="18" fill="none" stroke="white" stroke-width="1.5" opacity="0.15"/><circle cx="32" cy="32" r="2" fill="white" opacity="0.2"/><path d="M32 14 L34 30 L32 32 L30 30Z M32 50 L30 34 L32 32 L34 34Z" fill="white" opacity="0.15"/>`,
]

// Simple hash from string to pick palette/icon deterministically
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Auto-generated cover shown when there's no uploaded photo */
function ThumbnailPlaceholder({ title, isServiceProject, isFieldTrip }: { title: string; isServiceProject?: boolean; isFieldTrip?: boolean }) {
  const hash = hashStr(title)
  const palette = PALETTES[hash % PALETTES.length]
  const icon = ICONS[hash % ICONS.length]
  
  // Pick an emoji for the type
  const typeEmoji = isServiceProject ? '🫶' : isFieldTrip ? '🚌' : '🏕️'

  return (
    <div
      className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`,
      }}
      aria-hidden="true"
    >
      {/* Background icon */}
      <svg
        className="absolute opacity-100"
        width="120"
        height="120"
        style={{ right: '-10px', bottom: '-10px' }}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: icon }}
      />

      {/* Decorative dots */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="15" r="1.5" fill="white" opacity="0.3" />
        <circle cx="160" cy="12" r="1" fill="white" opacity="0.25" />
        <circle cx="140" cy="25" r="1.5" fill="white" opacity="0.2" />
        <circle cx="45" cy="80" r="1" fill="white" opacity="0.2" />
        <circle cx="170" cy="75" r="1.5" fill="white" opacity="0.15" />
      </svg>

      {/* Type emoji */}
      <span className="text-3xl mb-1.5 relative z-10 drop-shadow-sm">{typeEmoji}</span>

      {/* Meeting title */}
      <p
        className="relative z-10 text-sm font-semibold text-white text-center leading-tight px-5 line-clamp-2 drop-shadow-sm"
        style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      >
        {title}
      </p>
    </div>
  )
}
