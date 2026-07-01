// src/modules/attendance/AttendanceModule.jsx
import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

const ABSENCE_LIMIT_RATIO = 0.25 // 25% de faltas = reprovação

function getStatus(absences, limit) {
  if (limit === 0) return 'safe'
  const ratio = absences / limit
  if (ratio >= 1) return 'critical'
  if (ratio >= 0.6) return 'warning'
  return 'safe'
}

const STATUS = {
  safe:     { color: 'text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Em dia' },
  warning:  { color: 'text-amber-400',   bar: 'bg-amber-500',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   label: 'Atenção' },
  critical: { color: 'text-red-400',     bar: 'bg-red-500',     badge: 'bg-red-500/10 text-red-400 border-red-500/20',       label: 'Risco!'  },
}

// ─── Modal de configuração ────────────────────────────────────────────────────

function ConfigModal({ data, onSave, onClose }) {
  const [totalClasses,  setTotalClasses]  = useState(data.totalClasses  || '')
  const [classesPerDay, setClassesPerDay] = useState(data.classesPerDay || 1)

  const submit = () => {
    const n = parseInt(totalClasses)
    if (!n || n < 1) return
    onSave({ ...data, totalClasses: n, classesPerDay: parseInt(classesPerDay) || 1 })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Configurar Frequência
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Total de aulas no semestre *
            </label>
            <input
              autoFocus
              type="number"
              min="1"
              max="999"
              value={totalClasses}
              onChange={(e) => setTotalClasses(e.target.value)}
              placeholder="Ex: 60"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-slate-600 text-xs mt-1.5">
              Limite de faltas: {totalClasses ? Math.floor(parseInt(totalClasses) * ABSENCE_LIMIT_RATIO) : '—'} aulas
            </p>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Aulas por encontro
            </label>
            <select
              value={classesPerDay}
              onChange={(e) => setClassesPerDay(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} aula{n > 1 ? 's' : ''}</option>
              ))}
            </select>
            <p className="text-slate-600 text-xs mt-1.5">
              Usado para o botão "Marcar Falta" de uma aula inteira
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!totalClasses || parseInt(totalClasses) < 1}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Histórico de aulas ───────────────────────────────────────────────────────

function HistoryModal({ records, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Histórico de aulas
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {records.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Nenhum registro ainda.</p>
          ) : (
            [...records].reverse().map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${r.present ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                <span className={r.present ? 'text-emerald-400' : 'text-red-400'}>
                  {r.present ? '✓' : '✗'}
                </span>
                <span className="text-slate-300 text-sm flex-1">
                  {r.present ? 'Presente' : `Falta${r.count > 1 ? ` (${r.count}×)` : ''}`}
                </span>
                <span className="text-slate-600 text-xs font-mono">
                  {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AttendanceModule() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)

  const data = subject.attendance || {
    totalClasses: 0,
    classesPerDay: 1,
    absences: 0,
    records: [],
  }

  const [showConfig, setShowConfig] = useState(!data.totalClasses)
  const [showHistory, setShowHistory] = useState(false)

  const absenceLimit = useMemo(
    () => Math.floor((data.totalClasses || 0) * ABSENCE_LIMIT_RATIO),
    [data.totalClasses]
  )

  const remaining = Math.max(0, absenceLimit - (data.absences || 0))
  const status = getStatus(data.absences || 0, absenceLimit)
  const pct = absenceLimit > 0
    ? Math.min(100, Math.round(((data.absences || 0) / absenceLimit) * 100))
    : 0

  const save = (patch) => updateSubject(subject.id, { attendance: { ...data, ...patch } })

  const markAbsent = (count = data.classesPerDay || 1) => {
    const absences = (data.absences || 0) + count
    const records = [...(data.records || []), { date: new Date().toISOString(), present: false, count }]
    save({ absences, records })
  }

  const markPresent = () => {
    const records = [...(data.records || []), { date: new Date().toISOString(), present: true, count: data.classesPerDay || 1 }]
    save({ records })
  }

  const undoLast = () => {
    const records = [...(data.records || [])]
    if (records.length === 0) return
    const last = records.pop()
    const absences = last.present ? data.absences : Math.max(0, (data.absences || 0) - last.count)
    save({ absences, records })
  }

  if (!data.totalClasses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center gap-4">
        <div className="text-4xl">📅</div>
        <div>
          <p className="text-white font-medium">Configure o controle de faltas</p>
          <p className="text-slate-500 text-sm mt-1">Informe o total de aulas para calcular o limite de 25%.</p>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
        >
          Configurar
        </button>
        {showConfig && (
          <ConfigModal data={data} onSave={(d) => updateSubject(subject.id, { attendance: d })} onClose={() => setShowConfig(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Controle de Faltas
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Histórico
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ⚙ Configurar
          </button>
        </div>
      </div>

      {/* Card de status */}
      <div className={`rounded-2xl border p-6 mb-5 ${STATUS[status].badge}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-sm font-medium mb-0.5 ${STATUS[status].color}`}>
              {STATUS[status].label}
            </p>
            <p className="text-slate-500 text-xs">
              Limite: {absenceLimit} falta{absenceLimit !== 1 ? 's' : ''} ({ABSENCE_LIMIT_RATIO * 100}% de {data.totalClasses})
            </p>
          </div>
          <span className={`text-4xl font-bold font-mono ${STATUS[status].color}`}>
            {data.absences || 0}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${STATUS[status].bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{data.absences || 0} faltas</span>
          <span className={remaining > 0 ? 'text-slate-400' : STATUS.critical.color}>
            {remaining > 0
              ? `Pode faltar mais ${remaining} aula${remaining !== 1 ? 's' : ''}`
              : '⚠ Limite atingido!'}
          </span>
        </div>
      </div>

      {/* Grid de stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total de aulas', value: data.totalClasses, unit: '' },
          { label: 'Faltas',         value: data.absences || 0, unit: '' },
          { label: 'Restantes',      value: remaining,          unit: '' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold font-mono text-white mb-1">{value}</div>
            <div className="text-slate-600 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={markPresent}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-medium rounded-xl transition-colors"
          >
            ✓ Presente
          </button>
          <button
            onClick={() => markAbsent(data.classesPerDay || 1)}
            disabled={(data.absences || 0) >= absenceLimit * 1.5}
            className="flex items-center justify-center gap-2 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
          >
            ✗ Faltei
          </button>
        </div>

        {/* Marcar falta individual (quando classesPerDay > 1) */}
        {(data.classesPerDay || 1) > 1 && (
          <button
            onClick={() => markAbsent(1)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl transition-colors"
          >
            Marcar apenas 1 falta (de {data.classesPerDay} possíveis)
          </button>
        )}

        <button
          onClick={undoLast}
          disabled={(data.records || []).length === 0}
          className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs disabled:opacity-30 transition-colors"
        >
          ↩ Desfazer último registro
        </button>
      </div>

      {showConfig && (
        <ConfigModal
          data={data}
          onSave={(d) => updateSubject(subject.id, { attendance: d })}
          onClose={() => setShowConfig(false)}
        />
      )}
      {showHistory && (
        <HistoryModal records={data.records || []} onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}
