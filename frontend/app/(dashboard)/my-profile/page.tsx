'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, titlesApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { BELT_COLORS, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Loader2, Plus, X, MapPin, ImageIcon, Copy, Check,
  Trash2, ExternalLink, Camera, Trophy, Calendar, BarChart2,
  Star,
} from 'lucide-react'
import type { MatPost, UserTitle, GridWidget, WidgetType } from '@/lib/types'

const QUICK_TAGS = ['gi', 'nogi', 'drilling', 'competition', 'milestone', 'technique', 'sparring']

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, onDelete, selectable, selected, onSelect }: {
  post: MatPost
  onDelete?: (id: number) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: number) => void
}) {
  const [hovered, setHovered] = useState(false)

  if (post.image) {
    return (
      <div
        className={`relative aspect-square overflow-hidden bg-mat-darker cursor-pointer ${selected ? 'ring-2 ring-mat-gold' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (selectable && onSelect) onSelect(post.id) }}
      >
        <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
        {(hovered || selected) && (
          <div className="absolute inset-0 bg-mat-black/75 flex flex-col justify-end p-3 transition-opacity">
            <p className="text-white text-xs leading-relaxed line-clamp-4">{post.caption}</p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {post.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-mat-gold text-xs">#{t}</span>
                ))}
              </div>
            )}
            {onDelete && !selectable && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(post.id) }}
                className="absolute top-2 right-2 bg-mat-black/60 text-mat-red-light p-1.5 hover:bg-mat-red-light hover:text-white transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
        {selected && (
          <div className="absolute top-2 left-2 bg-mat-gold text-mat-black rounded-full p-0.5">
            <Check size={10} />
          </div>
        )}
        {onDelete && !selectable && !hovered && (
          <button
            onClick={() => onDelete(post.id)}
            className="absolute top-2 right-2 bg-mat-black/40 text-white/60 p-1.5 sm:hidden"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative aspect-square bg-mat-card border border-mat-border flex flex-col justify-between p-3 overflow-hidden cursor-pointer ${selected ? 'ring-2 ring-mat-gold' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (selectable && onSelect) onSelect(post.id) }}
    >
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
      {onDelete && !selectable && hovered && (
        <button
          onClick={() => onDelete(post.id)}
          className="absolute top-2 right-2 bg-mat-card text-mat-text-dim border border-mat-border p-1.5 hover:text-mat-red-light hover:border-mat-red-light/40 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  )
}

// ─── New post form ─────────────────────────────────────────────────────────────

function NewPostForm({ onCancel }: { onCancel: () => void }) {
  const qc = useQueryClient()
  const [caption, setCaption] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const createMutation = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('caption', caption.trim())
      form.append('tags', JSON.stringify(selectedTags))
      if (image) form.append('image', image)
      return authApi.createPost(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-posts'] })
      toast.success('Posted to your Mat Wall.')
      onCancel()
    },
    onError: () => toast.error('Failed to create post.'),
  })

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Images only.'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )

  return (
    <div className="bg-mat-card border border-mat-gold/30 p-5 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-mat-text font-semibold text-sm uppercase tracking-widest">New Post</p>
        <button onClick={onCancel} className="text-mat-text-dim hover:text-mat-text transition-colors">
          <X size={14} />
        </button>
      </div>
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`border border-dashed transition-colors cursor-pointer overflow-hidden ${
          dragging ? 'border-mat-gold bg-mat-gold/5' : 'border-mat-border hover:border-mat-gold/50'
        }`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-56 object-cover" />
            <button
              onClick={e => { e.stopPropagation(); setImage(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-mat-black/70 text-white p-1.5 hover:bg-mat-black transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-mat-text-dim gap-2">
            <Camera size={22} />
            <p className="text-xs">Drop a photo or click to browse <span className="text-mat-text-muted">(optional)</span></p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      <div>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Share a technique you drilled, a match you won, a lesson from the mat…"
          className="mat-input w-full resize-none"
          autoFocus
        />
        <p className="text-mat-text-dim text-xs text-right mt-1">{caption.length}/500</p>
      </div>
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 border transition-colors ${
                selectedTags.includes(tag)
                  ? 'border-mat-gold bg-mat-gold/10 text-mat-gold'
                  : 'border-mat-border text-mat-text-muted hover:border-mat-gold/40'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => createMutation.mutate()}
          disabled={!caption.trim() || createMutation.isPending}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5"
        >
          {createMutation.isPending && <Loader2 size={12} className="animate-spin" />}
          Post
        </button>
        <button onClick={onCancel} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
      </div>
    </div>
  )
}

// ─── Titles tab ───────────────────────────────────────────────────────────────

function TitlesTab({ posts }: { posts: MatPost[] }) {
  const qc = useQueryClient()
  const [addingWidget, setAddingWidget] = useState<WidgetType | null>(null)
  const [statPick, setStatPick] = useState<string>('sessions')

  const { data: titles = [], isLoading: titlesLoading } = useQuery<UserTitle[]>({
    queryKey: ['my-titles'],
    queryFn: () => titlesApi.list().then(r => r.data),
  })

  const { data: grid, isLoading: gridLoading } = useQuery<{ widgets: GridWidget[]; updated_at: string }>({
    queryKey: ['my-grid'],
    queryFn: () => titlesApi.getGrid().then(r => r.data),
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

  const updateGridMutation = useMutation({
    mutationFn: (widgets: GridWidget[]) => titlesApi.updateGrid(widgets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-grid'] })
      toast.success('Profile grid updated.')
    },
    onError: () => toast.error('Failed to update grid.'),
  })

  const equipped = titles.find(t => t.is_equipped)
  const widgets: GridWidget[] = grid?.widgets ?? []

  const addWidget = (type: WidgetType, config: Record<string, unknown> = {}) => {
    const newWidget: GridWidget = { id: crypto.randomUUID(), type, config }
    updateGridMutation.mutate([...widgets, newWidget])
    setAddingWidget(null)
  }

  const removeWidget = (id: string) => {
    updateGridMutation.mutate(widgets.filter(w => w.id !== id))
  }

  const WIDGET_ICON: Record<WidgetType, React.ReactNode> = {
    title: <Trophy size={12} />,
    photo: <Camera size={12} />,
    calendar: <Calendar size={12} />,
    stats: <BarChart2 size={12} />,
  }

  const WIDGET_LABEL: Record<WidgetType, string> = {
    title: 'Active Title',
    photo: 'Photo',
    calendar: 'Training Calendar',
    stats: 'Stat',
  }

  const imagePosts = posts.filter(p => p.image)

  if (titlesLoading || gridLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={18} className="animate-spin text-mat-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Equipped title */}
      <div className="bg-mat-card border border-mat-border p-4">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Active Title</p>
        {equipped ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-mat-gold/50 flex items-center justify-center shrink-0">
              <Trophy size={14} className="text-mat-gold" />
            </div>
            <div className="flex-1">
              <p className="text-mat-gold font-display text-lg uppercase tracking-wider">{equipped.name}</p>
              <p className="text-mat-text-dim text-xs">{equipped.description}</p>
            </div>
            <button
              onClick={() => unequipMutation.mutate()}
              className="text-xs text-mat-text-dim hover:text-mat-red-light transition-colors border border-mat-border hover:border-mat-red-light/40 px-2 py-1"
            >
              Unequip
            </button>
          </div>
        ) : (
          <p className="text-mat-text-dim text-sm">No title equipped — select one below.</p>
        )}
      </div>

      {/* Titles list */}
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">
          Unlocked Titles ({titles.length})
        </p>
        {titles.length === 0 ? (
          <div className="border border-dashed border-mat-border py-10 text-center">
            <Star size={20} className="text-mat-text-dim mx-auto mb-2" />
            <p className="text-mat-text-dim text-sm">No titles unlocked yet.</p>
            <p className="text-mat-text-dim text-xs mt-1">Log sessions, submit opponents, and compete to unlock titles.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {titles.map(title => (
              <div
                key={title.slug}
                className={`flex items-center gap-3 p-3 border transition-colors ${
                  title.is_equipped
                    ? 'border-mat-gold/40 bg-mat-gold/5'
                    : 'border-mat-border bg-mat-card'
                }`}
              >
                <Trophy size={14} className={title.is_equipped ? 'text-mat-gold' : 'text-mat-text-dim'} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${title.is_equipped ? 'text-mat-gold' : 'text-mat-text'}`}>
                    {title.name}
                  </p>
                  <p className="text-mat-text-dim text-xs">{title.description}</p>
                </div>
                {title.is_equipped ? (
                  <span className="text-xs text-mat-gold uppercase tracking-widest">Equipped</span>
                ) : (
                  <button
                    onClick={() => equipMutation.mutate(title.slug)}
                    disabled={equipMutation.isPending}
                    className="text-xs border border-mat-border hover:border-mat-gold/40 text-mat-text-muted hover:text-mat-gold transition-colors px-2 py-1"
                  >
                    Equip
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Grid editor */}
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Hunter Profile Grid</p>

        {/* Current widgets */}
        {widgets.length > 0 && (
          <div className="space-y-2 mb-3">
            {widgets.map(w => (
              <div key={w.id} className="flex items-center gap-2 p-2.5 border border-mat-border bg-mat-card">
                <span className="text-mat-gold">{WIDGET_ICON[w.type]}</span>
                <span className="text-mat-text text-sm flex-1">
                  {WIDGET_LABEL[w.type]}
                  {w.type === 'stats' && !!w.config.stat && (
                    <span className="text-mat-text-dim"> — {String(w.config.stat)}</span>
                  )}
                  {w.type === 'photo' && !!w.config.post_id && (
                    <span className="text-mat-text-dim"> — post #{String(w.config.post_id)}</span>
                  )}
                </span>
                <button
                  onClick={() => removeWidget(w.id)}
                  className="text-mat-text-dim hover:text-mat-red-light transition-colors p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add widget panel */}
        {addingWidget ? (
          <div className="border border-mat-gold/30 bg-mat-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-mat-text text-sm">Add {WIDGET_LABEL[addingWidget]} widget</p>
              <button onClick={() => setAddingWidget(null)} className="text-mat-text-dim hover:text-mat-text">
                <X size={14} />
              </button>
            </div>

            {addingWidget === 'title' && (
              <button onClick={() => addWidget('title')} className="btn-primary py-2 px-4 text-sm">
                Add Title Widget
              </button>
            )}

            {addingWidget === 'calendar' && (
              <button onClick={() => addWidget('calendar')} className="btn-primary py-2 px-4 text-sm">
                Add Calendar Widget
              </button>
            )}

            {addingWidget === 'stats' && (
              <div className="space-y-2">
                <p className="text-mat-text-muted text-xs">Choose stat to display:</p>
                <div className="flex gap-2">
                  {(['sessions', 'rounds', 'win_rate'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatPick(s)}
                      className={`text-xs px-3 py-1.5 border transition-colors ${
                        statPick === s ? 'border-mat-gold text-mat-gold bg-mat-gold/10' : 'border-mat-border text-mat-text-muted hover:border-mat-gold/40'
                      }`}
                    >
                      {s === 'win_rate' ? 'Win Rate' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={() => addWidget('stats', { stat: statPick })} className="btn-primary py-2 px-4 text-sm">
                  Add Stat Widget
                </button>
              </div>
            )}

            {addingWidget === 'photo' && (
              <div className="space-y-2">
                {imagePosts.length === 0 ? (
                  <p className="text-mat-text-dim text-xs">No photo posts yet. Add photos to your Mat Wall first.</p>
                ) : (
                  <>
                    <p className="text-mat-text-muted text-xs">Select a photo from your Mat Wall:</p>
                    <div className="grid grid-cols-3 gap-1">
                      {imagePosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          selectable
                          onSelect={id => addWidget('photo', { post_id: id })}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {([
              { type: 'title' as WidgetType, icon: <Trophy size={14} />, label: 'Title' },
              { type: 'photo' as WidgetType, icon: <Camera size={14} />, label: 'Photo' },
              { type: 'calendar' as WidgetType, icon: <Calendar size={14} />, label: 'Calendar' },
              { type: 'stats' as WidgetType, icon: <BarChart2 size={14} />, label: 'Stat' },
            ]).map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setAddingWidget(type)}
                className="flex items-center gap-2 text-sm border border-dashed border-mat-border hover:border-mat-gold/50 text-mat-text-muted hover:text-mat-gold transition-colors px-4 py-3"
              >
                {icon} + Add {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyProfilePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'wall' | 'titles'>('wall')

  const { data: posts = [], isLoading } = useQuery<MatPost[]>({
    queryKey: ['my-posts'],
    queryFn: () => authApi.listPosts().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => authApi.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-posts'] })
      toast.success('Post deleted.')
    },
  })

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${user?.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  const beltCls = BELT_COLORS[user.belt as keyof typeof BELT_COLORS] || ''
  const textColor = beltCls.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-text-muted'
  const bgColor = beltCls.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-gray-600'

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Public Profile</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">My Profile</h1>
        </div>
        <a
          href={`/u/${user.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-mat-text-muted hover:text-mat-gold transition-colors border border-mat-border hover:border-mat-gold/40 px-3 py-2"
        >
          <ExternalLink size={11} /> Preview
        </a>
      </div>

      {/* Profile card */}
      <div className="bg-mat-card border border-mat-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0 overflow-hidden">
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              : <span className="text-mat-gold font-bold text-xl">{user.username.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-mat-text uppercase tracking-wider leading-none">{user.username}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`h-2 w-10 rounded-sm ${bgColor}`} />
              <span className={`text-xs font-medium ${textColor}`}>{user.display_belt}</span>
            </div>
            {user.gym && (
              <p className="flex items-center gap-1 text-mat-text-muted text-xs mt-1.5">
                <MapPin size={10} /> {user.gym}
              </p>
            )}
            {user.bio && (
              <p className="text-mat-text-muted text-xs mt-2 leading-relaxed line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-mat-border text-center">
          <div>
            <p className="font-display text-2xl text-mat-gold">{user.total_sessions}</p>
            <p className="text-mat-text-dim text-xs uppercase tracking-widest">Sessions</p>
          </div>
          <div>
            <p className="font-display text-2xl text-mat-gold">{user.total_rounds}</p>
            <p className="text-mat-text-dim text-xs uppercase tracking-widest">Rounds</p>
          </div>
          <div>
            <p className="font-display text-2xl text-mat-gold">{posts.length}</p>
            <p className="text-mat-text-dim text-xs uppercase tracking-widest">Posts</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-mat-border flex items-center gap-2">
          <code className="text-mat-text-dim text-xs flex-1 truncate bg-mat-darker px-2 py-1.5 border border-mat-border">
            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/u/{user.username}
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

      {/* Tabs */}
      <div className="flex gap-0 border border-mat-border">
        <button
          onClick={() => setTab('wall')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
            tab === 'wall'
              ? 'bg-mat-gold/10 text-mat-gold border-b-2 border-mat-gold'
              : 'text-mat-text-muted hover:text-mat-text'
          }`}
        >
          <ImageIcon size={14} /> Mat Wall
        </button>
        <button
          onClick={() => setTab('titles')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
            tab === 'titles'
              ? 'bg-mat-gold/10 text-mat-gold border-b-2 border-mat-gold'
              : 'text-mat-text-muted hover:text-mat-text'
          }`}
        >
          <Trophy size={14} /> Titles & Grid
        </button>
      </div>

      {/* Tab content */}
      {tab === 'wall' ? (
        <>
          {showForm ? (
            <NewPostForm onCancel={() => setShowForm(false)} />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm border border-dashed border-mat-border hover:border-mat-gold/50 text-mat-text-muted hover:text-mat-gold transition-colors px-4 py-3 w-full"
            >
              <Plus size={14} /> Share a training moment…
            </button>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={18} className="animate-spin text-mat-gold" />
            </div>
          ) : posts.length === 0 ? (
            <div className="border border-dashed border-mat-border py-16 text-center space-y-2">
              <ImageIcon size={28} className="text-mat-text-dim mx-auto" />
              <p className="text-mat-text-muted text-sm">Your Mat Wall is empty.</p>
              <p className="text-mat-text-dim text-xs">
                Post training moments, techniques you&apos;ve been drilling, or competition wins.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={id => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <TitlesTab posts={posts} />
      )}
    </div>
  )
}
