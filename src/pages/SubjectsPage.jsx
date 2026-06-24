// src/pages/SubjectsPage.jsx
import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

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
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          + Nova disciplina
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-white font-semibold mb-2">Nenhuma disciplina ainda</h2>
          <p className="text-slate-400 text-sm mb-6">
            Cadastre suas matérias e o sistema criará a estrutura de pastas no Drive automaticamente.
          </p>
          <button
            onClick={() => navigate('/app/subjects/new')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            Cadastrar disciplina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              onClick={() => navigate(`/app/subjects/${subj.id}`)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 cursor-pointer transition-all group"
              style={{ borderLeftColor: subj.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">{subj.icon || '📖'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-500 text-xs font-mono mb-0.5">{subj.code}</p>
                  <h3 className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors leading-tight">
                    {subj.name}
                  </h3>
                </div>
              </div>
              <p className="text-slate-500 text-xs mb-3">{subj.professor || '—'}</p>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(subj.enabledModules || {})
                  .filter(([, v]) => v)
                  .map(([key]) => (
                    <span
                      key={key}
                      className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono"
                    >
                      {key}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
