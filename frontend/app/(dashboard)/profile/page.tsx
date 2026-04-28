'use client'

import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { authApi, coachingApi } from '@/lib/api'
import { useTutorialStore } from '@/stores/tutorialStore'
import { GymPicker } from '@/components/GymPicker'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Star, Camera, Globe, Lock, Shield, GraduationCap, X, Check, UserCheck, UserX, HelpCircle } from 'lucide-react'
import { BELT_COLORS, cn } from '@/lib/utils'
import Link from 'next/link'
import type { CoachRelationship } from '@/lib/types'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { open: openTutorial } = useTutorialStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [heightFt, setHeightFt] = useState(() => {
    if (!user?.height_cm) return ''
    return String(Math.floor(user.height_cm / 2.54 / 12))
  })
  const [heightIn, setHeightIn] = useState(() => {
    if (!user?.height_cm) return ''
    const totalIn = user.height_cm / 2.54
    return (totalIn % 12).toFixed(1)
  })
  const [weightLbs, setWeightLbs] = useState(() => {
    if (!user?.weight_kg) return ''
    return (user.weight_kg * 2.2046).toFixed(1)
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

  const { register, handleSubmit, formState: { isDirty }, getValues, setValue, control } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      belt: user?.belt || 'white',
      stripes: user?.stripes || 0,
      gym_ref: user?.gym_ref_id ?? null,
      start_date: user?.start_date || '',
      weight_class: user?.weight_class || '',
      bio: user?.bio || '',
      gender: user?.gender || '',
      height_cm: user?.height_cm ?? '',
      weight_kg: user?.weight_kg ?? '',
      is_public: user?.is_public ?? true,
    },
  })

  const switchUnits = (next: 'metric' | 'imperial') => {
    if (next === units) return
    if (next === 'imperial') {
      const cm = parseFloat(String(getValues('height_cm')))
      const kg = parseFloat(String(getValues('weight_kg')))
      if (!isNaN(cm) && cm > 0) {
        const totalIn = cm / 2.54
        setHeightFt(String(Math.floor(totalIn / 12)))
        setHeightIn((totalIn % 12).toFixed(1))
      }
      if (!isNaN(kg) && kg > 0) setWeightLbs((kg * 2.2046).toFixed(1))
    } else {
      const ft = parseFloat(heightFt || '0')
      const inch = parseFloat(heightIn || '0')
      const lbs = parseFloat(weightLbs || '0')
      if (ft || inch) {
        setValue('height_cm', parseFloat(((ft * 12 + inch) * 2.54).toFixed(1)), { shouldDirty: true })
      }
      if (lbs) {
        setValue('weight_kg', parseFloat((lbs / 2.2046).toFixed(1)), { shouldDirty: true })
      }
    }
    setUnits(next)
  }

  const mutation = useMutation({
    mutationFn: (data: object) => authApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data)
      toast.success('Profile updated.')
    },
    onError: () => toast.error('Update failed.'),
  })

  const onSubmit = (data: any) => {
    if (units === 'imperial') {
      const ft = parseFloat(heightFt || '0')
      const inch = parseFloat(heightIn || '0')
      const lbs = parseFloat(weightLbs || '0')
      if (ft || inch) data.height_cm = parseFloat(((ft * 12 + inch) * 2.54).toFixed(1))
      if (lbs) data.weight_kg = parseFloat((lbs / 2.2046).toFixed(1))
    }
    mutation.mutate(data)
  }

  if (!user) return null

  const beltTextColor = BELT_COLORS[user.belt]?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-gold'

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
            className="w-20 h-20 rounded-full bg-mat-muted border-2 border-mat-border overflow-hidden flex items-center justify-center cursor-pointer group"
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
            <div className="absolute inset-0 bg-mat-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              {avatarMutation.isPending
                ? <Loader2 size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />
              }
            </div>
          </div>
          <p className="text-mat-text text-sm font-medium text-center mt-2">{user.username}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
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
          <p className={`text-sm font-semibold capitalize mt-1 ${beltTextColor}`}>{user.display_belt}</p>
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
              <Controller
                name="gym_ref"
                control={control}
                render={({ field }) => (
                  <GymPicker
                    value={field.value}
                    initialName={user?.gym || ''}
                    onChange={field.onChange}
                  />
                )}
              />
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

          {/* Body Metrics with unit toggle */}
          <div className="border-t border-mat-border pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">Body Metrics</p>
              <div className="flex items-center border border-mat-border p-0.5">
                {(['metric', 'imperial'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => switchUnits(u)}
                    className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
                      units === u ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {units === 'metric' ? (
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
                  <input {...register('height_cm')} type="number" step="0.1" min="100" max="250" className="mat-input" placeholder="178" />
                </div>
                <div>
                  <label className="mat-label">Weight (kg)</label>
                  <input {...register('weight_kg')} type="number" step="0.1" min="30" max="200" className="mat-input" placeholder="76.5" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
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
                  <label className="mat-label">Feet</label>
                  <input
                    type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)}
                    className="mat-input" placeholder="5" min="3" max="8"
                  />
                </div>
                <div>
                  <label className="mat-label">Inches</label>
                  <input
                    type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)}
                    className="mat-input" placeholder="10" min="0" max="11" step="0.5"
                  />
                </div>
                <div>
                  <label className="mat-label">Weight (lbs)</label>
                  <input
                    type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)}
                    className="mat-input" placeholder="168" min="66" max="660" step="0.5"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mat-label">Bio</label>
            <textarea {...register('bio')} rows={3} className="mat-input resize-none" placeholder="Tell us about your BJJ journey..." />
          </div>

          {/* Dojo visibility */}
          <div className="border-t border-mat-border pt-5">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-3">Dojo</p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                {...register('is_public')}
                type="checkbox"
                className="mt-0.5 accent-mat-gold w-4 h-4 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-1.5 text-sm text-mat-text group-hover:text-mat-gold transition-colors">
                  {user.is_public ? <Globe size={13} /> : <Lock size={13} />}
                  Show in Dojo
                </div>
                <p className="text-mat-text-dim text-xs mt-0.5 leading-relaxed">
                  Appear on your gym&apos;s leaderboard and let training partners find your rival stats. Your individual sessions are never shown.
                </p>
              </div>
            </label>
            {user.is_public && user.gym && (
              <Link
                href="/dojo"
                className="flex items-center gap-1.5 mt-3 text-mat-gold/70 hover:text-mat-gold text-xs transition-colors"
              >
                <Shield size={11} /> View {user.gym} Dojo →
              </Link>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || (!isDirty && units === 'metric')}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><Loader2 size={13} className="animate-spin" /> Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>

      <CoachSection />

      <div className="bg-mat-card border border-mat-border p-6 space-y-3">
        <p className="text-mat-text-muted text-xs uppercase tracking-widest">Help</p>
        <button
          onClick={openTutorial}
          className="flex items-center gap-3 text-mat-text-muted hover:text-mat-gold transition-colors text-sm"
        >
          <HelpCircle size={15} className="shrink-0" />
          <div>
            <p className="font-medium">Help Tour</p>
            <p className="text-mat-text-dim text-xs mt-0.5">Replay the interactive walkthrough of MatLogic</p>
          </div>
        </button>
      </div>
    </div>
  )
}

function CoachSection() {
  const queryClient = useQueryClient()
  const [coachInput, setCoachInput] = useState('')

  const { data: relationship, isLoading: relLoading } = useQuery<CoachRelationship | null>({
    queryKey: ['coach-relationship'],
    queryFn: () => coachingApi.getRelationship().then(r => r.data),
  })

  const { data: incomingRequests } = useQuery<CoachRelationship[]>({
    queryKey: ['coach-requests'],
    queryFn: () => coachingApi.getRequests().then(r => r.data),
  })

  const requestMutation = useMutation({
    mutationFn: () => coachingApi.requestCoach(coachInput.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-relationship'] })
      setCoachInput('')
      toast.success('Coach request sent.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'User not found.'),
  })

  const removeMutation = useMutation({
    mutationFn: () => coachingApi.removeCoach(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-relationship'] })
      toast.success('Coach removed.')
    },
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'declined' }) =>
      coachingApi.respondToRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-requests'] })
      queryClient.invalidateQueries({ queryKey: ['coaching-students'] })
      toast.success('Response sent.')
    },
  })

  const pendingRequests = incomingRequests?.filter(r => r.status === 'pending') || []
  const hasActiveRelationship = relationship && relationship.status !== 'declined'

  return (
    <div className="space-y-5">
      {/* My Coach */}
      <div className="bg-mat-card border border-mat-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={14} className="text-mat-gold" />
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">My Coach</p>
        </div>

        {relLoading ? (
          <div className="flex items-center gap-2 text-mat-text-dim text-sm">
            <Loader2 size={13} className="animate-spin" /> Loading...
          </div>
        ) : hasActiveRelationship && relationship ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-mat-muted border border-mat-border flex items-center justify-center text-mat-gold font-bold text-sm overflow-hidden shrink-0">
                {relationship.coach_avatar
                  ? <img src={relationship.coach_avatar} alt={relationship.coach_username} className="w-full h-full object-cover" />
                  : relationship.coach_username.slice(0, 2).toUpperCase()
                }
              </div>
              <div>
                <p className="text-mat-text text-sm font-semibold">{relationship.coach_username}</p>
                <p className={cn(
                  'text-xs capitalize font-medium',
                  relationship.status === 'accepted' ? 'text-mat-green-light' : 'text-mat-gold'
                )}>
                  {relationship.status === 'accepted' ? 'Active Coach' : 'Request Pending'}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="text-mat-text-dim hover:text-mat-red-light transition-colors text-xs flex items-center gap-1 border border-mat-border hover:border-mat-red-light/50 px-2.5 py-1.5"
            >
              <X size={11} /> Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-mat-text-dim text-xs">
              Enter a username to request someone as your coach. They will receive a request to accept.
            </p>
            <div className="flex gap-2">
              <input
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') requestMutation.mutate() }}
                className="mat-input text-sm flex-1"
                placeholder="Coach's username"
              />
              <button
                onClick={() => requestMutation.mutate()}
                disabled={!coachInput.trim() || requestMutation.isPending}
                className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {requestMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
                Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incoming requests (if this user is a coach) */}
      {pendingRequests.length > 0 && (
        <div id="coach-requests" className="bg-mat-card border border-mat-border p-6 space-y-4">
          <p className="text-mat-text-muted text-xs uppercase tracking-widest">
            Coaching Requests ({pendingRequests.length})
          </p>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-mat-muted border border-mat-border flex items-center justify-center text-mat-gold font-bold text-xs overflow-hidden shrink-0">
                    {req.student_avatar
                      ? <img src={req.student_avatar} alt={req.student_username} className="w-full h-full object-cover" />
                      : req.student_username.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-mat-text text-sm font-semibold">{req.student_username}</p>
                    <p className="text-mat-text-dim text-xs capitalize">{req.student_belt} belt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => respondMutation.mutate({ id: req.id, status: 'accepted' })}
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-mat-green-light border border-mat-green-light/30 hover:bg-mat-green-light/10 px-2.5 py-1.5 transition-colors"
                  >
                    <UserCheck size={11} /> Accept
                  </button>
                  <button
                    onClick={() => respondMutation.mutate({ id: req.id, status: 'declined' })}
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-mat-red-light border border-mat-red-light/30 hover:bg-mat-red-light/10 px-2.5 py-1.5 transition-colors"
                  >
                    <UserX size={11} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

