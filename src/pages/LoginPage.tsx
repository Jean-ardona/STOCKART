import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { S } from '../lib/strings'

const cover: React.CSSProperties = {
  width: '520px', minHeight: '560px', background: '#1B2A41',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  paddingTop: '52px', paddingBottom: '48px', paddingLeft: '14px',
  position: 'relative', boxSizing: 'border-box',
}
const plate: React.CSSProperties = {
  background: '#F3EEE2', padding: '32px', width: '360px',
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
  outline: 'none', marginBottom: '24px', boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: '#1B2A41', color: '#F3EEE2',
  border: 'none', padding: '14px', fontFamily: "'IBM Plex Sans', sans-serif",
  fontWeight: 600, fontSize: '13px', letterSpacing: '0.1em',
  textTransform: 'uppercase', cursor: 'pointer', marginTop: '8px',
}
const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#1B2A41',
  cursor: 'pointer', textDecoration: 'underline',
  fontSize: '12px', fontFamily: "'IBM Plex Sans', sans-serif", padding: 0,
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) { setError(result.error.message); return }
      const user = result.data.user
      if (!user) { setError(S.errorAuthFailed); return }
      const existing = await db.shop_settings.where('user_id').equals(user.id).count()
      navigate(existing > 0 ? '/' : '/setup', { replace: true })
    } catch {
      setError(S.errorNetwork)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3EEE2' }}>
      <div style={cover}>
        {/* Red strip */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '14px', background: '#B3362B' }} />
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '40px', letterSpacing: '0.18em', color: '#F3EEE2', margin: '0 0 10px', textAlign: 'center' }}>
          {S.appName}
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(243,238,226,0.7)', margin: '0 0 40px', textTransform: 'uppercase' }}>
          {S.appSubtitle}
        </p>

        <div style={plate}>
          <div style={{ position: 'absolute', inset: '8px', border: '1px solid #1B2A41', pointerEvents: 'none' }} />
          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <label style={labelStyle}>{S.labelEmail}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus placeholder={S.placeholderEmail} style={inputStyle} />
            <label style={labelStyle}>{S.labelPassword}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6} style={inputStyle} />
            {error && <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#B3362B', margin: '0 0 16px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? S.loginLoading : mode === 'login' ? S.btnOpenLedger : S.btnCreateLedger}
            </button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', fontFamily: "'IBM Plex Sans', sans-serif", color: '#1B2A41', position: 'relative', zIndex: 1 }}>
            {mode === 'login' ? (
              <>{S.switchToSignup}{' '}<button onClick={() => { setMode('signup'); setError('') }} style={linkBtn}>{S.switchToSignupLink}</button></>
            ) : (
              <>{S.switchToLogin}{' '}<button onClick={() => { setMode('login'); setError('') }} style={linkBtn}>{S.switchToLoginLink}</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
