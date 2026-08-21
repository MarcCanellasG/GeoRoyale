import { Question } from './types'
import { generalQuestions } from './general'

export * from './types'

// Diccionario central: General Map
export const QUESTION_BANK: Record<string, Record<string, Question[]>> = {
  general: generalQuestions,
  geografia: generalQuestions,
  cultura_general: generalQuestions,
  deportes: generalQuestions,
  historia: generalQuestions
}

/**
 * Motor de Extracción Central: Devuelve las preguntas de una subzona determinísticamente
 * según el número de ronda (round_number) para garantizar que los duelistas lean las mismas preguntas.
 * Para la Ráfaga de Combate devuelve 2 preguntas consecutivas distintas.
 */
export function getQuestionsForZone(
  categoryKey: string = 'general',
  zoneId: string,
  roundNumber: number = 1,
  count: number = 2
): Question[] {
  const categoryQuestions = QUESTION_BANK[categoryKey] || QUESTION_BANK.general
  const zoneQuestions = categoryQuestions[zoneId] || generalQuestions[zoneId]

  const validRound = Math.max(1, typeof roundNumber === 'number' && !isNaN(roundNumber) ? Math.floor(roundNumber) : 1)

  if (zoneQuestions && zoneQuestions.length > 0) {
    const startIndex = ((validRound - 1) * 2) % zoneQuestions.length
    const desiredCount = Math.max(1, count || 2)
    const result: Question[] = []

    for (let i = 0; i < Math.min(desiredCount, zoneQuestions.length); i++) {
      const qIndex = (startIndex + i) % zoneQuestions.length
      result.push(zoneQuestions[qIndex])
    }
    return result
  }

  const isFiveOptions = zoneId?.includes('_l4_') || zoneId?.includes('_l5_') || zoneId === 'general_l5_1'

  // Fallback seguro si la zona no tiene preguntas configuradas aún (devuelve 2 preguntas)
  return [
    {
      id: `q_fallback_${zoneId}_${validRound}_1`,
      question: `Pregunta de combate 1 para "${zoneId}" - Ronda ${validRound}`,
      options: isFiveOptions
        ? ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D', 'Opción E']
        : ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D'],
      correctIndex: 0
    },
    {
      id: `q_fallback_${zoneId}_${validRound}_2`,
      question: `Pregunta de combate 2 para "${zoneId}" - Ronda ${validRound}`,
      options: isFiveOptions
        ? ['Opción A', 'Opción B (Correcta)', 'Opción C', 'Opción D', 'Opción E']
        : ['Opción A', 'Opción B (Correcta)', 'Opción C', 'Opción D'],
      correctIndex: 1
    }
  ]
}
