import { useEffect, useState } from 'react'
import { notificationsApi } from '@/lib/api'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buffer
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const supported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  useEffect(() => {
    if (supported) setPermission(Notification.permission)
  }, [supported])

  const subscribe = async (): Promise<boolean> => {
    if (!supported) return false
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
      return false
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await notificationsApi.subscribe({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      })
      return true
    } catch (err) {
      console.warn('Push subscription failed:', err)
      return false
    }
  }

  return { permission, supported, subscribe }
}
