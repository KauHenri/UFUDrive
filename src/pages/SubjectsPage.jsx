// src/pages/SubjectsPage.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import { calcCurrentGrade, gradeColor } from '@/utils/gradeUtils'

const MODULE_TAB_MAP = [
  { key: 'notes',           path: 'notes',       icon: '📝', label: 'Anotações'   },
  { key: 'media',           path: 'media',       icon: '📄', label: 'Slides'      },
  { key: 'gradeCalculator', path: 'grades',      icon: '📊', label: 'Notas'       },
  { key: 'kanban',          path: 'kanban',      icon: '📋', label: 'Kanban'      },
  { key: 'flashcards',      path: 'flashcards',  icon: '🃏', label: 'Flashcards'  },
  { key: 'codeEditor',      path: 'code',        icon: '💻', label: 'Código'      },
  { key: 'externalFrame',   path: 'external',    icon: '🌐', label: 'Externo'     },
]

function getFirstTab(subject) {
  const first = MODULE_TAB_MAP.find((t) => subject.enabledModules?.[t.key])
  return first ? first.path : 'grades'
}

export function SubjectsPage() {
  const config = useConfigStore((s) => s.config)
  const subjects = config?.subjects ?? []
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Disciplinas
        </h1>
        <button
          onClick={() => navigate('/app/subjects/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium"
        >
          + Nova disciplina
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-white font-semibold mb-2">Nenhuma disciplina ainda</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Cadastre suas matérias e o sistema criará a estrutura de pastas no Drive automaticamente.
          </p>
          <button
            onClick={() => navigate('/app/subjects/new')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Cadastrar disciplina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subj) => {
            const grade = calcCurrentGrade(subj.gradeConfig?.components || [])
            const enabledTabs = MODULE_TAB_MAP.filter((t) => subj.enabledModules?.[t.key])
            const firstTab = getFirstTab(subj)

            return (
              <div
                key={subj.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all group hover:shadow-lg hover:shadow-black/20"
                style={{ borderLeftColor: subj.color, borderLeftWidth: 3 }}
              >
                {/* Card header */}
                <Link
                  to={`/app/subjects/${subj.id}/${firstTab}`}
                  className="block p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{subj.icon || '📖'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-500 text-xs font-mono mb-0.5">{subj.code || '—'}</p>
                      <h3 className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors leading-tight">
                        {subj.name}
                      </h3>
                      <p className="text-slate-600 text-xs mt-0.5">{subj.professor || 'Professor não definido'}</p>
                    </div>
                    {grade !== null && (
                      <span className={`text-sm font-mono font-bold shrink-0 ${gradeColor(grade)}`}>
                        {grade.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Atalhos por módulo */}
                {enabledTabs.length > 0 && (
                  <div className="px-5 pb-4 flex gap-1.5 flex-wrap border-t border-slate-800 pt-3">
                    {enabledTabs.map((tab) => (
                      <Link
                        key={tab.key}
                        to={`/app/subjects/${subj.id}/${tab.path}`}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
                      >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
