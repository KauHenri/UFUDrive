// src/utils/gradeUtils.js

/**
 * Calcula a média atual com base apenas nas componentes que já têm nota.
 * @param {Array} components - Array de { weight, score, maxScore }
 * @returns {number|null} Média de 0 a 10, ou null se nenhuma nota lançada
 */
export function calcCurrentGrade(components) {
  const graded = components.filter((c) => c.score !== null && c.score !== undefined && c.score !== '')
  if (graded.length === 0) return null

  const totalWeight = graded.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return null

  const weightedSum = graded.reduce((sum, c) => {
    const normalized = (parseFloat(c.score) / (c.maxScore || 10)) * 10
    return sum + normalized * c.weight
  }, 0)

  return weightedSum / totalWeight
}

/**
 * Calcula a média final se todas as componentes sem nota receberem `hypothetical`.
 */
export function calcProjectedGrade(components, hypothetical = 0) {
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
  if (totalWeight === 0) return null

  const weightedSum = components.reduce((sum, c) => {
    const score = (c.score !== null && c.score !== undefined && c.score !== '')
      ? parseFloat(c.score)
      : hypothetical
    const normalized = (score / (c.maxScore || 10)) * 10
    return sum + normalized * c.weight
  }, 0)

  return weightedSum / totalWeight
}

/**
 * Calcula a nota mínima necessária nas componentes restantes para atingir `target`.
 * Considera que todas as pendentes recebem a mesma nota (nota necessária).
 *
 * @returns {{ needed: number|null, status: 'ok'|'impossible'|'guaranteed'|'pending' }}
 */
export function calcNeededGrade(components, target = 6.0) {
  const gradedWeight = components
    .filter((c) => c.score !== null && c.score !== undefined && c.score !== '')
    .reduce((sum, c) => sum + c.weight, 0)

  const ungradedComponents = components.filter(
    (c) => c.score === null || c.score === undefined || c.score === ''
  )
  const ungradedWeight = ungradedComponents.reduce((sum, c) => sum + c.weight, 0)
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)

  if (ungradedWeight === 0) return { needed: null, status: 'ok' }

  // Soma ponderada das notas já lançadas (normalizada para 0-10)
  const gradedSum = components
    .filter((c) => c.score !== null && c.score !== undefined && c.score !== '')
    .reduce((sum, c) => {
      const normalized = (parseFloat(c.score) / (c.maxScore || 10)) * 10
      return sum + normalized * c.weight
    }, 0)

  // needed * ungradedWeight + gradedSum = target * totalWeight
  const needed = (target * totalWeight - gradedSum) / ungradedWeight

  if (needed <= 0) return { needed: 0, status: 'guaranteed' }
  if (needed > 10) return { needed, status: 'impossible' }
  return { needed, status: 'pending' }
}

/**
 * Retorna a cor de status com base na média.
 */
export function gradeColor(grade, passing = 6.0) {
  if (grade === null) return 'text-slate-500'
  if (grade >= passing + 1.5) return 'text-emerald-400'
  if (grade >= passing) return 'text-yellow-400'
  return 'text-red-400'
}

export function gradeBgColor(grade, passing = 6.0) {
  if (grade === null) return 'bg-slate-700'
  if (grade >= passing + 1.5) return 'bg-emerald-500'
  if (grade >= passing) return 'bg-yellow-500'
  return 'bg-red-500'
}
