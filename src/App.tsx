import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/layout/AuthGuard'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import POSPage from './pages/POSPage'
import StockPage from './pages/StockPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import { PrintProvider } from './lib/printContext'

function App() {
  return (
    <PrintProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<POSPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PrintProvider>
  )
}

export default App
