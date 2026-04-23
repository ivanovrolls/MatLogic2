'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { coachingApi } from '@/lib/api'
import { useCoachingStore } from '@/stores/coachingStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Users, ChevronRight, Loader2, Calendar, BookOpen, AlertCircle, X } from 'lucide-react'
import { BELT_COLORS } from '@/lib/utils'
import type { StudentSummary, CoachRelationship } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export default function CoachingPage() {
  const { isCoachMode, enterCoachMode, exitCoachMode } = useCoachingStore()
  const router = useRouter()

  const { data: students, isLoading: studentsLoading } = useQuery<StudentSummary[]>({
    queryKey: ['coaching-students'],
    queryFn: () => coachingApi.getStudents().then(r => r.data),
    enabled: isCoachMode,
  })

  const { data: requests } = useQuery<CoachRelationship[]>({
    queryKey: ['coaching-requests'],
    queryFn: () => coachingApi.getRequests().then(r => r.data),
    enabled: isCoachMode,
  })

  const pendingRequests = requests?.filter(r => r.status === 'pending') || []

  if (!isCoachMode) {
    return (
      <div className="fixed inset-0 z-40 mat-overlay flex items-center justify-center p-4">
        <div className="bg-mat-card border border-mat-gold/30 w-full max-w-sm p-8 space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mat-gold/10 border border-mat-gold/30 flex items-center justify-center">
              <GraduationCap size={18} className="text-mat-gold" />
            </div>
            <div>
              <p className="text-mat-text-muted text-xs uppercase tracking-widest">Switch View</p>
              <h2 className="font-display text-2xl tracking-wider text-mat-text uppercase">Coach Mode</h2>
            </div>
          </div>
          <p className="text-mat-text-muted text-sm leading-relaxed">
            Switch to a coaching view to see your students&apos; training data, assign techniques, and create drilling plans.
            Your own data will be hidden until you exit.
          </p>
          <div className="flex gap-3">
            <button onClick={enterCoachMode} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              <GraduationCap size={14} /> Enter Coach Mode
            </button>
            <button onClick={() => router.back()} className="btn-secondary flex-1 py-3">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-mat-gold text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <GraduationCap size={12} /> Coach Mode Active
          </p>
          <h1 className="font-display text-4xl tracking-wider text-mat-text uppercase">My Students</h1>
        </div>
        <button
          onClick={() => { exitCoachMode(); router.push('/dashboard') }}
          className="flex items-center gap-1.5 text-xs text-mat-text-muted hover:text-mat-red-light transition-colors border border-mat-border hover:border-mat-red-light/50 px-3 py-2"
        >
          <X size={12} /> Exit Coach Mode
        </button>
      </div>

      {/* Pending requests banner */}
      {pendingRequests.length > 0 && (
        <div className="bg-mat-gold/5 border border-mat-gold/30 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-mat-gold shrink-0" />
            <p className="text-mat-gold text-sm font-semibold">
              {pendingRequests.length} pending coaching request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/profile#coach-requests" className="text-mat-gold/70 hover:text-mat-gold text-xs transition-colors shrink-0">
            Review →
          </Link>
        </div>
      )}

      {/* Aggregate stats */}
      {students && students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Students</p>
            <p className="font-display text-3xl text-mat-gold">{students.length}</p>
          </div>
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Total Sessions</p>
            <p className="font-display text-3xl text-mat-gold">
              {students.reduce((s, st) => s + st.total_sessions, 0)}
            </p>
          </div>
          <div className="bg-mat-card border border-mat-border p-4 text-center">
            <p className="text-mat-text-muted text-xs uppercase tracking-widest mb-1">Pending Review</p>
            <p className="font-display text-3xl text-mat-gold">
              {students.reduce((s, st) => s + st.pending_techniques, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Students list */}
      {studentsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-mat-gold" />
        </div>
      ) : !students || students.length === 0 ? (
        <div className="bg-mat-card border border-mat-border p-10 text-center space-y-3">
          <Users size={32} className="text-mat-text-dim mx-auto" />
          <p className="text-mat-text-muted text-sm">No accepted students yet.</p>
          <p className="text-mat-text-dim text-xs">
            Students can request you as a coach via their profile page using your username.
            Accept their requests from your Profile page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(student => {
            const beltColor = BELT_COLORS[student.belt]?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-mat-gold'
            return (
              <Link
                key={student.id}
                href={`/coaching/${student.id}`}
                className="bg-mat-card border border-mat-border hover:border-mat-gold/40 transition-colors flex items-center gap-4 p-4 group"
              >
                {/* Avatar */}
                <div className="w-11 h-11 bg-mat-muted border border-mat-border flex items-center justify-center text-mat-gold font-bold shrink-0 overflow-hidden">
                  {student.avatar
                    ? <img src={student.avatar} alt={student.username} className="w-full h-full object-cover" />
                    : student.username.slice(0, 2).toUpperCase()
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-mat-text font-semibold text-sm">{student.username}</p>
                    <span className={`text-xs font-semibold capitalize ${beltColor}`}>{student.belt}</span>
                    {student.pending_techniques > 0 && (
                      <span className="text-xs bg-mat-gold/10 text-mat-gold border border-mat-gold/30 px-1.5 py-0.5">
                        {student.pending_techniques} pending
                      </span>
                    )}
                  </div>
                  <p className="text-mat-text-dim text-xs">{student.gym || 'No gym listed'}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <p className="text-mat-gold font-bold text-sm">{student.total_sessions}</p>
                    <p className="text-mat-text-dim text-xs flex items-center gap-1"><BookOpen size={9} /> sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-mat-gold font-bold text-sm">{student.total_techniques}</p>
                    <p className="text-mat-text-dim text-xs">techniques</p>
                  </div>
                  {student.last_session && (
                    <div className="text-center">
                      <p className="text-mat-text text-xs font-medium">{formatDate(student.last_session, 'MMM d')}</p>
                      <p className="text-mat-text-dim text-xs flex items-center gap-1"><Calendar size={9} /> last session</p>
                    </div>
                  )}
                </div>

                <ChevronRight size={14} className="text-mat-text-dim group-hover:text-mat-gold transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
