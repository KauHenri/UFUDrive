// src/modules/external/ExternalFrame.jsx
import { useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'

const PRESETS = [
  { label: 'Moodle UFU',  icon: '🎓', url: 'https://moodle.ufu.br' },
  { label: 'SIGAA',       icon: '📋', url: 'https://sigaa.ufu.br'  },
  { label: 'YouTube',     icon: '▶️',  url: 'https://www.youtube.com' },
  { label: 'Wolfram Alpha',icon: '🔢', url: 'https://www.wolframalpha.com' },
  { label: 'Overleaf',   icon: '📄', url: 'https://www.overleaf.com' },
  { label: 'Desmos',     icon: '📈', url: 'https://www.desmos.com/calculator' },
]

function isValidUrl(str) {
  try {
    const u = new URL(str.startsWith('http') ? str : `https://${str}`)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch { return false }
}

function normalizeUrl(str) {
  if (!str.startsWith('http')) return `https://${str}`
  return str
}

export function ExternalFrame() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)

  const favorites = subject.externalLinks || []

  const [input, setInput]     = useState('')
  const [activeUrl, setActiveUrl] = useState(null)
  const [urlError, setUrlError]   = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const inputRef = useRef(null)

  const navigate = (url) => {
    const norm = normalizeUrl(url)
    if (!isValidUrl(norm)) { setUrlError('URL inválida.'); return }
    setUrlError('')
    setActiveUrl(norm)
    setInput(norm)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    navigate(input.trim())
  }

  const saveFavorite = () => {
    if (!activeUrl) return
    const exists = favorites.find((f) => f.url === activeUrl)
    if (exists) return
    const label = input.replace(/^https?:\/\//, '').split('/')[0]
    const updated = [...favorites, { label, url: activeUrl, icon: '🔗', addedAt: new Date().toISOString() }]
    updateSubject(subject.id, { externalLinks: updated })
  }

  const removeFavorite = (url) => {
    updateSubject(subject.id, { externalLinks: favorites.filter((f) => f.url !== url) })
  }

  const reload = () => setIframeKey((k) => k + 1)

  const isSaved = favorites.some((f) => f.url === activeUrl)

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar de favoritos ───────────────────────────────────────── */}
      <div className="w-52 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/40">
        <div className="px-3 py-3 border-b border-slate-800">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Favoritos</span>
        </div>

        {/* Presets */}
        <div className="px-2 py-2 border-b border-slate-800">
          <p className="text-slate-600 text-xs px-1 mb-1">Sugestões</p>
          {PRESETS.map((p) => (
            <button
              key={p.url}
              onClick={() => navigate(p.url)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                activeUrl === p.url
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{p.icon}</span>
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Favoritos da disciplina */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {favorites.length === 0 ? (
            <p className="text-slate-700 text-xs text-center pt-4 px-2">
              Abra uma URL e clique em ★ para salvar nos favoritos da disciplina.
            </p>
          ) : (
            <>
              <p className="text-slate-600 text-xs px-1 mb-1">Da disciplina</p>
              {favorites.map((fav) => (
                <div key={fav.url} className="flex items-center group">
                  <button
                    onClick={() => navigate(fav.url)}
                    className={`flex-1 text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors min-w-0 ${
                      activeUrl === fav.url
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{fav.icon}</span>
                    <span className="truncate">{fav.label}</span>
                  </button>
                  <button
                    onClick={() => removeFavorite(fav.url)}
                    className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 text-xs px-1 transition-all"
                    title="Remover"
                  >×</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Área principal ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra de navegação */}
        <form onSubmit={handleSubmit} className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-950/20">
          {/* Reload */}
          <button
            type="button"
            onClick={reload}
            disabled={!activeUrl}
            className="text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors text-base shrink-0"
            title="Recarregar"
          >
            ↺
          </button>

          {/* URL input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setUrlError('') }}
              placeholder="https://moodle.ufu.br ou qualquer URL…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Navegar */}
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors shrink-0"
          >
            Ir →
          </button>

          {/* Favoritar */}
          {activeUrl && (
            <button
              type="button"
              onClick={saveFavorite}
              disabled={isSaved}
              className={`text-lg transition-colors shrink-0 ${
                isSaved ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'
              }`}
              title={isSaved ? 'Já está nos favoritos' : 'Salvar nos favoritos'}
            >
              ★
            </button>
          )}

          {/* Abrir em nova aba */}
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-slate-300 transition-colors text-sm shrink-0"
              title="Abrir em nova aba"
            >
              ↗
            </a>
          )}
        </form>

        {urlError && (
          <div className="shrink-0 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
            <p className="text-red-400 text-xs">{urlError}</p>
          </div>
        )}

        {/* iFrame ou tela inicial */}
        {!activeUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="text-5xl">🌐</div>
            <div>
              <h3 className="text-white font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Janela Externa
              </h3>
              <p className="text-slate-500 text-sm max-w-xs">
                Abra qualquer site diretamente aqui — Moodle, SIGAA, materiais de aula — sem sair do UFUDrive.
              </p>
            </div>

            {/* Quick access */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              {PRESETS.map((p) => (
                <button
                  key={p.url}
                  onClick={() => navigate(p.url)}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all text-center"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-slate-400 text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            src={activeUrl}
            className="flex-1 w-full border-0 bg-white"
            title="Janela Externa"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          />
        )}
      </div>
    </div>
  )
}
