'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronRight, LayoutDashboard, BookOpen, Database, CalendarDays,
  BarChart2, User, Zap, HelpCircle, Lightbulb, Swords, Users,
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
const TOOLTIP_H = 220
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
    body: 'Your home base. See training stats, AI-powered insights, recent sessions, active challenges, and quick-action shortcuts.',
    target: '[data-tutorial="nav-dashboard"]',
    placement: 'right',
  },
  {
    icon: Zap,
    title: 'Log a Session',
    body: 'Hit the Log Today\'s Session button to jump straight to the full session form — date, type, duration, techniques, and more.',
    target: '[data-tutorial="quick-log"]',
    placement: 'bottom',
  },
  {
    icon: Lightbulb,
    title: 'Insights',
    body: 'AI-generated observations about your training patterns: warnings, highlights, and suggestions to help you keep improving.',
    target: '[data-tutorial="insights"]',
    placement: 'bottom',
  },
  {
    icon: BookOpen,
    title: 'Sessions',
    body: 'Log full training sessions with duration, type, and notes. The Injuries tab tracks what\'s affecting your training, and the Competitions tab is where you log tournament results and match breakdowns.',
    target: '[data-tutorial="nav-sessions"]',
    placement: 'right',
  },
  {
    icon: Database,
    title: 'Techniques',
    body: 'Your personal technique database. Save BJJ moves, tag them by position, and track how often you drill them.',
    target: '[data-tutorial="nav-techniques"]',
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
    icon: BarChart2,
    title: 'Analytics',
    body: 'Visualize training volume, technique usage, and sparring trends. The Calendar tab shows your monthly training heatmap, and the Sparring Log tab has a full history of your rounds.',
    target: '[data-tutorial="nav-analytics"]',
    placement: 'right',
  },
  {
    icon: Users,
    title: 'The Dojo',
    body: 'Your gym\'s leaderboard. Every public member from your gym appears here ranked by mat time, sessions, win rate, or streak. Rivals are auto-detected from your sparring partners.',
    target: '[data-tutorial="nav-dojo"]',
    placement: 'right',
  },
  {
    icon: Swords,
    title: 'Challenges',
    body: 'Challenge gym mates to head-to-head competitions: most sessions, hours on the mat, or highest win rate over 3–30 days. Accept or decline incoming challenges right here on the dashboard.',
    target: '[data-tutorial="challenges"]',
    placement: 'bottom',
  },
  {
    icon: User,
    title: 'Profile',
    body: 'Update your belt rank, body metrics, and account settings. Toggle between metric and imperial, and opt in to the Dojo leaderboard to appear to your gym mates.',
    target: '[data-tutorial="nav-profile"]',
    placement: 'right',
  },
]

interface TooltipPos {
  top: number
  left: number
  arrowDir: ArrowDir
}

const isNavTarget = (target: string | null) => !!target?.includes('"nav-')

export function Tutorial() {
  const { isOpen, close } = useTutorialStore()
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<TooltipPos | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const currentStep = STEPS[step]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  // Mobile: dispatch menu open/close so Header can respond
  useEffect(() => {
    if (!isMobile) return
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('tutorial:close-menu'))
      return
    }
    const event = isNavTarget(currentStep.target) ? 'tutorial:open-menu' : 'tutorial:close-menu'
    window.dispatchEvent(new CustomEvent(event))
  }, [isOpen, isMobile, step, currentStep.target])

  // Mobile: scroll non-nav targets into view above the bottom sheet
  useEffect(() => {
    if (!isOpen || !isMobile || !currentStep.target || isNavTarget(currentStep.target)) return
    const timer = setTimeout(() => {
      document.querySelector<HTMLElement>(currentStep.target!)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
    return () => clearTimeout(timer)
  }, [isOpen, step, isMobile, currentStep.target])

  // Gold glow — retries after 320 ms for mobile menu items that animate in
  useEffect(() => {
    if (!isOpen || !currentStep.target) return
    const target = currentStep.target
    let applied: HTMLElement | null = null

    const apply = () => {
      const el = document.querySelector<HTMLElement>(target)
      if (!el || applied) return
      applied = el
      el.style.transition = 'box-shadow 0.2s'
      el.style.boxShadow = '0 0 0 2px #d4af37, 0 0 14px 3px rgba(212,175,55,0.25)'
    }

    apply()
    const timer = setTimeout(apply, 320)

    return () => {
      clearTimeout(timer)
      if (applied) {
        applied.style.boxShadow = ''
        applied.style.transition = ''
      }
    }
  }, [isOpen, step, currentStep.target])

  if (!isOpen) return null

  const { icon: Icon, title, body } = currentStep
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) { close(); setStep(0) }
    else setStep(s => s + 1)
  }
  const handleClose = () => { close(); setStep(0) }

  const cardBody = (
    <>
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
        <button onClick={handleNext} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
          {isLast ? 'Done' : 'Next'}
          {!isLast && <ChevronRight size={12} />}
        </button>
      </div>
    </>
  )

  // Mobile: fixed bottom sheet
  if (isMobile) {
    return (
      <div
        className="bg-mat-card border-t border-mat-gold/30 p-5 shadow-2xl animate-slide-up"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70 }}
      >
        {cardBody}
      </div>
    )
  }

  // Desktop: positioned tooltip
  // Arrows are direct children of the position:fixed parent, which is itself a positioning
  // context — so absolute -left-[5px] places them outside the card border, not inside the padding.
  if (pos) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20" style={{ zIndex: 65 }} onClick={handleClose} />
        <div
          className="bg-mat-card border border-mat-gold/30 p-5 shadow-xl animate-slide-up"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: TOOLTIP_W, zIndex: 70 }}
        >
          {pos.arrowDir === 'left' && (
            <div
              className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-mat-card rotate-45"
              style={{ borderLeft: '1px solid rgba(212,175,55,0.3)', borderBottom: '1px solid rgba(212,175,55,0.3)' }}
            />
          )}
          {pos.arrowDir === 'top' && (
            <div
              className="absolute -top-[5px] left-5 w-2.5 h-2.5 bg-mat-card rotate-45"
              style={{ borderTop: '1px solid rgba(212,175,55,0.3)', borderLeft: '1px solid rgba(212,175,55,0.3)' }}
            />
          )}
          {cardBody}
        </div>
      </>
    )
  }

  // Desktop: centered modal (Welcome step or element not found)
  return (
    <div className="fixed inset-0 z-[60] mat-overlay flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-mat-card border border-mat-gold/30 w-full max-w-sm p-5 shadow-xl animate-slide-up">
        {cardBody}
      </div>
    </div>
  )
}
