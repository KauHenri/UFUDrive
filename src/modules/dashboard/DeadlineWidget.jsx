// src/modules/dashboard/DeadlineWidget.jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

const PRIORITY_COLOR = {
  urgent: 'border-red-500/60 bg-red-500/5',
  high:   'border-orange-500/50 bg-orange-500/5',
  medium: 'border-blue-500/30 bg-blue-500/5',
  low:    'border-slate-700 bg-transparent',
}

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-blue-400',
  low:    'bg-slate-500',
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

function DaysLabel({ days }) {
  if (days < 0)  return <span className="text-red-400 text-xs font-mono">{Math.abs(days)}d atrasado</span>
  if (days === 0) return <span className="text-orange-400 text-xs font-mono font-bold">Hoje!</span>
  if (days === 1) return <span className="text-orange-300 text-xs font-mono">Amanhã</span>
  if (days <= 7)  return <span className="text-yellow-400 text-xs font-mono">{days} dias</span>
  return <span className="text-slate-500 text-xs font-mono">{days} dias</span>
}

export function DeadlineWidget() {
  const config = useConfigStore((s) => s.config)
  const subjects = config?.subjects ?? []

  // Coleta todos os itens com prazo: tarefas kanban + componentes de nota
  const items = useMemo(() => {
    const list = []

    for (const subj of subjects) {
      // Tarefas kanban (não concluídas)
      const tasks = subj.kanban?.tasks ?? []
      for (const task of tasks) {
        if (!task.dueDate || task.column === 'done') continue
        list.push({
          id: `task_${task.id}`,
          type: 'task',
          title: task.title,
          subjectName: subj.name,
          subjectColor: subj.color,
          subjectIcon: subj.icon,
          subjectId: subj.id,
          dueDate: task.dueDate,
          priority: task.priority || 'medium',
          days: daysUntil(task.dueDate),
        })
      }

      // Componentes de nota sem nota lançada
      const comps = subj.gradeConfig?.components ?? []
      for (const comp of comps) {
        if (!comp.dueDate || comp.score !== null) continue
        list.push({
          id: `grade_${comp.id}`,
          type: 'grade',
          title: comp.label,
          subjectName: subj.name,
          subjectColor: subj.color,
          subjectIcon: subj.icon,
          subjectId: subj.id,
          dueDate: comp.dueDate,
          priority: daysUntil(comp.dueDate) <= 3 ? 'high' : 'medium',
          days: daysUntil(comp.dueDate),
          weight: comp.weight,
        })
      }
    }

    // Ordena por proximidade e filtra itens com mais de 30 dias
    return list
      .filter((i) => i.days <= 30)
      .sort((a, b) => a.days - b.days)
  }, [subjects])

  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Próximos prazos</h2>
        <span className="text-slate-600 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {items.slice(0, 8).map((item) => {
          const to = item.type === 'task'
            ? `/app/subjects/${item.subjectId}/kanban`
            : `/app/subjects/${item.subjectId}/grades`

          return (
            <Link
              key={item.id}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:brightness-110 ${
                PRIORITY_COLOR[item.priority] || PRIORITY_COLOR.medium
              }`}
            >
              {/* Indicador de disciplina */}
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: item.subjectColor }}
              />

              {/* Dot prioridade */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[item.priority] || PRIORITY_DOT.medium}`}
              />

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm leading-tight truncate">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                  <span>{item.subjectIcon}</span>
                  <span className="truncate">{item.subjectName}</span>
                  {item.type === 'grade' && (
                    <span className="text-slate-600">· {Math.round(item.weight * 100)}%</span>
                  )}
                  <span className="text-slate-700 mx-1">·</span>
                  <span className="text-xs opacity-60">
                    {item.type === 'task' ? '📋' : '📊'}
                  </span>
                </p>
              </div>

              {/* Dias restantes */}
              <div className="shrink-0 text-right">
                <DaysLabel days={item.days} />
                <p className="text-slate-700 text-xs mt-0.5">
                  {new Date(item.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </Link>
          )
        })}

        {items.length > 8 && (
          <p className="text-slate-600 text-xs text-center pt-1">
            +{items.length - 8} item{items.length - 8 !== 1 ? 's' : ''} nos próximos 30 dias
          </p>
        )}
      </div>
    </div>
  )
}
