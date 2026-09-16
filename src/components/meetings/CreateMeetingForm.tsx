'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { uploadFile, getMediaUrl } from '@/lib/storage'
import { SCOUT_LEVELS, type ScoutLevel, type Profile, type MeetingWithDetails } from '@/types/database'

interface LinkRow {
  id: string
  label: string
  url: string
}

// A media item that is already saved in storage (edit mode)
interface ExistingMedia {
  id: string           // meeting_media row id
  file_path: string
  file_name: string
  file_type: string | null
  previewUrl: string   // built from storage URL
  isExisting: true
}

// A newly selected file (not yet uploaded)
interface NewMedia {
  id: string
  file: File
  previewUrl: string
  uploading: boolean
  isExisting: false
}

type MediaItem = ExistingMedia | NewMedia

interface CreateMeetingFormProps {
  userId: string
  profile: Profile | null
  editMeeting?: MeetingWithDetails | null
}

let linkCounter = 100

function initialLinks(meeting: MeetingWithDetails | null | undefined): LinkRow[] {
  if (meeting?.links?.length) {
    return meeting.links.map((l, i) => ({
      id: `link-existing-${i}`,
      label: l.label ?? '',
      url: l.url,
    }))
  }
  return [{ id: 'link-0', label: '', url: '' }]
}

function initialMedia(meeting: MeetingWithDetails | null | undefined): MediaItem[] {
  if (!meeting?.media?.length) return []
  return meeting.media.map(m => ({
    id: m.id,
    file_path: m.file_path,
    file_name: m.file_name,
    file_type: m.file_type,
    previewUrl: getMediaUrl(m.file_path),
    isExisting: true,
  }))
}

export function CreateMeetingForm({ userId, editMeeting }: CreateMeetingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editMeeting

  // ─── State — seeded from editMeeting when present ──────────────────────

  const [title, setTitle] = useState(editMeeting?.title ?? '')
  const [description, setDescription] = useState(editMeeting?.description ?? '')
  const [meetingType, setMeetingType] = useState<'regular' | 'field-trip'>(
    editMeeting?.meeting_type ?? 'regular'
  )
  const [fieldTripTown, setFieldTripTown] = useState(editMeeting?.field_trip_town ?? '')
  const [selectedLevels, setSelectedLevels] = useState<ScoutLevel[]>(
    editMeeting?.levels ?? []
  )
  const [cost, setCost] = useState(
    editMeeting?.cost != null && editMeeting.cost !== 0
      ? String(editMeeting.cost)
      : ''
  )
  const [supplies, setSupplies] = useState(editMeeting?.supplies ?? '')

  const [links, setLinks] = useState<LinkRow[]>(() => initialLinks(editMeeting))

  const [localBusiness, setLocalBusiness] = useState(editMeeting?.local_business ?? '')
  const [localContact, setLocalContact] = useState(editMeeting?.local_contact ?? '')
  const [localEmail, setLocalEmail] = useState(editMeeting?.local_email ?? '')
  const [localPhone, setLocalPhone] = useState(editMeeting?.local_phone ?? '')
  const [localAddress, setLocalAddress] = useState(editMeeting?.local_address ?? '')
  const [localNotes, setLocalNotes] = useState(editMeeting?.local_notes ?? '')

  const [badgeType, setBadgeType] = useState<'official' | 'funpatch'>(
    editMeeting?.badge_type ?? 'official'
  )
  const [badgePurchaseUrl, setBadgePurchaseUrl] = useState(
    editMeeting?.badge_purchase_url ?? ''
  )

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => initialMedia(editMeeting))

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function toggleLevel(level: ScoutLevel) {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  function addLink() {
    setLinks(prev => [...prev, { id: `link-${++linkCounter}`, label: '', url: '' }])
  }

  function removeLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  function updateLink(id: string, field: 'label' | 'url', value: string) {
    setLinks(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newItems: NewMedia[] = files.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      isExisting: false,
    }))
    setMediaItems(prev => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeMedia(id: string) {
    setMediaItems(prev => {
      const item = prev.find(m => m.id === id)
      if (item && !item.isExisting) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(m => m.id !== id)
    })
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Please enter a meeting title.'); return }
    if (selectedLevels.length === 0) { setError('Please select at least one scout level.'); return }
    if (meetingType === 'field-trip' && !fieldTripTown.trim()) {
      setError('Please enter the field trip town/location.')
      return
    }

    setSubmitting(true)

    try {
      const meetingPayload = {
        title: title.trim(),
        description: description.trim() || null,
        meeting_type: meetingType,
        field_trip_town: meetingType === 'field-trip' ? fieldTripTown.trim() : null,
        levels: selectedLevels,
        cost: parseFloat(cost) || 0,
        supplies: supplies.trim() || null,
        local_business: localBusiness.trim() || null,
        local_contact: localContact.trim() || null,
        local_email: localEmail.trim() || null,
        local_phone: localPhone.trim() || null,
        local_address: localAddress.trim() || null,
        local_notes: localNotes.trim() || null,
        badge_type: badgeType,
        badge_purchase_url: badgePurchaseUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }

      let meetingId: string

      if (isEditing) {
        // ── UPDATE existing meeting ───────────────────────────────────────
        const { error: updateError } = await (supabase.from('meetings') as any)
          .update(meetingPayload)
          .eq('id', editMeeting!.id)

        if (updateError) throw new Error(updateError.message)
        meetingId = editMeeting!.id

        // Replace all links: delete old ones, re-insert
        await supabase.from('meeting_links').delete().eq('meeting_id', meetingId)
        const validLinks = links.filter(l => l.url.trim())
        if (validLinks.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('meeting_links') as any).insert(
            validLinks.map((l, i) => ({
              meeting_id: meetingId,
              label: l.label.trim() || null,
              url: l.url.trim(),
              sort_order: i,
            }))
          )
        }

        // Handle media:
        // - existing items the user kept stay as-is
        // - existing items the user removed need deleting from DB (and optionally storage)
        // - new items need uploading and inserting
        const keptExistingIds = new Set(
          mediaItems.filter(m => m.isExisting).map(m => m.id)
        )
        const originalIds = new Set(editMeeting!.media.map(m => m.id))
        const removedIds = [...originalIds].filter(id => !keptExistingIds.has(id))

        if (removedIds.length) {
          await supabase.from('meeting_media').delete().in('id', removedIds)
        }

      } else {
        // ── INSERT new meeting ────────────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: meeting, error: insertError } = await (supabase.from('meetings') as any)
          .insert({ ...meetingPayload, author_id: userId })
          .select()
          .single()

        if (insertError || !meeting) throw new Error(insertError?.message ?? 'Failed to create meeting')
        meetingId = meeting.id

        // Insert links
        const validLinks = links.filter(l => l.url.trim())
        if (validLinks.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('meeting_links') as any).insert(
            validLinks.map((l, i) => ({
              meeting_id: meetingId,
              label: l.label.trim() || null,
              url: l.url.trim(),
              sort_order: i,
            }))
          )
        }
      }

      // Upload any new files (both create and edit modes)
      const newFiles = mediaItems.filter((m): m is NewMedia => !m.isExisting)
      if (newFiles.length) {
        setMediaItems(prev =>
          prev.map(m => (!m.isExisting ? { ...m, uploading: true } : m))
        )
        const uploadResults = await Promise.allSettled(
          newFiles.map(m => uploadFile(supabase, m.file, meetingId))
        )
        const mediaInserts = uploadResults
          .map((result, i) =>
            result.status === 'fulfilled'
              ? {
                  meeting_id: meetingId,
                  file_path: result.value,
                  file_name: newFiles[i].file.name,
                  file_type: newFiles[i].file.type,
                }
              : null
          )
          .filter(Boolean)

        if (mediaInserts.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('meeting_media') as any).insert(mediaInserts)
        }
      }

      router.push(`/meetings/${meetingId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ── Meeting Title ── */}
      <section>
        <label htmlFor="title" className="label">
          Meeting Title <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Nature Journal Badge Workshop"
          className="input-field"
          required
          maxLength={120}
          aria-required="true"
        />
      </section>

      {/* ── Description ── */}
      <section>
        <label htmlFor="description" className="label">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the meeting — what you did, how it went, tips for other leaders…"
          rows={5}
          className="input-field resize-y"
        />
      </section>

      {/* ── Meeting Type ── */}
      <section>
        <p className="label" id="meeting-type-label">Meeting Type</p>
        <div className="flex gap-3 flex-wrap" role="group" aria-labelledby="meeting-type-label">
          {(['regular', 'field-trip'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setMeetingType(type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                meetingType === type
                  ? 'border-[#2D7A4C] bg-[#e8f5ee] text-[#2D7A4C]'
                  : 'border-[#e5ddd3] bg-white text-[#555] hover:border-[#2D7A4C]'
              }`}
              aria-pressed={meetingType === type}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {type === 'regular' ? '🏠 Regular Meeting' : '🚌 Field Trip'}
            </button>
          ))}
        </div>

        {meetingType === 'field-trip' && (
          <div className="mt-3">
            <label htmlFor="field-trip-town" className="label">
              Field Trip Location (town) <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="field-trip-town"
              type="text"
              value={fieldTripTown}
              onChange={e => setFieldTripTown(e.target.value)}
              placeholder="e.g. Asheville, NC"
              className="input-field"
              required={meetingType === 'field-trip'}
              aria-required={meetingType === 'field-trip'}
            />
          </div>
        )}
      </section>

      {/* ── Scout Levels ── */}
      <section>
        <p className="label" id="levels-label">
          Target Scout Levels <span className="text-red-500" aria-hidden="true">*</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="levels-label">
          {SCOUT_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={`filter-chip ${selectedLevels.includes(level) ? 'active' : ''}`}
              aria-pressed={selectedLevels.includes(level)}
            >
              {level}
            </button>
          ))}
        </div>
        {selectedLevels.length === 0 && (
          <p className="text-xs text-[#aaa] mt-1.5">Select at least one level</p>
        )}
      </section>

      {/* ── Estimated Cost ── */}
      <section>
        <label htmlFor="cost" className="label">Estimated Cost ($)</label>
        <div className="relative max-w-xs">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-[#aaa] text-sm pointer-events-none" aria-hidden="true">$</span>
          <input
            id="cost"
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="0"
            className="input-field pl-7"
          />
        </div>
        <p className="text-xs text-[#aaa] mt-1">Leave at 0 for a free meeting</p>
      </section>

      {/* ── Useful Links ── */}
      <section>
        <p className="label">Useful Links</p>
        <div className="space-y-2.5">
          {links.map((link, index) => (
            <div key={link.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  {index === 0 && (
                    <label className="block text-xs font-semibold text-[#888] mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Title
                    </label>
                  )}
                  <input
                  type="text"
                  value={link.label || ''}
                  onChange={e => updateLink(link.id, 'label', e.target.value)}
                  placeholder="Link name (e.g. Supply list)"
                  className="input-field"
                  aria-label={`Link ${index + 1} label`}
                />
                </div>
                <div>
                  {index === 0 && (
                    <label className="block text-xs font-semibold text-[#888] mb-1" style={{ fontFamily: 'var(--font-body)' }}>
                      Link
                    </label>
                  )}
                  <input
                  type="url"
                  value={link.url || ''}
                  onChange={e => updateLink(link.id, 'url', e.target.value)}
                  placeholder="Paste URL here (https://…)"
                  className="input-field"
                  aria-label={`Link ${index + 1} URL`}
                />
                </div>
              </div>
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="mt-2.5 text-[#ccc] hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label={`Remove link ${index + 1}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2.5 text-sm text-[#2D7A4C] hover:text-[#1f5a37] font-semibold flex items-center gap-1 transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add another link
        </button>
      </section>

      {/* ── Supplies ── */}
      <section>
        <label htmlFor="supplies" className="label">Supplies Needed</label>
        <textarea
          id="supplies"
          value={supplies}
          onChange={e => setSupplies(e.target.value)}
          placeholder="e.g.&#10;- Construction paper&#10;- Scissors&#10;- Glue sticks"
          rows={4}
          className="input-field resize-y"
        />
      </section>

      {/* ── Local Connection ── */}
      <section>
        <h2 className="section-title mb-4">Local Connection</h2>
        <p className="text-sm text-[#888] mb-4 -mt-2">
          If this meeting involves a local business or community partner, share their info so other leaders can reach out.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="local-business" className="label">Business Name</label>
            <input id="local-business" type="text" value={localBusiness} onChange={e => setLocalBusiness(e.target.value)} placeholder="Sunrise Pottery Studio" className="input-field" />
          </div>
          <div>
            <label htmlFor="local-contact" className="label">Contact Person</label>
            <input id="local-contact" type="text" value={localContact} onChange={e => setLocalContact(e.target.value)} placeholder="Jane Smith" className="input-field" />
          </div>
          <div>
            <label htmlFor="local-email" className="label">Email</label>
            <input id="local-email" type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} placeholder="jane@example.com" className="input-field" />
          </div>
          <div>
            <label htmlFor="local-phone" className="label">Phone</label>
            <input id="local-phone" type="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="(555) 555-1234" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="local-address" className="label">Address</label>
            <input id="local-address" type="text" value={localAddress} onChange={e => setLocalAddress(e.target.value)} placeholder="123 Main St, Asheville, NC" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="local-notes" className="label">Notes</label>
            <textarea id="local-notes" value={localNotes} onChange={e => setLocalNotes(e.target.value)} placeholder="Mention you're with Girl Scouts for a 10% discount!" rows={3} className="input-field resize-y" />
          </div>
        </div>
      </section>

      {/* ── Badge Details ── */}
      <section>
        <h2 className="section-title mb-4">Badge Details</h2>
        <div className="mb-4" role="group" aria-label="Badge type">
          <p className="label" id="badge-type-label">Badge Type</p>
          <div className="flex gap-3 flex-wrap">
            {(['official', 'funpatch'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setBadgeType(type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  badgeType === type
                    ? 'border-[#C9A97A] bg-[#f5edd9] text-[#a8854f]'
                    : 'border-[#e5ddd3] bg-white text-[#555] hover:border-[#C9A97A]'
                }`}
                aria-pressed={badgeType === type}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {type === 'official' ? '🏅 Official Badge' : '🎉 Fun Patch'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="badge-url" className="label">Purchase URL</label>
          <input
            id="badge-url"
            type="url"
            value={badgePurchaseUrl}
            onChange={e => setBadgePurchaseUrl(e.target.value)}
            placeholder="https://www.girlscoutshop.com/…"
            className="input-field"
          />
        </div>
      </section>

      {/* ── Photos & Media ── */}
      <section>
        <h2 className="section-title mb-2">Photos &amp; Media</h2>
        <p className="text-sm text-[#888] mb-4">
          Upload images or PDFs — activity sheets, badge art, planning docs, etc.
        </p>

        {/* Drop zone / file picker */}
        <div
          className="border-2 border-dashed border-[#e5ddd3] rounded-2xl p-6 text-center cursor-pointer hover:border-[#2D7A4C] hover:bg-[#e8f5ee]/40 transition-all"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
          role="button"
          tabIndex={0}
          aria-label="Upload photos or PDFs"
        >
          <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm font-semibold text-[#555]" style={{ fontFamily: 'var(--font-body)' }}>
            Click to upload photos or PDFs
          </p>
          <p className="text-xs text-[#aaa] mt-1">JPG, PNG, GIF, WebP, PDF up to 10MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            aria-label="File upload input"
          />
        </div>

        {/* Preview grid — existing + new */}
        {mediaItems.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaItems.map(m => {
              const isImage = m.isExisting
                ? m.file_type?.startsWith('image/')
                : m.file.type.startsWith('image/')
              const name = m.isExisting ? m.file_name : m.file.name

              return (
                <div key={m.id} className="relative group rounded-xl overflow-hidden border border-[#e5ddd3] bg-white">
                  {/* Existing badge */}
                  {m.isExisting && (
                    <span
                      className="absolute top-1.5 left-1.5 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/40 text-white"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      saved
                    </span>
                  )}

                  {isImage ? (
                    <div className="relative h-28">
                      <Image
                        src={m.previewUrl}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized={m.isExisting} // storage URLs don't need next/image optimization
                      />
                    </div>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center gap-1 bg-[#f9f5f0]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-xs text-[#888] px-2 text-center truncate w-full">{name}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMedia(m.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow text-[#888] hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${name}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Error message ── */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pt-2 pb-8">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary px-8 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {isEditing ? 'Saving…' : 'Publishing…'}
            </>
          ) : (
            <>
              {isEditing ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Changes
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Publish Meeting Idea
                </>
              )}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            isEditing
              ? router.push(`/meetings/${editMeeting!.id}`)
              : router.back()
          }
          className="btn-secondary px-6 py-3 text-base"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
