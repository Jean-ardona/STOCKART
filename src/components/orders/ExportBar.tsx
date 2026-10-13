import { useState } from 'react'
import { S } from '../../lib/strings'
import { buildOperationsCsv, downloadCsv } from '../../lib/exportOperations'
import type { ShopSettings } from '../../types'

const mono = "'IBM Plex Mono', monospace"

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ExportBar({ shop }: { shop: ShopSettings }) {
  const today = new Date()
  const [from, setFrom] = useState(ymd(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [to, setTo] = useState(ymd(today))
  const [message, setMessage] = useState('')

  const invalid = !from || !to || from > to

  async function handleExport() {
    if (invalid) { setMessage(S.exportBadRange); return }
    try {
      const { csv, salesCount, movementsCount } = await buildOperationsCsv(shop, from, to)
      if (salesCount + movementsCount === 0) { setMessage(S.exportNothing); return }
      downloadCsv(csv, `stockart-operations_${from}_to_${to}.csv`)
      setMessage(S.exportDone(salesCount, movementsCount))
    } catch (e) {
      console.error(e)
      setMessage(S.exportFailed)
    }
  }

  const dateInput: React.CSSProperties = {
    fontFamily: mono, fontSize: '12px', color: '#1B2A41', background: 'transparent',
    border: '1px solid #1B2A41', padding: '5px 8px', outline: 'none',
  }
  const label: React.CSSProperties = {
    fontFamily: mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
      <span style={{ ...label, fontWeight: 600, opacity: 1 }}>{S.exportTitle}</span>
      <label style={label} htmlFor="ex-from">{S.exportFrom}</label>
      <input id="ex-from" type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setMessage('') }} style={dateInput} />
      <label style={label} htmlFor="ex-to">{S.exportTo}</label>
      <input id="ex-to" type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setMessage('') }} style={dateInput} />
      <button
        onClick={handleExport}
        disabled={invalid}
        style={{
          background: invalid ? '#D8D0BC' : '#1B2A41', color: '#F3EEE2', border: 'none', padding: '7px 14px',
          fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.1em',
          cursor: invalid ? 'default' : 'pointer',
        }}
      >
        {S.btnExportCsv}
      </button>
      <span role="status" aria-live="polite" style={{ fontFamily: mono, fontSize: '12px', opacity: 0.75 }}>{message}</span>
    </div>
  )
}
