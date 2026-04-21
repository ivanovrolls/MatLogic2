'use client'

import { useState } from 'react'
import { X, ChevronRight, LayoutDashboard, BookOpen, Database, CalendarDays, Swords, BarChart2, Trophy, HeartPulse, User, Zap, HelpCircle } from 'lucide-react'
import { useTutorialStore } from '@/stores/tutorialStore'

const steps = [
  {
    icon: HelpCircle,
    title: 'Welcome to MatLogic',
    body: 'Your BJJ training intelligence platform. This quick tour covers everything you need to know.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    body: 'Your home base. See training stats, a monthly calendar heatmap, recent sessions, and quick-action shortcuts.',
  },
  {
    icon: Zap,
    title: 'Quick Log',
    body: 'Hit the ⚡ Quick Log bar at the top of the Dashboard to record a session in seconds without leaving the page.',
  },
  {
    icon: BookOpen,
    title: 'Sessions',
    body: 'Log full training sessions with duration, type, techniques used, and notes. Review your full history here.',
  },
  {
    icon: Database,
    title: 'Arsenal',
    body: 'Your personal technique database. Save BJJ moves, tag them by position or category, and track how often you drill them.',
  },
  {
    icon: CalendarDays,
    title: 'Planner',
    body: 'Plan your weekly training schedule. Assign session types and goals to each day to stay consistent.',
  },
  {
    icon: Swords,
    title: 'Sparring',
    body: 'Track individual sparring rounds, partners, duration, and observations to refine your game.',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    body: 'Visualize training volume, technique usage, and progress trends over time.',
  },
  {
    icon: Trophy,
    title: 'Competition',
    body: 'Log tournament results, divisions, and outcomes. Keep a complete competitive record.',
  },
  {
    icon: HeartPulse,
    title: 'Injuries',
    body: 'Track injuries, severity, and affected areas so you can train around them and monitor recovery.',
  },
  {
    icon: User,
    title: 'Profile',
    body: 'Update your belt rank, body metrics, and account settings. Accurate weight/height enables calorie estimates.',
  },
]

export function Tutorial() {
  const { isOpen, close } = useTutorialStore()
  const [step, setStep] = useState(0)

  if (!isOpen) return null

  const { icon: Icon, title, body } = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      close()
      setStep(0)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleClose = () => {
    close()
    setStep(0)
  }

  return (
    <div className="fixed inset-0 z-[60] mat-overlay flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-mat-card border border-mat-gold/30 w-full max-w-sm p-6 animate-slide-up">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-mat-gold/10 border border-mat-gold/30 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-mat-gold" />
            </div>
            <h3 className="font-display text-lg tracking-wider text-mat-text uppercase">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-mat-text-dim hover:text-mat-text transition-colors shrink-0 mt-0.5"
            aria-label="Close tutorial"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p className="text-mat-text-muted text-sm leading-relaxed mb-6">{body}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 transition-colors ${i === step ? 'bg-mat-gold' : 'bg-mat-border hover:bg-mat-text-dim'}`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            {isLast ? 'Done' : 'Next'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
