import { createClient } from '@supabase/supabase-js'

const BUCKET = 'meeting-media'

// Lazy-init the storage client so it doesn't crash at build time
// when env vars aren't yet available
let _storageClient: ReturnType<typeof createClient> | null = null

function getStorageClient() {
  if (!_storageClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
    if (url && key) {
      _storageClient = createClient(url, key)
    }
  }
  return _storageClient
}

/**
 * Returns the public URL for a file stored in the meeting-media bucket.
 * Uses the Supabase SDK's getPublicUrl() so encoding is handled correctly.
 * Falls back to constructing the URL manually if the client isn't ready.
 */
export function getMediaUrl(filePath: string): string {
  const client = getStorageClient()
  if (client) {
    const { data } = client.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  }
  // Fallback: construct URL directly
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${url}/storage/v1/object/public/${BUCKET}/${filePath}`
}

/**
 * Returns the first image media item's public URL, or null if none.
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
