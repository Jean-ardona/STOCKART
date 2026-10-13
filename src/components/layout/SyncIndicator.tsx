import { S } from '../../lib/strings'

interface Props {
  status?: 'synced' | 'pending' | 'offline' | 'auth-error'
  pendingCount?: number
}

export default function SyncIndicator({ status = 'synced', pendingCount = 0 }: Props) {
  const label =
    status === 'pending'    ? S.syncPending(pendingCount) :
    status === 'offline'    ? S.syncOffline :
    status === 'auth-error' ? S.syncAuthError :
                              S.syncSynced

  return (
    <div style={{ padding: '12px 16px' }}>
      <span style={{
        display: 'inline-block',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '11px',
        fontWeight: 400,
        color: '#F3EEE2',
        border: '2px solid #F3EEE2',
        padding: '3px 7px',
        transform: 'rotate(-3deg)',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}
