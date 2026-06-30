// src/modules/ModulePlaceholder.jsx
// Componente genérico de "em breve" para módulos ainda não implementados

export function ModulePlaceholder({ icon, title, description, sprint }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700">
        {icon}
      </div>
      <h3
        className="text-white font-semibold mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>
      {sprint && (
        <span className="text-xs font-mono px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">
          {sprint}
        </span>
      )}
    </div>
  )
}
