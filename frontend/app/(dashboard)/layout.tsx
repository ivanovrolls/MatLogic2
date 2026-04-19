'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Loader2, User } from 'lucide-react'

function ProfileSetupModal() {
  const { user, updateUser } = useAuthStore()
  const [gender, setGender] = useState(user?.gender || '')
  const [height, setHeight] = useState(user?.height_cm?.toString() || '')
  const [weight, setWeight] = useState(user?.weight_kg?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!gender || !height || !weight) {
      setError('All three fields are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await authApi.updateProfile({
        gender,
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
      })
      updateUser(res.data)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 mat-overlay flex items-center justify-center p-4">
      <div className="bg-mat-card border border-mat-gold/30 w-full max-w-md p-8 space-y-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mat-gold/10 border border-mat-gold/30 flex items-center justify-center">
            <User size={18} className="text-mat-gold" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-wider text-mat-text uppercase">Complete Your Profile</h2>
            <p className="text-mat-text-muted text-xs mt-0.5">
              Required to estimate calories burned in your sessions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mat-label">Biological Sex</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="mat-input"
            >
              <option value="">— Select —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mat-label">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="mat-input"
                placeholder="e.g. 178"
                min="100"
                max="250"
                step="0.1"
              />
            </div>
            <div>
              <label className="mat-label">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="mat-input"
                placeholder="e.g. 76.5"
                min="30"
                max="200"
                step="0.1"
              />
            </div>
          </div>
          {error && <p className="text-mat-red-light text-xs">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save & Continue'}
        </button>

        <p className="text-mat-text-dim text-xs text-center">
          You can update these anytime in your Profile settings.
        </p>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchProfile, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [isAuthenticated, router, fetchProfile])

  if (!isAuthenticated) return null

  const needsBodyMetrics = user && (!user.gender || user.height_cm == null || user.weight_kg == null)

  return (
    <div className="min-h-screen bg-mat-black">
      <Sidebar />
      <Header />
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
      {needsBodyMetrics && <ProfileSetupModal />}
    </div>
  )
}
