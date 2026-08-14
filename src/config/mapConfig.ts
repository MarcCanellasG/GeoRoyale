export interface SubZone {
  id: string
  name: string
  description: string
}

export interface MapLevel {
  level: number
  name: string
  difficulty: 'Fácil' | 'Medio' | 'Difícil' | 'Épico'
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

export type CategoryKey = 'geografia' | 'cultura_general' | 'deportes' | 'historia'

export const GAME_CATEGORIES: Record<CategoryKey, CategoryMap> = {
  geografia: {
    id: 'geografia',
    name: 'Geografía Mundial',
    subtitle: 'Expedición Océano & Selva',
    description: 'Países, capitales, relieves e islas del planeta.',
    iconName: 'Globe',
    badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-teal-950/60 to-slate-950',
      cardBg: 'bg-teal-950/40 backdrop-blur-xl',
      cardBorder: 'border-teal-500/30',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-400/40',
      accentGradient: 'from-emerald-400 via-teal-300 to-cyan-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm',
      buttonClass: 'from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/20',
      heroTitleGradient: 'from-emerald-300 via-teal-200 to-cyan-300',
      glowColor: 'bg-emerald-500/15',
      bannerBg: 'bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-900/80',
      themeTagline: '🌍 Expedición Terrestre & Cartografía'
    },
    levels: [
      {
        level: 4,
        name: 'Nivel 4 • Épico',
        difficulty: 'Épico',
        colorTheme: {
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          border: 'border-amber-400/50',
          text: 'text-amber-300',
          badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
          indicator: 'bg-amber-400'
        },
        subzones: [
          {
            id: 'nodo-sig',
            name: 'Cima de los Antípodas',
            description: 'Relieve y coordenadas extremas del globo.'
          }
        ]
      },
      {
        level: 3,
        name: 'Nivel 3 • Difícil',
        difficulty: 'Difícil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-rose-500/30',
          text: 'text-rose-300',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          indicator: 'bg-rose-500'
        },
        subzones: [
          {
            id: 'cumbre-geopolitica',
            name: 'Cumbre Geopolítica',
            description: 'Fronteras complejas y soberanías.'
          },
          {
            id: 'cuenca-regional',
            name: 'Cuenca de los Ríos Supremos',
            description: 'Grandes sistemas fluviales y mares.'
          }
        ]
      },
      {
        level: 2,
        name: 'Nivel 2 • Medio',
        difficulty: 'Medio',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-sky-500/30',
          text: 'text-sky-300',
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          indicator: 'bg-sky-400'
        },
        subzones: [
          {
            id: 'metropolis-expansion',
            name: 'Metrópolis Mundiales',
            description: 'Megaciudades y densidad urbana.'
          },
          {
            id: 'reserva-recursos',
            name: 'Valles de Recursos',
            description: 'Regiones naturales y biomas.'
          }
        ]
      },
      {
        level: 1,
        name: 'Nivel 1 • Fácil',
        difficulty: 'Fácil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-emerald-500/30',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          indicator: 'bg-emerald-400'
        },
        subzones: [
          {
            id: 'archipielago-fisico',
            name: 'Archipiélago Físico',
            description: 'Islas principales y relieve costero.'
          },
          {
            id: 'praderas-demograficas',
            name: 'Praderas Demográficas',
            description: 'Banderas icónicas y países del mundo.'
          },
          {
            id: 'valles-cartograficos',
            name: 'Valles del Ecuador',
            description: 'Líneas ecuatoriales y polos.'
          }
        ]
      }
    ]
  },
  cultura_general: {
    id: 'cultura_general',
    name: 'Cultura General',
    subtitle: 'Ateneo de las Artes & Letras',
    description: 'Arte clásico, cine de culto, literatura y música.',
    iconName: 'BookOpen',
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-purple-950/60 to-slate-950',
      cardBg: 'bg-purple-950/40 backdrop-blur-xl',
      cardBorder: 'border-purple-500/30',
      activeBorder: 'border-purple-400 ring-2 ring-purple-400/40',
      accentGradient: 'from-amber-300 via-purple-300 to-pink-400',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm',
      buttonClass: 'from-purple-400 via-pink-400 to-amber-300 hover:from-purple-300 hover:to-amber-200 text-slate-950 shadow-purple-500/20',
      heroTitleGradient: 'from-purple-300 via-pink-200 to-amber-200',
      glowColor: 'bg-purple-500/15',
      bannerBg: 'bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900/80',
      themeTagline: '📚 Ateneo de Bellas Artes & Sabiduría'
    },
    levels: [
      {
        level: 4,
        name: 'Nivel 4 • Épico',
        difficulty: 'Épico',
        colorTheme: {
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          border: 'border-amber-400/50',
          text: 'text-amber-300',
          badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
          indicator: 'bg-amber-400'
        },
        subzones: [
          {
            id: 'panteon-sabiduria',
            name: 'Panteón del Saber Universal',
            description: 'El desafío definitivo del conocimiento.'
          }
        ]
      },
      {
        level: 3,
        name: 'Nivel 3 • Difícil',
        difficulty: 'Difícil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-rose-500/30',
          text: 'text-rose-300',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          indicator: 'bg-rose-500'
        },
        subzones: [
          {
            id: 'galeria-bellas-artes',
            name: 'Galería de Obras Maestras',
            description: 'Pintura, escultura y museos.'
          },
          {
            id: 'laboratorio-filosofico',
            name: 'Salón Filosófico',
            description: 'Grandes pensadores e ideas.'
          }
        ]
      },
      {
        level: 2,
        name: 'Nivel 2 • Medio',
        difficulty: 'Medio',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-sky-500/30',
          text: 'text-sky-300',
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          indicator: 'bg-sky-400'
        },
        subzones: [
          {
            id: 'teatro-literario',
            name: 'Teatro de las Letras',
            description: 'Premios Nobel y clásicos.'
          },
          {
            id: 'estudio-cinematografico',
            name: 'Estudio de Cine de Culto',
            description: 'Directores, bandas sonoras y séptimo arte.'
          }
        ]
      },
      {
        level: 1,
        name: 'Nivel 1 • Fácil',
        difficulty: 'Fácil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-emerald-500/30',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          indicator: 'bg-emerald-400'
        },
        subzones: [
          {
            id: 'plaza-pop',
            name: 'Plaza Cultura Pop',
            description: 'Música, iconos modernos y tendencias.'
          },
          {
            id: 'museo-tradiciones',
            name: 'Museo de Tradiciones',
            description: 'Gastronomía y patrimonio cultural.'
          },
          {
            id: 'salon-inventos',
            name: 'Salón de Grandes Inventos',
            description: 'Descubrimientos que cambiaron el mundo.'
          }
        ]
      }
    ]
  },
  deportes: {
    id: 'deportes',
    name: 'Deportes & Competición',
    subtitle: 'Arena Olímpica de Campeones',
    description: 'Juegos Olímpicos, fútbol, F1, tenis y leyendas.',
    iconName: 'Trophy',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-amber-950/60 to-slate-950',
      cardBg: 'bg-amber-950/40 backdrop-blur-xl',
      cardBorder: 'border-amber-500/30',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/40',
      accentGradient: 'from-amber-400 via-orange-400 to-yellow-300',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm',
      buttonClass: 'from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/20',
      heroTitleGradient: 'from-amber-300 via-orange-200 to-yellow-300',
      glowColor: 'bg-amber-500/15',
      bannerBg: 'bg-gradient-to-r from-amber-900/60 via-orange-900/40 to-slate-900/80',
      themeTagline: '🏆 Arena de Leyendas & Alta Competición'
    },
    levels: [
      {
        level: 4,
        name: 'Nivel 4 • Épico',
        difficulty: 'Épico',
        colorTheme: {
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          border: 'border-amber-400/50',
          text: 'text-amber-300',
          badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
          indicator: 'bg-amber-400'
        },
        subzones: [
          {
            id: 'estadio-olimpico',
            name: 'Panteón Olímpico de Leyendas',
            description: 'Récords mundiales históricos e hitos épicos.'
          }
        ]
      },
      {
        level: 3,
        name: 'Nivel 3 • Difícil',
        difficulty: 'Difícil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-rose-500/30',
          text: 'text-rose-300',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          indicator: 'bg-rose-500'
        },
        subzones: [
          {
            id: 'circuito-motor',
            name: 'Circuito de F1 & Velodrómo',
            description: 'Grandes Premios y escuderías míticas.'
          },
          {
            id: 'pista-gran-slam',
            name: 'Pistas de Grand Slam',
            description: 'Tenis de élite y finales históricas.'
          }
        ]
      },
      {
        level: 2,
        name: 'Nivel 2 • Medio',
        difficulty: 'Medio',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-sky-500/30',
          text: 'text-sky-300',
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          indicator: 'bg-sky-400'
        },
        subzones: [
          {
            id: 'cancha-baloncesto',
            name: 'Cancha NBA & Basket World',
            description: 'Anillos de campeón y estrellas.'
          },
          {
            id: 'puerto-nautico',
            name: 'Puerto Náutico & Ciclismo',
            description: 'Grandes vueltas y regatas internacionales.'
          }
        ]
      },
      {
        level: 1,
        name: 'Nivel 1 • Fácil',
        difficulty: 'Fácil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-emerald-500/30',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          indicator: 'bg-emerald-400'
        },
        subzones: [
          {
            id: 'campo-futbol',
            name: 'Estadio de Fútbol Base',
            description: 'Mundiales, clubes y reglas del balón.'
          },
          {
            id: 'pista-atletismo',
            name: 'Pista de Atletismo Popular',
            description: 'Velocidad, maratón y saltos.'
          },
          {
            id: 'polideportivo-general',
            name: 'Polideportivo Multidisciplina',
            description: 'Natación, balonmano y equipo.'
          }
        ]
      }
    ]
  },
  historia: {
    id: 'historia',
    name: 'Historia Universal',
    subtitle: 'Panteón de los Imperios',
    description: 'Civilizaciones antiguas, batallas y grandes eras.',
    iconName: 'Landmark',
    badgeColor: 'text-rose-300 border-rose-500/40 bg-rose-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-rose-950/60 to-slate-950',
      cardBg: 'bg-rose-950/40 backdrop-blur-xl',
      cardBorder: 'border-rose-500/30',
      activeBorder: 'border-rose-400 ring-2 ring-rose-400/40',
      accentGradient: 'from-rose-400 via-amber-300 to-orange-300',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm',
      buttonClass: 'from-rose-400 via-amber-400 to-orange-400 hover:from-rose-300 hover:to-amber-300 text-slate-950 shadow-rose-500/20',
      heroTitleGradient: 'from-rose-300 via-amber-200 to-orange-300',
      glowColor: 'bg-rose-500/15',
      bannerBg: 'bg-gradient-to-r from-rose-900/60 via-amber-900/40 to-slate-900/80',
      themeTagline: '🏛️ Panteón de las Civilizaciones & Reyes'
    },
    levels: [
      {
        level: 4,
        name: 'Nivel 4 • Épico',
        difficulty: 'Épico',
        colorTheme: {
          bg: 'bg-slate-900/90 hover:bg-slate-900',
          border: 'border-amber-400/50',
          text: 'text-amber-300',
          badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
          indicator: 'bg-amber-400'
        },
        subzones: [
          {
            id: 'archivo-imperios',
            name: 'Archivo Secreto de los Imperios',
            description: 'Grandes dinastías, tratados y coronaciones.'
          }
        ]
      },
      {
        level: 3,
        name: 'Nivel 3 • Difícil',
        difficulty: 'Difícil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-rose-500/30',
          text: 'text-rose-300',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          indicator: 'bg-rose-500'
        },
        subzones: [
          {
            id: 'frente-guerra-mundial',
            name: 'Frente del Siglo XX',
            description: 'Guerras mundiales y pactos internacionales.'
          },
          {
            id: 'corte-renacentista',
            name: 'Corte Renacentista',
            description: 'Ilustración, revoluciones y dinastías.'
          }
        ]
      },
      {
        level: 2,
        name: 'Nivel 2 • Medio',
        difficulty: 'Medio',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-sky-500/30',
          text: 'text-sky-300',
          badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          indicator: 'bg-sky-400'
        },
        subzones: [
          {
            id: 'castillo-medieval',
            name: 'Fortaleza Medieval',
            description: 'Cruzadas, feudos y orden militar.'
          },
          {
            id: 'foro-romano',
            name: 'Foro Romano y Acrópolis',
            description: 'Imperio Romano, Grecia e ideología.'
          }
        ]
      },
      {
        level: 1,
        name: 'Nivel 1 • Fácil',
        difficulty: 'Fácil',
        colorTheme: {
          bg: 'bg-slate-900/60 hover:bg-slate-900/90',
          border: 'border-emerald-500/30',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          indicator: 'bg-emerald-400'
        },
        subzones: [
          {
            id: 'piramides-egipto',
            name: 'Valle de los Faraones',
            description: 'Egipto Antiguo, Mesopotamia y jeroglíficos.'
          },
          {
            id: 'cueva-prehistoria',
            name: 'Santuario Prehistórico',
            description: 'Primeros homínidos, fuego y pintura rupestre.'
          },
          {
            id: 'ruta-descubrimientos',
            name: 'Ruta de los Exploradores',
            description: 'Navegación y la Era de los Descubrimientos.'
          }
        ]
      }
    ]
  }
}
