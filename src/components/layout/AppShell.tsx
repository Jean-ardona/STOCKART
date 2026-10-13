import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import type { ShopSettings } from '../../types'

interface Props {
  settings: ShopSettings
}

export default function AppShell({ settings }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F3EEE2' }}>
      <Sidebar settings={settings} />
      <main style={{ flex: 1, overflowY: 'auto', background: '#F3EEE2' }}>
        <Outlet />
      </main>
    </div>
  )
}
