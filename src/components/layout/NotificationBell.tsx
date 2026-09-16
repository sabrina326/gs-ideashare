'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  meeting_id: string
  commenter_name: string
  meeting_title: string
  is_read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      }
    }
    fetchNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tbl = supabase.from('notifications') as any
    await tbl
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from('notifications') as any
      await tbl
        .update({ is_read: true })
        .eq('id', notification.id)

      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-[#e8f5ee] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Bell icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
            style={{ background: '#2D7A4C', fontFamily: 'var(--font-body)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white py-2 z-50 max-h-96 overflow-y-auto"
          style={{ boxShadow: '0 4px 24px rgba(44,44,44,0.13)', border: '1px solid #e5ddd3' }}
          role="menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#f0e8da]">
            <span className="text-sm font-semibold text-[#2C2C2C]" style={{ fontFamily: 'var(--font-display)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#2D7A4C] hover:underline"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#aaa]" style={{ fontFamily: 'var(--font-body)' }}>
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <Link
                key={n.id}
                href={`/meetings/${n.meeting_id}`}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-[#faf6f1] transition-colors ${
                  !n.is_read ? 'bg-[#f0faf4]' : ''
                }`}
                role="menuitem"
              >
                {/* Comment icon */}
                <div className="shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={n.is_read ? '#ccc' : '#2D7A4C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2C2C2C] leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
                    <span className="font-semibold">{n.commenter_name}</span>
                    {' commented on '}
                    <span className="font-semibold">{n.meeting_title}</span>
                  </p>
                  <p className="text-xs text-[#aaa] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {/* Unread dot */}
                {!n.is_read && (
                  <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#2D7A4C]" />
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
