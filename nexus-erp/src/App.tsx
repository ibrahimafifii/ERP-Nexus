import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import {
  Inventory, POS, Accounting, HR,
  Warehouse, Imports, DamageTracking
} from '@/pages/Placeholders'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/warehouse" element={<Warehouse />} />
                    <Route path="/accounting" element={<Accounting />} />
                    <Route path="/hr" element={<HR />} />
                    <Route path="/imports" element={<Imports />} />
                    <Route path="/damage" element={<DamageTracking />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
