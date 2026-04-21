'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CompetitionRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/progress?tab=competition') }, [router])
  return null
}
