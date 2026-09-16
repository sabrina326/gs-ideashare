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
 * Returns the cover image's public URL, or the first image, or null.
 */
export function getThumbnailUrl(
  media: Array<{ file_path: string; file_type: string | null; is_cover?: boolean }>
): string | null {
  const images = media.filter(m => m.file_type?.startsWith('image/'))
  const image = images.find(m => m.is_cover) ?? images[0]
  return image ? getMediaUrl(image.file_path) : null
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
