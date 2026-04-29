'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Tutorial } from '@/components/Tutorial'
import { PushPrompt } from '@/components/PushPrompt'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTutorialStore } from '@/stores/tutorialStore'
import { Loader2, User } from 'lucide-react'

function ProfileSetupModal() {
  const { user, updateUser } = useAuthStore()
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [gender, setGender] = useState(user?.gender || '')
  // metric inputs
  const [heightCm, setHeightCm] = useState(user?.height_cm?.toString() || '')
  const [weightKg, setWeightKg] = useState(user?.weight_kg?.toString() || '')
  // imperial inputs
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const switchUnits = (next: 'metric' | 'imperial') => {
    if (next === units) return
    if (next === 'imperial') {
      // convert metric → imperial for display
      if (heightCm) {
        const totalIn = parseFloat(heightCm) / 2.54
        setHeightFt(String(Math.floor(totalIn / 12)))
        setHeightIn((totalIn % 12).toFixed(1))
      }
      if (weightKg) setWeightLbs((parseFloat(weightKg) * 2.2046).toFixed(1))
    } else {
      // convert imperial → metric for display
      if (heightFt || heightIn) {
        const totalIn = (parseFloat(heightFt || '0') * 12) + parseFloat(heightIn || '0')
        setHeightCm((totalIn * 2.54).toFixed(1))
      }
      if (weightLbs) setWeightKg((parseFloat(weightLbs) / 2.2046).toFixed(1))
    }
    setUnits(next)
  }

  const handleSave = async () => {
    let finalHeightCm: number
    let finalWeightKg: number

    if (units === 'metric') {
      finalHeightCm = parseFloat(heightCm)
      finalWeightKg = parseFloat(weightKg)
    } else {
      finalHeightCm = ((parseFloat(heightFt || '0') * 12) + parseFloat(heightIn || '0')) * 2.54
      finalWeightKg = parseFloat(weightLbs) / 2.2046
    }

    if (!gender || isNaN(finalHeightCm) || isNaN(finalWeightKg)) {
      setError('All three fields are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await authApi.updateProfile({
        gender,
        height_cm: Math.round(finalHeightCm * 10) / 10,
        weight_kg: Math.round(finalWeightKg * 10) / 10,
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
          {/* Units toggle */}
          <div className="flex items-center gap-1 self-start border border-mat-border p-0.5 w-fit">
            {(['metric', 'imperial'] as const).map(u => (
              <button
                key={u}
                onClick={() => switchUnits(u)}
                className={`px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                  units === u ? 'bg-mat-gold text-mat-black font-bold' : 'text-mat-text-muted hover:text-mat-text'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <div>
            <label className="mat-label">Biological Sex</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="mat-input">
              <option value="">— Select —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </div>

          {units === 'metric' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mat-label">Height (cm)</label>
                <input
                  type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  className="mat-input" placeholder="e.g. 178" min="100" max="250" step="0.1"
                />
              </div>
              <div>
                <label className="mat-label">Weight (kg)</label>
                <input
                  type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                  className="mat-input" placeholder="e.g. 76.5" min="30" max="300" step="0.1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
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
  const { hasSeenTutorial, open: openTutorial } = useTutorialStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchProfile()
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Android hardware back button — navigate back or exit the app
    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app')
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back()
          } else {
            App.exitApp()
          }
        })
      } catch {
        // Not running inside Capacitor — ignore
      }
    }
    setupBackButton()
  }, [isAuthenticated, router, fetchProfile])

  const needsBodyMetrics = user && (!user.gender || user.height_cm == null || user.weight_kg == null)

  useEffect(() => {
    if (isAuthenticated && user && !needsBodyMetrics && !hasSeenTutorial) {
      openTutorial()
    }
  }, [isAuthenticated, user, needsBodyMetrics, hasSeenTutorial, openTutorial])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-mat-black">
      <Sidebar />
      <Header />
      <main className="app-main lg:ml-56 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          {children}
        </div>
      </main>
      {needsBodyMetrics && <ProfileSetupModal />}
      <Tutorial />
      <PushPrompt />
      <ConfirmDialog />
    </div>
  )
}
