// src/pages/NewSubjectPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import { DriveService } from '@/services/drive.service'
import { ALL_MODULES, DEFAULT_MODULES } from '@/config/constants'
import { sanitizeText } from '@/utils/sanitize'

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#64748b',
]
const ICONS = ['📚','🧠','⚡','🔬','💡','🖥️','📐','📈','🎓','🔭','🧮','📡']

export function NewSubjectPage() {
  const navigate = useNavigate()
  const { config, addSubject, appFolderId } = useConfigStore()

  const [step, setStep] = useState(1) // 1: info, 2: modules, 3: criando...
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    code: '',
    professor: '',
    color: COLORS[0],
    icon: ICONS[0],
  })

  const [modules, setModules] = useState({ ...DEFAULT_MODULES })

  const toggleModule = (key) =>
    setModules((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleCreate = async () => {
    setStep(3)
    setError(null)
    try {
      // 1. Garante pasta do semestre
      const semesterLabel =
        config?.academicProfile?.currentSemester || 'Sem Semestre'

      const semesterFolderId = await DriveService.ensureSemesterFolder(
        semesterLabel,
        appFolderId
      )

      // 2. Cria estrutura de pastas da disciplina
      const { rootFolderId, folders } = await DriveService.createSubjectStructure(
        semesterFolderId,
        sanitizeText(form.name)
      )

      // 3. Monta objeto da disciplina
      const subject = {
        id: `subj_${Date.now()}`,
        semesterId: semesterLabel,
        name: sanitizeText(form.name),
        code: sanitizeText(form.code),
        professor: sanitizeText(form.professor),
        color: form.color,
        icon: form.icon,
        driveStructure: { rootFolderId, folders },
        enabledModules: { ...modules },
        gradeConfig: {
          scheme: 'weighted',
          components: [],
          currentGrade: null,
          predictedGrade: null,
        },
        kanban: {
          columns: ['backlog', 'todo', 'doing', 'done'],
          tasks: [],
        },
        flashcardDecks: [],
        externalFrames: [],
      }

      // 4. Salva no config.json
      await addSubject(subject)
      navigate('/app/subjects')
    } catch (err) {
      setError(err.message)
      setStep(2)
    }
  }

  // ── Step 3: Criando ────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Criando estrutura no Drive...</p>
          <p className="text-slate-500 text-sm mt-1">Isso pode levar alguns segundos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => (step === 1 ? navigate('/app/subjects') : setStep(1))}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
      >
        ← {step === 1 ? 'Voltar' : 'Informações da disciplina'}
      </button>

      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {step === 1 ? 'Nova disciplina' : 'Selecionar módulos'}
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        {step === 1
          ? 'Passo 1 de 2 — Informações básicas'
          : 'Passo 2 de 2 — Escolha as ferramentas desta matéria'}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Step 1: Informações ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Nome da disciplina *</label>
              <input
                type="text"
                placeholder="Ex: Máquinas de Aprendizado"
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
                  placeholder="Ex: FEELT001"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Professor</label>
                <input
                  type="text"
                  placeholder="Ex: Prof. Fulano"
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
                      form.icon === ic
                        ? 'bg-indigo-600 scale-110'
                        : 'bg-slate-800 hover:bg-slate-700'
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
                <p className="text-white text-sm font-medium">
                  {form.name || 'Nome da disciplina'}
                </p>
                <p className="text-slate-400 text-xs">{form.code || 'Código'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-colors"
          >
            Próximo — Selecionar módulos →
          </button>
        </div>
      )}

      {/* ── Step 2: Módulos ─────────────────────────────────────────────── */}
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
                <div
                  className={`w-10 h-6 rounded-full transition-all relative ${
                    modules[key] ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      modules[key] ? 'left-5' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-xs text-center">
            Você pode alterar os módulos ativos a qualquer momento.
          </p>

          <button
            onClick={handleCreate}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Criar disciplina e estrutura no Drive
          </button>
        </div>
      )}
    </div>
  )
}
