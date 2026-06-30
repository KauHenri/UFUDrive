// src/components/layout/Sidebar.jsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useConfigStore } from '@/store/config.store'

const NAV_MAIN = [
  { to: '/app/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/app/subjects',  icon: '📚', label: 'Disciplinas' },
  { to: '/app/settings',  icon: '⚙️', label: 'Configurações' },
]

// Primeira aba ativa de uma disciplina
function getFirstTab(subject) {
  const tabMap = [
    { key: 'notes',           path: 'notes'      },
    { key: 'media',           path: 'media'      },
    { key: 'gradeCalculator', path: 'grades'     },
    { key: 'kanban',          path: 'kanban'     },
    { key: 'flashcards',      path: 'flashcards' },
    { key: 'codeEditor',      path: 'code'       },
    { key: 'externalFrame',   path: 'external'   },
  ]
  const first = tabMap.find((t) => subject.enabledModules?.[t.key])
  return first ? first.path : 'grades'
}

export function Sidebar() {
  const { user, signOut } = useAuthStore()
  const { saving, config } = useConfigStore()
  const navigate = useNavigate()
  const [subjectsOpen, setSubjectsOpen] = useState(true)

  const subjects = config?.subjects ?? []

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <aside className="w-16 lg:w-60 h-screen bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-3 shrink-0">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-900/50">
          U
        </div>
        <span className="hidden lg:block text-white font-semibold text-sm tracking-wide">
          UFUDrive
        </span>
        {saving && (
          <span className="hidden lg:block ml-auto text-xs text-indigo-400 font-mono animate-pulse">
            ●
          </span>
        )}
      </div>

      {/* ── Nav principal ─────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {NAV_MAIN.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base shrink-0 leading-none">{icon}</span>
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}

        {/* ── Seção de disciplinas ──────────────────────────────────── */}
        {subjects.length > 0 && (
          <div className="pt-3">
            <button
              onClick={() => setSubjectsOpen((p) => !p)}
              className="hidden lg:flex items-center gap-2 w-full px-3 py-1.5 text-slate-600 hover:text-slate-400 transition-colors text-xs font-medium uppercase tracking-widest"
            >
              <span className="flex-1 text-left">Matérias</span>
              <span className="text-xs">{subjectsOpen ? '▾' : '▸'}</span>
            </button>

            {subjectsOpen && (
              <div className="mt-1 space-y-0.5">
                {subjects.map((subj) => (
                  <NavLink
                    key={subj.id}
                    to={`/app/subjects/${subj.id}/${getFirstTab(subj)}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    {/* Indicador de cor */}
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: subj.color }}
                    />
                    <span className="hidden lg:block text-xs truncate">{subj.name}</span>
                    {/* Ícone quando sidebar colapsada */}
                    <span className="lg:hidden text-base">{subj.icon || '📖'}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── Usuário ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800 p-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full shrink-0 ring-1 ring-slate-700"
            />
          ) : (
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs text-white">{user?.name?.[0] ?? '?'}</span>
            </div>
          )}
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-600 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="hidden lg:flex items-center justify-center w-6 h-6 text-slate-600 hover:text-red-400 transition-colors rounded shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
