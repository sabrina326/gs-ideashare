import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://gsideashare.com'

export const revalidate = 3600 // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/auth/signup`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/auth/login`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Dynamic meeting pages — best-effort; if it fails, still return static routes
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (url && key) {
      const supabase = createClient(url, key)
      const { data } = await supabase
        .from('meetings')
        .select('id, updated_at')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (data) {
        for (const m of data as { id: string; updated_at: string | null }[]) {
          staticRoutes.push({
            url: `${SITE_URL}/meetings/${m.id}`,
            lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          })
        }
      }
    }
  } catch {
    // Ignore — return static routes only
  }

  return staticRoutes
}
