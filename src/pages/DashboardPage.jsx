// src/pages/DashboardPage.jsx
import { useAuthStore } from '@/store/auth.store'
import { useConfigStore } from '@/store/config.store'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const config = useConfigStore((s) => s.config)

  const subjects = config?.subjects ?? []
  const semester = config?.academicProfile?.currentSemester

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-slate-500 text-sm font-mono mb-1">
          {semester || 'Configure o semestre atual nas configurações'}
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {greeting}, {firstName} 👋
        </h1>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Disciplinas', value: subjects.length, icon: '📚', color: 'indigo' },
          { label: 'Tarefas pendentes', value: '—', icon: '📋', color: 'violet' },
          { label: 'Flashcards hoje', value: '—', icon: '🃏', color: 'blue' },
          { label: 'Média geral', value: '—', icon: '📊', color: 'emerald' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-2xl mb-3">{icon}</div>
            <div className={`text-2xl font-bold text-${color}-400 mb-1`}>{value}</div>
            <div className="text-slate-500 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Disciplinas ativas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Disciplinas</h2>
          <a href="#/app/subjects/new" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            + Adicionar
          </a>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-slate-400 text-sm mb-4">
              Nenhuma disciplina cadastrada ainda.
            </p>
            <a
              href="#/app/subjects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              Cadastrar primeira disciplina
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors cursor-pointer group"
                style={{ borderLeftColor: subj.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{subj.icon || '📖'}</span>
                  <span className="text-slate-600 text-xs font-mono">{subj.code}</span>
                </div>
                <h3 className="text-white font-medium text-sm mb-1 group-hover:text-indigo-300 transition-colors">
                  {subj.name}
                </h3>
                <p className="text-slate-500 text-xs">{subj.professor || 'Professor não definido'}</p>

                {/* Módulos ativos */}
                <div className="flex gap-1 mt-3 flex-wrap">
                  {Object.entries(subj.enabledModules || {})
                    .filter(([, v]) => v)
                    .map(([key]) => (
                      <span
                        key={key}
                        className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono"
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

      {/* Aviso de próximas features */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5">
        <p className="text-indigo-300 text-sm font-medium mb-1">Sprint 2 em andamento</p>
        <p className="text-slate-500 text-xs">
          Dashboard completo (prazos, calculadora de notas, Kanban) será implementado na próxima fase.
        </p>
      </div>
    </div>
  )
}
