// src/pages/LoginPage.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function LoginPage() {
  const { signIn, status, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated') navigate('/app/dashboard', { replace: true })
  }, [status, navigate])

  const handleSignIn = async () => {
    clearError()
    await signIn()
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Painel esquerdo — identidade visual */}
      <div className="hidden lg:flex flex-col w-1/2 bg-slate-900 border-r border-slate-800 relative overflow-hidden p-16 justify-between">
        {/* Grade decorativa */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradiente accent */}
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-violet-600/15 rounded-full blur-2xl" />

        {/* Topo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              U
            </div>
            <span className="text-white font-semibold tracking-wide">UFUDrive</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Sua vida acadêmica,<br />
            <span className="text-indigo-400">organizada.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Disciplinas, anotações, prazos e arquivos — tudo sincronizado no seu Google Drive.
          </p>
        </div>

        {/* Features */}
        <div className="relative space-y-4">
          {[
            { icon: '📁', text: 'Estrutura de pastas automática no Drive' },
            { icon: '📝', text: 'Editor Markdown com suporte a LaTeX' },
            { icon: '📊', text: 'Calculadora preditiva de notas' },
            { icon: '🔒', text: 'Acesso restrito apenas aos seus arquivos' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-slate-300 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="relative">
          <p className="text-slate-600 text-xs font-mono">
            Universidade Federal de Uberlândia · FEELT
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo mobile */}
        <div className="flex lg:hidden items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            U
          </div>
          <span className="text-white font-semibold tracking-wide text-lg">UFUDrive</span>
        </div>

        <div className="w-full max-w-sm">
          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Entrar
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Use sua conta Google para acessar o sistema.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
              {error.includes('CLIENT_ID') && (
                <p className="text-slate-500 text-xs mt-1">
                  Configure a variável <code className="font-mono text-indigo-400">VITE_GOOGLE_CLIENT_ID</code> no arquivo <code className="font-mono text-indigo-400">.env.local</code>
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 font-medium rounded-xl transition-all shadow-lg shadow-black/20 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                {/* Google SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          <p className="mt-6 text-center text-slate-600 text-xs leading-relaxed">
            O sistema solicita acesso{' '}
            <span className="text-slate-400">apenas aos arquivos que ele próprio criar</span>
            {' '}no seu Drive. Seus arquivos pessoais não são acessados.
          </p>
        </div>

        {/* Aviso de setup */}
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="mt-8 w-full max-w-sm p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-xs font-mono mb-1">⚠ Configuração pendente</p>
            <p className="text-slate-400 text-xs">
              Crie um arquivo <code className="text-amber-400">.env.local</code> com:
            </p>
            <pre className="mt-2 text-indigo-300 text-xs font-mono bg-slate-950 rounded p-2 overflow-x-auto">
              VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
