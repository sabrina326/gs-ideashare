import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep auth callback and private flows out of the index
      disallow: ['/auth/callback'],
    },
    sitemap: 'https://gsideashare.com/sitemap.xml',
    host: 'https://gsideashare.com',
  }
}
