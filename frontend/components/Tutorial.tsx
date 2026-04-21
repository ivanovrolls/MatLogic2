'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronRight, LayoutDashboard, BookOpen, Database, CalendarDays,
  Swords, BarChart2, Trophy, HeartPulse, User, Zap, HelpCircle,
} from 'lucide-react'
import { useTutorialStore } from '@/stores/tutorialStore'

type Placement = 'center' | 'right' | 'bottom'
type ArrowDir = 'left' | 'top' | 'none'

interface Step {
  icon: React.ElementType
  title: string
  body: string
  target: string | null
  placement: Placement
}

const TOOLTIP_W = 288
const TOOLTIP_H = 220  // slightly generous so clamping keeps tooltip in viewport
const GAP = 14

const STEPS: Step[] = [
  {
    icon: HelpCircle,
    title: 'Welcome to MatLogic',
    body: 'Your BJJ training intelligence platform. This quick tour covers everything you need to know.',
    target: null,
    placement: 'center',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    body: 'Your home base. See training stats, a monthly calendar heatmap, recent sessions, and quick-action shortcuts.',
    target: '[data-tutorial="nav-dashboard"]',
    placement: 'right',
  },
  {
    icon: Zap,
    title: 'Quick Log',
    body: 'Hit the Quick Log bar to record a session in seconds without leaving the dashboard.',
    target: '[data-tutorial="quick-log"]',
    placement: 'bottom',
  },
  {
    icon: BookOpen,
    title: 'Sessions',
    body: 'Log full training sessions with duration, type, techniques used, and notes. Review your full history here.',
    target: '[data-tutorial="nav-sessions"]',
    placement: 'right',
  },
  {
    icon: Database,
    title: 'Arsenal',
    body: 'Your personal technique database. Save BJJ moves, tag them by position, and track how often you drill them.',
    target: '[data-tutorial="nav-arsenal"]',
    placement: 'right',
  },
  {
    icon: CalendarDays,
    title: 'Planner',
    body: 'Plan your weekly training schedule. Assign session types and goals to each day to stay consistent.',
    target: '[data-tutorial="nav-planner"]',
    placement: 'right',
  },
  {
    icon: Swords,
    title: 'Sparring',
    body: 'Track individual sparring rounds, partners, and observations to refine your game.',
    target: '[data-tutorial="nav-sparring"]',
    placement: 'right',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    body: 'Visualize training volume, technique usage, and progress trends over time.',
    target: '[data-tutorial="nav-analytics"]',
    placement: 'right',
  },
  {
    icon: Trophy,
    title: 'Competition',
    body: 'Log tournament results, divisions, and outcomes. Keep a complete competitive record.',
    target: '[data-tutorial="nav-competition"]',
    placement: 'right',
  },
  {
    icon: HeartPulse,
    title: 'Injuries',
    body: 'Track injuries and affected areas so you can train around them and monitor recovery.',
    target: '[data-tutorial="nav-injuries"]',
    placement: 'right',
  },
  {
    icon: User,
    title: 'Profile',
    body: 'Update your belt rank, body metrics, and account settings. Accurate metrics enable calorie estimates.',
    target: '[data-tutorial="nav-profile"]',
    placement: 'right',
  },
]

interface TooltipPos {
  top: number
  left: number
  arrowDir: ArrowDir
}

export function Tutorial() {
  const { isOpen, close } = useTutorialStore()
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<TooltipPos | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const currentStep = STEPS[step]

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Compute tooltip position (desktop only)
  const computePosition = useCallback(() => {
    if (!isOpen || !currentStep.target || typeof window === 'undefined' || window.innerWidth < 1024) {
      setPos(null)
      return
    }

    const el = document.querySelector<HTMLElement>(currentStep.target)
    if (!el) { setPos(null); return }

    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (currentStep.placement === 'right') {
      const left = rect.right + GAP
      if (left + TOOLTIP_W > vw - 8) { setPos(null); return }
      const top = Math.max(8, Math.min(
        rect.top + rect.height / 2 - TOOLTIP_H / 2,
        vh - TOOLTIP_H - 8,
      ))
      setPos({ top, left, arrowDir: 'left' })
    } else if (currentStep.placement === 'bottom') {
      const left = Math.max(8, Math.min(rect.left, vw - TOOLTIP_W - 8))
      const topBelow = rect.bottom + GAP
      if (topBelow + TOOLTIP_H < vh - 8) {
        setPos({ top: topBelow, left, arrowDir: 'top' })
      } else {
        setPos({ top: Math.max(8, rect.top - TOOLTIP_H - GAP), left, arrowDir: 'none' })
      }
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    computePosition()
    window.addEventListener('resize', computePosition)
    return () => window.removeEventListener('resize', computePosition)
  }, [computePosition])

  // Gold glow on target element
  useEffect(() => {
    if (!isOpen || !currentStep.target) return
    const el = document.querySelector<HTMLElement>(currentStep.target)
    if (!el) return
    const prevShadow = el.style.boxShadow
    const prevTransition = el.style.transition
    el.style.transition = 'box-shadow 0.2s'
    el.style.boxShadow = '0 0 0 2px #d4af37, 0 0 14px 3px rgba(212,175,55,0.25)'
    return () => {
      el.style.boxShadow = prevShadow
      el.style.transition = prevTransition
    }
  }, [isOpen, step, currentStep.target])

  // On mobile: scroll target element into view when step changes
  useEffect(() => {
    if (!isOpen || !isMobile || !currentStep.target) return
    const el = document.querySelector<HTMLElement>(currentStep.target)
    if (!el) return
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => clearTimeout(timer)
  }, [isOpen, step, isMobile, currentStep.target])

  if (!isOpen) return null

  const { icon: Icon, title, body } = currentStep
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) { close(); setStep(0) }
    else setStep(s => s + 1)
  }
  const handleClose = () => { close(); setStep(0) }

  const dots = (
    <div className="flex gap-1">
      {STEPS.map((_, i) => (
        <button
          key={i}
          onClick={() => setStep(i)}
          className={`w-1.5 h-1.5 transition-colors ${i === step ? 'bg-mat-gold' : 'bg-mat-border hover:bg-mat-text-dim'}`}
          aria-label={`Go to step ${i + 1}`}
        />
      ))}
    </div>
  )

  const cardInner = (arrowDir: ArrowDir = 'none') => (
    <>
      {arrowDir === 'left' && (
        <div
          className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-mat-card rotate-45"
          style={{ borderLeft: '1px solid rgba(212,175,55,0.3)', borderBottom: '1px solid rgba(212,175,55,0.3)' }}
        />
      )}
      {arrowDir === 'top' && (
        <div
          className="absolute -top-[5px] left-5 w-2.5 h-2.5 bg-mat-card rotate-45"
          style={{ borderTop: '1px solid rgba(212,175,55,0.3)', borderLeft: '1px solid rgba(212,175,55,0.3)' }}
        />
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-mat-gold/10 border border-mat-gold/30 flex items-center justify-center shrink-0">
            <Icon size={13} className="text-mat-gold" />
          </div>
          <h3 className="font-display text-base tracking-wider text-mat-text uppercase">{title}</h3>
        </div>
        <button onClick={handleClose} className="text-mat-text-dim hover:text-mat-text transition-colors shrink-0 mt-0.5" aria-label="Close tutorial">
          <X size={14} />
        </button>
      </div>
      <p className="text-mat-text-muted text-xs leading-relaxed mb-4">{body}</p>
      <div className="flex items-center justify-between">
        {dots}
        <button onClick={handleNext} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
          {isLast ? 'Done' : 'Next'}
          {!isLast && <ChevronRight size={12} />}
        </button>
      </div>
    </>
  )

  // --- Mobile: fixed bottom sheet, scrolls target into view behind it ---
  if (isMobile) {
    return (
      <div
        className="bg-mat-card border-t border-mat-gold/30 p-5 shadow-2xl animate-slide-up"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70 }}
      >
        <div className="relative">{cardInner()}</div>
      </div>
    )
  }

  // --- Desktop: positioned tooltip next to target element ---
  if (pos) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20" style={{ zIndex: 65 }} onClick={handleClose} />
        <div
          className="bg-mat-card border border-mat-gold/30 p-5 shadow-xl animate-slide-up"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: TOOLTIP_W, zIndex: 70 }}
        >
          {/* relative wrapper so arrows can use absolute positioning */}
          <div className="relative">{cardInner(pos.arrowDir)}</div>
        </div>
      </>
    )
  }

  // --- Desktop fallback: centered modal (Welcome step, or if element not found) ---
  return (
    <div className="fixed inset-0 z-[60] mat-overlay flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-mat-card border border-mat-gold/30 w-full max-w-sm p-5 shadow-xl animate-slide-up">
        <div className="relative">{cardInner()}</div>
      </div>
    </div>
  )
}
