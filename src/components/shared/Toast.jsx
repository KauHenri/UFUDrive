// src/components/shared/Toast.jsx
import { useState, useCallback, createContext, useContext, useEffect } from 'react'

const ToastContext = createContext(null)

const TYPE_STYLES = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  error:   'bg-red-500/15 border-red-500/30 text-red-300',
  info:    'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
}

const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

let _addToast = null

// Chamável de fora de componentes React (ex: services)
export function toast(message, type = 'info', duration = 4000) {
  _addToast?.({ message, type, duration })
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = `toast_${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  // Registra função global
  useEffect(() => {
    _addToast = addToast
    return () => { _addToast = null }
  }, [addToast])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Portal de toasts */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 px-4 py-3 border rounded-xl text-sm shadow-lg shadow-black/30 max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-2 ${TYPE_STYLES[t.type] || TYPE_STYLES.info}`}
          >
            <span className="font-bold shrink-0 mt-0.5">{TYPE_ICONS[t.type]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
