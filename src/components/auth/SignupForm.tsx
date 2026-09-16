'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'credentials' | 'profile' | 'confirm'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [town, setTown] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Step 1: validate credentials, move to profile step
  function handleCredentialsNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Please enter your email.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setStep('profile')
  }

  // Step 2: create account + profile
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!displayName.trim()) { setError('Please enter your display name.'); return }

    setLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No user returned after sign up')

      // Create the profile row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any).insert({
        id: data.user.id,
        display_name: displayName.trim(),
        avatar_initials: displayName.trim().slice(0, 2).toUpperCase(),
        town: town.trim() || null,
      })

      if (profileError) {
        // Profile insert can fail if RLS not happy (shouldn't in our setup), non-fatal
        console.error('Profile insert error:', profileError.message)
      }

      // If email confirmation is required, Supabase will have session = null
      if (data.session) {
        // Auto-confirmed (e.g. dev mode) — go straight in
        router.push(redirectTo)
        router.refresh()
      } else {
        setStep('confirm')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed. Please try again.')
      setLoading(false)
    }
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="text-center space-y-4">
        <span className="text-5xl block mb-2" aria-hidden="true">📬</span>
        <h2
          className="text-xl font-semibold text-[#2C2C2C]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Check your inbox!
        </h2>
        <p className="text-sm text-[#666]" style={{ fontFamily: 'var(--font-body)' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account and start sharing plans.
        </p>
        <Link href="/" className="btn-secondary inline-flex mt-2">
          Browse plans while you wait
        </Link>
      </div>
    )
  }

  // ── Profile step ─────────────────────────────────────────────────────────
  if (step === 'profile') {
    return (
      <form onSubmit={handleProfileSubmit} noValidate className="space-y-5">
        <div className="text-center mb-2">
          <p className="text-sm text-[#888]" style={{ fontFamily: 'var(--font-body)' }}>
            Almost there! Tell us a little about yourself.
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="display-name" className="label">
            Your Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Sarah J."
            className="input-field"
            required
            autoFocus
            aria-required="true"
          />
          <p className="text-xs text-[#aaa] mt-1">This is shown on your plans and comments</p>
        </div>

        <div>
          <label htmlFor="town" className="label">Your Town <span className="text-[#aaa] font-normal">(optional)</span></label>
          <input
            id="town"
            type="text"
            value={town}
            onChange={e => setTown(e.target.value)}
            placeholder="e.g. Asheville, NC"
            className="input-field"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="btn-secondary flex-1 justify-center py-3"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 justify-center py-3 disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-xs text-[#aaa]" style={{ fontFamily: 'var(--font-body)' }}>
          By signing up you agree to use this platform for Girl Scout planning purposes.
        </p>
      </form>
    )
  }

  // ── Credentials step (default) ───────────────────────────────────────────
  return (
    <form onSubmit={handleCredentialsNext} noValidate className="space-y-5">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="signup-email" className="label">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
          required
          autoComplete="email"
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="label">Password</label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="input-field pr-10"
            required
            autoComplete="new-password"
            minLength={8}
            aria-required="true"
            aria-describedby="password-hint"
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-[#aaa] hover:text-[#555]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <p id="password-hint" className="text-xs text-[#aaa] mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <label htmlFor="confirm-password" className="label">Confirm Password</label>
        <input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
          required
          autoComplete="new-password"
          aria-required="true"
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full justify-center py-3 text-base"
      >
        Continue
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <p className="text-center text-sm text-[#888]" style={{ fontFamily: 'var(--font-body)' }}>
        Already have an account?{' '}
        <Link
          href={`/auth/login${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-[#2D7A4C] font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
