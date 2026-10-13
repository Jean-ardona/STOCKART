/**
 * LoadingPage — shown while AuthGuard checks Dexie on first render.
 * Also accessible at /loading for design preview.
 *
 * Design: ink background (same as login cover), the receipt icon centered,
 * "STOCKART" in spaced caps, a CSS-animated ink line that fills left→right.
 * No libraries, no external assets — the icon is inline SVG.
 */
export default function LoadingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1B2A41',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '28px',
    }}>
      {/* Receipt icon — inline SVG, same as favicon.svg */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        style={{ width: '80px', height: '80px' }}
        aria-hidden="true"
      >
        <g transform="rotate(-5 256 256)">
          <path
            d="M136 92 H376 V392 L352 412 L328 392 L304 412 L280 392 L256 412 L232 392 L208 412 L184 392 L160 412 L136 392 Z"
            fill="#F3EEE2"
          />
          <rect x="160" y="92" width="7" height="300" fill="#B3362B" />
          <g fill="#1B2A41">
            <rect x="192" y="140" width="148" height="14" />
            <rect x="192" y="186" width="116" height="14" />
            <rect x="192" y="232" width="148" height="14" />
            <rect x="192" y="278" width="92"  height="14" />
            <rect x="192" y="330" width="148" height="22" />
          </g>
        </g>
      </svg>

      {/* App name */}
      <div style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontWeight: 600,
        fontSize: '22px',
        letterSpacing: '0.22em',
        color: '#F3EEE2',
        textTransform: 'uppercase',
      }}>
        STOCKART
      </div>

      {/* Animated loading bar */}
      <div style={{
        width: '120px',
        height: '2px',
        background: 'rgba(243,238,226,0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          height: '100%',
          width: '40%',
          background: '#B3362B',
          animation: 'stockart-loading 1.2s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes stockart-loading {
          0%   { left: -40%; }
          100% { left: 140%; }
        }
      `}</style>
    </div>
  )
}
