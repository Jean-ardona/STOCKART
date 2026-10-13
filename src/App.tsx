import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import POSPage from './pages/POSPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import StockPage from './pages/StockPage'
import DashboardPage from './pages/DashboardPage'

// AuthGuard and AppShell are added in slice 3.
// For slice 1, routes render directly.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/" element={<POSPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
