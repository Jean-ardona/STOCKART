import { useState } from 'react'
import { S } from '../../lib/strings'
import { formatCurrency } from '../../lib/formatCurrency'
import type { Sale, ShopSettings } from '../../types'

export type ChartMode = 'day' | 'week'

interface Bucket { label: string; revenueInt: number; count: number }

const DAY_MS = 86_400_000
const W = 760, H = 300
const PAD = { left: 56, right: 8, top: 28, bottom: 34 }

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

/** Day mode: last 7 days. Week mode: last 4 blocks of 7 days (the last block ends today). */
export function buildBuckets(sales: Sale[], mode: ChartMode, today = new Date()): Bucket[] {
  const todayStart = startOfDay(today)
  const n = mode === 'day' ? 7 : 4
  const span = mode === 'day' ? 1 : 7
  const buckets: Bucket[] = Array.from({ length: n }, (_, i) => {
    // i = 0 is the oldest bucket
    const endDaysAgo = (n - 1 - i) * span
    const end = new Date(todayStart.getTime() - endDaysAgo * DAY_MS)
    const start = new Date(end.getTime() - (span - 1) * DAY_MS)
    const fmt = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    const label = mode === 'day'
      ? end.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })
      : `${fmt(start)}–${fmt(end)}`
    return { label, revenueInt: 0, count: 0 }
  })
  for (const s of sales) {
    const daysAgo = Math.round((todayStart.getTime() - startOfDay(new Date(s.completed_at)).getTime()) / DAY_MS)
    if (daysAgo < 0 || daysAgo >= n * span) continue
    const idx = n - 1 - Math.floor(daysAgo / span)
    buckets[idx].revenueInt += s.total_int
    buckets[idx].count += 1
  }
  return buckets
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

// Deterministic "pen wobble" so bars look hand-drawn but never jump between renders
function jit(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return ((x - Math.floor(x)) - 0.5) * 3
}

interface Props { sales: Sale[]; mode: ChartMode; settings: ShopSettings }

export default function SalesChart({ sales, mode, settings }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const buckets = buildBuckets(sales, mode)
  const divisor = settings.decimal_places === 2 ? 100 : 1
  const maxVal = niceMax(Math.max(...buckets.map(b => b.revenueInt)) / divisor)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const slot = innerW / buckets.length
  const barW = Math.min(slot * 0.55, 64)
  const y0 = PAD.top + innerH
  const yOf = (valInt: number) => y0 - (valInt / divisor / maxVal) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxVal)
  const empty = buckets.every(b => b.revenueInt === 0)
  const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label={S.chartTitle} style={{ display: 'block' }}>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#1B2A41" strokeWidth="1.2" opacity="0.45" />
        </pattern>
        <pattern id="hatchDark" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#1B2A41" strokeWidth="1.4" opacity="0.8" />
        </pattern>
      </defs>

      {/* Ruled lines + y labels */}
      {ticks.map((t, i) => {
        const y = y0 - (t / maxVal) * innerH
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#D8D0BC" strokeDasharray={i === 0 ? undefined : '3 4'} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="#1B2A41" opacity="0.65">
              {compact.format(t)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {buckets.map((b, i) => {
        const cx = PAD.left + slot * i + slot / 2
        const x = cx - barW / 2
        const top = yOf(b.revenueInt)
        const h = y0 - top
        const active = hover === i
        const tip = `${formatCurrency(b.revenueInt, settings)} · ${S.salesCount(b.count)}`
        return (
          <g
            key={i}
            tabIndex={0}
            role="img"
            aria-label={`${b.label}: ${tip}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            style={{ outline: 'none', cursor: 'default' }}
          >
            {/* invisible hit area for the whole slot */}
            <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH + PAD.bottom} fill="transparent" />
            {b.revenueInt > 0 && (
              <>
                <path
                  d={`M ${x + jit(i, 1)} ${y0} L ${x + jit(i, 2)} ${top + jit(i, 3)} L ${x + barW + jit(i, 4)} ${top + jit(i, 5)} L ${x + barW + jit(i, 6)} ${y0} Z`}
                  fill={active ? 'url(#hatchDark)' : 'url(#hatch)'}
                  stroke="#1B2A41" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"
                />
                {/* second, lighter pen pass */}
                <path
                  d={`M ${x + jit(i, 7)} ${y0} L ${x + jit(i, 8)} ${top + jit(i, 9)} L ${x + barW + jit(i, 10)} ${top + jit(i, 11)} L ${x + barW + jit(i, 12)} ${y0}`}
                  fill="none" stroke="#1B2A41" strokeWidth="1" opacity="0.4" strokeLinejoin="round"
                />
              </>
            )}
            {h === 0 && <line x1={x} x2={x + barW} y1={y0} y2={y0} stroke="#1B2A41" strokeWidth="2" opacity="0.5" />}
            <text x={cx} y={H - 12} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="11" fill="#1B2A41" opacity={active ? 1 : 0.7}>
              {b.label}
            </text>
            {active && (
              <text x={Math.min(Math.max(cx, PAD.left + 90), W - PAD.right - 90)} y={Math.max(top - 8, 14)} textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace" fontSize="12" fontWeight="600" fill="#1B2A41">
                {tip}
              </text>
            )}
          </g>
        )
      })}

      {empty && (
        <text x={W / 2} y={PAD.top + innerH / 2} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="13" fill="#1B2A41" opacity="0.5">
          {S.noSalesYet}
        </text>
      )}
    </svg>
  )
}
