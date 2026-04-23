'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { BELT_COLORS } from '@/lib/utils'
import { Loader2, MapPin, BookOpen, Swords } from 'lucide-react'
import Link from 'next/link'
import type { PublicUser } from '@/lib/types'

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => authApi.getPublicProfile(username).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mat-black flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-mat-gold" />
      </div>
    )
  }

  if (error || !profile) {
    const msg = (error as any)?.response?.data?.detail
    return (
      <div className="min-h-screen bg-mat-black flex flex-col items-center justify-center p-6 space-y-6">
        <Link href="/" className="font-display text-2xl tracking-widest">
          <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
        </Link>
        <div className="bg-mat-card border border-mat-border p-10 text-center max-w-sm w-full">
          <p className="text-mat-text-muted text-sm">{msg || 'Profile not found or private.'}</p>
        </div>
        <Link href="/login" className="text-mat-text-dim text-xs hover:text-mat-gold transition-colors">
          Sign in to MatLogic →
        </Link>
      </div>
    )
  }

  const beltCls = BELT_COLORS[profile.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'

  return (
    <div className="min-h-screen bg-mat-black flex flex-col items-center justify-start p-6 pt-12 space-y-6">
      {/* Brand */}
      <Link href="/" className="font-display text-2xl tracking-widest mb-2">
        <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
      </Link>

      <div className="w-full max-w-md space-y-4 animate-fade-in">
        {/* Profile card */}
        <div className="bg-mat-card border border-mat-border p-6 space-y-5">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                : <span className="text-mat-gold font-bold text-2xl">{profile.username.slice(0, 2).toUpperCase()}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider">{profile.username}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`h-2 w-14 rounded-sm ${bgColor}`} />
                <span className={`text-xs font-medium ${textColor}`}>{profile.display_belt}</span>
              </div>
              {profile.gym && (
                <p className="flex items-center gap-1 text-mat-text-muted text-xs mt-2">
                  <MapPin size={10} /> {profile.gym}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-mat-text-muted text-sm leading-relaxed border-t border-mat-border pt-4">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <BookOpen size={14} className="text-mat-gold mx-auto mb-1" />
            <p className="font-display text-3xl text-mat-gold">{profile.total_sessions}</p>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Sessions</p>
          </div>
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <Swords size={14} className="text-mat-gold mx-auto mb-1" />
            <p className="font-display text-3xl text-mat-gold">{profile.total_rounds}</p>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Rounds</p>
          </div>
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <p className="font-display text-3xl text-mat-gold">
              {profile.win_rate !== null ? `${profile.win_rate}%` : '—'}
            </p>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Win Rate</p>
          </div>
        </div>

        <p className="text-mat-text-dim text-xs text-center">
          Powered by{' '}
          <Link href="/login" className="text-mat-gold hover:underline">MatLogic</Link>
          {' '}— BJJ Training Intelligence
        </p>
      </div>
    </div>
  )
}
