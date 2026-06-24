import { useEffect, useState } from 'react'
import { isNative } from '@/lib/capacitor'
import { notificationsApi } from '@/lib/api'

// ── Web push helpers ──────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buffer
}

async function subscribeWeb(): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const perm = await Notification.requestPermission()
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
    console.warn('Web push subscription failed:', err)
    return false
  }
}

// ── Native push helpers ───────────────────────────────────────────────────────

async function subscribeNative(): Promise<boolean> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const result = await PushNotifications.requestPermissions()
    if (result.receive !== 'granted') return false
    await PushNotifications.register()
    return true
  } catch (err) {
    console.warn('Native push subscription failed:', err)
    return false
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  const webSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  const supported = isNative() || webSupported

  useEffect(() => {
    if (webSupported && !isNative()) {
      setPermission(Notification.permission)
    } else if (isNative()) {
      // Treat as 'default' until they subscribe; we don't query native perm state here
      setPermission('default')
    }
  }, [webSupported])

  const subscribe = async (): Promise<boolean> => {
    if (!supported) return false
    let ok: boolean
    if (isNative()) {
      ok = await subscribeNative()
    } else {
      ok = await subscribeWeb()
    }
    if (ok) setPermission('granted')
    return ok
  }

  return { permission, supported, subscribe }
}

// ── Native push listener setup (call once on app start) ───────────────────────

export async function initNativePush() {
  if (!isNative()) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    PushNotifications.addListener('registration', async (token) => {
      try {
        await notificationsApi.nativeSubscribe({
          token: token.value,
          platform: (await import('@capacitor/core')).Capacitor.getPlatform(),
        })
      } catch (err) {
        console.warn('Failed to register native push token:', err)
      }
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.warn('Native push registration error:', err)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received (foreground):', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification.data?.url
      if (url && typeof window !== 'undefined') {
        window.location.href = url
      }
    })
  } catch (err) {
    console.warn('initNativePush failed:', err)
  }
}
