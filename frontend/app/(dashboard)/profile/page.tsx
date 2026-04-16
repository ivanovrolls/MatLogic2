'use client'

import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Shield, Star } from 'lucide-react'
import { BELT_COLORS } from '@/lib/utils'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

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
      <div>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Account</p>
        <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">Profile</h1>
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
    </div>
  )
}
