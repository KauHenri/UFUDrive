// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useConfigStore } from '@/store/config.store'

const navItems = [
  { to: '/app/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/app/subjects',  icon: '📚', label: 'Disciplinas' },
  { to: '/app/settings',  icon: '⚙️', label: 'Configurações' },
]

export function Sidebar() {
  const { user, signOut } = useAuthStore()
  const { saving } = useConfigStore()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <aside className="w-16 lg:w-56 h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
          U
        </div>
        <span className="hidden lg:block text-white font-semibold text-sm tracking-wide">
          UFUDrive
        </span>
        {saving && (
          <span className="hidden lg:block ml-auto text-xs text-indigo-400 font-mono">
            salvando…
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base shrink-0">{icon}</span>
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs text-white">{user?.name?.[0] ?? '?'}</span>
            </div>
          )}
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="hidden lg:flex text-slate-500 hover:text-red-400 transition-colors text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  )
}
