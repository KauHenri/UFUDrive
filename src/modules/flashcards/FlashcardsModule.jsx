// src/modules/flashcards/FlashcardsModule.jsx
import { useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useConfigStore } from '@/store/config.store'
import { createCard, applyReview, getDueCards, deckStats } from '@/utils/sm2'

// ─── Modal de criar/editar card ───────────────────────────────────────────────

function CardModal({ card, onSave, onDelete, onClose }) {
  const isNew = !card
  const [front, setFront] = useState(card?.front || '')
  const [back, setBack]   = useState(card?.back  || '')
  const [err, setErr]     = useState('')

  const submit = () => {
    if (!front.trim() || !back.trim()) { setErr('Preencha frente e verso.'); return }
    onSave(isNew ? createCard(front, back) : { ...card, front: front.trim(), back: back.trim() })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        <h3 className="text-white font-semibold mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {isNew ? 'Novo flashcard' : 'Editar flashcard'}
        </h3>
        {err && <p className="text-red-400 text-xs mb-3">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Frente (pergunta) *</label>
            <textarea
              autoFocus
              rows={3}
              placeholder="Ex: O que é a Lei de Ohm?"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Verso (resposta) *</label>
            <textarea
              rows={4}
              placeholder="Ex: V = R × I, onde V é tensão, R é resistência e I é corrente."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {!isNew && (
            <button
              onClick={() => { onDelete(card.id); onClose() }}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors"
            >
              Excluir
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors">Cancelar</button>
          <button onClick={submit} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium">
            {isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sessão de revisão ────────────────────────────────────────────────────────

const QUALITY_BUTTONS = [
  { quality: 0, label: 'Não lembrei',  color: 'bg-red-600 hover:bg-red-500',      hint: '×' },
  { quality: 2, label: 'Difícil',      color: 'bg-orange-600 hover:bg-orange-500', hint: '~' },
  { quality: 3, label: 'Com dificuldade', color: 'bg-yellow-600 hover:bg-yellow-500', hint: '≈' },
  { quality: 4, label: 'Fácil',        color: 'bg-emerald-600 hover:bg-emerald-500', hint: '✓' },
  { quality: 5, label: 'Perfeito',     color: 'bg-indigo-600 hover:bg-indigo-500',  hint: '★' },
]

function ReviewSession({ cards, onFinish, onRate }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState([])

  const card = cards[idx]
  const total = cards.length

  const rate = (quality) => {
    onRate(card, quality)
    const nextDone = [...done, card.id]
    setDone(nextDone)
    if (idx + 1 < cards.length) {
      setIdx(idx + 1)
      setFlipped(false)
    } else {
      onFinish(nextDone.length)
    }
  }

  if (!card) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 gap-6">
      {/* Progresso */}
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{idx + 1} de {total}</span>
          <span>{Math.round(((idx) / total) * 100)}% concluído</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card com flip */}
      <div
        className="w-full max-w-xl cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Frente */}
          <div
            className="absolute inset-0 bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-slate-500 text-xs mb-4 uppercase tracking-widest">Pergunta</p>
            <p className="text-white text-lg leading-relaxed">{card.front}</p>
            {!flipped && (
              <p className="text-slate-600 text-xs mt-6">Clique para ver a resposta →</p>
            )}
          </div>

          {/* Verso */}
          <div
            className="absolute inset-0 bg-slate-800 border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-indigo-400 text-xs mb-4 uppercase tracking-widest">Resposta</p>
            <p className="text-white text-lg leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Botões de avaliação — só aparecem após virar */}
      <div
        className={`w-full max-w-xl transition-all duration-300 ${
          flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <p className="text-slate-500 text-xs text-center mb-3">Como foi?</p>
        <div className="grid grid-cols-5 gap-2">
          {QUALITY_BUTTONS.map(({ quality, label, color, hint }) => (
            <button
              key={quality}
              onClick={() => rate(quality)}
              className={`${color} text-white text-xs font-medium py-3 px-2 rounded-xl transition-all flex flex-col items-center gap-1`}
            >
              <span className="text-base">{hint}</span>
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Resultado da sessão ──────────────────────────────────────────────────────

function SessionResult({ count, total, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center gap-6">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Sessão concluída!
        </h2>
        <p className="text-slate-400">
          Você revisou <span className="text-indigo-400 font-semibold">{count}</span> de {total} cards.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Voltar ao deck
      </button>
    </div>
  )
}

// ─── FlashcardsModule principal ───────────────────────────────────────────────

export function FlashcardsModule() {
  const { subject } = useOutletContext()
  const updateSubject = useConfigStore((s) => s.updateSubject)
  const saving = useConfigStore((s) => s.saving)

  const [modal, setModal]     = useState(null) // { card? }
  const [session, setSession] = useState(null) // 'reviewing' | 'done'
  const [doneCount, setDoneCount] = useState(0)

  const cards = subject.flashcards?.cards || []
  const stats = deckStats(cards)
  const dueCards = getDueCards(cards)

  const persistCards = useCallback((newCards) => {
    updateSubject(subject.id, { flashcards: { cards: newCards } })
  }, [subject.id, updateSubject])

  const saveCard = (card) => {
    const exists = cards.find((c) => c.id === card.id)
    persistCards(exists ? cards.map((c) => (c.id === card.id ? card : c)) : [...cards, card])
  }

  const deleteCard = (id) => persistCards(cards.filter((c) => c.id !== id))

  const rateCard = (card, quality) => {
    const updated = applyReview(card, quality)
    persistCards(cards.map((c) => (c.id === card.id ? updated : c)))
  }

  const handleFinish = (count) => {
    setDoneCount(count)
    setSession('done')
  }

  // ── Tela de revisão ──────────────────────────────────────────────────────
  if (session === 'reviewing') {
    return (
      <ReviewSession
        cards={dueCards}
        onRate={rateCard}
        onFinish={handleFinish}
      />
    )
  }

  if (session === 'done') {
    return (
      <SessionResult
        count={doneCount}
        total={dueCards.length}
        onClose={() => setSession(null)}
      />
    )
  }

  // ── Deck view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Flashcards
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {stats.total} card{stats.total !== 1 ? 's' : ''} · {stats.due} para revisar hoje
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-indigo-400 text-xs font-mono animate-pulse">salvando…</span>}
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl transition-colors"
          >
            + Card
          </button>
          {dueCards.length > 0 && (
            <button
              onClick={() => setSession('reviewing')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
            >
              🎯 Revisar {dueCards.length}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total',    value: stats.total,     color: 'text-slate-300'  },
            { label: 'Revisando', value: stats.reviewing, color: 'text-indigo-400' },
            { label: 'Hoje',     value: stats.due,        color: stats.due > 0 ? 'text-emerald-400' : 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold font-mono mb-1 ${color}`}>{value}</div>
              <div className="text-slate-600 text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de cards */}
      {cards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-16 text-center">
          <div className="text-4xl mb-4">🃏</div>
          <p className="text-slate-400 text-sm mb-4">Nenhum flashcard ainda.</p>
          <button
            onClick={() => setModal({})}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Criar primeiro card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cards.map((card) => {
            const isDue = card.nextReview <= new Date().toISOString().split('T')[0]
            return (
              <button
                key={card.id}
                onClick={() => setModal({ card })}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    isDue ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isDue ? 'revisar' : `+${card.interval}d`}
                  </span>
                  <span className="text-xs text-slate-700 font-mono">EF {card.easeFactor.toFixed(1)}</span>
                </div>
                <p className="text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-indigo-200 transition-colors">
                  {card.front}
                </p>
                <p className="text-slate-500 text-xs line-clamp-2">{card.back}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CardModal
          card={modal.card || null}
          onSave={saveCard}
          onDelete={deleteCard}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
