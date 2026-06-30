// src/pages/DashboardPage.jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useConfigStore } from '@/store/config.store'
import { calcCurrentGrade, gradeColor } from '@/utils/gradeUtils'

const MODULE_TAB_MAP = [
  { key: 'notes',           path: 'notes'      },
  { key: 'media',           path: 'media'      },
  { key: 'gradeCalculator', path: 'grades'     },
  { key: 'kanban',          path: 'kanban'     },
  { key: 'flashcards',      path: 'flashcards' },
  { key: 'codeEditor',      path: 'code'       },
  { key: 'externalFrame',   path: 'external'   },
]

function getFirstTab(subject) {
  const first = MODULE_TAB_MAP.find((t) => subject.enabledModules?.[t.key])
  return first ? first.path : 'grades'
}

function SubjectCard({ subject }) {
  const grade = calcCurrentGrade(subject.gradeConfig?.components || [])
  const to = `/app/subjects/${subject.id}/${getFirstTab(subject)}`

  const activeModules = Object.entries(subject.enabledModules || {})
    .filter(([, v]) => v)
    .map(([k]) => k)

  const moduleIcons = {
    notes: '📝', media: '📄', gradeCalculator: '📊',
    kanban: '📋', flashcards: '🃏', codeEditor: '💻', externalFrame: '🌐',
  }

  return (
    <Link
      to={to}
      className="group block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
      style={{ borderLeftColor: subject.color, borderLeftWidth: '3px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{subject.icon || '📖'}</span>
          <div>
            <h3 className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors leading-tight">
              {subject.name}
            </h3>
            {subject.code && (
              <span className="text-slate-600 text-xs font-mono">{subject.code}</span>
            )}
          </div>
        </div>
        {grade !== null && (
          <span className={`text-sm font-mono font-bold ${gradeColor(grade)}`}>
            {grade.toFixed(1)}
          </span>
        )}
      </div>

      <p className="text-slate-500 text-xs mb-3">
        {subject.professor || 'Professor não definido'}
      </p>

      {/* Módulos ativos como ícones */}
      {activeModules.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {activeModules.map((key) => (
            <span
              key={key}
              className="text-sm"
              title={key}
            >
              {moduleIcons[key] || '•'}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const config = useConfigStore((s) => s.config)

  const subjects = config?.subjects ?? []
  const semester = config?.academicProfile?.currentSemester

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = user?.name?.split(' ')[0] ?? ''

  // Stats calculados
  const stats = useMemo(() => {
    const allComponents = subjects.flatMap((s) => s.gradeConfig?.components || [])
    const gradedComponents = allComponents.filter(
      (c) => c.score !== null && c.score !== undefined && c.score !== ''
    )

    const overallGrades = subjects
      .map((s) => calcCurrentGrade(s.gradeConfig?.components || []))
      .filter((g) => g !== null)
    const avgGrade =
      overallGrades.length > 0
        ? overallGrades.reduce((a, b) => a + b, 0) / overallGrades.length
        : null

    const allTasks = subjects.flatMap((s) => s.kanban?.tasks || [])
    const pendingTasks = allTasks.filter((t) => t.column !== 'done').length

    return { avgGrade, pendingTasks, gradedComponents: gradedComponents.length }
  }, [subjects])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-slate-600 text-xs font-mono mb-1">
          {semester || 'Configure o semestre nas ⚙️ Configurações'}
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {greeting}, {firstName} 👋
        </h1>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Disciplinas',
            value: subjects.length || '—',
            icon: '📚',
            sub: subjects.length > 0 ? `${subjects.length} ativas` : 'Nenhuma ainda',
          },
          {
            label: 'Tarefas pendentes',
            value: stats.pendingTasks || '—',
            icon: '📋',
            sub: 'No Kanban',
          },
          {
            label: 'Notas lançadas',
            value: stats.gradedComponents || '—',
            icon: '✏️',
            sub: 'Avaliações registradas',
          },
          {
            label: 'Média geral',
            value: stats.avgGrade !== null ? stats.avgGrade.toFixed(1) : '—',
            icon: '📊',
            sub: stats.avgGrade !== null
              ? stats.avgGrade >= 6 ? 'Aprovado em todas' : 'Atenção: abaixo do corte'
              : 'Sem notas ainda',
            highlight: stats.avgGrade !== null ? gradeColor(stats.avgGrade) : 'text-slate-400',
          },
        ].map(({ label, value, icon, sub, highlight }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold mb-1 font-mono ${highlight || 'text-indigo-400'}`}>
              {value}
            </div>
            <div className="text-slate-600 text-xs">{label}</div>
            {sub && <div className="text-slate-700 text-xs mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Disciplinas ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">
            Disciplinas
          </h2>
          <Link
            to="/app/subjects/new"
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            + Adicionar
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-slate-400 text-sm mb-4">Nenhuma disciplina cadastrada ainda.</p>
            <Link
              to="/app/subjects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
            >
              Cadastrar primeira disciplina
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <SubjectCard key={subj.id} subject={subj} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
