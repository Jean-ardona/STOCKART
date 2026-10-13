import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { seedSampleProducts } from '../lib/sampleData'
import { S } from '../lib/strings'

const cover: React.CSSProperties = {
  width: '520px', minHeight: '560px', background: '#1B2A41',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  paddingTop: '52px', paddingBottom: '48px', paddingLeft: '14px',
  position: 'relative', boxSizing: 'border-box',
}
const plate: React.CSSProperties = {
  background: '#F3EEE2', padding: '32px', width: '380px',
  position: 'relative', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#1B2A41', marginBottom: '6px',
}
const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: 'transparent',
  border: 'none', borderBottom: '1px solid #1B2A41',
  padding: '6px 0', fontSize: '14px',
  fontFamily: "'IBM Plex Sans', sans-serif", color: '#1B2A41',
  outline: 'none', marginBottom: '20px', boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: '#1B2A41', color: '#F3EEE2',
  border: 'none', padding: '14px', fontFamily: "'IBM Plex Sans', sans-serif",
  fontWeight: 600, fontSize: '13px', letterSpacing: '0.1em',
  textTransform: 'uppercase', cursor: 'pointer', marginTop: '8px',
}

export default function SetupPage() {
  const navigate = useNavigate()
  const [shopName, setShopName] = useState('')
  const [contact, setContact] = useState('')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [decimalPlaces, setDecimalPlaces] = useState<0 | 2>(2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shopName.trim()) { setError(S.errorShopNameRequired); return }
    setSaving(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError(S.errorNotAuthenticated); return }
      const now = new Date().toISOString()
      const settingsId = crypto.randomUUID()
      await db.transaction('rw', db.shop_settings, db.sync_queue, async () => {
        await db.shop_settings.add({
          id: settingsId, user_id: user.id,
          shop_name: shopName.trim(), contact: contact.trim(),
          currency_code: currencyCode.trim().toUpperCase(),
          decimal_places: decimalPlaces,
          last_sale_number: 0, setup_complete: true,
        })
        await db.sync_queue.add({ table_name: 'shop_settings', record_id: settingsId, operation: 'upsert', created_at: now, attempts: 0 })
      })
      await seedSampleProducts(user.id)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      setError(S.errorSetupFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3EEE2' }}>
      <div style={cover}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '14px', background: '#B3362B' }} />
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '40px', letterSpacing: '0.18em', color: '#F3EEE2', margin: '0 0 10px', textAlign: 'center' }}>
          {S.appName}
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(243,238,226,0.7)', margin: '0 0 40px', textTransform: 'uppercase' }}>
          {S.setupSubtitle}
        </p>

        <div style={plate}>
          <div style={{ position: 'absolute', inset: '8px', border: '1px solid #1B2A41', pointerEvents: 'none' }} />
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '12px', color: 'rgba(27,42,65,0.7)', margin: '0 0 20px', position: 'relative', zIndex: 1 }}>
            {S.setupHint}
          </p>
          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <label style={labelStyle}>{S.labelShopName} *</label>
            <input value={shopName} onChange={e => setShopName(e.target.value)} required autoFocus
              placeholder={S.placeholderShopName} style={inputStyle} />
            <label style={labelStyle}>{S.labelContact}</label>
            <input value={contact} onChange={e => setContact(e.target.value)}
              placeholder={S.placeholderContact} style={inputStyle} />
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>{S.labelCurrencyCode}</label>
                <input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())}
                  maxLength={3} placeholder={S.placeholderCurrencyCode} style={inputStyle} />
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
            {error && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#B3362B', margin: '0 0 16px' }}>{error}</p>}
            <button type="submit" disabled={saving} style={btnStyle}>
              {saving ? S.btnSaving : S.btnSave}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
