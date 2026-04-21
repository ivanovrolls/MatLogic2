'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InjuriesRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/sessions?tab=injuries') }, [router])
  return null
}
