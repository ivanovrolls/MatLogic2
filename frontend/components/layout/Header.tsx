'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Menu, X, LayoutDashboard, BookOpen, Database, CalendarDays,
  BarChart2, Trophy, User, LogOut, Sun, Moon, HelpCircle,
} from 'lucide-react'
import { AndroidInstallButton } from '@/components/InstallPrompt'
import { useThemeStore } from '@/stores/themeStore'
import { useTutorialStore } from '@/stores/tutorialStore'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tutorialId: 'nav-dashboard' },
  { href: '/sessions', label: 'Sessions', icon: BookOpen, tutorialId: 'nav-sessions' },
  { href: '/techniques', label: 'Arsenal', icon: Database, tutorialId: 'nav-arsenal' },
  { href: '/planning', label: 'Planner', icon: CalendarDays, tutorialId: 'nav-planner' },
  { href: '/progress', label: 'Analytics', icon: BarChart2, tutorialId: 'nav-analytics' },
  { href: '/competition', label: 'Competition', icon: Trophy, tutorialId: 'nav-competition' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { open: openTutorial } = useTutorialStore()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out.')
    router.push('/login')
    setOpen(false)
  }

  // Allow Tutorial component to control menu open/close on mobile
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)
    window.addEventListener('tutorial:open-menu', handleOpen)
    window.addEventListener('tutorial:close-menu', handleClose)
    return () => {
      window.removeEventListener('tutorial:open-menu', handleOpen)
      window.removeEventListener('tutorial:close-menu', handleClose)
    }
  }, [])

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-mat-darker border-b border-mat-border px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-mat-text-muted hover:text-mat-gold transition-colors p-1"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-20 mat-overlay pt-14 animate-fade-in">
          <nav className="px-4 py-6 space-y-1">
            {navItems.map(({ href, label, icon: Icon, tutorialId }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  data-tutorial={tutorialId}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 text-sm transition-colors',
                    active
                      ? 'text-mat-gold bg-mat-gold/5 border-l-2 border-mat-gold'
                      : 'text-mat-text-muted hover:text-mat-text border-l-2 border-transparent'
                  )}
                >
                  <Icon size={16} />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
            <div className="divider" />
            <AndroidInstallButton className="flex items-center gap-4 w-full px-4 py-3 text-mat-gold text-sm" />
            <button
              onClick={() => { toggleTheme(); setOpen(false) }}
              className="flex items-center gap-4 w-full px-4 py-3 text-mat-text-muted text-sm border-l-2 border-transparent"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <Link
              href="/profile"
              data-tutorial="nav-profile"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-4 px-4 py-3 text-sm border-l-2',
                pathname === '/profile'
                  ? 'text-mat-gold bg-mat-gold/5 border-mat-gold'
                  : 'text-mat-text-muted border-transparent'
              )}
            >
              <User size={16} /> Profile
            </Link>
            <button
              onClick={() => { openTutorial(); setOpen(false) }}
              className="flex items-center gap-4 w-full px-4 py-3 text-mat-text-muted text-sm border-l-2 border-transparent"
            >
              <HelpCircle size={16} /> Help Tour
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 text-mat-red-light text-sm"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
