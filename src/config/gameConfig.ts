// Configuración estática del juego Geo-Royale
export interface GameConfig {
  defaultRounds: number
  timePerRoundSeconds: number
  initialHP: number
  damagePerMiss: number
  maps: {
    id: string
    name: string
    description: string
  }[]
}

export const GAME_CONFIG: GameConfig = {
  defaultRounds: 5,
  timePerRoundSeconds: 60,
  initialHP: 100,
  damagePerMiss: 25,
  maps: [
    { id: 'world', name: 'Mundo (Países y Capitales)', description: 'Ubicaciones globales en los 5 continentes.' },
    { id: 'spain', name: 'España (Provincias y Monumentos)', description: 'Puntos de interés en la Península Ibérica e islas.' },
    { id: 'capitals', name: 'Capitales Famosas', description: 'Metrópolis principales del mundo.' }
  ]
}
