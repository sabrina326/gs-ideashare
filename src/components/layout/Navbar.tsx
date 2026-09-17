'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
    } else {
      // Profile doesn't exist yet — can happen if the insert failed during signup.
      // Try to create a minimal profile so the user isn't stuck.
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email ?? ''
      const name = email.split('@')[0] || 'Leader'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newProfile } = await (supabase.from('profiles') as any)
        .upsert({
          id: userId,
          display_name: name,
          avatar_initials: name.slice(0, 2).toUpperCase(),
        })
        .select()
        .single()
      if (newProfile) setProfile(newProfile)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = profile?.avatar_initials ||
    profile?.display_name?.slice(0, 2).toUpperCase() || '??'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{
        background: 'rgba(250,246,241,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5ddd3',
        boxShadow: '0 1px 8px rgba(44,44,44,0.07)',
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Logo size="sm" />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              pathname === '/'
                ? 'bg-[#e8f5ee] text-[#2D7A4C]'
                : 'text-[#555] hover:text-[#2D7A4C] hover:bg-[#e8f5ee]'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Explore Meeting Ideas
          </Link>

          {user && (
            <Link
              href="/create"
              className="btn-primary text-sm px-4 py-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Share a Plan
            </Link>
          )}

          {user ? (
            <>
            <NotificationBell userId={user.id} />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-[#e8f5ee] transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span
                  className="avatar w-8 h-8 text-sm"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="text-sm font-semibold text-[#2C2C2C] max-w-[120px] truncate" style={{ fontFamily: 'var(--font-body)' }}>
                  {profile?.display_name ?? 'Leader'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white py-2 z-50"
                  style={{ boxShadow: '0 4px 24px rgba(44,44,44,0.13)', border: '1px solid #e5ddd3' }}
                  role="menu"
                >
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#e8f5ee] transition-colors" role="menuitem">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    My Dashboard
                  </Link>
                  <Link href="/create" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#e8f5ee] transition-colors" role="menuitem">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Share a Plan
                  </Link>
                  <hr className="my-1 border-[#e5ddd3]" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    role="menuitem"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            </>
           ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm px-4 py-2">
                Join Free
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-[#e8f5ee] transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-expanded={mobileOpen}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#e5ddd3] py-3 px-4 flex flex-col gap-1 z-50"
          style={{ boxShadow: '0 4px 16px rgba(44,44,44,0.10)' }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <Link href="/" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#2C2C2C] hover:bg-[#e8f5ee]">
            Explore Meeting Ideas
          </Link>
          {user ? (
            <>
              <Link href="/create" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#2D7A4C] hover:bg-[#e8f5ee]">
                + Share a Plan
              </Link>
              <Link href="/profile" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#2C2C2C] hover:bg-[#e8f5ee]">
                My Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#2C2C2C] hover:bg-[#e8f5ee]">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2D7A4C] hover:bg-[#1f5a37]">
                Join Free
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
