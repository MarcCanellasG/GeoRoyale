import { Question } from './types'
import {
  level1Questions,
  level2Questions,
  level3Questions,
  level4Questions,
  level5Questions
} from '@/data/questions/general'

export const generalQuestions: Record<string, Question[]> = {
  // ==========================================
  // NIVEL 1: BASE (FÁCIL - 4 OPCIONES - 16 PREGUNTAS)
  // ==========================================
  general_l1_deportes: level1Questions,
  general_l1_cine: level1Questions,
  general_l1_geografia: level1Questions,
  general_l1_musica: level1Questions,

  // ==========================================
  // NIVEL 2: INTERMEDIO (MEDIO - 4 OPCIONES - 16 PREGUNTAS)
  // ==========================================
  general_l2_historia: level2Questions,
  general_l2_ciencia: level2Questions,
  general_l2_literatura: level2Questions,

  // ==========================================
  // NIVEL 3: AVANZADO (DIFÍCIL - 4 OPCIONES - 16 PREGUNTAS)
  // ==========================================
  general_l3_arte: level3Questions,
  general_l3_tecnologia: level3Questions,

  // ==========================================
  // NIVEL 4: EXPERTO (ÉPICO - 5 OPCIONES - 16 PREGUNTAS)
  // ==========================================
  general_l4_astronomia: level4Questions,
  general_l4_mitologia: level4Questions,
  general_l4_filosofia: level4Questions,

  // ==========================================
  // NIVEL 5: CÚSPIDE (DEFINITIVO - 5 OPCIONES - 10 PREGUNTAS)
  // ==========================================
  general_l5_1: level5Questions
}

