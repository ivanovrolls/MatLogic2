'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

// ── Android install hook ──────────────────────────────────────────────────────

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    // Hide button if already installed
    window.addEventListener('appinstalled', () => setIsInstallable(false))
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  return { isInstallable, install }
}

// ── Android install button ────────────────────────────────────────────────────

export function AndroidInstallButton({ className }: { className?: string }) {
  const { isInstallable, install } = useInstallPrompt()
  if (!isInstallable) return null

  return (
    <button
      onClick={install}
      className={className ?? 'flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-mat-gold border border-mat-gold hover:bg-mat-gold hover:text-mat-black transition-colors'}
    >
      <Download size={13} />
      Add to Home Screen
    </button>
  )
}

// ── iOS helpers ───────────────────────────────────────────────────────────────

function isIOSSafari() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isWebkit = /webkit/i.test(ua)
  const isChrome = /crios/i.test(ua)
  return isIOS && isWebkit && !isChrome
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (window.navigator as any).standalone === true
}

// ── iOS install banner (landing page) ────────────────────────────────────────

export function IOSInstallBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('ios-banner-dismissed')
    if (!wasDismissed && isIOSSafari() && !isStandalone()) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('ios-banner-dismissed', '1')
    setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-mat-darker border-t border-mat-gold/40 px-4 py-4 flex items-start gap-3 animate-fade-in">
      <div className="flex-1">
        <p className="text-mat-gold text-xs font-bold uppercase tracking-wider mb-1">
          Install MatLogic
        </p>
        <p className="text-mat-text-muted text-xs leading-relaxed">
          Tap{' '}
          <span className="inline-flex items-center gap-0.5 text-mat-text">
            <Share size={12} className="inline" /> Share
          </span>
          {' '}then{' '}
          <span className="text-mat-text font-semibold">"Add to Home Screen"</span>
          {' '}to install MatLogic on your iPhone.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="text-mat-text-dim hover:text-mat-text transition-colors mt-0.5 shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
