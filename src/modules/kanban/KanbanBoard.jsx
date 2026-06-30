// src/modules/kanban/KanbanBoard.jsx
import { useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useConfigStore } from '@/store/config.store'

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLUMN_META = {
  backlog: { label: 'Backlog',   icon: '📥', accent: '#475569' },
  todo:    { label: 'A fazer',   icon: '📌', accent: '#3b82f6' },
  doing:   { label: 'Fazendo',   icon: '⚡', accent: '#6366f1' },
  review:  { label: 'Revisão',   icon: '👁',  accent: '#8b5cf6' },
  done:    { label: 'Concluído', icon: '✅', accent: '#10b981' },
}

const PRIORITY_META = {
  low:    { label: 'Baixa',   dot: 'bg-slate-500'  },
  medium: { label: 'Média',   dot: 'bg-blue-400'   },
  high:   { label: 'Alta',    dot: 'bg-orange-400' },
  urgent: { label: 'Urgente', dot: 'bg-red-500'    },
}

// ─── Task Card (sortable) ─────────────────────────────────────────────────────

function TaskCard({ task, onClick, isDragOverlay = false }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.column !== 'done'

  const card = (
    <div
      onClick={() => onClick(task)}
      className={`bg-slate-800 border rounded-xl p-3.5 select-none group transition-shadow ${
        isDragOverlay
          ? 'border-indigo-500/60 shadow-2xl shadow-black/50 rotate-1 cursor-grabbing'
          : 'border-slate-700/60 hover:border-slate-600 hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pMeta.dot}`} />
        {task.tags?.map((tag) => (
          <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded font-mono">
            {tag}
          </span>
        ))}
      </div>
      <p className="text-slate-200 text-sm leading-snug mb-2.5 line-clamp-3">{task.title}</p>
      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs font-mono ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
          <span>{isOverdue ? '⚠' : '📅'}</span>
          {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </div>
      )}
    </div>
  )

  if (isDragOverlay) return card

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {card}
    </div>
  )
}

// ─── Column (droppable) ───────────────────────────────────────────────────────

function KanbanColumn({ colId, tasks, onAddTask, onCardClick }) {
  const meta = COLUMN_META[colId] || { label: colId, icon: '•', accent: '#6366f1' }

  // Torna a coluna um alvo de drop independente
  const { setNodeRef, isOver } = useDroppable({ id: colId })

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl min-w-[220px] w-[220px] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-3 border-b border-slate-800">
        <span className="text-sm leading-none">{meta.icon}</span>
        <span className="text-sm font-medium text-slate-300 flex-1">{meta.label}</span>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: meta.accent + '28', color: meta.accent }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone para a coluna */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 min-h-[80px] rounded-b-none transition-colors ${
          isOver ? 'bg-indigo-500/5' : ''
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onCardClick} />
          ))}
        </SortableContext>

        {/* Placeholder visível quando coluna está vazia e hovering */}
        {tasks.length === 0 && isOver && (
          <div className="h-14 border-2 border-dashed border-indigo-500/40 rounded-xl" />
        )}
      </div>

      {/* Add task */}
      <button
        onClick={() => onAddTask(colId)}
        className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-colors text-xs rounded-b-xl border-t border-slate-800"
      >
        <span>+</span> Adicionar tarefa
      </button>
    </div>
  )
}

// ─── Modal de tarefa ──────────────────────────────────────────────────────────

function TaskModal({ task, defaultColumn, columns, onSave, onDelete, onClose }) {
  const isNew = !task
  const [form, setForm] = useState(
    task
      ? { ...task }
      : { title: '', column: defaultColumn || 'todo', priority: 'medium', dueDate: '', tags: [] }
  )
  const [tagInput, setTagInput] = useState('')
  const [err, setErr] = useState('')

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags?.includes(t)) setForm((f) => ({ ...f, tags: [...(f.tags || []), t] }))
    setTagInput('')
  }

  const submit = () => {
    if (!form.title.trim()) { setErr('Informe o título.'); return }
    onSave({ ...form, title: form.title.trim(), id: form.id || `task_${Date.now()}`, tags: form.tags || [] })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {isNew ? 'Nova tarefa' : 'Editar tarefa'}
        </h3>
        {err && <p className="text-red-400 text-xs mb-3">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Título *</label>
            <textarea
              autoFocus
              rows={2}
              placeholder="Descreva a tarefa..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Coluna</label>
              <select
                value={form.column}
                onChange={(e) => setForm({ ...form, column: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>{COLUMN_META[col]?.label || col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Prazo</label>
            <input
              type="date"
              value={form.dueDate || ''}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="python, prova, lab..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <button onClick={addTag} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors">+</button>
            </div>
            {form.tags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full">
                    {tag}
                    <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {!isNew && (
            <button
              onClick={() => { onDelete(task.id); onClose() }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm rounded-xl transition-colors"
            >
              Excluir
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.title.trim()}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-xl transition-colors font-medium"
          >
            {isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KanbanBoard principal ────────────────────────────────────────────────────

export function KanbanBoard() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)
  const saving = useConfigStore((s) => s.saving)

  const [activeTask, setActiveTask] = useState(null)
  const [modal, setModal] = useState(null)

  const kanban = subject.kanban || { columns: ['backlog', 'todo', 'doing', 'done'], tasks: [] }
  const columns = kanban.columns
  const tasks = kanban.tasks || []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.column === col)
    return acc
  }, {})

  const persistTasks = useCallback(
    (newTasks) => {
      updateSubject(subject.id, { kanban: { ...kanban, tasks: newTasks } })
    },
    [subject.id, kanban, updateSubject]
  )

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const draggedId = active.id
    const overId = over.id
    const draggedTask = tasks.find((t) => t.id === draggedId)
    if (!draggedTask) return

    // Descobrir a coluna de destino
    const overIsColumn = columns.includes(overId)
    const overTask = tasks.find((t) => t.id === overId)
    const targetColumn = overIsColumn ? overId : overTask?.column

    if (!targetColumn) return

    if (draggedTask.column !== targetColumn) {
      // Mover para outra coluna
      const newTasks = tasks.map((t) =>
        t.id === draggedId ? { ...t, column: targetColumn } : t
      )
      persistTasks(newTasks)
      return
    }

    // Reordenar dentro da mesma coluna
    if (!overTask || draggedId === overId) return
    const colTasks = tasks.filter((t) => t.column === draggedTask.column)
    const oldIdx = colTasks.findIndex((t) => t.id === draggedId)
    const newIdx = colTasks.findIndex((t) => t.id === overId)
    if (oldIdx === newIdx) return

    const reordered = arrayMove(colTasks, oldIdx, newIdx)
    const otherTasks = tasks.filter((t) => t.column !== draggedTask.column)
    persistTasks([...otherTasks, ...reordered])
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSaveTask = (taskData) => {
    const exists = tasks.find((t) => t.id === taskData.id)
    persistTasks(exists ? tasks.map((t) => (t.id === taskData.id ? taskData : t)) : [...tasks, taskData])
  }

  const handleDeleteTask = (taskId) => persistTasks(tasks.filter((t) => t.id !== taskId))

  const totalPending = tasks.filter((t) => t.column !== 'done').length
  const totalDone = tasks.filter((t) => t.column === 'done').length

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Quadro Kanban
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {totalPending} pendente{totalPending !== 1 ? 's' : ''} · {totalDone} concluída{totalDone !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-indigo-400 text-xs font-mono animate-pulse">salvando…</span>}
          <button
            onClick={() => setModal({ defaultColumn: 'todo' })}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            + Nova tarefa
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full pb-2" style={{ minWidth: `${columns.length * 236}px` }}>
            {columns.map((colId) => (
              <KanbanColumn
                key={colId}
                colId={colId}
                tasks={tasksByColumn[colId] || []}
                onAddTask={(col) => setModal({ defaultColumn: col })}
                onCardClick={(task) => setModal({ task })}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
            {activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal.task || null}
          defaultColumn={modal.defaultColumn}
          columns={columns}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
