import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/layout/AuthGuard'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import POSPage from './pages/POSPage'
import StockPage from './pages/StockPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no sidebar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />

        {/* Protected routes — AuthGuard checks Dexie, renders AppShell with Outlet */}
        <Route element={<AuthGuard />}>
          <Route path="/" element={<POSPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
