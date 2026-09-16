import type { Metadata } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GS IdeaShare — Girl Scout Meeting Plans',
  description:
    'A platform for local Girl Scout troop leaders to share, filter, and archive meeting plans across their area.',
  openGraph: {
    title: 'GS IdeaShare',
    description: 'Share and discover Girl Scout meeting plans',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <footer className="mt-16 py-8 border-t border-[#e5ddd3] text-center text-sm text-[#888]"
          style={{ fontFamily: 'var(--font-body)' }}>
          <p>
            Made with 🌲 for Girl Scout troop leaders everywhere
          </p>
          <p className="mt-2">
            <a
              href="mailto:gsideashare@gmail.com?subject=Report%20an%20Issue"
              className="inline-flex items-center gap-1.5 text-[#aaa] hover:text-[#2D7A4C] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Report an Issue
            </a>
          </p>
        </footer>
        {/* GoatCounter analytics — privacy-friendly, no cookies */}
        <script
          data-goatcounter="https://gs-ideashare.goatcounter.com/count"
          async
          src="//gc.zgo.at/count.js"
        />
      </body>
    </html>
  )
}
