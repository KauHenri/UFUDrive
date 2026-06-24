// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { useConfigStore } from '@/store/config.store'
import { sanitizeText } from '@/utils/sanitize'

export function SettingsPage() {
  const { config, updateConfig, saving } = useConfigStore()
  const profile = config?.academicProfile ?? {}

  const [form, setForm] = useState({
    institution: profile.institution ?? 'Universidade Federal de Uberlândia',
    course: profile.course ?? '',
    department: profile.department ?? 'FEELT',
    currentSemester: profile.currentSemester ?? '',
    targetGPA: profile.targetGPA ?? 7.0,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const sanitized = {
      institution: sanitizeText(form.institution),
      course: sanitizeText(form.course),
      department: sanitizeText(form.department),
      currentSemester: sanitizeText(form.currentSemester),
      targetGPA: Number(form.targetGPA),
    }
    await updateConfig({ academicProfile: { ...profile, ...sanitized } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1
        className="text-2xl font-bold text-white mb-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Configurações
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-sm mb-4">Perfil Acadêmico</h2>

        {[
          { key: 'institution', label: 'Instituição' },
          { key: 'course',      label: 'Curso'       },
          { key: 'department',  label: 'Departamento'},
          { key: 'currentSemester', label: 'Semestre atual (ex: 2026/1)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-slate-400 text-xs mb-1.5">{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="block text-slate-400 text-xs mb-1.5">Média alvo</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.targetGPA}
            onChange={(e) => setForm({ ...form, targetGPA: e.target.value })}
            className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      {/* Info do Drive */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white font-semibold text-sm mb-3">Google Drive</h2>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Pasta raiz</span>
            <span className="text-indigo-400">UFUDrive/</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Config ID</span>
            <span className="text-slate-400 truncate ml-4">{config?.metadata?.appFolderId?.slice(0, 20)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Última modificação</span>
            <span className="text-slate-400">
              {config?.metadata?.lastModified
                ? new Date(config.metadata.lastModified).toLocaleString('pt-BR')
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
