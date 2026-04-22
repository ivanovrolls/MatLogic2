'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import { PublicUser } from '@/lib/types'
import { BELT_COLORS } from '@/lib/utils'
import { Search, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'

function UserCard({ user }: { user: PublicUser }) {
  const beltCls = BELT_COLORS[user.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'

  return (
    <Link
      href={`/users/${user.username}`}
      className="bg-mat-card border border-mat-border p-4 flex items-start gap-4 hover:border-mat-gold/40 transition-colors group"
    >
      <div className="w-12 h-12 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
        {user.avatar
          ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          : <span className="text-mat-gold font-bold">{user.username.slice(0, 2).toUpperCase()}</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-mat-text uppercase tracking-wider group-hover:text-mat-gold transition-colors">
            {user.username}
          </p>
          <div className={`h-1.5 w-8 rounded-sm ${bgColor}`} />
          <span className={`text-xs ${textColor}`}>{user.belt}</span>
        </div>
        {user.gym && (
          <p className="text-mat-text-muted text-xs flex items-center gap-1 mt-0.5">
            <MapPin size={9} /> {user.gym}
          </p>
        )}
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-mat-text-dim text-xs">{user.total_sessions} sessions</span>
          <span className="text-mat-text-dim text-xs">{user.total_rounds} rounds</span>
          {user.win_rate !== null && (
            <span className="text-mat-text-dim text-xs">{user.win_rate}% win rate</span>
          )}
        </div>
      </div>
    </Link>
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
        results.length === 0
          ? <p className="text-mat-text-muted text-sm text-center py-8">No public profiles found for &quot;{q}&quot;</p>
          : <div className="space-y-2">{results.map(u => <UserCard key={u.id} user={u} />)}</div>
      )}

      {q.trim().length < 2 && (
        <p className="text-mat-text-dim text-sm text-center py-8">Type at least 2 characters to search</p>
      )}
    </div>
  )
}
