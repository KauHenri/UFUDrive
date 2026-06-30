// src/utils/sm2.js
// Implementação do algoritmo SM-2 para repetição espaçada
// Referência: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

/**
 * Estrutura de um flashcard:
 * {
 *   id: string,
 *   front: string,
 *   back: string,
 *   easeFactor: number,     // padrão 2.5
 *   interval: number,        // dias até próxima revisão
 *   repetitions: number,     // quantas vezes revisado com sucesso
 *   nextReview: string,      // ISO date
 *   createdAt: string,
 * }
 */

/**
 * Cria um novo flashcard com valores iniciais do SM-2.
 */
export function createCard(front, back) {
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    front: front.trim(),
    back: back.trim(),
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0], // hoje
    createdAt: new Date().toISOString(),
  }
}

/**
 * Aplica o SM-2 após uma revisão.
 * @param {object} card - O card revisado
 * @param {number} quality - Nota de 0 a 5 (0-1: blackout/errou, 2: difícil, 3: hesitação, 4: correto, 5: perfeito)
 * @returns {object} Card atualizado
 */
export function applyReview(card, quality) {
  let { easeFactor, interval, repetitions } = card

  if (quality < 3) {
    // Errou — reinicia o ciclo
    repetitions = 0
    interval = 1
  } else {
    // Acertou
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // Atualiza o EF (nunca abaixo de 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    ...card,
    easeFactor: parseFloat(easeFactor.toFixed(3)),
    interval,
    repetitions,
    nextReview: nextReview.toISOString().split('T')[0],
  }
}

/**
 * Retorna os cards com revisão pendente para hoje.
 */
export function getDueCards(cards) {
  const today = new Date().toISOString().split('T')[0]
  return cards.filter((c) => c.nextReview <= today)
}

/**
 * Calcula estatísticas básicas do deck.
 */
export function deckStats(cards) {
  const today = new Date().toISOString().split('T')[0]
  const due = cards.filter((c) => c.nextReview <= today).length
  const learning = cards.filter((c) => c.repetitions === 0).length
  const reviewing = cards.filter((c) => c.repetitions > 0).length
  return { total: cards.length, due, learning, reviewing }
}
