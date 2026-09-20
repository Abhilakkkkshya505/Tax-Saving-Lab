import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Holdings from './pages/Holdings'
import Results from './pages/Results'
import Harvest from './pages/Harvest'

function ProtectedLayout({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/holdings" element={<ProtectedLayout><Holdings /></ProtectedLayout>} />
        <Route path="/results" element={<ProtectedLayout><Results /></ProtectedLayout>} />
        <Route path="/harvest" element={<ProtectedLayout><Harvest /></ProtectedLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
