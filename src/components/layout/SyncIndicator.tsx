import { S } from '../../lib/strings'
import { useSyncStatus } from '../../hooks/useSyncStatus'
import type { SyncStatus } from '../../lib/syncEngine'

// Status colors, chosen to read well on the ink-blue sidebar
const TONE: Record<SyncStatus, string> = {
  synced: '#8FD6A8',       // green
  pending: '#F2C14E',      // amber
  offline: '#F0958B',      // soft red
  'auth-error': '#F0958B', // soft red
}

export default function SyncIndicator() {
  const { status, pendingCount, pendingSales } = useSyncStatus()

  // Two short lines instead of one long one, so the stamp always fits the sidebar
  let main: string = S.syncSynced
  let detail = ''
  if (status === 'offline') {
    main = S.syncOffline
    if (pendingCount > 0) detail = S.syncDetailOffline(pendingSales, pendingCount)
  } else if (status === 'pending') {
    main = 'PENDING'
    detail = S.syncDetailQueued(pendingSales, pendingCount)
  } else if (status === 'auth-error') {
    main = S.syncAuthError
  }
  const color = TONE[status]

  return (
    <div style={{ padding: '12px 16px' }}>
      <style>{`
        @keyframes stockart-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
        @media (prefers-reduced-motion: reduce) { .stockart-dot { animation: none !important } }
      `}</style>
      <span
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          maxWidth: 'calc(100% - 8px)',
          boxSizing: 'border-box',
          fontFamily: "'IBM Plex Mono', monospace",
          color,
          background: `${color}1F`,
          border: `2px solid ${color}`,
          padding: '3px 7px',
          transform: 'rotate(-3deg)',
          letterSpacing: '0.05em',
        }}
      >
        <span
          className="stockart-dot"
          aria-hidden="true"
          style={{
            width: '7px', height: '7px', flexShrink: 0, background: color, display: 'inline-block',
            animation: status === 'pending' ? 'stockart-pulse 1.1s ease-in-out infinite' : undefined,
          }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{main}</span>
          {detail && <span style={{ fontSize: '10px', fontWeight: 400, whiteSpace: 'nowrap', opacity: 0.9 }}>{detail}</span>}
        </span>
      </span>
    </div>
  )
}
