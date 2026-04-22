'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import { PublicUser, FollowUser } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'
import { BELT_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Loader2, UserPlus, UserMinus, Users, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

function BeltDot({ belt }: { belt: string }) {
  const color = BELT_COLORS[belt as keyof typeof BELT_COLORS] || 'bg-gray-400'
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color.split(' ')[0]}`} />
}

function FollowModal({
  title,
  users,
  onClose,
}: {
  title: string
  users: FollowUser[]
  onClose: () => void
}) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mat-black/70" onClick={onClose}>
      <div className="bg-mat-card border border-mat-border w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-mat-border">
          <span className="font-display text-mat-text text-lg uppercase tracking-wider">{title}</span>
          <button onClick={onClose} className="text-mat-text-muted hover:text-mat-text text-lg leading-none">×</button>
        </div>
        {users.length === 0 ? (
          <p className="text-mat-text-muted text-sm text-center py-8">Nobody here yet</p>
        ) : (
          <ul className="divide-y divide-mat-border max-h-80 overflow-y-auto">
            {users.map(u => (
              <li
                key={u.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-mat-muted cursor-pointer"
                onClick={() => { onClose(); router.push(`/users/${u.username}`) }}
              >
                <div className="w-9 h-9 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
                  {u.avatar
                    ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                    : <span className="text-mat-gold font-bold text-sm">{u.username.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="text-mat-text text-sm font-medium">{u.username}</p>
                  <p className="text-mat-text-muted text-xs flex items-center gap-1">
                    <BeltDot belt={u.belt} /> {u.display_belt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const router = useRouter()
  const [modal, setModal] = useState<'followers' | 'following' | null>(null)

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => socialApi.getProfile(username).then(r => r.data),
  })

  const { data: followersData } = useQuery<FollowUser[]>({
    queryKey: ['followers', username],
    queryFn: () => socialApi.followers(username).then(r => r.data),
    enabled: modal === 'followers',
  })

  const { data: followingData } = useQuery<FollowUser[]>({
    queryKey: ['following', username],
    queryFn: () => socialApi.following(username).then(r => r.data),
    enabled: modal === 'following',
  })

  const followMutation = useMutation({
    mutationFn: () => socialApi.follow(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['public-profile', username] })
      toast.success(`Following ${username}`)
    },
    onError: () => toast.error('Failed to follow.'),
  })

  const unfollowMutation = useMutation({
    mutationFn: () => socialApi.unfollow(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['public-profile', username] })
      toast.success(`Unfollowed ${username}`)
    },
    onError: () => toast.error('Failed to unfollow.'),
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

  const isMe = me?.username === username
  const beltColor = BELT_COLORS[profile.belt as keyof typeof BELT_COLORS] || ''

  return (
    <div className="max-w-xl animate-fade-in space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-mat-text-muted hover:text-mat-text text-sm">
        <ChevronLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="bg-mat-card border border-mat-border p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              : <span className="text-mat-gold font-bold text-xl">{profile.username.slice(0, 2).toUpperCase()}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider">{profile.username}</h1>
                <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${beltColor.split(' ').find(c => c.startsWith('text-')) || 'text-mat-text-muted'}`}>
                  <BeltDot belt={profile.belt} />
                  {profile.display_belt}
                </p>
                {profile.gym && <p className="text-mat-text-muted text-xs mt-1">{profile.gym}</p>}
              </div>

              {!isMe && (
                <button
                  onClick={() => profile.is_following ? unfollowMutation.mutate() : followMutation.mutate()}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-sm border transition-colors shrink-0 ${
                    profile.is_following
                      ? 'border-mat-border text-mat-text-muted hover:border-red-500 hover:text-red-400'
                      : 'border-mat-gold text-mat-gold hover:bg-mat-gold hover:text-mat-black'
                  }`}
                >
                  {followMutation.isPending || unfollowMutation.isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : profile.is_following
                      ? <><UserMinus size={13} /> Unfollow</>
                      : <><UserPlus size={13} /> Follow</>
                  }
                </button>
              )}
            </div>

            {profile.bio && (
              <p className="text-mat-text-muted text-sm mt-3 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Follow counts */}
        <div className="flex gap-6 mt-5 pt-4 border-t border-mat-border">
          <button
            onClick={() => setModal('followers')}
            className="text-center hover:opacity-80 transition-opacity"
          >
            <p className="font-display text-2xl text-mat-gold">{profile.follower_count}</p>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Followers</p>
          </button>
          <button
            onClick={() => setModal('following')}
            className="text-center hover:opacity-80 transition-opacity"
          >
            <p className="font-display text-2xl text-mat-gold">{profile.following_count}</p>
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Following</p>
          </button>
        </div>
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

      {/* Modals */}
      {modal === 'followers' && (
        <FollowModal
          title="Followers"
          users={followersData || []}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'following' && (
        <FollowModal
          title="Following"
          users={followingData || []}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
