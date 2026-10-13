import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import { S } from '../../lib/strings'
import AppShell from './AppShell'
import LoadingPage from '../../pages/LoadingPage'
import type { ShopSettings } from '../../types'

/**
 * Checks for an existing shop_settings row in Dexie (offline-safe).
 * Does NOT call supabase.auth.getSession() — works with expired tokens.
 *
 * - No local record + online  → redirect to /login
 * - No local record + offline → show offline-locked message
 * - Local record exists       → render the app (setup_complete check handled by router)
 */
export default function AuthGuard() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<ShopSettings | null | undefined>(undefined)

  useEffect(() => {
    async function check() {
      const all = await db.shop_settings.toArray()
      if (all.length === 0) {
        setSettings(null)
      } else {
        setSettings(all[0])
      }
    }
    check()
  }, [])

  // Still loading
  if (settings === undefined) {
    return <LoadingPage />
  }

  // No local record
  if (settings === null) {
    if (navigator.onLine) {
      navigate('/login', { replace: true })
      return null
    }
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>{S.offlineTitle}</h2>
        <p>{S.offlineMessage}</p>
      </div>
    )
  }

  // Has local record but setup not complete
  if (!settings.setup_complete) {
    navigate('/setup', { replace: true })
    return null
  }

  return <AppShell settings={settings} />
}
