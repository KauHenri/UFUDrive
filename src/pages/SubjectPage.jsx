// src/pages/SubjectPage.jsx
import { useMemo } from 'react'
import { useParams, NavLink, Outlet, Navigate, useLocation, Link } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

const MODULE_TABS = [
  { key: 'notes',           label: 'Anotações',  icon: '📝', path: 'notes'   },
  { key: 'media',           label: 'Slides',     icon: '📄', path: 'media'   },
  { key: 'gradeCalculator', label: 'Notas',      icon: '📊', path: 'grades'  },
  { key: 'kanban',          label: 'Kanban',     icon: '📋', path: 'kanban'  },
  { key: 'flashcards',      label: 'Flashcards', icon: '🃏', path: 'flashcards' },
  { key: 'codeEditor',      label: 'Código',     icon: '💻', path: 'code'    },
  { key: 'externalFrame',   label: 'Externo',    icon: '🌐', path: 'external'},
]

export function SubjectPage() {
  const { id } = useParams()
  const location = useLocation()
  const config = useConfigStore((s) => s.config)

  const subject = useMemo(
    () => config?.subjects?.find((s) => s.id === id),
    [config, id]
  )

  if (!subject) {
    return <Navigate to="/app/subjects" replace />
  }

  const enabledTabs = MODULE_TABS.filter(
    (tab) => subject.enabledModules?.[tab.key]
  )

  // Redireciona para a primeira aba ativa se estiver na raiz
  const isRoot = location.pathname.endsWith(`/subjects/${id}`)
  if (isRoot && enabledTabs.length > 0) {
    return <Navigate to={enabledTabs[0].path} replace />
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header da disciplina ───────────────────────────────────────── */}
      <div
        className="shrink-0 px-8 pt-8 pb-0 border-b border-slate-800"
        style={{ background: `linear-gradient(135deg, ${subject.color}12 0%, transparent 60%)` }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
            style={{ backgroundColor: subject.color + '22', border: `1.5px solid ${subject.color}55` }}
          >
            {subject.icon || '📖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {subject.name}
              </h1>
              {subject.code && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {subject.code}
                </span>
              )}
              <Link
                to={`/app/subjects/${subject.id}/edit`}
                className="ml-auto text-slate-600 hover:text-slate-300 transition-colors text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800"
              >
                ✏️ Editar
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {subject.professor || 'Professor não definido'}
              {subject.semesterId ? ` · ${subject.semesterId}` : ''}
            </p>
          </div>
        </div>

        {/* ── Abas ───────────────────────────────────────────────────── */}
        {enabledTabs.length > 0 ? (
          <nav className="flex gap-1 overflow-x-auto pb-0 no-scrollbar">
            {enabledTabs.map((tab) => (
              <NavLink
                key={tab.key}
                to={tab.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px ${
                    isActive
                      ? 'text-white border-current bg-slate-800/50'
                      : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                  }`
                }
                style={({ isActive }) => isActive ? { borderColor: subject.color, color: subject.color } : {}}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <p className="text-slate-600 text-sm pb-4">Nenhum módulo habilitado.</p>
        )}
      </div>

      {/* ── Conteúdo do módulo ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ subject }} />
      </div>
    </div>
  )
}
