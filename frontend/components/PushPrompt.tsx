'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import toast from 'react-hot-toast'

const DISMISSED_KEY = 'push-prompt-dismissed'

export function PushPrompt() {
  const { permission, supported, subscribe } = usePushNotifications()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (supported && permission === 'default') {
      setVisible(localStorage.getItem(DISMISSED_KEY) !== 'true')
    }
  }, [supported, permission])

  if (!visible) return null

  const handleEnable = async () => {
    setVisible(false)
    const ok = await subscribe()
    if (ok) toast.success('Challenge notifications enabled.')
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-mat-card border border-mat-gold/40 px-4 py-3 shadow-2xl w-[calc(100%-2rem)] max-w-sm animate-slide-up lg:left-[calc(50%+112px)]">
      <Bell size={13} className="text-mat-gold shrink-0" />
      <p className="text-mat-text text-xs flex-1 leading-snug">
        Enable notifications for challenge alerts.
      </p>
      <button
        onClick={handleEnable}
        className="btn-primary text-xs px-3 py-1.5 shrink-0"
      >
        Enable
      </button>
      <button
        onClick={handleDismiss}
        className="text-mat-text-dim hover:text-mat-text transition-colors shrink-0 ml-1"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  )
}
