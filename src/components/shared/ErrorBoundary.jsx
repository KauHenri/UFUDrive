// src/components/shared/ErrorBoundary.jsx
import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[UFUDrive] Erro não tratado:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-8">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-xl p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-white font-semibold text-lg mb-2">Algo deu errado</h2>
            <p className="text-slate-400 text-sm mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
