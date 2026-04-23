'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { BELT_COLORS, formatDate } from '@/lib/utils'
import { Loader2, MapPin, BookOpen, Swords, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { PublicUser, MatPost } from '@/lib/types'

// ─── Post card (read-only) ────────────────────────────────────────────────────

function PublicPostCard({ post }: { post: MatPost }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (post.image) {
    return (
      <div
        className="relative aspect-square overflow-hidden bg-mat-darker cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setExpanded(e => !e)}
      >
        <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
        {(hovered || expanded) && (
          <div className="absolute inset-0 bg-mat-black/75 flex flex-col justify-end p-3">
            <p className="text-white text-xs leading-relaxed line-clamp-4">{post.caption}</p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {post.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-mat-gold text-xs">#{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative aspect-square bg-mat-card border border-mat-border flex flex-col justify-between p-3 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mat-gold/80 to-mat-gold/20" />
      <p className="text-mat-text text-xs leading-relaxed line-clamp-5 pt-1 flex-1">
        {post.caption}
      </p>
      <div className="space-y-1 mt-2">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(t => (
              <span key={t} className="text-mat-gold/80 text-xs">#{t}</span>
            ))}
          </div>
        )}
        <p className="text-mat-text-dim text-xs">{formatDate(post.created_at, 'MMM d')}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()

  const { data: profile, isLoading, error } = useQuery<PublicUser>({
    queryKey: ['public-profile', username],
    queryFn: () => authApi.getPublicProfile(username).then(r => r.data),
  })

  const { data: posts = [] } = useQuery<MatPost[]>({
    queryKey: ['user-posts', username],
    queryFn: () => authApi.getUserPosts(username).then(r => r.data),
    enabled: !!profile,
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
    <div className="min-h-screen bg-mat-black">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6 animate-fade-in">

        {/* Brand */}
        <Link href="/" className="block text-center font-display text-xl tracking-widest mb-6">
          <span className="text-mat-gold">MAT</span><span className="text-mat-text">LOGIC</span>
        </Link>

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
              <h1 className="font-display text-2xl text-mat-text uppercase tracking-wider leading-none">
                {profile.username}
              </h1>
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

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest">Mat Wall</p>
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post => <PublicPostCard key={post.id} post={post} />)}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-mat-border py-10 text-center">
            <ImageIcon size={22} className="text-mat-text-dim mx-auto mb-2" />
            <p className="text-mat-text-dim text-xs">No posts yet.</p>
          </div>
        )}

        <p className="text-mat-text-dim text-xs text-center pt-2">
          Powered by{' '}
          <Link href="/login" className="text-mat-gold hover:underline">MatLogic</Link>
          {' '}— BJJ Training Intelligence
        </p>
      </div>
    </div>
  )
}
