import type { CSSProperties } from 'react'

export const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#1B2A41',
  marginBottom: '6px',
}

export const inputStyle: CSSProperties = {
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

export const primaryBtn: CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#1B2A41',
  color: '#F3EEE2',
  border: '1px solid #1B2A41',
  padding: '12px',
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontWeight: 600,
  fontSize: '13px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

export const ghostBtn: CSSProperties = {
  ...primaryBtn,
  background: 'transparent',
  color: '#1B2A41',
}

export const errorStyle: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  color: '#B3362B',
  margin: '0 0 12px',
}
