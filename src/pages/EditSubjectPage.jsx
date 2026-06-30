// src/pages/EditSubjectPage.jsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import { ALL_MODULES } from '@/config/constants'
import { sanitizeText } from '@/utils/sanitize'

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#64748b',
]
const ICONS = ['📚','🧠','⚡','🔬','💡','🖥️','📐','📈','🎓','🔭','🧮','📡']

export function EditSubjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { config, updateSubject, removeSubject } = useConfigStore()

  const subject = config?.subjects?.find((s) => s.id === id)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [form, setForm] = useState({
    name:      subject?.name      || '',
    code:      subject?.code      || '',
    professor: subject?.professor || '',
    color:     subject?.color     || COLORS[0],
    icon:      subject?.icon      || ICONS[0],
  })

  const [modules, setModules] = useState({ ...(subject?.enabledModules || {}) })

  if (!subject) {
    navigate('/app/subjects')
    return null
  }

  const toggleModule = (key) =>
    setModules((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateSubject(id, {
        name:           sanitizeText(form.name),
        code:           sanitizeText(form.code),
        professor:      sanitizeText(form.professor),
        color:          form.color,
        icon:           form.icon,
        enabledModules: { ...modules },
      })
      navigate(`/app/subjects/${id}/grades`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await removeSubject(id)
      navigate('/app/subjects')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (saving) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Salvando…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
      >
        ← {step === 1 ? 'Voltar' : 'Informações'}
      </button>

      <h1
        className="text-2xl font-bold text-white mb-1"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Editar disciplina
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        {step === 1 ? 'Passo 1 de 2 — Informações básicas' : 'Passo 2 de 2 — Módulos ativos'}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Step 1: Info ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Código</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Professor</label>
                <input
                  type="text"
                  value={form.professor}
                  onChange={(e) => setForm({ ...form, professor: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Cor */}
            <div>
              <label className="block text-slate-400 text-xs mb-2">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: form.color === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Ícone */}
            <div>
              <label className="block text-slate-400 text-xs mb-2">Ícone</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                      form.icon === ic ? 'bg-indigo-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ borderColor: form.color + '60', backgroundColor: form.color + '10' }}
            >
              <span className="text-2xl">{form.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{form.name || 'Nome'}</p>
                <p className="text-slate-400 text-xs">{form.code || 'Código'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-colors"
          >
            Próximo — Módulos →
          </button>

          {/* Deletar */}
          <div className="pt-4 border-t border-slate-800">
            {showDeleteConfirm ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm mb-3">
                  Tem certeza? A disciplina será removida do sistema.
                  <span className="block text-red-500/70 text-xs mt-1">
                    As pastas no Drive não serão excluídas.
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-400 text-sm rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Sim, remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500/60 hover:text-red-400 text-sm transition-colors"
              >
                Remover disciplina…
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Módulos ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {ALL_MODULES.map(({ key, label, icon, description }, idx) => (
              <div
                key={key}
                className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800 transition-colors ${
                  idx < ALL_MODULES.length - 1 ? 'border-b border-slate-800' : ''
                }`}
                onClick={() => toggleModule(key)}
              >
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs">{description}</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all relative ${modules[key] ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${modules[key] ? 'left-5' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      )}
    </div>
  )
}
