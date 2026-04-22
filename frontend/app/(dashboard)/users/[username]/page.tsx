'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { socialApi } from '@/lib/api'
import { PublicUser, ChallengeType } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'
import { BELT_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Loader2, ChevronLeft, MapPin, Swords, X } from 'lucide-react'

const CHALLENGE_TYPES: { key: ChallengeType; label: string; desc: string }[] = [
  { key: 'sessions', label: 'Sessions', desc: 'Who logs more training sessions' },
  { key: 'hours', label: 'Mat Hours', desc: 'Who spends more time on the mat' },
  { key: 'win_rate', label: 'Win Rate', desc: 'Higher sparring win rate (min 3 rounds)' },
]
const DURATIONS = [{ days: 3, label: '3d' }, { days: 7, label: '1wk' }, { days: 14, label: '2wk' }, { days: 30, label: '1mo' }]

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const [showChallenge, setShowChallenge] = useState(false)
  const [challengeType, setChallengeType] = useState<ChallengeType>('sessions')
  const [duration, setDuration] = useState(7)
  const [message, setMessage] = useState('')

  const challengeMutation = useMutation({
    mutationFn: () => socialApi.sendChallenge(username, {
      challenge_type: challengeType,
      duration_days: duration,
      message: message.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges'] })
      toast.success(`Challenge sent to ${username}!`)
      setShowChallenge(false)
      setMessage('')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to send.'),
  })

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
            <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider">{profile.username}</h1>
            {me && me.username !== profile.username && (
              <button
                onClick={() => setShowChallenge(s => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-mat-gold text-mat-gold text-xs hover:bg-mat-gold hover:text-mat-black transition-colors shrink-0"
              >
                <Swords size={11} /> Challenge
              </button>
            )}
          </div>

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

      {/* Inline challenge form */}
      {showChallenge && me && (
        <div className="bg-mat-card border border-mat-gold/40 p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="font-display text-mat-text uppercase tracking-wider flex items-center gap-2">
              <Swords size={14} className="text-mat-gold" /> Challenge {profile.username}
            </p>
            <button onClick={() => setShowChallenge(false)} className="text-mat-text-muted hover:text-mat-text">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Type</p>
            <div className="grid grid-cols-3 gap-2">
              {CHALLENGE_TYPES.map(ct => (
                <button
                  key={ct.key}
                  onClick={() => setChallengeType(ct.key)}
                  className={`py-2 px-3 text-xs border transition-colors ${
                    challengeType === ct.key
                      ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
                      : 'border-mat-border text-mat-text-muted hover:border-mat-gold/40'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Duration</p>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.days}
                  onClick={() => setDuration(d.days)}
                  className={`flex-1 py-2 text-xs border transition-colors ${
                    duration === d.days
                      ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
                      : 'border-mat-border text-mat-text-muted hover:border-mat-gold/40'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="mat-input w-full"
            placeholder="Add some trash talk (optional)"
            maxLength={200}
          />

          <button
            onClick={() => challengeMutation.mutate()}
            disabled={challengeMutation.isPending}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {challengeMutation.isPending
              ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
              : <><Swords size={13} /> Send Challenge</>
            }
          </button>
        </div>
      )}

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
