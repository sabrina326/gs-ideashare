'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { getMediaUrl, getCoverPositionCSS } from '@/lib/storage'
import type { MeetingMedia } from '@/types/database'

export function HeroImage({
  image,
  meetingTitle,
  allImages,
}: {
  image: MeetingMedia
  meetingTitle: string
  allImages: MeetingMedia[]
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const heroIndex = allImages.findIndex(img => img.id === image.id)

  const lightboxImages = allImages
    .filter(m => m.file_type?.startsWith('image/'))
    .map(m => ({ url: getMediaUrl(m.file_path), name: m.file_name }))

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-[#e8f5ee] cursor-zoom-in group block"
        aria-label={`View full size: ${meetingTitle}`}
      >
        <Image
          src={getMediaUrl(image.file_path)}
          alt={`Hero image for ${meetingTitle}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          style={{ objectPosition: getCoverPositionCSS(image.cover_position) }}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
        />
        {/* Zoom hint */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-body)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          Click to enlarge
        </span>
      </button>

      {lightboxOpen && (
        <PhotoLightbox
          images={lightboxImages}
          initialIndex={Math.max(0, heroIndex)}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

export function PhotoGrid({
  images,
  meetingTitle,
}: {
  images: MeetingMedia[]
  meetingTitle: string
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const lightboxImages = images.map(m => ({
    url: getMediaUrl(m.file_path),
    name: m.file_name,
  }))

  function openAt(i: number) {
    setLightboxIndex(i)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openAt(i)}
            className="relative h-36 rounded-xl overflow-hidden bg-[#e8f5ee] cursor-zoom-in group"
            aria-label={`View photo ${i + 1}: ${meetingTitle}`}
          >
            <Image
              src={getMediaUrl(img.file_path)}
              alt={`Photo ${i + 1} for ${meetingTitle}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
