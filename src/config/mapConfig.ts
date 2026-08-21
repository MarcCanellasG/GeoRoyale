export interface SubZone {
  id: string
  name: string
  description: string
  themeColor?: string
  icon?: string
}

export interface MapLevel {
  level: number
  name: string
  difficulty: 'Fácil' | 'Medio' | 'Difícil' | 'Experto' | 'Épico'
  colorTheme: {
    bg: string
    border: string
    text: string
    badge: string
    indicator: string
  }
  subzones: SubZone[]
}

export interface CategoryTheme {
  bgGradient: string
  cardBg: string
  cardBorder: string
  activeBorder: string
  accentGradient: string
  badgeClass: string
  buttonClass: string
  heroTitleGradient: string
  glowColor: string
  bannerBg: string
  themeTagline: string
}

export interface CategoryMap {
  id: string
  name: string
  subtitle: string
  description: string
  iconName: string
  badgeColor: string
  theme: CategoryTheme
  levels: MapLevel[]
}

export type CategoryKey = 'general' | 'geografia' | 'cultura_general' | 'deportes' | 'historia'

export const GENERAL_MAP: CategoryMap = {
  id: 'general',
  name: 'Cultura General & Sabiduría',
  subtitle: 'La Pirámide del Conocimiento',
  description: '12 disciplinas del saber divididas en 5 niveles de desafío ascendente.',
  iconName: 'Sparkles',
  badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-500/15',
  theme: {
    bgGradient: 'from-slate-950 via-slate-900 to-slate-950',
    cardBg: 'bg-slate-900/60 backdrop-blur-xl',
    cardBorder: 'border-slate-700/60',
    activeBorder: 'border-amber-400 ring-2 ring-amber-400/40',
    accentGradient: 'from-amber-400 via-emerald-400 to-cyan-400',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm',
    buttonClass: 'from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 shadow-amber-500/20',
    heroTitleGradient: 'from-amber-300 via-emerald-200 to-cyan-300',
    glowColor: 'bg-amber-500/15',
    bannerBg: 'bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-cyan-950/60',
    themeTagline: '👑 Ascenso a la Cúspide del Saber'
  },
  levels: [
    {
      level: 5,
      name: 'Nivel 5 • Cúspide Definitiva',
      difficulty: 'Épico',
      colorTheme: {
        bg: 'bg-slate-900/90 hover:bg-slate-900',
        border: 'border-amber-400/80',
        text: 'text-amber-300',
        badge: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
        indicator: 'bg-amber-400'
      },
      subzones: [
        {
          id: 'general_l5_1',
          name: 'Desafío Definitivo',
          description: 'La gran prueba final del conocimiento supremo (5 opciones de respuesta).',
          themeColor: 'gold',
          icon: '👑'
        }
      ]
    },
    {
      level: 4,
      name: 'Nivel 4 • Experto',
      difficulty: 'Experto',
      colorTheme: {
        bg: 'bg-slate-900/80 hover:bg-slate-900',
        border: 'border-purple-500/50',
        text: 'text-purple-300',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
        indicator: 'bg-purple-400'
      },
      subzones: [
        {
          id: 'general_l4_astronomia',
          name: 'Astronomía',
          description: 'Cosmos, planetas, estrellas, galaxias y exploración espacial (5 opciones).',
          themeColor: 'indigo',
          icon: '🌌'
        },
        {
          id: 'general_l4_mitologia',
          name: 'Mitología',
          description: 'Dioses, mitos, leyendas, héroes y panteones universales (5 opciones).',
          themeColor: 'violet',
          icon: '⚡'
        }
      ]
    },
    {
      level: 3,
      name: 'Nivel 3 • Avanzado',
      difficulty: 'Difícil',
      colorTheme: {
        bg: 'bg-slate-900/70 hover:bg-slate-900/90',
        border: 'border-rose-500/40',
        text: 'text-rose-300',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        indicator: 'bg-rose-500'
      },
      subzones: [
        {
          id: 'general_l3_tecnologia',
          name: 'Tecnología',
          description: 'Computación, inteligencia artificial, inventos e internet.',
          themeColor: 'blue',
          icon: '💻'
        },
        {
          id: 'general_l3_arte',
          name: 'Arte',
          description: 'Pintura, escultura, arquitectura y corrientes artísticas.',
          themeColor: 'rose',
          icon: '🎨'
        }
      ]
    },
    {
      level: 2,
      name: 'Nivel 2 • Intermedio',
      difficulty: 'Medio',
      colorTheme: {
        bg: 'bg-slate-900/60 hover:bg-slate-900/90',
        border: 'border-sky-500/40',
        text: 'text-sky-300',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
        indicator: 'bg-sky-400'
      },
      subzones: [
        {
          id: 'general_l2_ciencia',
          name: 'Ciencia',
          description: 'Física, química, biología y descubrimientos científicos.',
          themeColor: 'cyan',
          icon: '🧬'
        },
        {
          id: 'general_l2_historia',
          name: 'Historia',
          description: 'Grandes eventos, civilizaciones, personajes y eras históricas.',
          themeColor: 'amber',
          icon: '🏛️'
        },
        {
          id: 'general_l2_literatura',
          name: 'Literatura',
          description: 'Obras universales, escritores clásicos, poesía y novelas.',
          themeColor: 'yellow',
          icon: '📚'
        }
      ]
    },
    {
      level: 1,
      name: 'Nivel 1 • Base',
      difficulty: 'Fácil',
      colorTheme: {
        bg: 'bg-slate-900/60 hover:bg-slate-900/90',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        indicator: 'bg-emerald-400'
      },
      subzones: [
        {
          id: 'general_l1_deportes',
          name: 'Deportes',
          description: 'Fútbol, baloncesto, tenis, Juegos Olímpicos y récords.',
          themeColor: 'orange',
          icon: '⚽'
        },
        {
          id: 'general_l1_cine',
          name: 'Cine',
          description: 'Películas de culto, directores, actores y cultura pop.',
          themeColor: 'purple',
          icon: '🎬'
        },
        {
          id: 'general_l1_musica',
          name: 'Música',
          description: 'Bandas legendarias, géneros musicales, himnos e instrumentos.',
          themeColor: 'pink',
          icon: '🎵'
        },
        {
          id: 'general_l1_geografia',
          name: 'Geografía',
          description: 'Países, capitales, cordilleras, ríos y banderas del mundo.',
          themeColor: 'emerald',
          icon: '🌍'
        }
      ]
    }
  ]
}

export const GAME_CATEGORIES: Record<CategoryKey, CategoryMap> = {
  general: GENERAL_MAP,
  geografia: GENERAL_MAP,
  cultura_general: GENERAL_MAP,
  deportes: GENERAL_MAP,
  historia: GENERAL_MAP
}
