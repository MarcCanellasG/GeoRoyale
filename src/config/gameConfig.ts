import { GAME_CATEGORIES, CategoryKey } from './mapConfig'

export type DifficultyMode = 'normal' | 'hard'

export interface DifficultyConfig {
  id: DifficultyMode
  name: string
  badgeText: string
  description: string
  timer: number // Duración base de combate en segundos
  damage: {
    level1: number
    level2: number
    level3: number
    level4: number
    level5: number
  }
  healing: {
    level3: number
    level4: number
    level5: number
  }
}

export const DIFFICULTY_SETTINGS: Record<DifficultyMode, DifficultyConfig> = {
  normal: {
    id: 'normal',
    name: 'Modo Normal',
    badgeText: 'Normal (8s)',
    description: '8s por pregunta de ráfaga (5s en Nivel 5). Daño base (15 a 75 HP) con Matriz de Ráfaga de 2 preguntas y curaciones por doble acierto (+10, +15, +20 HP).',
    timer: 8,
    damage: {
      level1: 15,
      level2: 25,
      level3: 35,
      level4: 50,
      level5: 75
    },
    healing: {
      level3: 10,
      level4: 15,
      level5: 20
    }
  },
  hard: {
    id: 'hard',
    name: 'Modo Hardcore',
    badgeText: 'Hardcore (5s 🔥)',
    description: '5s por pregunta de ráfaga (5s en Nivel 5). Daño demoledor (25 a 100 HP) con Matriz de Ráfaga y curaciones mínimas por doble acierto (+5 en Nivel 4, +10 en Nivel 5).',
    timer: 5,
    damage: {
      level1: 25,
      level2: 40,
      level3: 60,
      level4: 80,
      level5: 100
    },
    healing: {
      level3: 0,
      level4: 5,
      level5: 10
    }
  }
}

/**
 * Función helper que calcula la penalización de daño o la curación exacta según la dificultad y el nivel de la subzona:
 */
export function calculateDamageOrHealing(
  difficultyMode: DifficultyMode = 'normal',
  categoryKey: string = 'general',
  zoneId: string = '',
  isCorrect: boolean = false
): { damage: number; healing: number } {
  const modeKey: DifficultyMode = difficultyMode === 'hard' ? 'hard' : 'normal'
  const settings = DIFFICULTY_SETTINGS[modeKey]
  const catKey = (categoryKey as CategoryKey) in GAME_CATEGORIES ? (categoryKey as CategoryKey) : 'general'
  const categoryConfig = GAME_CATEGORIES[catKey]

  let zoneLevel = 1
  for (const lvl of categoryConfig.levels) {
    if (lvl.subzones.some((s) => s.id === zoneId)) {
      zoneLevel = lvl.level
      break
    }
  }

  if (isCorrect) {
    let healAmount = 0
    if (zoneLevel === 3) healAmount = settings.healing.level3
    if (zoneLevel === 4) healAmount = settings.healing.level4
    if (zoneLevel === 5) healAmount = settings.healing.level5
    return { damage: 0, healing: healAmount }
  } else {
    let dmgAmount = settings.damage.level1
    if (zoneLevel === 2) dmgAmount = settings.damage.level2
    if (zoneLevel === 3) dmgAmount = settings.damage.level3
    if (zoneLevel === 4) dmgAmount = settings.damage.level4
    if (zoneLevel === 5) dmgAmount = settings.damage.level5
    return { damage: dmgAmount, healing: 0 }
  }
}
