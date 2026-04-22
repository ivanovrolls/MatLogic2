'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { socialApi } from '@/lib/api'
import { DojoRoom, DojoMember, Rival } from '@/lib/types'
import { useAuthStore } from '@/stores/authStore'
import { BELT_COLORS } from '@/lib/utils'
import Link from 'next/link'
import {
  Flame, Trophy, Clock, Zap, Search, Swords, TrendingUp,
  TrendingDown, Minus, Shield,
} from 'lucide-react'

type SortKey = 'hours_month' | 'sessions_week' | 'win_rate' | 'streak'

const SORT_TABS: { key: SortKey; label: string; icon: React.ReactNode; unit: string }[] = [
  { key: 'hours_month', label: 'Mat Hours', icon: <Clock size={12} />, unit: 'h' },
  { key: 'sessions_week', label: 'This Week', icon: <Zap size={12} />, unit: ' sessions' },
  { key: 'win_rate', label: 'Win Rate', icon: <Trophy size={12} />, unit: '%' },
  { key: 'streak', label: 'Streak', icon: <Flame size={12} />, unit: ' days' },
]

function BeltBar({ belt }: { belt: string }) {
  const cls = BELT_COLORS[belt as keyof typeof BELT_COLORS] || ''
  const bg = cls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'
  return <span className={`inline-block w-8 h-1.5 rounded-sm ${bg}`} />
}

function RankBadge({ rank, isMe }: { rank: number; isMe: boolean }) {
  if (rank === 1) return <span className="font-display text-amber-400 text-lg w-6 text-center">#1</span>
  if (rank === 2) return <span className="font-display text-slate-300 text-base w-6 text-center">#2</span>
  if (rank === 3) return <span className="font-display text-amber-600 text-base w-6 text-center">#3</span>
  return (
    <span className={`font-display text-sm w-6 text-center ${isMe ? 'text-mat-gold' : 'text-mat-text-dim'}`}>
      #{rank}
    </span>
  )
}

function RivalCard({ rival }: { rival: Rival }) {
  const isUp = (rival.win_rate ?? 0) > 50
  const isEven = rival.wins === rival.losses
  const beltCls = BELT_COLORS[rival.user.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'

  return (
    <Link
      href={`/users/${rival.user.username}`}
      className="bg-mat-panel border border-mat-border p-4 flex items-center gap-4 hover:border-mat-gold/40 transition-colors group"
    >
      <div className="w-10 h-10 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
        {rival.user.avatar
          ? <img src={rival.user.avatar} alt={rival.user.username} className="w-full h-full object-cover" />
          : <span className="text-mat-gold font-bold text-sm">{rival.user.username.slice(0, 2).toUpperCase()}</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-mat-text font-medium group-hover:text-mat-gold transition-colors">
            {rival.user.username}
          </span>
          <BeltBar belt={rival.user.belt} />
          <span className={`text-xs ${textColor}`}>{rival.user.belt}</span>
        </div>
        <p className="text-mat-text-dim text-xs mt-0.5">
          {rival.total} rounds together
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 justify-end mb-0.5">
          {isEven
            ? <Minus size={12} className="text-mat-text-muted" />
            : isUp
              ? <TrendingUp size={12} className="text-mat-green-light" />
              : <TrendingDown size={12} className="text-mat-red-light" />
          }
          <span className={`font-display text-lg ${isEven ? 'text-mat-text-muted' : isUp ? 'text-mat-green-light' : 'text-mat-red-light'}`}>
            {rival.wins}W–{rival.losses}L{rival.draws > 0 ? `–${rival.draws}D` : ''}
          </span>
        </div>
        <p className={`text-xs ${isEven ? 'text-mat-text-dim' : isUp ? 'text-mat-green-light' : 'text-mat-red-light'}`}>
          {isEven ? 'Dead even' : isUp ? 'You\'re up' : 'You\'re down'}
        </p>
      </div>
    </Link>
  )
}

function LeaderboardRow({
  member,
  rank,
  sortKey,
}: {
  member: DojoMember
  rank: number
  sortKey: SortKey
}) {
  const tab = SORT_TABS.find(t => t.key === sortKey)!
  const rawValue = member[sortKey]
  const value = rawValue === null ? '—' : `${rawValue}${tab.unit}`
  const beltCls = BELT_COLORS[member.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 ${member.is_me ? 'bg-mat-gold/5 border-l-2 border-mat-gold' : 'border-l-2 border-transparent hover:bg-mat-darker'} transition-colors`}>
      <RankBadge rank={rank} isMe={member.is_me} />

      <div className="w-8 h-8 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
        {member.avatar
          ? <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
          : <span className="text-mat-gold font-bold text-xs">{member.username.slice(0, 2).toUpperCase()}</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${member.is_me ? 'text-mat-gold' : 'text-mat-text'}`}>
            {member.username}
            {member.is_me && <span className="text-xs text-mat-text-muted ml-1">(you)</span>}
          </span>
          <BeltBar belt={member.belt} />
        </div>
        <p className={`text-xs ${textColor}`}>{member.display_belt}</p>
      </div>

      {/* Secondary stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-mat-text-dim">
        {sortKey !== 'streak' && member.streak > 0 && (
          <span className="flex items-center gap-1">
            <Flame size={10} className="text-orange-400" />
            {member.streak}d
          </span>
        )}
        {sortKey !== 'sessions_week' && (
          <span>{member.sessions_week} this wk</span>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className={`font-display text-xl ${member.is_me ? 'text-mat-gold' : rank <= 3 ? 'text-mat-text' : 'text-mat-text-muted'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default function DojoPage() {
  const { user } = useAuthStore()
  const [sortKey, setSortKey] = useState<SortKey>('hours_month')

  const { data: dojoData, isLoading: dojoLoading } = useQuery<DojoRoom | { detail: string }>({
    queryKey: ['dojo'],
    queryFn: () => socialApi.dojo().then(r => r.data),
  })

  const { data: rivals, isLoading: rivalsLoading } = useQuery<Rival[]>({
    queryKey: ['rivals'],
    queryFn: () => socialApi.rivals().then(r => r.data),
  })

  const noGym = dojoData && 'detail' in dojoData && dojoData.detail === 'no_gym'
  const dojo = dojoData && !('detail' in dojoData) ? dojoData as DojoRoom : null

  const sorted = dojo
    ? [...dojo.members].sort((a, b) => {
        const av = a[sortKey] ?? -1
        const bv = b[sortKey] ?? -1
        return bv - av
      })
    : []

  return (
    <div className="max-w-3xl animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Social</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">
            {dojo ? dojo.gym : 'The Dojo'}
          </h1>
          {dojo && (
            <p className="text-mat-text-muted text-sm mt-0.5">
              {dojo.members.length} athlete{dojo.members.length !== 1 ? 's' : ''} training here
            </p>
          )}
        </div>
        <Link href="/users" className="flex items-center gap-1.5 text-mat-text-muted hover:text-mat-gold text-xs transition-colors">
          <Search size={12} /> Find Athletes
        </Link>
      </div>

      {/* No gym set */}
      {noGym && !dojoLoading && (
        <div className="bg-mat-card border border-mat-border p-8 text-center space-y-3">
          <Shield size={28} className="text-mat-gold mx-auto opacity-60" />
          <p className="text-mat-text font-medium">Set your gym to join your Dojo</p>
          <p className="text-mat-text-dim text-sm">
            Add your gym in your profile and turn on &quot;Show in Dojo&quot; to see how your teammates are training.
          </p>
          <Link href="/profile" className="btn-primary text-xs px-5 py-2 inline-block mt-2">
            Go to Profile
          </Link>
        </div>
      )}

      {/* Solo dojo — you're the only one */}
      {dojo && dojo.members.length === 1 && (
        <div className="bg-mat-card border border-mat-border p-8 text-center space-y-2">
          <p className="text-mat-text-muted text-sm">
            No other public athletes from <span className="text-mat-gold">{dojo.gym}</span> yet.
          </p>
          <p className="text-mat-text-dim text-xs">
            Share MatLogic with your training partners — when they set the same gym and go public, they&apos;ll appear here.
          </p>
        </div>
      )}

      {/* Leaderboard */}
      {dojo && dojo.members.length > 1 && (
        <div className="bg-mat-card border border-mat-border">
          {/* Sort tabs */}
          <div className="flex border-b border-mat-border">
            {SORT_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSortKey(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                  sortKey === tab.key
                    ? 'text-mat-gold border-b-2 border-mat-gold -mb-px bg-mat-gold/5'
                    : 'text-mat-text-muted hover:text-mat-text'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-mat-border">
            {sorted.map((member, i) => (
              <LeaderboardRow
                key={member.id}
                member={member}
                rank={i + 1}
                sortKey={sortKey}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rivals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Swords size={14} className="text-mat-gold" />
          <h2 className="font-display text-xl tracking-wider text-mat-text uppercase">Your Rivals</h2>
        </div>

        {rivalsLoading ? null : rivals && rivals.length > 0 ? (
          <div className="space-y-2">
            {rivals.map(r => <RivalCard key={r.user.id} rival={r} />)}
          </div>
        ) : (
          <div className="bg-mat-card border border-mat-border p-6 text-center">
            <p className="text-mat-text-muted text-sm">
              Rivals appear automatically when you log sparring rounds with someone who&apos;s on MatLogic.
            </p>
            <p className="text-mat-text-dim text-xs mt-1">
              Make sure to use their MatLogic username in the &quot;Partner Name&quot; field.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
