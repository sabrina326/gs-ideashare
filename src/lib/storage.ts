import { createClient } from '@supabase/supabase-js'

const BUCKET = 'meeting-media'

/**
 * Returns the public URL for a file stored in the meeting-media bucket.
 * Constructs the URL directly — no Supabase client needed.
 */
export function getMediaUrl(filePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${url}/storage/v1/object/public/${BUCKET}/${filePath}`
}

/**
 * Convert a cover_position value (legacy text or percentage) to CSS object-position.
 */
export function getCoverPositionCSS(position?: string): string {
  if (!position) return 'center'
  if (position === 'top') return 'center 0%'
  if (position === 'center') return 'center 50%'
  if (position === 'bottom') return 'center 100%'
  if (position.endsWith('%')) return `center ${position}`
  return 'center'
}

/**
 * Returns the cover image's public URL and position, or the first image, or null.
 */
export function getThumbnailUrl(
  media: Array<{ file_path: string; file_type: string | null; is_cover?: boolean; cover_position?: string }>
): { url: string; position: string } | null {
  const images = media.filter(m => m.file_type?.startsWith('image/'))
  const image = images.find(m => m.is_cover) ?? images[0]
  return image
    ? { url: getMediaUrl(image.file_path), position: getCoverPositionCSS(image.cover_position) }
    : null
}

/**
 * Upload a file to the meeting-media bucket.
 * Returns the storage path on success.
 */
export async function uploadFile(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  file: File,
  meetingId: string
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${meetingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)
  return path
}

/**
 * Delete a file from the meeting-media bucket by path.
 */
export async function deleteFile(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath])
  if (error) throw new Error(error.message)
}
