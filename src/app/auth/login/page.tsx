import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/layout/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — GS IdeaShare',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="md" className="justify-center mb-3" />
          <h1
            className="text-2xl font-semibold text-[#2C2C2C]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome back, Leader!
          </h1>
          <p className="text-sm text-[#888] mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            Sign in to share and save meeting plans
          </p>
        </div>

        <div
          className="bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 4px 24px rgba(44,44,44,0.10)' }}
        >
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
