// src/modules/quick-links/QuickLinksModule.jsx
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

const LINK_TYPES = [
  { id: 'moodle',    label: 'Moodle',      icon: '🎓' },
  { id: 'classroom', label: 'Classroom',   icon: '📚' },
  { id: 'email',     label: 'Email Prof.', icon: '✉️' },
  { id: 'whatsapp',  label: 'WhatsApp',    icon: '💬' },
  { id: 'telegram',  label: 'Telegram',    icon: '📨' },
  { id: 'youtube',   label: 'YouTube',     icon: '▶️' },
  { id: 'github',    label: 'GitHub',      icon: '🐙' },
  { id: 'drive',     label: 'Drive',       icon: '📁' },
  { id: 'other',     label: 'Outro',       icon: '🔗' },
]

function getLinkType(id) {
  return LINK_TYPES.find((t) => t.id === id) || LINK_TYPES.at(-1)
}

function normalizeHref(url, type) {
  if (!url) return '#'
  if (type === 'email') return url.startsWith('mailto:') ? url : `mailto:${url}`
  if (type === 'whatsapp') return url.startsWith('https://') ? url : `https://wa.me/${url.replace(/\D/g, '')}`
  if (type === 'telegram') return url.startsWith('https://') ? url : `https://t.me/${url.replace('@', '')}`
  if (!url.startsWith('http')) return `https://${url}`
  return url
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LinkModal({ link, onSave, onDelete, onClose }) {
  const isNew = !link
  const [type,  setType]  = useState(link?.type  || 'moodle')
  const [label, setLabel] = useState(link?.label || '')
  const [url,   setUrl]   = useState(link?.url   || '')

  const selectedType = getLinkType(type)

  const submit = () => {
    if (!url.trim()) return
    onSave({
      id: link?.id || `link_${Date.now()}`,
      type,
      label: label.trim() || selectedType.label,
      url: url.trim(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {isNew ? 'Novo link' : 'Editar link'}
        </h3>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-slate-400 text-xs mb-2 block">Tipo</label>
            <div className="grid grid-cols-3 gap-1.5">
              {LINK_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setType(t.id); if (!label) setLabel('') }}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs transition-colors ${
                    type === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Nome do link <span className="text-slate-600">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder={selectedType.label}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* URL / Email */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              {type === 'email' ? 'Email' : type === 'whatsapp' ? 'Número (com DDD)' : 'URL'} *
            </label>
            <input
              autoFocus
              type="text"
              placeholder={
                type === 'email' ? 'professor@ufu.br' :
                type === 'whatsapp' ? '+55 34 9xxxx-xxxx' :
                'https://...'
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {!isNew && (
            <button
              onClick={() => { onDelete(link.id); onClose() }}
              className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors"
            >
              ✕
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!url.trim()}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-xl transition-colors font-medium"
          >
            {isNew ? 'Adicionar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Módulo principal ─────────────────────────────────────────────────────────

export function QuickLinksModule() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)

  const links = subject.quickLinks || []
  const [modal, setModal] = useState(null) // null | {} | { link }

  const saveLink = (link) => {
    const exists = links.find((l) => l.id === link.id)
    updateSubject(subject.id, {
      quickLinks: exists ? links.map((l) => (l.id === link.id ? link : l)) : [...links, link],
    })
  }

  const deleteLink = (id) => {
    updateSubject(subject.id, { quickLinks: links.filter((l) => l.id !== id) })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Links Rápidos
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Moodle, professor, grupos — abre em nova aba</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors"
        >
          + Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-16 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-slate-400 text-sm mb-4">Nenhum link salvo ainda.</p>
          <button
            onClick={() => setModal({})}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Adicionar primeiro link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => {
            const type = getLinkType(link.type)
            const href = normalizeHref(link.url, link.type)
            return (
              <div
                key={link.id}
                className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: subject.color + '22' }}
                  >
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{link.label || type.label}</p>
                    <p className="text-slate-500 text-xs truncate font-mono mt-0.5">
                      {link.url.replace(/^https?:\/\//, '').replace(/^mailto:/, '')}
                    </p>
                  </div>
                  <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-sm shrink-0">↗</span>
                </a>

                {/* Botão de editar */}
                <button
                  onClick={() => setModal({ link })}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded transition-all"
                  title="Editar"
                >
                  ✏
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal !== null && (
        <LinkModal
          link={modal.link || null}
          onSave={saveLink}
          onDelete={deleteLink}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
