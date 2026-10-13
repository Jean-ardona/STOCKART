import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import SyncIndicator from './SyncIndicator'
import SettingsPanel from './SettingsPanel'
import { S } from '../../lib/strings'
import type { ShopSettings } from '../../types'

interface Props {
  settings: ShopSettings
}

export default function Sidebar({ settings }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  function navStyle(isActive: boolean): React.CSSProperties {
    return {
      display: 'block',
      padding: '5px 0px',
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize: '15px',
      color: isActive ? '#F3EEE2' : 'rgba(243,238,226,0.7)',
      borderBottom: isActive ? '2px solid white' : 'none',
      textDecorationColor: isActive ? '#F3EEE2' : 'transparent',
      textUnderlineOffset: '4px',
      textDecorationThickness: '2px',
      marginBottom: "10px",
      letterSpacing: '0',
    }
  }

  return (
    <>
      <nav style={{
        width: '190px',
        minWidth: '190px',
        background: '#1B2A41',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '4px solid #B3362B',
        boxSizing: 'border-box',
      }}>
        {/* App name */}
        <div style={{
          padding: '18px 20px 14px',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 600,
          fontSize: '15px',
          letterSpacing: '0.1em',
          color: '#F3EEE2',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(243,238,226,0.15)',
        }}>
          Stockart
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: '8px 20px' }}>
          <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>{S.navPOS}</NavLink>
          <NavLink to="/stock" style={({ isActive }) => navStyle(isActive)}>{S.navStock}</NavLink>
          <NavLink to="/dashboard" style={({ isActive }) => navStyle(isActive)}>{S.navDashboard}</NavLink>
        </div>

        {/* Bottom: sync stamp + settings */}
        <div style={{ borderTop: '1px solid rgba(243,238,226,0.15)', paddingBottom: '4px' }}>
          <SyncIndicator />
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              width: '100%',
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(243,238,226,0.7)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              letterSpacing: '0.05em',
            }}
          >
            {S.navSettings}
          </button>
        </div>
      </nav>

      {settingsOpen && (
        <SettingsPanel settings={settings} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  )
}
