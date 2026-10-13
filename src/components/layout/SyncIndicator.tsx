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
  const label =
    status === 'offline' && pendingCount > 0 ? S.syncOfflineLabel(pendingSales, pendingCount) :
    status === 'pending'    ? S.syncPendingLabel(pendingSales, pendingCount) :
    status === 'offline'    ? S.syncOffline :
    status === 'auth-error' ? S.syncAuthError :
                              S.syncSynced
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
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          fontWeight: 600,
          color,
          background: `${color}1F`,
          border: `2px solid ${color}`,
          padding: '3px 7px',
          transform: 'rotate(-3deg)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="stockart-dot"
          aria-hidden="true"
          style={{
            width: '7px', height: '7px', background: color, display: 'inline-block',
            animation: status === 'pending' ? 'stockart-pulse 1.1s ease-in-out infinite' : undefined,
          }}
        />
        {label}
      </span>
    </div>
  )
}
