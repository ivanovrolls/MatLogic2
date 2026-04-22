'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import { PublicUser } from '@/lib/types'
import { BELT_COLORS } from '@/lib/utils'
import { Loader2, ChevronLeft, MapPin } from 'lucide-react'

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => socialApi.getProfile(username).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-mat-gold" />
      </div>
    )
  }

  if (error || !profile) {
    const msg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    return (
      <div className="max-w-lg animate-fade-in">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-mat-text-muted hover:text-mat-text text-sm mb-6">
          <ChevronLeft size={14} /> Back
        </button>
        <div className="bg-mat-card border border-mat-border p-10 text-center">
          <p className="text-mat-text-muted text-sm">{msg || 'Profile not found.'}</p>
        </div>
      </div>
    )
  }

  const beltCls = BELT_COLORS[profile.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'

  return (
    <div className="max-w-xl animate-fade-in space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-mat-text-muted hover:text-mat-text text-sm">
        <ChevronLeft size={14} /> Back
      </button>

      {/* Profile card */}
      <div className="bg-mat-card border border-mat-border p-6 space-y-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              : <span className="text-mat-gold font-bold text-xl">{profile.username.slice(0, 2).toUpperCase()}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider">{profile.username}</h1>

            {/* Belt strip */}
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
          <p className="font-display text-3xl text-mat-gold">{profile.total_sessions}</p>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Sessions</p>
        </div>
        <div className="bg-mat-card border border-mat-border p-4 text-center">
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
    </div>
  )
}
