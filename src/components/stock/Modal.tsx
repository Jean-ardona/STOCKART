import { useEffect, type ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/** Ledger "label plate" dialog, same look as the Settings panel. */
export default function Modal({ title, subtitle, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(27,42,65,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div style={{
        background: '#F3EEE2', border: '1px solid #1B2A41', padding: '32px',
        width: '400px', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: '8px', border: '1px solid #1B2A41', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '18px', margin: '0 0 4px', position: 'relative' }}>
          {title}
        </h2>
        {subtitle && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', opacity: 0.65, marginBottom: '20px', position: 'relative' }}>
            {subtitle}
          </div>
        )}
        {!subtitle && <div style={{ height: '20px' }} />}
        <div style={{ position: 'relative' }}>{children}</div>
      </div>
    </div>
  )
}
