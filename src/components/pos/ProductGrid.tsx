import { useState, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import { S } from '../../lib/strings'
import type { Product, ShopSettings } from '../../types'

const PAGE_SIZE = 16

interface Props {
  products: Product[]
  settings: ShopSettings
  onTap: (product: Product) => void
}

export default function ProductGrid({ products, settings, onTap }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const searchRef = useRef<HTMLInputElement>(null)

  // / shortcut focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Filter + reset to page 1 on query change
  const filtered = query.trim()
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : products

  useEffect(() => { setPage(1) }, [query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Search bar */}
      <div style={{ marginBottom: '12px' }}>
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={S.searchPlaceholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '14px',
            background: 'transparent',
            border: '1px solid #1B2A41',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1B2A41',
          }}
        />
      </div>

      {/* Grid — 4 columns × 4 rows, fills available height */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        flex: 1,
        border: '1px solid #1B2A41',
        borderRight: 'none',
        borderBottom: 'none',
        minHeight: 0,
      }}>
        {paged.map(product => (
          <div key={product.id} style={{ borderRight: '1px solid #1B2A41', borderBottom: '1px solid #1B2A41' }}>
            <ProductCard product={product} settings={settings} onTap={onTap} />
          </div>
        ))}
        {/* Fill empty cells to maintain grid shape */}
        {Array.from({ length: PAGE_SIZE - paged.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{
            borderRight: '1px solid #1B2A41', borderBottom: '1px solid #1B2A41',
            background: '#FFFDF7',
          }} />
        ))}
      </div>

      {/* Pagination footer — pinned at bottom */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '10px', flexShrink: 0,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#1B2A41',
      }}>
        <span style={{ opacity: 0.7 }}>
          {S.paginationOf(
            (safePage - 1) * PAGE_SIZE + 1,
            Math.min(safePage * PAGE_SIZE, filtered.length),
            filtered.length
          )}
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <PageBtn label="‹" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} active={false} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <PageBtn key={n} label={String(n)} onClick={() => setPage(n)} disabled={false} active={n === safePage} />
            ))}
            <PageBtn label="›" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} active={false} />
          </div>
        )}
      </div>
    </div>
  )
}

function PageBtn({ label, onClick, disabled, active }: {
  label: string; onClick: () => void; disabled: boolean; active: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '30px', height: '30px',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
        background: active ? '#1B2A41' : 'transparent',
        color: active ? '#F3EEE2' : '#1B2A41',
        border: '1px solid #1B2A41',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        padding: 0,
      }}
    >
      {label}
    </button>
  )
}
