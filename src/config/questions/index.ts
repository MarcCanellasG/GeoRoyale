import { Question } from './types'
import { geografiaQuestions } from './geografia'
import { culturaGeneralQuestions } from './cultura_general'
import { deportesQuestions } from './deportes'
import { historiaQuestions } from './historia'

export * from './types'

// Diccionario central modularizado: [category_key] -> [subzone_id] -> Question[]
export const QUESTION_BANK: Record<string, Record<string, Question[]>> = {
  geografia: geografiaQuestions,
  cultura_general: culturaGeneralQuestions,
  deportes: deportesQuestions,
  historia: historiaQuestions
}

/**
 * Motor de Extracción Central: Devuelve un conjunto de preguntas para una categoría y subzona dadas.
 */
export function getQuestionsForZone(
  categoryKey: string,
  zoneId: string,
  count = 3
): Question[] {
  const categoryQuestions = QUESTION_BANK[categoryKey] || QUESTION_BANK.geografia
  const zoneQuestions = categoryQuestions[zoneId]

  if (zoneQuestions && zoneQuestions.length > 0) {
    return zoneQuestions.slice(0, count)
  }

  // Fallback seguro si la zona no tiene preguntas configuradas aún
  return [
    {
      id: `q_fallback_${categoryKey}_${zoneId}_1`,
      question: `Pregunta de prueba para la subzona "${zoneId}" (${categoryKey})`,
      options: ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D'],
      correctIndex: 0
    }
  ]
}
