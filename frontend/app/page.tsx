'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  BookOpen, BarChart2, Target, Trophy, Users, Zap, ChevronRight
} from 'lucide-react'
import { AndroidInstallButton, IOSInstallBanner } from '@/components/InstallPrompt'

const features = [
  {
    icon: BookOpen,
    title: 'Session Diary',
    desc: 'Log every mat session. Notes, performance ratings, energy levels, techniques drilled.',
  },
  {
    icon: Target,
    title: 'Technique Database',
    desc: 'Build your personal system. Tag by position and type. Chain techniques into game flows.',
  },
  {
    icon: Users,
    title: 'Sparring Log',
    desc: 'Track rounds, partners, outcomes, and positions. Stop repeating the same mistakes.',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    desc: 'Win rates, submission trends, positional weaknesses. Data-driven self-assessment.',
  },
  {
    icon: Zap,
    title: 'Weekly Planner',
    desc: 'Deliberate practice over random drilling. Set weekly focus and generate checklists.',
  },
  {
    icon: Trophy,
    title: 'Competition Mode',
    desc: 'Log matches, build game plans, review comp performance.',
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-mat-black gritty-bg">
      {/* Nav */}
      <nav className="border-b border-mat-border px-6 py-4 flex items-center justify-between">
        <span className="font-display text-3xl tracking-widest text-mat-gold">
          MAT<span className="text-mat-text">LOGIC</span>
        </span>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-xs px-5 py-2">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-xs px-5 py-2">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 max-w-5xl mx-auto text-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="font-display text-[20rem] text-mat-gold leading-none select-none">BJJ</span>
        </div>
        <div className="relative">
          <p className="text-mat-text-muted text-xs uppercase tracking-[0.4em] mb-4">
            For grapplers who take it seriously
          </p>
          <h1 className="font-display text-7xl md:text-9xl tracking-wider text-mat-text leading-none mb-6">
            TRAIN<br />
            <span className="text-mat-gold">SMARTER.</span>
          </h1>
          <p className="text-mat-text-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            MatLogic is the training intelligence platform built for Brazilian Jiu-Jitsu practitioners.
            Stop training blind. Start tracking what matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary px-8 py-3 text-sm inline-flex items-center gap-2">
              Start Tracking Free
              <ChevronRight size={16} />
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3 text-sm">
              Sign In
            </Link>
            <AndroidInstallButton />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-mat-border bg-mat-darker">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-mat-border text-center">
          {[['6', 'Core Modules'], ['100%', 'Yours'], ['Free', 'To Start']].map(([val, label]) => (
            <div key={label} className="px-6">
              <div className="font-display text-4xl text-mat-gold">{val}</div>
              <div className="text-mat-text-muted text-xs uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-display text-4xl text-mat-text uppercase tracking-wider mb-12 text-center">
          Everything you need.<br />
          <span className="text-mat-text-muted text-2xl">Nothing you don't.</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-mat-border">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-mat-black p-6 hover:bg-mat-darker transition-colors group">
              <Icon
                size={20}
                className="text-mat-gold mb-3 group-hover:scale-110 transition-transform"
              />
              <h3 className="font-display text-xl tracking-wider text-mat-text uppercase mb-2">
                {title}
              </h3>
              <p className="text-mat-text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-mat-border py-20 text-center">
        <p className="text-mat-text-muted text-xs uppercase tracking-[0.4em] mb-4">
          The mat doesn't lie. Neither does your data.
        </p>
        <h2 className="font-display text-5xl text-mat-text uppercase tracking-wider mb-8">
          Ready to level up?
        </h2>
        <Link href="/register" className="btn-primary px-10 py-4 text-sm inline-flex items-center gap-2">
          Create Free Account
          <ChevronRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-mat-border py-8 px-6 text-center text-mat-text-dim text-xs uppercase tracking-widest">
        MatLogic © 2024 — Train. Track. Improve.
      </footer>

      {/* iOS install banner */}
      <IOSInstallBanner />
    </div>
  )
}
