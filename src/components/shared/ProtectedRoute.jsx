// src/components/shared/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status)

  if (status === 'idle') return <Navigate to="/login" replace />
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-mono">Conectando ao Drive...</span>
        </div>
      </div>
    )
  }
  if (status === 'error') return <Navigate to="/login" replace />

  return children
}
