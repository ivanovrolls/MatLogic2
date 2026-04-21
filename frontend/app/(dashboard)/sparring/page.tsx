'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SparringRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = searchParams.get('session')

  useEffect(() => {
    const dest = session ? `/sessions?tab=sparring&session=${session}` : '/sessions?tab=sparring'
    router.replace(dest)
  }, [router, session])

  return null
}
