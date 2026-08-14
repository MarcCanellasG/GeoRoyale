import { GAME_CATEGORIES, CategoryKey } from './mapConfig'

export type DifficultyMode = 'normal' | 'hard'

export interface DifficultyConfig {
  id: DifficultyMode
  name: string
  badgeText: string
  description: string
  timer: number // Duración de combate en segundos
  damage: {
    level1: number
    level2: number
    level3: number
    level4: number
  }
  healing: {
    level3: number
    level4: number
  }
}

export const DIFFICULTY_SETTINGS: Record<DifficultyMode, DifficultyConfig> = {
  normal: {
    id: 'normal',
    name: 'Modo Normal',
    badgeText: 'Normal (10s)',
    description: '10s por pregunta. Daño estándar (15-50 HP) y curaciones al acertar en Nivel 3 (+10) y Nivel 4 (+15).',
    timer: 10,
    damage: {
      level1: 15,
      level2: 25,
      level3: 35,
      level4: 50
    },
    healing: {
      level3: 10,
      level4: 15
    }
  },
  hard: {
    id: 'hard',
    name: 'Modo Hardcore',
    badgeText: 'Hardcore (7s 🔥)',
    description: '7s por pregunta. Daño masivo (25-80 HP) y casi sin curaciones (+5 HP solo en Nivel 4).',
    timer: 7,
    damage: {
      level1: 25,
      level2: 40,
      level3: 60,
      level4: 80
    },
    healing: {
      level3: 0,
      level4: 5
    }
  }
}

/**
 * Función helper que calcula la penalización de daño o la curación exacta según la dificultad y el nivel de la subzona:
 */
export function calculateDamageOrHealing(
  difficultyMode: DifficultyMode = 'normal',
  categoryKey: string = 'geografia',
  zoneId: string = '',
  isCorrect: boolean = false
): { damage: number; healing: number } {
  const modeKey: DifficultyMode = difficultyMode === 'hard' ? 'hard' : 'normal'
  const settings = DIFFICULTY_SETTINGS[modeKey]
  const catKey = (categoryKey as CategoryKey) in GAME_CATEGORIES ? (categoryKey as CategoryKey) : 'geografia'
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
    return { damage: 0, healing: healAmount }
  } else {
    let dmgAmount = settings.damage.level1
    if (zoneLevel === 2) dmgAmount = settings.damage.level2
    if (zoneLevel === 3) dmgAmount = settings.damage.level3
    if (zoneLevel === 4) dmgAmount = settings.damage.level4
    return { damage: dmgAmount, healing: 0 }
  }
}
