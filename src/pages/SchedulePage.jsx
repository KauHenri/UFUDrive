// src/pages/SchedulePage.jsx
// Horário semanal global — agrega os horários de todas as disciplinas
import { useState, useMemo } from 'react'
import { useConfigStore } from '@/store/config.store'
import { WEEK_DAYS } from '@/config/constants'

const HOUR_START = 7
const HOUR_END   = 22

// Converte "HH:MM" → minutos desde meia-noite
function toMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Posição e altura em pixels (1px = 1 min)
const PX_PER_MIN = 1.2

function slotStyle(startTime, endTime) {
  const top    = (toMin(startTime) - HOUR_START * 60) * PX_PER_MIN
  const height = (toMin(endTime)   - toMin(startTime)) * PX_PER_MIN
  return { top: `${top}px`, height: `${Math.max(height, 24)}px` }
}

const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN

// ─── Modal de adicionar/editar horário ────────────────────────────────────────

function SlotModal({ subjects, onSave, onClose }) {
  const [subjectId,  setSubjectId]  = useState(subjects[0]?.id || '')
  const [day,        setDay]        = useState('MON')
  const [startTime,  setStartTime]  = useState('08:00')
  const [endTime,    setEndTime]    = useState('09:40')
  const [room,       setRoom]       = useState('')

  const submit = () => {
    if (!subjectId || !day || !startTime || !endTime) return
    if (toMin(endTime) <= toMin(startTime)) return
    onSave({ subjectId, day, startTime, endTime, room: room.trim() })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Adicionar aula ao horário
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Disciplina</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Dia da semana</label>
            <div className="grid grid-cols-6 gap-1.5">
              {WEEK_DAYS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDay(id)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    day === id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Sala (opcional)</label>
            <input
              type="text"
              placeholder="Ex: B2-212, LAB3"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!subjectId || toMin(endTime) <= toMin(startTime)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Grade semanal ─────────────────────────────────────────────────────────────

export function SchedulePage() {
  const config       = useConfigStore((s) => s.config)
  const updateSubject = useConfigStore((s) => s.updateSubject)

  const [showModal, setShowModal] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)

  const subjects = config?.subjects ?? []

  // Agrega todos os slots de todas as disciplinas
  const allSlots = useMemo(() => {
    const slots = []
    for (const subj of subjects) {
      for (const slot of (subj.schedule || [])) {
        slots.push({ ...slot, subject: subj })
      }
    }
    return slots
  }, [subjects])

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  const today = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()]

  const addSlot = ({ subjectId, day, startTime, endTime, room }) => {
    const subj = subjects.find((s) => s.id === subjectId)
    if (!subj) return
    const schedule = [...(subj.schedule || []), { day, startTime, endTime, room, id: `slot_${Date.now()}` }]
    updateSubject(subjectId, { schedule })
  }

  const removeSlot = (slot) => {
    const subj = slot.subject
    const schedule = (subj.schedule || []).filter((s) => s.id !== slot.id)
    updateSubject(subj.id, { schedule })
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center gap-4">
        <div className="text-4xl">🗓️</div>
        <p className="text-white font-medium">Nenhuma disciplina cadastrada</p>
        <p className="text-slate-500 text-sm">Cadastre suas disciplinas primeiro para montar o horário.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Horário Semanal
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">{allSlots.length} aula{allSlots.length !== 1 ? 's' : ''} cadastrada{allSlots.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {allSlots.length > 0 && (
            <button
              onClick={() => setDeleteMode((d) => !d)}
              className={`px-3 py-2 text-xs rounded-xl transition-colors ${
                deleteMode ? 'bg-red-600/30 text-red-300 border border-red-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {deleteMode ? '✓ Concluído' : '✕ Remover'}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            + Aula
          </button>
        </div>
      </div>

      {/* Legenda de disciplinas */}
      <div className="shrink-0 flex gap-3 px-6 py-2.5 border-b border-slate-800 overflow-x-auto">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-400 text-xs whitespace-nowrap">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Grade */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[640px]">
          {/* Header dos dias */}
          <div className="grid sticky top-0 z-10 bg-slate-950 border-b border-slate-800" style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}>
            <div />
            {WEEK_DAYS.map(({ id, label }) => (
              <div
                key={id}
                className={`py-2.5 text-center text-xs font-medium border-l border-slate-800 ${
                  today === id ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                {label}
                {today === id && <div className="w-1 h-1 bg-indigo-400 rounded-full mx-auto mt-1" />}
              </div>
            ))}
          </div>

          {/* Corpo da grade */}
          <div
            className="grid relative"
            style={{ gridTemplateColumns: '48px repeat(6, 1fr)', height: `${totalHeight}px` }}
          >
            {/* Linhas de hora */}
            {hours.map((h) => (
              <div
                key={h}
                className="col-span-7 absolute w-full border-t border-slate-800/50 flex items-start"
                style={{ top: `${(h - HOUR_START) * 60 * PX_PER_MIN}px` }}
              >
                <span className="text-slate-700 text-xs font-mono w-12 px-1 -mt-2.5 select-none">
                  {String(h).padStart(2, '0')}h
                </span>
              </div>
            ))}

            {/* Colunas dos dias */}
            {WEEK_DAYS.map(({ id: dayId }, colIdx) => (
              <div
                key={dayId}
                className="relative border-l border-slate-800/50"
                style={{ gridColumn: colIdx + 2 }}
              >
                {allSlots
                  .filter((s) => s.day === dayId)
                  .map((slot, i) => {
                    const style = slotStyle(slot.startTime, slot.endTime)
                    return (
                      <div
                        key={`${slot.subject.id}-${i}`}
                        className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden transition-all ${
                          deleteMode ? 'cursor-pointer hover:opacity-70 ring-2 ring-red-500' : ''
                        }`}
                        style={{
                          ...style,
                          backgroundColor: slot.subject.color + '30',
                          borderLeft: `3px solid ${slot.subject.color}`,
                        }}
                        onClick={() => deleteMode && removeSlot(slot)}
                        title={deleteMode ? 'Clique para remover' : ''}
                      >
                        <p
                          className="text-xs font-semibold leading-tight truncate"
                          style={{ color: slot.subject.color }}
                        >
                          {slot.subject.icon} {slot.subject.name}
                        </p>
                        <p className="text-slate-400 text-xs font-mono leading-tight">
                          {slot.startTime}–{slot.endTime}
                        </p>
                        {slot.room && (
                          <p className="text-slate-500 text-xs leading-tight truncate">{slot.room}</p>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <SlotModal
          subjects={subjects}
          onSave={addSlot}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
