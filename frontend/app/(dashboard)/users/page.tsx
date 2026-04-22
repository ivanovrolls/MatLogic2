'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import { PublicUser } from '@/lib/types'
import { BELT_COLORS } from '@/lib/utils'
import { Search, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

function UserCard({ user }: { user: PublicUser }) {
  const qc = useQueryClient()
  const { user: me } = useAuthStore()
  const isMe = me?.username === user.username

  const followMutation = useMutation({
    mutationFn: () => socialApi.follow(user.username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] })
      toast.success(`Following ${user.username}`)
    },
    onError: () => toast.error('Failed to follow.'),
  })

  const unfollowMutation = useMutation({
    mutationFn: () => socialApi.unfollow(user.username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] })
      toast.success(`Unfollowed ${user.username}`)
    },
    onError: () => toast.error('Failed to unfollow.'),
  })

  const beltColor = BELT_COLORS[user.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltColor.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'

  return (
    <div className="bg-mat-card border border-mat-border p-4 flex items-start gap-4">
      <Link href={`/users/${user.username}`} className="shrink-0">
        <div className="w-12 h-12 bg-mat-muted border border-mat-border flex items-center justify-center hover:border-mat-gold/50 transition-colors">
          {user.avatar
            ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            : <span className="text-mat-gold font-bold">{user.username.slice(0, 2).toUpperCase()}</span>
          }
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/users/${user.username}`} className="hover:text-mat-gold transition-colors">
          <p className="font-display text-mat-text uppercase tracking-wider">{user.username}</p>
        </Link>
        <p className={`text-xs mt-0.5 ${textColor}`}>{user.display_belt}</p>
        {user.gym && <p className="text-mat-text-muted text-xs">{user.gym}</p>}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-mat-text-dim text-xs">{user.total_sessions} sessions</span>
          <span className="text-mat-text-dim text-xs">{user.follower_count} followers</span>
          {user.win_rate !== null && (
            <span className="text-mat-text-dim text-xs">{user.win_rate}% win rate</span>
          )}
        </div>
      </div>

      {!isMe && (
        <button
          onClick={() => user.is_following ? unfollowMutation.mutate() : followMutation.mutate()}
          disabled={followMutation.isPending || unfollowMutation.isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors shrink-0 ${
            user.is_following
              ? 'border-mat-border text-mat-text-muted hover:border-red-500 hover:text-red-400'
              : 'border-mat-gold text-mat-gold hover:bg-mat-gold hover:text-mat-black'
          }`}
        >
          {followMutation.isPending || unfollowMutation.isPending
            ? <Loader2 size={11} className="animate-spin" />
            : user.is_following
              ? <><UserMinus size={11} /> Unfollow</>
              : <><UserPlus size={11} /> Follow</>
          }
        </button>
      )}
    </div>
  )
}

export default function UsersPage() {
  const [q, setQ] = useState('')

  const { data: results, isFetching } = useQuery<PublicUser[]>({
    queryKey: ['user-search', q],
    queryFn: () => socialApi.search(q).then(r => r.data),
    enabled: q.trim().length >= 2,
  })

  return (
    <div className="max-w-2xl animate-fade-in space-y-5">
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Social</p>
        <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Find Athletes</h1>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mat-text-muted pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by username or gym…"
          className="mat-input pl-9 w-full"
          autoFocus
        />
        {isFetching && (
          <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-mat-text-muted" />
        )}
      </div>

      {q.trim().length >= 2 && results !== undefined && (
        results.length === 0 ? (
          <p className="text-mat-text-muted text-sm text-center py-8">No public profiles found for &quot;{q}&quot;</p>
        ) : (
          <div className="space-y-2">
            {results.map(u => <UserCard key={u.id} user={u} />)}
          </div>
        )
      )}

      {q.trim().length < 2 && (
        <p className="text-mat-text-dim text-sm text-center py-8">Type at least 2 characters to search</p>
      )}
    </div>
  )
}
