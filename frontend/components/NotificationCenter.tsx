'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Bell, Swords, GraduationCap, Trophy, Info, CheckCheck } from 'lucide-react'

interface Notification {
  id: number
  type: 'challenge' | 'coach' | 'achievement' | 'system'
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const typeIcon: Record<string, React.ElementType> = {
  challenge: Swords,
  coach: GraduationCap,
  achievement: Trophy,
  system: Info,
}

const typeColor: Record<string, string> = {
  challenge: 'text-mat-gold',
  coach: 'text-blue-400',
  achievement: 'text-mat-gold',
  system: 'text-mat-text-muted',
}

export function NotificationCenter({ iconSize = 16 }: { iconSize?: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount().then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = countData?.count ?? 0

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id)
    if (n.link) router.push(n.link)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-1.5 text-mat-text-muted hover:text-mat-gold transition-colors"
        aria-label="Notifications"
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-mat-gold text-mat-darker text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-mat-card border border-mat-border shadow-xl z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-mat-border">
            <span className="text-xs font-semibold text-mat-text-muted uppercase tracking-widest">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-mat-gold hover:text-mat-gold/70 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-mat-text-dim text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const Icon = typeIcon[n.type] ?? Info
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-mat-muted transition-colors border-b border-mat-border/50 last:border-0',
                      !n.is_read && 'bg-mat-gold/5'
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', typeColor[n.type] ?? 'text-mat-text-muted')}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-semibold truncate', n.is_read ? 'text-mat-text-muted' : 'text-mat-text')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-mat-text-dim mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-mat-text-dim mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-mat-gold mt-1.5 shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
