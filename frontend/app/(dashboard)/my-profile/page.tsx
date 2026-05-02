'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { titlesApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { BELT_COLORS } from '@/lib/utils'
import { ALL_TITLES } from '@/lib/titles'
import toast from 'react-hot-toast'
import { Loader2, MapPin, Copy, Check, ExternalLink, Trophy, Lock, Settings } from 'lucide-react'
import Link from 'next/link'
import type { UserTitle } from '@/lib/types'

export default function MyProfilePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)

  const { data: titles = [], isLoading } = useQuery<UserTitle[]>({
    queryKey: ['my-titles'],
    queryFn: () => titlesApi.list().then(r => r.data),
  })

  const equipMutation = useMutation({
    mutationFn: (slug: string) => titlesApi.equip(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-titles'] })
      toast.success('Title equipped.')
    },
    onError: () => toast.error('Failed to equip title.'),
  })

  const unequipMutation = useMutation({
    mutationFn: () => titlesApi.unequip(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-titles'] })
      toast.success('Title unequipped.')
    },
  })

  if (!user) return null

  const beltCls = BELT_COLORS[user.belt as keyof typeof BELT_COLORS] || ''
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'

  const equipped = titles.find(t => t.is_equipped)
  const unlockedSlugs = new Set(titles.map(t => t.slug))
  const lockedTitles = ALL_TITLES.filter(t => !unlockedSlugs.has(t.slug))

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Public Profile</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">My Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs text-mat-text-muted hover:text-mat-gold transition-colors border border-mat-border hover:border-mat-gold/40 px-3 py-2"
          >
            <Settings size={11} /> Edit Profile
          </Link>
          <a
            href={`/u/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-mat-text-muted hover:text-mat-gold transition-colors border border-mat-border hover:border-mat-gold/40 px-3 py-2"
          >
            <ExternalLink size={11} /> Preview
          </a>
        </div>
      </div>

      {/* Profile preview card */}
      <div className="bg-mat-card border border-mat-border p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mat-gold via-mat-gold/50 to-transparent" />
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 border border-mat-border shrink-0 overflow-hidden bg-mat-muted flex items-center justify-center">
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : <span className="font-display text-xl text-mat-gold">{user.username.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-mat-text uppercase tracking-wider leading-none">{user.username}</h2>
            {equipped && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 border border-mat-gold/40 bg-mat-gold/5">
                <Trophy size={10} className="text-mat-gold" />
                <span className="text-mat-gold text-xs uppercase tracking-widest">{equipped.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-2 w-10 rounded-sm ${bgColor}`} />
              <span className={`text-xs ${textColor}`}>{user.display_belt}</span>
            </div>
            {user.gym && (
              <p className="flex items-center gap-1 text-mat-text-dim text-xs mt-1">
                <MapPin size={10} /> {user.gym}
              </p>
            )}
          </div>
        </div>

        {/* Share link */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-mat-border">
          <code className="text-mat-text-dim text-xs flex-1 truncate bg-mat-darker px-2 py-1.5 border border-mat-border">
            {typeof window !== 'undefined' ? window.location.origin : 'https://matlogic.app'}/u/{user.username}
          </code>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs border border-mat-border hover:border-mat-gold/40 text-mat-text-muted hover:text-mat-gold transition-colors px-3 py-1.5 shrink-0"
          >
            {copied
              ? <><Check size={11} className="text-mat-green-light" /> Copied</>
              : <><Copy size={11} /> Copy link</>
            }
          </button>
        </div>
      </div>

      {/* Titles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={18} className="animate-spin text-mat-gold" />
        </div>
      ) : (
        <>
          {/* Unlocked */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">Titles</p>
              <p className="text-mat-text-dim text-xs">{titles.length} / {ALL_TITLES.length} unlocked</p>
            </div>

            {titles.length === 0 ? (
              <div className="border border-dashed border-mat-border py-10 text-center">
                <Trophy size={20} className="text-mat-text-dim mx-auto mb-2" />
                <p className="text-mat-text-dim text-sm">No titles unlocked yet.</p>
                <p className="text-mat-text-dim text-xs mt-1">Log sessions, submit opponents, and compete to earn them.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {titles.map(title => (
                  <div
                    key={title.slug}
                    className={`flex items-center gap-3 px-3 py-3 border transition-colors ${
                      title.is_equipped
                        ? 'border-mat-gold/40 bg-mat-gold/5'
                        : 'border-mat-border bg-mat-card'
                    }`}
                  >
                    <Trophy size={13} className={title.is_equipped ? 'text-mat-gold shrink-0' : 'text-mat-text-dim shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${title.is_equipped ? 'text-mat-gold' : 'text-mat-text'}`}>
                        {title.name}
                      </p>
                      <p className="text-mat-text-dim text-xs mt-0.5">{title.description}</p>
                    </div>
                    {title.is_equipped ? (
                      <button
                        onClick={() => unequipMutation.mutate()}
                        disabled={unequipMutation.isPending}
                        className="text-xs text-mat-text-dim hover:text-mat-red-light border border-mat-border hover:border-mat-red-light/40 px-2 py-1 shrink-0 transition-colors"
                      >
                        Unequip
                      </button>
                    ) : (
                      <button
                        onClick={() => equipMutation.mutate(title.slug)}
                        disabled={equipMutation.isPending}
                        className="text-xs border border-mat-border hover:border-mat-gold/50 text-mat-text-muted hover:text-mat-gold px-2 py-1 shrink-0 transition-colors"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked */}
          {lockedTitles.length > 0 && (
            <div>
              <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Locked</p>
              <div className="space-y-1">
                {lockedTitles.map(title => (
                  <div key={title.slug} className="flex items-center gap-3 px-3 py-3 border border-mat-border opacity-40">
                    <Lock size={11} className="text-mat-text-dim shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-mat-text leading-snug">{title.name}</p>
                      <p className="text-mat-text-dim text-xs mt-0.5">{title.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
