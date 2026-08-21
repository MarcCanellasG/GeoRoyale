import { GAME_CATEGORIES, CategoryKey, MapLevel } from '@/config/mapConfig'

export interface PlayerZoneInfo {
  current_zone?: string | null
  completed_zones?: string[]
}

/**
 * Retorna el nivel más alto (1, 2, 3 o 4) que ha pisado el jugador,
 * analizando su zona actual y el historial de zonas conquistadas.
 */
export function getHighestLevelReached(
  player: PlayerZoneInfo | null | undefined,
  categoryKey: CategoryKey = 'geografia',
  customLevels?: MapLevel[]
): number {
  if (!player) return 1

  const levels = customLevels || GAME_CATEGORIES[categoryKey]?.levels || GAME_CATEGORIES.geografia.levels
  let highest = 1

  const checkZone = (zoneId?: string | null) => {
    if (!zoneId) return
    for (const lvl of levels) {
      if (lvl.subzones.some((s) => s.id === zoneId)) {
        if (lvl.level > highest) {
          highest = lvl.level
        }
      }
    }
  }

  // Comprobar zona actual
  checkZone(player?.current_zone)

  // Comprobar todas las zonas completadas
  if (Array.isArray(player?.completed_zones)) {
    player?.completed_zones.forEach((zId) => checkZone(zId))
  }

  return highest
}
