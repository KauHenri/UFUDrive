// src/modules/media/MediaViewer.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { DriveService } from '@/services/drive.service'

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const PDF_MIME = 'application/pdf'

function FileIcon({ mimeType }) {
  if (mimeType === PDF_MIME) return <span className="text-2xl">📄</span>
  if (IMAGE_MIMES.includes(mimeType)) return <span className="text-2xl">🖼️</span>
  return <span className="text-2xl">📎</span>
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaViewer() {
  const { subject } = useOutletContext()

  const slidesFolderId = subject.driveStructure?.folders?.slides
  const assignmentsFolderId = subject.driveStructure?.folders?.assignments

  const [activeFolder, setActiveFolder] = useState('slides')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [loadingMedia, setLoadingMedia] = useState(false)

  const folderId = activeFolder === 'slides' ? slidesFolderId : assignmentsFolderId

  // Carrega lista ao trocar pasta
  useEffect(() => {
    if (!folderId) { setFiles([]); return }
    setLoading(true)
    setSelectedFile(null)
    setMediaUrl(null)
    DriveService.listFiles(folderId)
      .then((f) => {
        // Filtra apenas visualizáveis
        const viewable = f.filter(
          (file) => file.mimeType === PDF_MIME || IMAGE_MIMES.includes(file.mimeType)
        )
        setFiles(viewable)
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false))
  }, [folderId])

  // Carrega URL autenticada ao selecionar arquivo
  const openFile = async (file) => {
    if (selectedFile?.id === file.id) return
    setSelectedFile(file)
    setMediaUrl(null)
    setLoadingMedia(true)
    try {
      const url = await DriveService.getMediaUrl(file.id)
      setMediaUrl(url)
    } catch {
      setMediaUrl(null)
    } finally {
      setLoadingMedia(false)
    }
  }

  const hasSlides = !!slidesFolderId
  const hasAssignments = !!assignmentsFolderId

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/40">
        {/* Seletor de pasta */}
        <div className="p-2 border-b border-slate-800 space-y-1">
          {[
            { id: 'slides',      label: 'Slides',     icon: '📄', available: hasSlides      },
            { id: 'assignments', label: 'Atividades',  icon: '📋', available: hasAssignments },
          ].map(({ id, label, icon, available }) => (
            <button
              key={id}
              disabled={!available}
              onClick={() => setActiveFolder(id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                !available
                  ? 'opacity-40 cursor-not-allowed text-slate-600'
                  : activeFolder === id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Lista de arquivos */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex justify-center pt-6">
              <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="px-3 pt-6 text-center">
              <p className="text-slate-600 text-xs">Nenhum arquivo encontrado.</p>
              <p className="text-slate-700 text-xs mt-1">
                Envie arquivos diretamente para a pasta no Drive.
              </p>
            </div>
          ) : (
            files.map((file) => (
              <button
                key={file.id}
                onClick={() => openFile(file)}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-start gap-2 ${
                  selectedFile?.id === file.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileIcon mimeType={file.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate leading-tight">{file.name}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{formatSize(parseInt(file.size))}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Visualizador ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/20">
        {!selectedFile ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-4xl mb-4">📄</div>
              <p className="text-slate-500 text-sm">Selecione um arquivo para visualizar</p>
              <p className="text-slate-700 text-xs mt-2">
                PDFs e imagens são exibidos diretamente do Drive
              </p>
            </div>
          </div>
        ) : loadingMedia ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Carregando…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de título */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-800">
              <FileIcon mimeType={selectedFile.mimeType} />
              <span className="text-slate-300 text-sm truncate flex-1">{selectedFile.name}</span>
              <span className="text-slate-600 text-xs">{formatSize(parseInt(selectedFile.size))}</span>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-hidden">
              {selectedFile.mimeType === PDF_MIME && mediaUrl ? (
                <iframe
                  src={mediaUrl}
                  className="w-full h-full border-0"
                  title={selectedFile.name}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : IMAGE_MIMES.includes(selectedFile.mimeType) && mediaUrl ? (
                <div className="flex-1 h-full overflow-auto flex items-center justify-center p-4">
                  <img
                    src={mediaUrl}
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="text-3xl mb-3">⚠️</div>
                    <p className="text-slate-400 text-sm">Não foi possível carregar o arquivo.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
