import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children }) {
  const { usuario } = useApp()
  const location = useLocation()
  if (!usuario) {
    return <Navigate to="/login" state={{ de: location.pathname }} replace />
  }
  return children
}
