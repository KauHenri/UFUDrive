// src/modules/notes/NotesEditor.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import { DriveService } from '@/services/drive.service'
import { AuthService } from '@/services/auth.service'
import { renderMarkdownWithLatex } from '@/utils/markdownRenderer'

const AUTOSAVE_DELAY = 1500 // ms

// Lista arquivos .md na pasta notes da disciplina
async function listNoteFiles(folderId) {
  const files = await DriveService.listFiles(folderId)
  return files.filter((f) => f.name.endsWith('.md') || f.mimeType === 'text/plain')
}

// Lê conteúdo de um arquivo como texto
async function readFileText(fileId) {
  const res = await DriveService.readFile(fileId)
  return res.text()
}

// Salva/atualiza um arquivo de texto no Drive
async function saveTextFile(content, { fileId = null, fileName, parentId }) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const meta = {
    name: fileName,
    mimeType: 'text/plain',
    ...(!fileId && parentId ? { parents: [parentId] } : {}),
  }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file', blob)

  const token = await AuthService.ensureToken()
  const method = fileId ? 'PATCH' : 'POST'
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Falha ao salvar nota: ${res.status}`)
  return res.json()
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NotesEditor() {
  const { subject } = useOutletContext()
  const saving = useConfigStore((s) => s.saving)

  const notesFolderId = subject.driveStructure?.folders?.notes

  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [activeFileName, setActiveFileName] = useState('')
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState('split') // 'edit' | 'split' | 'preview'
  const [driveStatus, setDriveStatus] = useState('idle') // 'idle'|'saving'|'saved'|'error'
  const [loadingFile, setLoadingFile] = useState(false)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [filesLoaded, setFilesLoaded] = useState(false)

  const autosaveTimer = useRef(null)
  const currentFileIdRef = useRef(null)

  // Carrega lista de arquivos
  useEffect(() => {
    if (!notesFolderId) return
    listNoteFiles(notesFolderId)
      .then((f) => { setFiles(f); setFilesLoaded(true) })
      .catch(() => setFilesLoaded(true))
  }, [notesFolderId])

  // Sincroniza ref para autosave
  useEffect(() => { currentFileIdRef.current = activeFileId }, [activeFileId])

  // Autosave com debounce
  const scheduleAutosave = useCallback((text, fileId, fileName) => {
    if (!fileId && !fileName) return
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      setDriveStatus('saving')
      try {
        const saved = await saveTextFile(text, {
          fileId: fileId || null,
          fileName: fileName,
          parentId: notesFolderId,
        })
        // Se era novo arquivo, atualiza o id na lista
        if (!fileId) {
          setActiveFileId(saved.id)
          currentFileIdRef.current = saved.id
          setFiles((prev) => {
            const exists = prev.find((f) => f.id === saved.id)
            return exists
              ? prev.map((f) => (f.id === saved.id ? { ...f, ...saved } : f))
              : [...prev, { id: saved.id, name: fileName }]
          })
        }
        setDriveStatus('saved')
        setTimeout(() => setDriveStatus('idle'), 2000)
      } catch {
        setDriveStatus('error')
      }
    }, AUTOSAVE_DELAY)
  }, [notesFolderId])

  const handleContentChange = (e) => {
    const val = e.target.value
    setContent(val)
    scheduleAutosave(val, currentFileIdRef.current, activeFileName)
  }

  // Abre um arquivo existente
  const openFile = async (file) => {
    if (file.id === activeFileId) return
    setLoadingFile(true)
    setActiveFileId(file.id)
    setActiveFileName(file.name)
    setContent('')
    try {
      const text = await readFileText(file.id)
      setContent(text)
    } catch {
      setContent('*Erro ao carregar arquivo.*')
    } finally {
      setLoadingFile(false)
    }
  }

  // Cria novo arquivo
  const handleCreateFile = async () => {
    const name = newFileName.trim().replace(/\.md$/, '') + '.md'
    if (!name || name === '.md') return
    setShowNewFile(false)
    setNewFileName('')
    setActiveFileId(null)
    setActiveFileName(name)
    setContent('')
    currentFileIdRef.current = null
  }

  const renderedHtml = renderMarkdownWithLatex(content)

  if (!notesFolderId) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8 text-center">
        <div>
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-slate-400 text-sm">Pasta de anotações não encontrada no Drive.</p>
          <p className="text-slate-600 text-xs mt-1">Recadastre a disciplina para recriar a estrutura.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar de arquivos ────────────────────────────────────────── */}
      <div className="w-52 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/40">
        <div className="px-3 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Anotações</span>
          <button
            onClick={() => setShowNewFile(true)}
            className="text-indigo-400 hover:text-indigo-300 text-lg leading-none"
            title="Nova anotação"
          >
            +
          </button>
        </div>

        {/* Modal inline: novo arquivo */}
        {showNewFile && (
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900">
            <input
              autoFocus
              type="text"
              placeholder="nome-do-arquivo"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') { setShowNewFile(false); setNewFileName('') }
              }}
              className="w-full bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white text-xs focus:outline-none"
            />
            <p className="text-slate-600 text-xs mt-1">Enter para criar · Esc para cancelar</p>
          </div>
        )}

        {/* Lista de arquivos */}
        <div className="flex-1 overflow-y-auto py-1">
          {!filesLoaded ? (
            <div className="flex justify-center pt-6">
              <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 && !activeFileName ? (
            <p className="text-slate-600 text-xs text-center pt-6 px-3">
              Nenhuma anotação ainda. Clique em + para criar.
            </p>
          ) : (
            <>
              {/* Arquivo novo (ainda não salvo) */}
              {activeFileName && !activeFileId && (
                <button
                  className="w-full text-left px-3 py-2 text-xs text-indigo-300 bg-indigo-500/10 flex items-center gap-2"
                >
                  <span className="text-indigo-500">●</span>
                  <span className="truncate">{activeFileName}</span>
                </button>
              )}
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => openFile(file)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                    activeFileId === file.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-slate-600">📝</span>
                  <span className="truncate">{file.name.replace(/\.md$/, '')}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Área principal ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950/20">
          <span className="text-slate-500 text-xs truncate flex-1 font-mono">
            {activeFileName || 'Selecione ou crie uma anotação'}
          </span>

          {/* Status de save */}
          <span className={`text-xs font-mono shrink-0 ${
            driveStatus === 'saving' ? 'text-indigo-400 animate-pulse' :
            driveStatus === 'saved'  ? 'text-emerald-400' :
            driveStatus === 'error'  ? 'text-red-400' : 'text-transparent'
          }`}>
            {driveStatus === 'saving' ? '● salvando…' :
             driveStatus === 'saved'  ? '✓ salvo' :
             driveStatus === 'error'  ? '✗ erro ao salvar' : '●'}
          </span>

          {/* Modo de visualização */}
          <div className="flex shrink-0 bg-slate-800 rounded-lg p-0.5">
            {[
              { id: 'edit',    icon: '✏️', title: 'Editar' },
              { id: 'split',   icon: '⬛', title: 'Dividido' },
              { id: 'preview', icon: '👁',  title: 'Prévia' },
            ].map(({ id, icon, title }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                title={title}
                className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                  viewMode === id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Preview */}
        {!activeFileName ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="text-4xl mb-4">📝</div>
              <p className="text-slate-500 text-sm mb-2">Selecione uma anotação ou crie uma nova</p>
              <button
                onClick={() => setShowNewFile(true)}
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                + Nova anotação
              </button>
            </div>
          </div>
        ) : loadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'}`}>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder={`# Título da anotação\n\nEscreva em Markdown...\n\nUse $E = mc^2$ para LaTeX inline e $$\\int_0^\\infty$$ para blocos.`}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent text-slate-200 text-sm font-mono p-5 resize-none focus:outline-none leading-relaxed"
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                />
              </div>
            )}

            {/* Preview */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div
                className={`overflow-y-auto p-6 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}
              >
                {content ? (
                  <div
                    className="prose-notes"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                ) : (
                  <p className="text-slate-600 text-sm italic">A prévia aparecerá aqui…</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
