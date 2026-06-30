// src/modules/code-editor/CodeEditorModule.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { DriveService } from '@/services/drive.service'
import { AuthService } from '@/services/auth.service'

// CodeMirror 6
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { cpp } from '@codemirror/lang-cpp'

const AUTOSAVE_DELAY = 1500

// Linguagens suportadas
const LANGUAGES = [
  { id: 'python',     label: 'Python',     ext: '.py',  lang: python    },
  { id: 'javascript', label: 'JavaScript', ext: '.js',  lang: () => javascript({ jsx: false }) },
  { id: 'typescript', label: 'TypeScript', ext: '.ts',  lang: () => javascript({ typescript: true }) },
  { id: 'c',          label: 'C',          ext: '.c',   lang: cpp       },
  { id: 'cpp',        label: 'C++',        ext: '.cpp', lang: cpp       },
  { id: 'verilog',    label: 'Verilog',    ext: '.v',   lang: null      }, // sem parser ainda
  { id: 'text',       label: 'Texto',      ext: '.txt', lang: null      },
]

function getLang(langId) {
  const found = LANGUAGES.find((l) => l.id === langId)
  if (!found?.lang) return []
  return [found.lang()]
}

// Salva um arquivo genérico de texto no Drive
async function saveDriveFile(content, { fileId = null, fileName, parentId }) {
  const blob = new Blob([content], { type: 'text/plain' })
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
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: form })
  if (!res.ok) throw new Error(`Erro ao salvar: ${res.status}`)
  return res.json()
}

// ─── Hook: CodeMirror editor ─────────────────────────────────────────────────

function useCodeMirror({ value, onChange, langId, fileKey, isLoaded }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  
  // Usar ref para onChange para evitar recriação do view se onChange mudar
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!editorRef.current || !isLoaded) return

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        oneDark,
        ...getLang(langId),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
          '.cm-content': { padding: '8px 0', minHeight: '100%' },
        }),
      ],
    })

    const view = new EditorView({ state: startState, parent: editorRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [langId, fileKey, isLoaded]) // Reconstrói ao mudar arquivo ou após carregar

  return editorRef
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CodeEditorModule() {
  const { subject } = useOutletContext()
  const codeFolderId = subject.driveStructure?.folders?.code

  const [files, setFiles]           = useState([])
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [activeFileId, setActiveFileId] = useState(null)
  const [activeFileName, setActiveFileName] = useState('')
  const [content, setContent]       = useState('')
  const [langId, setLangId]         = useState('python')
  const [driveStatus, setDriveStatus] = useState('idle')
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)

  const autosaveTimer = useRef(null)
  const fileIdRef = useRef(null)
  const fileNameRef = useRef('')

  // Carrega lista de arquivos
  useEffect(() => {
    if (!codeFolderId) return
    DriveService.listFiles(codeFolderId)
      .then((f) => { setFiles(f); setFilesLoaded(true) })
      .catch(() => setFilesLoaded(true))
  }, [codeFolderId])

  useEffect(() => { fileIdRef.current = activeFileId }, [activeFileId])
  useEffect(() => { fileNameRef.current = activeFileName }, [activeFileName])

  // Autosave
  const scheduleAutosave = useCallback((text) => {
    clearTimeout(autosaveTimer.current)
    const fid = fileIdRef.current
    const fname = fileNameRef.current
    if (!fname) return
    autosaveTimer.current = setTimeout(async () => {
      setDriveStatus('saving')
      try {
        const saved = await saveDriveFile(text, {
          fileId: fid || null,
          fileName: fname,
          parentId: codeFolderId,
        })
        if (!fid) {
          setActiveFileId(saved.id)
          fileIdRef.current = saved.id
          setFiles((prev) => {
            const exists = prev.find((f) => f.id === saved.id)
            return exists
              ? prev.map((f) => (f.id === saved.id ? { ...f, ...saved } : f))
              : [...prev, { id: saved.id, name: fname }]
          })
        }
        setDriveStatus('saved')
        setTimeout(() => setDriveStatus('idle'), 2000)
      } catch {
        setDriveStatus('error')
      }
    }, AUTOSAVE_DELAY)
  }, [codeFolderId])

  const handleChange = (val) => {
    setContent(val)
    scheduleAutosave(val)
  }

  const editorRef = useCodeMirror({ 
    value: content, 
    onChange: handleChange, 
    langId, 
    fileKey: activeFileName, 
    isLoaded: !loadingFile 
  })

  // Detecta linguagem pelo nome do arquivo
  const detectLang = (name) => {
    const ext = '.' + name.split('.').pop().toLowerCase()
    const found = LANGUAGES.find((l) => l.ext === ext)
    return found?.id || 'text'
  }

  const openFile = async (file) => {
    if (file.id === activeFileId) return
    setLoadingFile(true)
    setActiveFileId(file.id)
    setActiveFileName(file.name)
    setLangId(detectLang(file.name))
    try {
      const res = await DriveService.readFile(file.id)
      const text = await res.text()
      setContent(text)
    } catch {
      setContent('// Erro ao carregar arquivo')
    } finally {
      setLoadingFile(false)
    }
  }

  const handleCreateFile = () => {
    let name = newFileName.trim()
    if (!name) return
    if (!name.includes('.')) name += '.py'
    setShowNewFile(false)
    setNewFileName('')
    setActiveFileId(null)
    setActiveFileName(name)
    setLangId(detectLang(name))
    setContent('')
  }

  if (!codeFolderId) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8 text-center">
        <div>
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-slate-400 text-sm">Pasta de código não encontrada.</p>
          <p className="text-slate-600 text-xs mt-1">Recadastre a disciplina para recriar a estrutura.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-52 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/40">
        <div className="px-3 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Arquivos</span>
          <button onClick={() => setShowNewFile(true)} className="text-indigo-400 hover:text-indigo-300 text-lg leading-none" title="Novo arquivo">+</button>
        </div>

        {showNewFile && (
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900">
            <input
              autoFocus
              type="text"
              placeholder="arquivo.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') { setShowNewFile(false); setNewFileName('') }
              }}
              className="w-full bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-white text-xs focus:outline-none"
            />
            <p className="text-slate-600 text-xs mt-1">Enter criar · Esc cancelar</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {!filesLoaded ? (
            <div className="flex justify-center pt-6">
              <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeFileName && !activeFileId && (
                <div className="w-full px-3 py-2 text-xs text-indigo-300 bg-indigo-500/10 flex items-center gap-2">
                  <span className="text-indigo-500">●</span>
                  <span className="truncate">{activeFileName}</span>
                </div>
              )}
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => openFile(file)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                    activeFileId === file.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-slate-600">💻</span>
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
              {files.length === 0 && !activeFileName && (
                <p className="text-slate-600 text-xs text-center pt-6 px-3">Crie um arquivo com + para começar.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Editor principal ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950/20">
          <span className="text-slate-500 text-xs truncate flex-1 font-mono">
            {activeFileName || 'Selecione ou crie um arquivo'}
          </span>

          {/* Status */}
          <span className={`text-xs font-mono shrink-0 ${
            driveStatus === 'saving' ? 'text-indigo-400 animate-pulse' :
            driveStatus === 'saved'  ? 'text-emerald-400' :
            driveStatus === 'error'  ? 'text-red-400' : 'text-transparent'
          }`}>
            {driveStatus === 'saving' ? '● salvando…' :
             driveStatus === 'saved'  ? '✓ salvo' :
             driveStatus === 'error'  ? '✗ erro' : '●'}
          </span>

          {/* Seletor de linguagem */}
          {activeFileName && (
            <select
              value={langId}
              onChange={(e) => setLangId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Editor */}
        {!activeFileName ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-4xl mb-4">💻</div>
              <p className="text-slate-500 text-sm mb-2">Selecione ou crie um arquivo para editar</p>
              <button onClick={() => setShowNewFile(true)} className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                + Novo arquivo
              </button>
            </div>
          </div>
        ) : loadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div ref={editorRef} className="flex-1 overflow-hidden" />
        )}
      </div>
    </div>
  )
}
