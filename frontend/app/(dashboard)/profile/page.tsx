'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { authApi, socialApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { FollowUser } from '@/lib/types'
import toast from 'react-hot-toast'
import { Loader2, Star, Camera, Users, Globe, Lock, Search } from 'lucide-react'
import { BELT_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)

  const { data: followersData } = useQuery<FollowUser[]>({
    queryKey: ['followers', user?.username],
    queryFn: () => socialApi.followers(user!.username).then(r => r.data),
    enabled: !!user,
  })

  const { data: followingData } = useQuery<FollowUser[]>({
    queryKey: ['following', user?.username],
    queryFn: () => socialApi.following(user!.username).then(r => r.data),
    enabled: !!user,
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (res) => {
      updateUser(res.data)
      setAvatarPreview(null)
      toast.success('Profile picture updated.')
    },
    onError: () => toast.error('Failed to upload picture.'),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    avatarMutation.mutate(file)
  }

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      belt: user?.belt || 'white',
      stripes: user?.stripes || 0,
      gym: user?.gym || '',
      start_date: user?.start_date || '',
      weight_class: user?.weight_class || '',
      bio: user?.bio || '',
      gender: user?.gender || '',
      height_cm: user?.height_cm ?? '',
      weight_kg: user?.weight_kg ?? '',
      is_public: user?.is_public ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: object) => authApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data)
      toast.success('Profile updated.')
    },
    onError: () => toast.error('Update failed.'),
  })

  if (!user) return null

  return (
    <div className="max-w-2xl animate-fade-in space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">Account</p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Profile</h1>
        </div>

        {/* Avatar upload */}
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 bg-mat-muted border border-mat-border overflow-hidden flex items-center justify-center cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {(avatarPreview || user?.avatar) ? (
              <img
                src={avatarPreview || user!.avatar!}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-mat-gold font-bold text-2xl select-none">
                {user?.username.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-mat-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {avatarMutation.isPending
                ? <Loader2 size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />
              }
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Social counts */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setFollowModal('followers')}
          className="bg-mat-card border border-mat-border p-4 text-center hover:border-mat-gold/40 transition-colors"
        >
          <p className="font-display text-3xl text-mat-gold">
            {followersData?.length ?? '—'}
          </p>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Followers</p>
        </button>
        <button
          onClick={() => setFollowModal('following')}
          className="bg-mat-card border border-mat-border p-4 text-center hover:border-mat-gold/40 transition-colors"
        >
          <p className="font-display text-3xl text-mat-gold">
            {followingData?.length ?? '—'}
          </p>
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">Following</p>
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Sessions</p>
          <p className="font-display text-3xl text-mat-gold">{user.total_sessions}</p>
        </div>
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Rounds</p>
          <p className="font-display text-3xl text-mat-gold">{user.total_rounds}</p>
        </div>
        <div className="bg-mat-card border border-mat-border p-4 text-center">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Belt</p>
          <p className={`font-display text-xl capitalize pt-1 ${BELT_COLORS[user.belt]?.includes('text') ? BELT_COLORS[user.belt].split(' ').find(c => c.startsWith('text-')) : 'text-mat-gold'}`}>
            {user.belt}
          </p>
        </div>
      </div>

      {/* Premium badge */}
      {user.is_premium && (
        <div className="bg-mat-gold/10 border border-mat-gold/30 px-5 py-3 flex items-center gap-2">
          <Star size={14} className="text-mat-gold" />
          <span className="text-mat-gold text-sm font-semibold">Premium Account Active</span>
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="bg-mat-card border border-mat-border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">First Name</label>
              <input {...register('first_name')} className="mat-input" placeholder="First name" />
            </div>
            <div>
              <label className="mat-label">Last Name</label>
              <input {...register('last_name')} className="mat-input" placeholder="Last name" />
            </div>
          </div>

          <div className="border-t border-mat-border pt-5">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Account</p>
            <p className="text-mat-text text-sm">{user.email}</p>
            <p className="text-mat-text-dim text-xs mt-0.5">
              Member since {new Date(user.date_joined).toLocaleDateString()}
            </p>
          </div>

          <div className="border-t border-mat-border pt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Belt</label>
              <select {...register('belt')} className="mat-input">
                {BELTS.map(b => (
                  <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mat-label">Stripes</label>
              <input {...register('stripes')} type="number" min={0} max={4} className="mat-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Gym</label>
              <input {...register('gym')} className="mat-input" placeholder="Your gym" />
            </div>
            <div>
              <label className="mat-label">Training Since</label>
              <input {...register('start_date')} type="date" className="mat-input" />
            </div>
          </div>

          <div>
            <label className="mat-label">Weight Class</label>
            <input {...register('weight_class')} className="mat-input" placeholder="e.g. Lightweight / 76kg" />
          </div>

          <div className="border-t border-mat-border pt-5">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-4">Body Metrics</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mat-label">Gender</label>
                <select {...register('gender')} className="mat-input">
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mat-label">Height (cm)</label>
                <input {...register('height_cm')} type="number" step="0.1" min="100" max="250" className="mat-input" placeholder="e.g. 178" />
              </div>
              <div>
                <label className="mat-label">Weight (kg)</label>
                <input {...register('weight_kg')} type="number" step="0.1" min="30" max="200" className="mat-input" placeholder="e.g. 76.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="mat-label">Bio</label>
            <textarea {...register('bio')} rows={3} className="mat-input resize-none" placeholder="Tell us about your BJJ journey..." />
          </div>

          <div className="border-t border-mat-border pt-5">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Privacy</p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                {...register('is_public')}
                type="checkbox"
                className="mt-0.5 accent-mat-gold w-4 h-4 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-1.5 text-sm text-mat-text group-hover:text-mat-gold transition-colors">
                  {user.is_public ? <Globe size={13} /> : <Lock size={13} />}
                  Public Profile
                </div>
                <p className="text-mat-text-dim text-xs mt-0.5 leading-relaxed">
                  Let other athletes find and follow you. Your sessions stay private — only your stats, belt, and bio are visible.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><Loader2 size={13} className="animate-spin" /> Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Find people link */}
      <Link
        href="/users"
        className="flex items-center gap-2 text-mat-text-muted hover:text-mat-gold text-sm transition-colors"
      >
        <Search size={13} />
        Find athletes to follow
      </Link>

      {/* Follow/Following modal */}
      {followModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-mat-black/70"
          onClick={() => setFollowModal(null)}
        >
          <div
            className="bg-mat-card border border-mat-border w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-mat-border">
              <span className="font-display text-mat-text text-lg uppercase tracking-wider">
                {followModal === 'followers' ? 'Followers' : 'Following'}
              </span>
              <button onClick={() => setFollowModal(null)} className="text-mat-text-muted hover:text-mat-text text-lg leading-none">×</button>
            </div>
            {(() => {
              const list = followModal === 'followers' ? followersData : followingData
              if (!list) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-mat-gold" /></div>
              if (list.length === 0) return <p className="text-mat-text-muted text-sm text-center py-8">Nobody here yet</p>
              return (
                <ul className="divide-y divide-mat-border max-h-80 overflow-y-auto">
                  {list.map((u: FollowUser) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-mat-muted cursor-pointer"
                      onClick={() => { setFollowModal(null); router.push(`/users/${u.username}`) }}
                    >
                      <div className="w-9 h-9 bg-mat-muted border border-mat-border flex items-center justify-center shrink-0">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                          : <span className="text-mat-gold font-bold text-sm">{u.username.slice(0, 2).toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="text-mat-text text-sm font-medium">{u.username}</p>
                        <p className="text-mat-text-muted text-xs">{u.display_belt}</p>
                      </div>
                      <Users size={12} className="text-mat-text-dim ml-auto" />
                    </li>
                  ))}
                </ul>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
