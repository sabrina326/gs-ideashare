import Image from 'next/image'
import Link from 'next/link'
import { HeroImage, PhotoGrid } from './PhotoGallery'
import { LevelBadgeList } from '@/components/ui/LevelBadge'
import { Avatar } from '@/components/ui/Avatar'
import { getMediaUrl } from '@/lib/storage'
import { MeetingActions } from './MeetingActions'
import { CommentsSection } from './CommentsSection'
import type { MeetingWithDetails } from '@/types/database'

interface MeetingDetailProps {
  meeting: MeetingWithDetails
  currentUserId?: string
  isAdmin?: boolean
}

export function MeetingDetail({ meeting, currentUserId, isAdmin = false }: MeetingDetailProps) {
  const isFieldTrip = meeting.meeting_type === 'field-trip'
  const authorInitials =
    meeting.author.avatar_initials ||
    meeting.author.display_name.slice(0, 2).toUpperCase()

  const images = meeting.media.filter(m => m.file_type?.startsWith('image/'))
  const pdfs = meeting.media.filter(m => m.file_type === 'application/pdf')
  const heroImage = images.find(m => m.is_cover) ?? images[0]

  const totalCost = meeting.cost ?? 0
  const supplyCost = meeting.supply_cost ?? 0
  const guestCost = meeting.guest_cost ?? 0
  const numGirls = meeting.num_girls ?? 0
  const costPerGirl = numGirls > 0 ? totalCost / numGirls : 0
  const costLabel =
    totalCost === 0
      ? 'Free'
      : numGirls > 0
        ? `$${costPerGirl.toFixed(2)}/girl`
        : `$${totalCost.toFixed(totalCost % 1 === 0 ? 0 : 2)}`

  return (
    <article>
      {/* Back link + Edit button row */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#2D7A4C] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All meeting ideas
        </Link>

        {/* Edit — visible to author or admin */}
        {(currentUserId === meeting.author_id || isAdmin) && (
          <Link
            href={`/create?edit=${meeting.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-[#2D7A4C] text-[#2D7A4C] text-sm font-semibold hover:bg-[#e8f5ee] transition-all"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </Link>
        )}
      </div>

      {/* Hero image */}
      {heroImage ? (
        <div className="relative mb-6">
          <HeroImage image={heroImage} meetingTitle={meeting.title} allImages={images} />
          {isFieldTrip && (
            <span
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white z-10"
              style={{ background: '#2D7A4C', fontFamily: 'var(--font-body)' }}
            >
              🚌 Field Trip
            </span>
          )}
        </div>
      ) : (
        <div
          className="w-full h-48 md:h-64 rounded-2xl flex flex-col items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #2D7A4C 0%, #3d9960 50%, #1a5c36 100%)' }}
          aria-hidden="true"
        >
          <span className="text-5xl mb-2">{meeting.is_service_project ? '🫶' : isFieldTrip ? '🚌' : '🏕️'}</span>
          <p className="text-lg font-semibold text-white/90 text-center px-8" style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            {meeting.title}
          </p>
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <LevelBadgeList levels={meeting.levels} max={6} className="mb-3" />

        <h1
          className="text-3xl md:text-4xl font-semibold text-[#2C2C2C] leading-tight mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {meeting.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#888]">
          {/* Author */}
          <div className="flex items-center gap-1.5">
            <Avatar initials={authorInitials} size="xs" />
            <span style={{ fontFamily: 'var(--font-body)' }}>{meeting.author.display_name}</span>
            {meeting.author.town && (
              <span className="text-[#ccc]">· {meeting.author.town}</span>
            )}
          </div>

          {/* Meeting type */}
          <span className="flex items-center gap-1">
            {isFieldTrip ? '🚌' : '🏠'}
            {isFieldTrip
              ? `Field Trip${meeting.field_trip_town ? ` — ${meeting.field_trip_town}` : ''}`
              : 'Regular Meeting'}
          </span>

          {/* Service Project tag */}
          {meeting.is_service_project && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#D4637A', fontFamily: 'var(--font-body)' }}>
              🫶 Service Project
            </span>
          )}

          {/* Cost */}
          <span className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {costLabel}
          </span>

          {/* Date */}
          <span>
            {new Date(meeting.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-[#e5ddd3] mb-6" />

      {/* ── Interactive actions (upvote / favorite / complete) ── */}
      <MeetingActions
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        initialUpvoteCount={meeting.upvote_count}
        initialUpvoted={meeting.user_has_upvoted ?? false}
        initialFavorited={meeting.user_has_favorited ?? false}
        initialCompleted={meeting.user_has_completed ?? false}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      <hr className="border-[#e5ddd3] my-6" />

      {/* ── Description ── */}
      {meeting.description && (
        <section className="mb-8">
          <h2 className="section-title mb-3">About this meeting idea</h2>
          <p
            className="text-[#444] leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Linkify text={meeting.description} />
          </p>
        </section>
      )}

      {/* ── Cost Breakdown ── */}
      {totalCost > 0 && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Cost Breakdown</h2>
          <div className="rounded-xl px-4 py-3 space-y-1.5 text-sm" style={{ background: '#f5edd9', fontFamily: 'var(--font-body)' }}>
            {supplyCost > 0 && (
              <div className="flex justify-between">
                <span className="text-[#666]">Supply cost</span>
                <span className="font-semibold text-[#2C2C2C]">${supplyCost.toFixed(2)}</span>
              </div>
            )}
            {guestCost > 0 && (
              <div className="flex justify-between">
                <span className="text-[#666]">Guest speaker</span>
                <span className="font-semibold text-[#2C2C2C]">${guestCost.toFixed(2)}</span>
              </div>
            )}
            {(supplyCost > 0 && guestCost > 0) && (
              <div className="flex justify-between border-t border-[#e5ddd3] pt-1.5">
                <span className="text-[#666]">Total</span>
                <span className="font-semibold text-[#2C2C2C]">${totalCost.toFixed(2)}</span>
              </div>
            )}
            {numGirls > 0 && (
              <div className="flex justify-between border-t border-[#e5ddd3] pt-1.5">
                <span className="text-[#2D7A4C] font-semibold">Cost per girl ({numGirls} girls)</span>
                <span className="font-bold text-[#2D7A4C]">${costPerGirl.toFixed(2)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Supplies ── */}
      {meeting.supplies && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Supplies Needed</h2>
          <div
            className="rounded-2xl p-4 text-sm text-[#444] leading-relaxed whitespace-pre-wrap"
            style={{ background: '#f5edd9', fontFamily: 'var(--font-body)' }}
          >
            {meeting.supplies}
          </div>
        </section>
      )}

      {/* ── Useful Links ── */}
      {meeting.links.length > 0 && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Useful Links</h2>
          <ul className="space-y-2">
            {meeting.links.map(link => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#2D7A4C] hover:text-[#1f5a37] underline underline-offset-2 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  {link.label || link.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Badge Details ── */}
      {(meeting.badge_type || meeting.badge_purchase_url) && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Badge Details</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: '#f5edd9',
                color: '#a8854f',
                fontFamily: 'var(--font-body)',
              }}
            >
              {meeting.badge_type === 'official' ? '🏅 Official Badge' : '🎉 Fun Patch'}
            </span>
            {meeting.badge_purchase_url && (
              <a
                href={meeting.badge_purchase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-bark text-sm px-4 py-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Buy Badge
              </a>
            )}
          </div>
        </section>
      )}

      {/* ── Local Connection ── */}
      {meeting.local_business && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Local Connection</h2>
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: '#e8f5ee', fontFamily: 'var(--font-body)' }}
          >
            <p className="font-semibold text-[#2C2C2C] text-base"><Linkify text={meeting.local_business} /></p>
            {meeting.local_contact && (
              <InfoRow icon="person" label="Contact" value={meeting.local_contact} />
            )}
            {meeting.local_email && (
              <InfoRow
                icon="email"
                label="Email"
                value={meeting.local_email}
                href={`mailto:${meeting.local_email}`}
              />
            )}
            {meeting.local_phone && (
              <InfoRow
                icon="phone"
                label="Phone"
                value={meeting.local_phone}
                href={`tel:${meeting.local_phone.replace(/\D/g, '')}`}
              />
            )}
            {meeting.local_address && (
              <InfoRow icon="map" label="Address" value={meeting.local_address} />
            )}
            {meeting.local_notes && (
              <div className="pt-2 border-t border-[#c8e6d4]">
                <p className="text-sm text-[#555] whitespace-pre-wrap"><Linkify text={meeting.local_notes} /></p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Photo Gallery ── */}
      {images.length > 1 && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Photos</h2>
          <PhotoGrid images={images} meetingTitle={meeting.title} />
        </section>
      )}

      {/* ── PDFs ── */}
      {pdfs.length > 0 && (
        <section className="mb-8">
          <h2 className="section-title mb-3">Documents</h2>
          <ul className="space-y-2">
            {pdfs.map(pdf => (
              <li key={pdf.id}>
                <a
                  href={getMediaUrl(pdf.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e5ddd3] bg-white text-sm font-semibold text-[#2C2C2C] hover:border-[#2D7A4C] hover:text-[#2D7A4C] transition-all"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {pdf.file_name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <hr className="border-[#e5ddd3] mb-8" />

      {/* ── Comments ── */}
      <CommentsSection
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        meetingAuthorId={meeting.author_id}
        initialComments={meeting.comments ?? []}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </article>
  )
}

// ─── Small helper sub-component ──────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: 'person' | 'email' | 'phone' | 'map'
  label: string
  value: string
  href?: string
}) {
  const icons = {
    person: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    email: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    phone: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.62 4.38 2 2 0 0 1 3.62 2.18L6.93 2a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    map: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  }

  const content = (
    <span className="flex items-center gap-1.5 text-sm text-[#444]">
      <span className="text-[#2D7A4C]">{icons[icon]}</span>
      <span className="text-[#888] mr-1">{label}:</span>
      <span>{value}</span>
    </span>
  )

  if (href) {
    return (
      <div>
        <a
          href={href}
          className="hover:text-[#2D7A4C] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {content}
        </a>
      </div>
    )
  }

  return <div>{content}</div>
}

/** Auto-linkify URLs in text */
function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const parts = text.split(urlRegex)
  
  if (parts.length === 1) return <>{text}</>
  
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D7A4C] hover:text-[#1f5a37] underline underline-offset-2 transition-colors"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
