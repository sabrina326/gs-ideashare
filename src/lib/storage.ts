import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const BUCKET = 'meeting-media'

// Lightweight client just for building public storage URLs
const _storageClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Returns the public URL for a file stored in the meeting-media bucket.
 * Uses the Supabase SDK's getPublicUrl() so encoding is handled correctly.
 */
export function getMediaUrl(filePath: string): string {
  const { data } = _storageClient.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Returns the first image media item's public URL, or null if none.
 */
export function getThumbnailUrl(
  media: Array<{ file_path: string; file_type: string | null }>
): string | null {
  const image = media.find(m => m.file_type?.startsWith('image/'))
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
