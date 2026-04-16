'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Min 3 characters').max(30),
  password: z.string().min(8, 'Min 8 characters'),
  password2: z.string(),
  belt: z.enum(['white', 'blue', 'purple', 'brown', 'black']),
  gym: z.string().optional(),
}).refine((d) => d.password === d.password2, {
  message: "Passwords don't match",
  path: ['password2'],
})
type FormData = z.infer<typeof schema>

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { belt: 'white' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data)
      toast.success('Account created. Welcome to the mats.')
      router.push('/dashboard')
    } catch (err: any) {
      const msg =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.detail ||
        'Registration failed.'
      toast.error(msg)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <Link href="/" className="font-display text-4xl tracking-widest">
          <span className="text-mat-gold">MAT</span>
          <span className="text-mat-text">LOGIC</span>
        </Link>
        <p className="text-mat-text-muted text-xs uppercase tracking-widest mt-2">
          Create Your Account
        </p>
      </div>

      <div className="bg-mat-card border border-mat-border p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mat-label">Email</label>
            <input {...register('email')} type="email" className="mat-input" placeholder="your@email.com" />
            {errors.email && <p className="text-mat-red-light text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mat-label">Username</label>
            <input {...register('username')} className="mat-input" placeholder="jitsu_warrior" />
            {errors.username && <p className="text-mat-red-light text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mat-label">Belt</label>
              <select {...register('belt')} className="mat-input">
                {BELTS.map((b) => (
                  <option key={b} value={b}>
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mat-label">Gym (optional)</label>
              <input {...register('gym')} className="mat-input" placeholder="Your gym" />
            </div>
          </div>

          <div>
            <label className="mat-label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="mat-input pr-10"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mat-text-dim hover:text-mat-text-muted"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-mat-red-light text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mat-label">Confirm Password</label>
            <input
              {...register('password2')}
              type="password"
              className="mat-input"
              placeholder="Repeat password"
            />
            {errors.password2 && <p className="text-mat-red-light text-xs mt-1">{errors.password2.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Creating Account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-mat-text-muted text-sm mt-6">
        Already training?{' '}
        <Link href="/login" className="text-mat-gold hover:text-mat-gold-light transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  )
}
