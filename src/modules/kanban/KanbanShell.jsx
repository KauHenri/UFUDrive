// src/modules/kanban/KanbanShell.jsx
import { useOutletContext } from 'react-router-dom'

export function KanbanShell() {
  const { subject } = useOutletContext()

  const columns = subject?.kanban?.columns || ['backlog', 'todo', 'doing', 'done']
  const tasks = subject?.kanban?.tasks || []

  const columnLabels = {
    backlog: { label: 'Backlog', icon: '📥', color: 'slate' },
    todo:    { label: 'A fazer', icon: '📌', color: 'blue'  },
    doing:   { label: 'Fazendo', icon: '⚡', color: 'indigo'},
    review:  { label: 'Revisão', icon: '👁', color: 'violet'},
    done:    { label: 'Concluído',icon: '✅', color: 'emerald'},
  }

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.column === col)
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Quadro Kanban
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <span className="text-indigo-400 text-xs">🚧 Sprint 2</span>
        </div>
      </div>

      {/* Preview das colunas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-x-auto">
        {columns.map((col) => {
          const info = columnLabels[col] || { label: col, icon: '•', color: 'slate' }
          const colTasks = tasksByColumn[col] || []
          return (
            <div key={col} className="bg-slate-900 border border-slate-800 rounded-xl p-3 min-w-[160px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{info.icon}</span>
                <span className="text-slate-400 text-xs font-medium">{info.label}</span>
                <span className="ml-auto text-xs font-mono text-slate-600">{colTasks.length}</span>
              </div>
              {colTasks.length === 0 ? (
                <div className="h-16 border border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                  <span className="text-slate-700 text-xs">vazio</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {colTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="bg-slate-800 rounded-lg p-2">
                      <p className="text-slate-300 text-xs line-clamp-2">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-slate-600 text-xs mt-1 font-mono">
                          {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ))}
                  {colTasks.length > 3 && (
                    <p className="text-slate-600 text-xs text-center">+{colTasks.length - 3} mais</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-900 border border-slate-800 border-dashed rounded-xl text-center">
        <p className="text-slate-600 text-sm">
          Drag & drop com <span className="text-slate-500 font-mono">@dnd-kit</span> será implementado no Sprint 2.
        </p>
      </div>
    </div>
  )
}
