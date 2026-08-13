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
    subtitle: 'Mapa: Geografía y Naturaleza',
    description: 'Países, capitales, continentes y mapas del mundo.',
    iconName: 'Globe',
    badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-teal-950/40 to-slate-950',
      cardBg: 'bg-teal-950/30 backdrop-blur-xl',
      cardBorder: 'border-teal-500/20',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-400/30',
      accentGradient: 'from-emerald-400 via-teal-300 to-cyan-400',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      buttonClass: 'from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950',
      heroTitleGradient: 'from-emerald-300 via-teal-200 to-cyan-300'
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
            name: 'El Nodo SIG',
            description: 'Núcleo cartográfico supremo.'
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
            description: 'Fronteras complejas y disputas.'
          },
          {
            id: 'cuenca-regional',
            name: 'Cuenca Regional',
            description: 'Hidrografía y sistemas fluviales.'
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
            name: 'Metrópolis en Expansión',
            description: 'Megaciudades y densidad urbana.'
          },
          {
            id: 'reserva-recursos',
            name: 'Reserva de Recursos',
            description: 'Regiones de importancia energética.'
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
            description: 'Islas y relieve básico.'
          },
          {
            id: 'praderas-demograficas',
            name: 'Praderas Demográficas',
            description: 'Países y banderas icónicas.'
          },
          {
            id: 'valles-cartograficos',
            name: 'Valles Cartográficos',
            description: 'Líneas ecuatoriales y polos.'
          }
        ]
      }
    ]
  },
  cultura_general: {
    id: 'cultura_general',
    name: 'Cultura General',
    subtitle: 'Mapa: Arte, Cine y Letras',
    description: 'Arte, cine, literatura, música y curiosidades.',
    iconName: 'BookOpen',
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-purple-950/40 to-slate-950',
      cardBg: 'bg-purple-950/30 backdrop-blur-xl',
      cardBorder: 'border-purple-500/20',
      activeBorder: 'border-purple-400 ring-2 ring-purple-400/30',
      accentGradient: 'from-purple-400 via-pink-300 to-indigo-300',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      buttonClass: 'from-purple-400 to-indigo-500 hover:from-purple-300 hover:to-indigo-400 text-slate-950',
      heroTitleGradient: 'from-purple-300 via-pink-200 to-indigo-300'
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
            name: 'Panteón de la Sabiduría',
            description: 'Desafío del saber universal.'
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
            name: 'Galería de Bellas Artes',
            description: 'Obras maestras y escultura.'
          },
          {
            id: 'laboratorio-filosofico',
            name: 'Laboratorio Filosófico',
            description: 'Corrientes de pensamiento.'
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
            name: 'Teatro Literario',
            description: 'Dramaturgos y premios Nobel.'
          },
          {
            id: 'estudio-cinematografico',
            name: 'Estudio Cinematográfico',
            description: 'Cine de culto y directores.'
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
            description: 'Personajes y canciones popular.'
          },
          {
            id: 'museo-tradiciones',
            name: 'Museo Tradiciones',
            description: 'Gastronomía y festividades.'
          },
          {
            id: 'salon-inventos',
            name: 'Salón de Inventos',
            description: 'Creaciones del día a día.'
          }
        ]
      }
    ]
  },
  deportes: {
    id: 'deportes',
    name: 'Deportes',
    subtitle: 'Mapa: Competición y Leyendas',
    description: 'JJ.OO., fútbol, F1, tenis y leyendas del deporte.',
    iconName: 'Trophy',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-amber-950/40 to-slate-950',
      cardBg: 'bg-amber-950/30 backdrop-blur-xl',
      cardBorder: 'border-amber-500/20',
      activeBorder: 'border-amber-400 ring-2 ring-amber-400/30',
      accentGradient: 'from-amber-400 via-orange-300 to-yellow-300',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      buttonClass: 'from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950',
      heroTitleGradient: 'from-amber-300 via-orange-200 to-yellow-300'
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
            name: 'Estadio Olímpico Leyenda',
            description: 'Records mundiales históricos.'
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
            name: 'Circuito de Motor y F1',
            description: 'Grandes Premios y escuderías.'
          },
          {
            id: 'pista-gran-slam',
            name: 'Pista Gran Slam',
            description: 'Tenis de élite y torneos.'
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
            name: 'Cancha Baloncesto NBA',
            description: 'Anillos y estrellas del basket.'
          },
          {
            id: 'puerto-nautico',
            name: 'Puerto Náutico & Ciclismo',
            description: 'Grandes vueltas y regatas.'
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
            name: 'Campo de Fútbol Base',
            description: 'Mundiales, clubes y reglas.'
          },
          {
            id: 'pista-atletismo',
            name: 'Pista Atletismo Popular',
            description: 'Carreras, saltos y pruebas.'
          },
          {
            id: 'polideportivo-general',
            name: 'Polideportivo General',
            description: 'Balonmano, natación y equipo.'
          }
        ]
      }
    ]
  },
  historia: {
    id: 'historia',
    name: 'Historia Universal',
    subtitle: 'Mapa: Civilizaciones del Pasado',
    description: 'Imperios antiguos, guerras y momentos clave.',
    iconName: 'Landmark',
    badgeColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/15',
    theme: {
      bgGradient: 'from-slate-950 via-rose-950/30 to-slate-950',
      cardBg: 'bg-rose-950/20 backdrop-blur-xl',
      cardBorder: 'border-rose-500/20',
      activeBorder: 'border-rose-400 ring-2 ring-rose-400/30',
      accentGradient: 'from-rose-400 via-amber-300 to-orange-300',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      buttonClass: 'from-rose-400 to-amber-500 hover:from-rose-300 hover:to-amber-400 text-slate-950',
      heroTitleGradient: 'from-rose-300 via-amber-200 to-orange-300'
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
            name: 'Archivo de los Imperios',
            description: 'Grandes dinastías y tratados.'
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
            name: 'Frente Guerras Mundiales',
            description: 'Estrategias y el Siglo XX.'
          },
          {
            id: 'corte-renacentista',
            name: 'Corte Renacentista',
            description: 'Ilustración y monarquías.'
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
            name: 'Castillo Medieval',
            description: 'Cruzadas y caballeros.'
          },
          {
            id: 'foro-romano',
            name: 'Foro Romano y Atenas',
            description: 'Repúblicas y mitología.'
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
            name: 'Pirámides de Egipto',
            description: 'Faraones y civilizaciones.'
          },
          {
            id: 'cueva-prehistoria',
            name: 'Cueva Prehistoria',
            description: 'Fuego y herramientas.'
          },
          {
            id: 'ruta-descubrimientos',
            name: 'Ruta Descubrimientos',
            description: 'Exploradores y viajes.'
          }
        ]
      }
    ]
  }
}
