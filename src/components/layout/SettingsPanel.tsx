import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { db } from '../../lib/db'
import { S } from '../../lib/strings'
import type { ShopSettings } from '../../types'

interface Props {
  settings: ShopSettings
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#1B2A41',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #1B2A41',
  padding: '6px 0',
  fontSize: '14px',
  fontFamily: "'IBM Plex Sans', sans-serif",
  color: '#1B2A41',
  outline: 'none',
  marginBottom: '20px',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#1B2A41',
  color: '#F3EEE2',
  border: 'none',
  padding: '12px',
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontWeight: 600,
  fontSize: '13px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

export default function SettingsPanel({ settings, onClose }: Props) {
  const navigate = useNavigate()
  const [shopName, setShopName] = useState(settings.shop_name)
  const [contact, setContact] = useState(settings.contact)
  const [currencyCode, setCurrencyCode] = useState(settings.currency_code)
  const [decimalPlaces, setDecimalPlaces] = useState<0 | 2>(settings.decimal_places)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!shopName.trim()) { setError(S.errorNameRequired); return }
    setSaving(true); setError('')
    try {
      await db.shop_settings.update(settings.id, {
        shop_name: shopName.trim(),
        contact: contact.trim(),
        currency_code: currencyCode.trim().toUpperCase(),
        decimal_places: decimalPlaces,
      })
      await db.sync_queue.add({
        table_name: 'shop_settings', record_id: settings.id,
        operation: 'upsert', created_at: new Date().toISOString(), attempts: 0,
      })
      onClose()
    } catch {
      setError(S.errorSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(27,42,65,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: '#F3EEE2',
        border: '1px solid #1B2A41',
        padding: '32px',
        width: '400px',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: '8px', border: '1px solid #1B2A41', pointerEvents: 'none' }} />

        <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '18px', margin: '0 0 24px', position: 'relative' }}>
          {S.settingsTitle}
        </h2>

        <form onSubmit={handleSave} style={{ position: 'relative' }}>
          <label style={labelStyle}>{S.labelShopName}</label>
          <input value={shopName} onChange={e => setShopName(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>{S.labelContact}</label>
          <input value={contact} onChange={e => setContact(e.target.value)} style={inputStyle} />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{S.labelCurrencyCode}</label>
              <input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} maxLength={3} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{S.labelDecimalPlaces}</label>
              <select value={decimalPlaces} onChange={e => setDecimalPlaces(Number(e.target.value) as 0 | 2)}
                style={{ ...inputStyle, appearance: 'none' }}>
                <option value={2}>{S.decimalOption2}</option>
                <option value={0}>{S.decimalOption0}</option>
              </select>
            </div>
          </div>

          {error && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#B3362B', margin: '0 0 12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose}
              style={{ ...btnStyle, background: 'transparent', color: '#1B2A41', border: '1px solid #1B2A41', flex: 1 }}>
              {S.btnCancel}
            </button>
            <button type="submit" disabled={saving} style={{ ...btnStyle, flex: 2 }}>
              {saving ? S.btnSaving : S.btnSave}
            </button>
          </div>
        </form>

        <div style={{ borderTop: '1px solid #D8D0BC', marginTop: '24px', paddingTop: '16px', position: 'relative' }}>
          <button onClick={handleLogout}
            style={{ ...btnStyle, background: 'transparent', color: '#B3362B', border: '1px solid #B3362B' }}>
            {S.btnLogout}
          </button>
        </div>
      </div>
    </div>
  )
}
