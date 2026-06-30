// src/modules/grade-calculator/GradeCalculator.jsx
import { useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import {
  calcCurrentGrade,
  calcNeededGrade,
  gradeColor,
  gradeBgColor,
} from '@/utils/gradeUtils'

const PASSING_GRADE = 6.0

function GradeRow({ comp, onChange, onRemove, passingGrade }) {
  const [localScore, setLocalScore] = useState(
    comp.score !== null && comp.score !== undefined ? String(comp.score) : ''
  )
  const [editing, setEditing] = useState(false)

  const commit = () => {
    setEditing(false)
    const val = localScore === '' ? null : parseFloat(localScore)
    if (val !== comp.score) onChange({ ...comp, score: val })
  }

  const scoreNum = localScore !== '' ? parseFloat(localScore) : null
  const normalized = scoreNum !== null ? (scoreNum / (comp.maxScore || 10)) * 10 : null

  return (
    <div className="group flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors rounded-lg">
      {/* Peso badge */}
      <div className="w-12 shrink-0 text-center">
        <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
          {Math.round(comp.weight * 100)}%
        </span>
      </div>

      {/* Label */}
      <p className="flex-1 text-sm text-slate-300 font-medium min-w-0 truncate">
        {comp.label}
      </p>

      {/* Data de vencimento */}
      {comp.dueDate && (
        <span className="hidden sm:block text-xs text-slate-600 font-mono shrink-0">
          {new Date(comp.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
      )}

      {/* Input de nota */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <input
            autoFocus
            type="number"
            min="0"
            max={comp.maxScore || 10}
            step="0.1"
            value={localScore}
            onChange={(e) => setLocalScore(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="w-16 bg-slate-700 border border-indigo-500 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`w-16 px-2 py-1 rounded-lg text-sm text-center font-mono transition-all border ${
              scoreNum !== null
                ? `${gradeColor(normalized, passingGrade)} border-slate-700 hover:border-slate-500`
                : 'text-slate-600 border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-400'
            }`}
          >
            {scoreNum !== null ? scoreNum.toFixed(1) : '—'}
          </button>
        )}
        <span className="text-slate-600 text-xs">/{comp.maxScore || 10}</span>
      </div>

      {/* Remover */}
      <button
        onClick={() => onRemove(comp.id)}
        className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all text-sm ml-1"
        title="Remover"
      >
        ✕
      </button>
    </div>
  )
}

function AddComponentModal({ onAdd, onClose, existingWeightSum }) {
  const [form, setForm] = useState({
    label: '', weight: '', maxScore: '10', dueDate: '',
  })
  const [err, setErr] = useState('')

  const weightRemaining = Math.max(0, 1 - existingWeightSum)

  const submit = () => {
    if (!form.label.trim()) { setErr('Informe o nome da avaliação.'); return }
    const w = parseFloat(form.weight) / 100
    if (!w || w <= 0) { setErr('Informe um peso válido (ex: 35 para 35%).'); return }
    if (w > weightRemaining + 0.001) {
      setErr(`Peso total excederia 100%. Disponível: ${Math.round(weightRemaining * 100)}%`)
      return
    }
    onAdd({
      id: `comp_${Date.now()}`,
      label: form.label.trim(),
      weight: w,
      maxScore: parseFloat(form.maxScore) || 10,
      score: null,
      dueDate: form.dueDate || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Adicionar avaliação
        </h3>

        {err && <p className="text-red-400 text-xs mb-3">{err}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Nome *</label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Prova 1"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Peso (%) — restante: {Math.round(weightRemaining * 100)}%
              </label>
              <input
                type="number"
                min="1"
                max={Math.round(weightRemaining * 100)}
                placeholder="35"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Nota máx.</label>
              <input
                type="number"
                min="1"
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Data (opcional)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

export function GradeCalculator() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)
  const saving = useConfigStore((s) => s.saving)

  const [showModal, setShowModal] = useState(false)
  const [saveDebounce, setSaveDebounce] = useState(null)

  const gradeConfig = subject.gradeConfig || { components: [] }
  const components = gradeConfig.components || []
  const passingGrade = PASSING_GRADE

  const currentGrade = calcCurrentGrade(components)
  const { needed, status } = calcNeededGrade(components, passingGrade)
  const totalWeight = components.reduce((s, c) => s + c.weight, 0)

  const persistComponents = useCallback(
    (newComponents) => {
      if (saveDebounce) clearTimeout(saveDebounce)
      const t = setTimeout(() => {
        updateSubject(subject.id, {
          gradeConfig: {
            ...gradeConfig,
            components: newComponents,
            currentGrade: calcCurrentGrade(newComponents),
          },
        })
      }, 800)
      setSaveDebounce(t)
    },
    [subject.id, gradeConfig, updateSubject, saveDebounce]
  )

  const handleChange = (updated) => {
    const newComponents = components.map((c) => (c.id === updated.id ? updated : c))
    // Optimistic update via store (without waiting for Drive)
    updateSubject(subject.id, {
      gradeConfig: { ...gradeConfig, components: newComponents },
    })
    persistComponents(newComponents)
  }

  const handleRemove = (id) => {
    const newComponents = components.filter((c) => c.id !== id)
    updateSubject(subject.id, {
      gradeConfig: { ...gradeConfig, components: newComponents },
    })
    persistComponents(newComponents)
  }

  const handleAdd = (comp) => {
    const newComponents = [...components, comp]
    updateSubject(subject.id, {
      gradeConfig: { ...gradeConfig, components: newComponents },
    })
    persistComponents(newComponents)
  }

  // Barra de progresso da média
  const progressPct = currentGrade !== null ? Math.min((currentGrade / 10) * 100, 100) : 0
  const passingPct = (passingGrade / 10) * 100

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Calculadora de Notas
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Clique na nota para editar · salvo automaticamente
          </p>
        </div>
        {saving && (
          <span className="text-indigo-400 text-xs font-mono animate-pulse">salvando…</span>
        )}
      </div>

      {/* ── Painel de média ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-slate-500 text-xs mb-1">Média atual</p>
            <p
              className={`text-4xl font-bold font-mono ${
                currentGrade !== null ? gradeColor(currentGrade, passingGrade) : 'text-slate-600'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {currentGrade !== null ? currentGrade.toFixed(2) : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs mb-1">Corte de aprovação</p>
            <p className="text-slate-400 text-lg font-mono">{passingGrade.toFixed(1)}</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
          {/* Marcador de corte */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
            style={{ left: `${passingPct}%` }}
          />
          {/* Barra de progresso */}
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              currentGrade !== null ? gradeBgColor(currentGrade, passingGrade) : 'bg-slate-700'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0</span>
          <span className="text-slate-500">corte {passingGrade}</span>
          <span>10</span>
        </div>
      </div>

      {/* ── Status de aprovação ────────────────────────────────────────── */}
      {status !== 'ok' && (
        <div
          className={`rounded-xl px-4 py-3 mb-5 text-sm ${
            status === 'guaranteed'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : status === 'impossible'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
          }`}
        >
          {status === 'guaranteed' && '✅ Aprovação garantida mesmo com zero nas avaliações restantes.'}
          {status === 'impossible' && `❌ Aprovação impossível — precisaria de ${needed?.toFixed(1)} nas avaliações restantes.`}
          {status === 'pending' && needed !== null && (
            <>
              📌 Você precisa de <strong className="font-mono">{needed.toFixed(2)}</strong> nas avaliações restantes para ser aprovado.
            </>
          )}
        </div>
      )}

      {/* ── Lista de componentes ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-800 bg-slate-800/40">
          <span className="w-12 text-center text-xs text-slate-600 font-mono">Peso</span>
          <span className="flex-1 text-xs text-slate-600">Avaliação</span>
          <span className="text-xs text-slate-600">Nota</span>
          <span className="w-5" />
        </div>

        {components.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-slate-500 text-sm">Nenhuma avaliação cadastrada.</p>
            <p className="text-slate-600 text-xs mt-1">Clique em "Adicionar avaliação" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {components.map((comp) => (
              <GradeRow
                key={comp.id}
                comp={comp}
                onChange={handleChange}
                onRemove={handleRemove}
                passingGrade={passingGrade}
              />
            ))}
          </div>
        )}

        {/* Footer: soma dos pesos */}
        {components.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-800 bg-slate-800/20">
            <span className="w-12 text-center text-xs font-mono font-bold text-slate-400">
              {Math.round(totalWeight * 100)}%
            </span>
            <span className="flex-1 text-xs text-slate-600">Total</span>
            {Math.abs(totalWeight - 1) > 0.01 && (
              <span className="text-xs text-amber-400">
                ⚠ Pesos somam {Math.round(totalWeight * 100)}% (esperado 100%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Botão adicionar ────────────────────────────────────────────── */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 text-sm rounded-xl transition-all"
      >
        + Adicionar avaliação
      </button>

      {showModal && (
        <AddComponentModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          existingWeightSum={totalWeight}
        />
      )}
    </div>
  )
}
