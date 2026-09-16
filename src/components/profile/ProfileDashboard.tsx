'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { MeetingCard } from '@/components/meetings/MeetingCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Profile, MeetingWithDetails } from '@/types/database'

interface ProfileDashboardProps {
  profile: Profile | null
  myMeetings: MeetingWithDetails[]
  favorites: MeetingWithDetails[]
  completed: MeetingWithDetails[]
  userId: string
}

type Tab = 'shared' | 'favorites' | 'completed'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'shared', label: 'My Shared', icon: '📋' },
  { id: 'favorites', label: 'Favorites', icon: '❤️' },
  { id: 'completed', label: 'Completed', icon: '✅' },
]

export function ProfileDashboard({
  profile,
  myMeetings,
  favorites,
  completed,
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('shared')

  const initials =
    profile?.avatar_initials ||
    profile?.display_name?.slice(0, 2).toUpperCase() ||
    '??'

  const tabContent: Record<Tab, MeetingWithDetails[]> = {
    shared: myMeetings,
    favorites,
    completed,
  }

  const emptyMessages: Record<Tab, { icon: string; title: string; description: string; action?: React.ReactNode }> = {
    shared: {
      icon: '📋',
      title: "You haven't shared any meeting ideas yet",
      description: 'Share a meeting idea and help other troop leaders!',
      action: <Link href="/create" className="btn-primary mt-2">Share a Meeting Idea</Link>,
    },
    favorites: {
      icon: '❤️',
      title: 'No saved meeting ideas yet',
      description: 'Explore meeting ideas and tap the heart to save them here.',
      action: <Link href="/" className="btn-secondary mt-2">Explore Meeting Ideas</Link>,
    },
    completed: {
      icon: '✅',
      title: 'No completed meeting ideas yet',
      description: "Mark meeting ideas as done after you've used them with your troop.",
      action: <Link href="/" className="btn-secondary mt-2">Explore Meeting Ideas</Link>,
    },
  }

  const meetings = tabContent[activeTab]
  const empty = emptyMessages[activeTab]

  return (
    <div>
      {/* Profile header */}
      <div
        className="rounded-2xl p-6 mb-8 flex items-center gap-5"
        style={{ background: 'white', boxShadow: '0 2px 12px rgba(44,44,44,0.08)' }}
      >
        <Avatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-semibold text-[#2C2C2C] truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {profile?.display_name ?? 'Leader'}
          </h1>
          {profile?.town && (
            <p className="text-sm text-[#888] mt-0.5 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {profile.town}
            </p>
          )}

          {/* Stats row */}
          <div className="flex gap-5 mt-3 flex-wrap">
            <Stat value={myMeetings.length} label="Plans shared" />
            <Stat value={favorites.length} label="Saved" />
            <Stat value={completed.length} label="Completed" />
          </div>
        </div>

        <Link
          href="/create"
          className="btn-primary text-sm px-4 py-2 shrink-0 hidden sm:inline-flex"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Share a Plan
        </Link>
      </div>

      {/* Mobile share button */}
      <div className="sm:hidden mb-4">
        <Link href="/create" className="btn-primary w-full justify-center">
          + Share a New Plan
        </Link>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6"
        style={{ background: '#f0e8da' }}
        role="tablist"
        aria-label="Dashboard sections"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#2D7A4C] shadow-sm'
                : 'text-[#888] hover:text-[#555]'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
            {tabContent[tab.id].length > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-[#e8f5ee] text-[#2D7A4C]'
                    : 'bg-[#e5ddd3] text-[#888]'
                }`}
              >
                {tabContent[tab.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {meetings.length === 0 ? (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={empty.action}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p
        className="text-xl font-semibold text-[#2D7A4C]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p
        className="text-xs text-[#888]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
    </div>
  )
}
