'use client'

import { useState, useEffect, useRef } from 'react'
import { Crown, MapPin, Skull, Zap, Radio, Compass, Info, X, CheckCircle2, Lock, Navigation, Swords, Check, Clock, Eye, EyeOff, Flame, Users, Heart, Ban, AlertTriangle, ShieldAlert, Hourglass } from 'lucide-react'
import { GAME_CATEGORIES, CategoryKey, MapLevel, SubZone } from '@/config/mapConfig'
import { getQuestionsForZone, Question } from '@/config/questionBank'
import { ActivePlayer, updatePlayerZone, broadcastGameState, sendPlayerReady, applyPlayerDamage, clearPlayerMandatoryZone } from '@/lib/supabase/playersService'
import { getHighestLevelReached } from '@/utils/gameLogic'
import { playBuzzSound } from '@/lib/soundService'

interface GameMapProps {
  categoryKey?: CategoryKey
  currentZoneId?: string
  eliminatedZoneIds?: string[]
  players?: ActivePlayer[]
  currentPlayerName?: string
  roomPin?: string
  gamePhase?: string
  roundNumber?: number
  readyMap?: Record<string, boolean>
  isGodMode?: boolean
  onSelectZone?: (subzoneId: string, questions: Question[]) => void
  onToggleReady?: (playerName: string, isReady: boolean) => void
  onStartCombat?: (selectedZoneId: string) => void
}

const LANDING_TIMEOUT_SECONDS = 15

// Diccionario de estilos temáticos seguros para Tailwind
const THEME_STYLES: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  orange: {
    bg: 'from-orange-500/20 via-orange-500/5 to-transparent',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    glow: 'ring-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.4)]',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  purple: {
    bg: 'from-purple-500/20 via-purple-500/5 to-transparent',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    glow: 'ring-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.4)]',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  pink: {
    bg: 'from-pink-500/20 via-pink-500/5 to-transparent',
    border: 'border-pink-500/30',
    text: 'text-pink-300',
    glow: 'ring-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.4)]',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
  },
  emerald: {
    bg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    glow: 'ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.4)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  cyan: {
    bg: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    glow: 'ring-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.4)]',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  amber: {
    bg: 'from-amber-500/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    glow: 'ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.4)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  yellow: {
    bg: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
    border: 'border-yellow-500/30',
    text: 'text-yellow-300',
    glow: 'ring-yellow-500 shadow-[0_0_18px_rgba(234,179,8,0.4)]',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  },
  blue: {
    bg: 'from-blue-500/20 via-blue-500/5 to-transparent',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    glow: 'ring-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.4)]',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  rose: {
    bg: 'from-rose-500/20 via-rose-500/5 to-transparent',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
    glow: 'ring-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.4)]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  indigo: {
    bg: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
    border: 'border-indigo-500/30',
    text: 'text-indigo-300',
    glow: 'ring-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.4)]',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  violet: {
    bg: 'from-violet-500/20 via-violet-500/5 to-transparent',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    glow: 'ring-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.4)]',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40'
  },
  gold: {
    bg: 'from-amber-400/25 via-amber-500/10 to-transparent',
    border: 'border-amber-400/50',
    text: 'text-amber-300',
    glow: 'ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.55)]',
    badge: 'bg-amber-500/25 text-amber-300 border-amber-400/50'
  },
  default: {
    bg: 'from-gray-500/15 via-gray-500/5 to-transparent',
    border: 'border-gray-500/20',
    text: 'text-gray-300',
    glow: 'ring-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.3)]',
    badge: 'bg-gray-500/20 text-gray-300 border-gray-500/40'
  }
}

export default function GameMap({
  categoryKey = 'geografia',
  currentZoneId,
  eliminatedZoneIds = [],
  players = [],
  currentPlayerName = '',
  roomPin = '',
  gamePhase = 'ZONE_SELECTION',
  roundNumber = 1,
  readyMap = {},
  isGodMode = false,
  onSelectZone,
  onToggleReady,
  onStartCombat
}: GameMapProps) {
  const categoryConfig = GAME_CATEGORIES[categoryKey] || GAME_CATEGORIES.geografia
  const levels = categoryConfig.levels

  // Regla 7: Rondas y Tormenta (Matriz de 11 Rondas)
  const isLevelStorm = (levelNum: number, round: number): boolean => {
    if (round >= 11) {
      return levelNum >= 1 && levelNum <= 4
    }
    if (round >= 10) {
      return levelNum >= 1 && levelNum <= 3
    }
    if (round >= 8) {
      return levelNum === 1 || levelNum === 2
    }
    if (round >= 5) {
      return levelNum === 1
    }
    return false
  }

  // Regla 7: Ajuste de apertura de niveles por ronda (Matriz de 11 Rondas)
  const isLevelLocked = (levelNum: number, round: number): boolean => {
    if (levelNum === 1) return false
    if (levelNum === 2) return round < 3  // Abre en R3
    if (levelNum === 3) return round < 6  // Abre en R6
    if (levelNum === 4) return round < 8  // Abre en R8
    if (levelNum === 5) return round < 11 // Abre en R11 (Cúspide Definitiva)
    return false
  }

  const getZoneLevel = (zoneId: string): number => {
    for (const lvl of levels) {
      if (lvl.subzones.some((s) => s.id === zoneId)) {
        return lvl.level
      }
    }
    return 1
  }

  // Find current player object
  const me = players.find((p) => p.player_name === currentPlayerName)
  const isSpectator = isGodMode || Boolean(me && (me.hp ?? 100) <= 0)

  // Regla 9: Extraer completed_zones y mandatory_zone del jugador local
  const completedZones: string[] = me?.completed_zones || []
  const rawMandatoryZone: string | null = me?.mandatory_zone || null

  // Regla 10: Nivel máximo alcanzado (Ascenso Irreversible / Sin Retorno)
  const myHighestLevel = getHighestLevelReached(me, categoryKey, levels)

  // Excepción de la Tormenta: Si la zona obligatoria ha sido consumida por la tormenta, el bloqueo se rompe
  const isMandatoryInStorm = Boolean(rawMandatoryZone && isLevelStorm(getZoneLevel(rawMandatoryZone), roundNumber))
  const effectiveMandatoryZone: string | null = isMandatoryInStorm ? null : rawMandatoryZone

  // Get lowest valid open zone for current round (not storm, not locked, not completed, not lower than highest level)
  const getFirstOpenZoneId = (round: number): string => {
    // Si hay zona obligatoria activa, es la única válida
    if (effectiveMandatoryZone) {
      return effectiveMandatoryZone
    }

    for (let l = myHighestLevel; l <= 5; l++) {
      if (!isLevelStorm(l, round) && !isLevelLocked(l, round)) {
        const found = levels.find((lvl) => lvl.level === l)
        if (found) {
          const availableSub = found.subzones.find((s) => !completedZones.includes(s.id))
          if (availableSub) return availableSub.id
          if (found.subzones.length > 0) return found.subzones[0].id
        }
      }
    }
    return levels[levels.length - 1]?.subzones[0]?.id || 'general_l1_deportes'
  }

  const fallbackOpenZone = getFirstOpenZoneId(roundNumber)

  // Validate zone availability (Reglas 7, 9 y 10)
  const isZoneAvailable = (zoneId: string, round: number): boolean => {
    if (isSpectator) {
      return false
    }
    if (effectiveMandatoryZone) {
      return zoneId === effectiveMandatoryZone
    }
    if (completedZones.includes(zoneId)) {
      return false
    }
    // Regla 10: Sin Retorno (no se puede seleccionar una zona inferior al nivel máximo alcanzado)
    const zoneLvl = getZoneLevel(zoneId)
    if (zoneLvl < myHighestLevel) {
      return false
    }
    for (const lvl of levels) {
      if (lvl.subzones.some((s) => s.id === zoneId)) {
        return !isLevelStorm(lvl.level, round) && !isLevelLocked(lvl.level, round)
      }
    }
    return false
  }

  const initialZone = effectiveMandatoryZone || (
    me?.current_zone && isZoneAvailable(me.current_zone, roundNumber)
      ? me.current_zone
      : currentZoneId && isZoneAvailable(currentZoneId, roundNumber)
      ? currentZoneId
      : fallbackOpenZone
  )

  const [selectedZone, setSelectedZone] = useState<string>(initialZone)
  const [localReadyMap, setLocalReadyMap] = useState<Record<string, boolean>>(readyMap)
  const [landingTimer, setLandingTimer] = useState<number>(LANDING_TIMEOUT_SECONDS)
  const [noReturnWarning, setNoReturnWarning] = useState<boolean>(false)

  const triggerNoReturnWarning = () => {
    if (isSpectator) return
    setNoReturnWarning(true)
    setTimeout(() => {
      setNoReturnWarning(false)
    }, 2500)
  }

  // Track auto-transition trigger to avoid duplicate broadcasts
  const autoTransitionTriggeredRef = useRef<boolean>(false)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeZoneRef = useRef<string>(initialZone)
  const onStartCombatRef = useRef(onStartCombat)
  onStartCombatRef.current = onStartCombat

  useEffect(() => {
    setLocalReadyMap(readyMap)
  }, [readyMap])

  // Fase 5: Autoselección por Obligación (QoL) y sincronización de zona
  useEffect(() => {
    if (isSpectator) return

    if (effectiveMandatoryZone) {
      setSelectedZone(effectiveMandatoryZone)
      if (roomPin && currentPlayerName && me?.current_zone !== effectiveMandatoryZone) {
        updatePlayerZone(roomPin, currentPlayerName, effectiveMandatoryZone)
      }
    } else if (me?.current_zone && isZoneAvailable(me.current_zone, roundNumber)) {
      setSelectedZone(me.current_zone)
    } else if (!isZoneAvailable(selectedZone, roundNumber)) {
      const newZone = fallbackOpenZone
      setSelectedZone(newZone)
      if (roomPin && currentPlayerName) {
        updatePlayerZone(roomPin, currentPlayerName, newZone)
      }
    }
  }, [me?.current_zone, roundNumber, fallbackOpenZone, roomPin, currentPlayerName, selectedZone, effectiveMandatoryZone, isSpectator])

  const activeZone = effectiveMandatoryZone || selectedZone || fallbackOpenZone
  activeZoneRef.current = activeZone

  const [eliminatedSet, setEliminatedSet] = useState<Set<string>>(
    new Set(eliminatedZoneIds)
  )

  // Helper to get zone name
  const findZoneName = (zoneId?: string | null): string => {
    if (!zoneId) return 'Ninguna'
    for (const lvl of levels) {
      const found = lvl.subzones.find((s) => s.id === zoneId)
      if (found) return found.name
    }
    return zoneId
  }

  // Modals
  const [activeInfoZone, setActiveInfoZone] = useState<{
    zone: SubZone
    levelName: string
    colorClass: string
  } | null>(null)
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false)
  const [stormStrikeAlert, setStormStrikeAlert] = useState<{
    zoneName: string
    damage: number
    level: number
  } | null>(null)
  const stormStrikeProcessedRoundsRef = useRef<Set<string>>(new Set())

  // Fase 1: Filtro de Supervivientes (solo jugadores con HP > 0)
  const playersList = players.length > 0 ? players : [{ id: 'p1', room_pin: roomPin, player_name: currentPlayerName || 'Jugador', hp: 100 }]
  const alivePlayers = playersList.filter((p) => (p.hp ?? 100) > 0)
  const playersWithZone = alivePlayers.filter((p) => Boolean(p.current_zone || (p.player_name === currentPlayerName && activeZone)))
  
  const isMyReady = Boolean(currentPlayerName && localReadyMap[currentPlayerName])
  
  const allPlayersSelectedZone = alivePlayers.length > 0 && playersWithZone.length === alivePlayers.length
  const allPlayersReadyOnMap = alivePlayers.length > 0 && (
    alivePlayers.every((p) => Boolean(localReadyMap[p.player_name])) || (alivePlayers.length === 1 && isMyReady)
  )
  const isAssaultReady = allPlayersSelectedZone && allPlayersReadyOnMap

  // Position Visibility Control: Positions are hidden during selection until timer reaches 0 or all players confirm ready
  // En Modo Dios: Visión total sin niebla de guerra
  const positionsRevealed = isGodMode || landingTimer === 0 || isAssaultReady || allPlayersReadyOnMap || gamePhase !== 'ZONE_SELECTION'

  // Fase 2 & 3: Detección de Impacto de Tormenta Progresivo (-10 a -50 HP) y Liberación Atómica de mandatory_zone
  useEffect(() => {
    if (isSpectator || !me || (me.hp ?? 100) <= 0 || gamePhase !== 'ZONE_SELECTION') return
    if (!rawMandatoryZone) return

    const zoneLvl = getZoneLevel(rawMandatoryZone)
    const isUnderStorm = isLevelStorm(zoneLvl, roundNumber)

    if (isUnderStorm) {
      const strikeKey = `${roundNumber}_${rawMandatoryZone}`
      if (!stormStrikeProcessedRoundsRef.current.has(strikeKey)) {
        stormStrikeProcessedRoundsRef.current.add(strikeKey)

        const destroyedZoneName = findZoneName(rawMandatoryZone)

        // Daño progresivo según el nivel de la zona destruida
        const stormDamageConfig: Record<number, number> = { 1: 10, 2: 20, 3: 30, 4: 50 }
        const stormDamage = stormDamageConfig[zoneLvl] || 25

        // Paso 1: Aplicar Daño Atómico Dinámico
        if (me.id) {
          applyPlayerDamage(me.id, stormDamage)
        }

        // Paso 2: Liberar la zona obligatoria en Supabase
        if (me.id) {
          clearPlayerMandatoryZone(me.id)
        }

        // Paso 3: Feedback auditivo y visual
        playBuzzSound()
        setStormStrikeAlert({
          zoneName: destroyedZoneName,
          damage: stormDamage,
          level: zoneLvl
        })

        // Auto-dismiss alert after 4.0s
        const dismissTimer = setTimeout(() => {
          setStormStrikeAlert(null)
        }, 4000)

        return () => clearTimeout(dismissTimer)
      }
    }
  }, [roundNumber, gamePhase, rawMandatoryZone, isSpectator, me])

  // Reset transition flags when phase or round changes
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION') {
      setLandingTimer(LANDING_TIMEOUT_SECONDS)
      autoTransitionTriggeredRef.current = false
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }
      return
    }

    autoTransitionTriggeredRef.current = false
    setLandingTimer(LANDING_TIMEOUT_SECONDS)
  }, [gamePhase, roundNumber])

  // 1. Landing Phase Countdown Timer (15 seconds)
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION') return

    const timerInterval = setInterval(() => {
      setLandingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [gamePhase, roundNumber])

  // 2. Automated Transition from ZONE_SELECTION to COMBAT with guaranteed 2.0s reveal pause
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION') return

    if (positionsRevealed && !autoTransitionTriggeredRef.current) {
      autoTransitionTriggeredRef.current = true

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      transitionTimeoutRef.current = setTimeout(() => {
        transitionTimeoutRef.current = null
        if (onStartCombatRef.current) {
          onStartCombatRef.current(activeZoneRef.current)
        }
      }, 2000)
    }
  }, [positionsRevealed, gamePhase])

  // Handle Player Zone Click on Tactical Map (Regla 9 y 10)
  const handleZoneClick = (
    subzone: SubZone,
    isStorm: boolean,
    isLocked: boolean,
    isCompleted: boolean,
    isMandatory: boolean,
    hasOtherMandatory: boolean
  ) => {
    if (isSpectator) return
    if (isStorm || isLocked) return
    if (hasOtherMandatory) return
    if (isCompleted) return

    setSelectedZone(subzone.id)

    if (roomPin && currentPlayerName) {
      updatePlayerZone(roomPin, currentPlayerName, subzone.id)
    }

    const zoneQuestions = getQuestionsForZone(categoryKey, subzone.id, roundNumber, 1)
    if (onSelectZone) {
      onSelectZone(subzone.id, zoneQuestions)
    }
  }

  // Handle Ready Toggle on Map
  const handleReadyToggle = () => {
    if (isSpectator) return
    if (!currentPlayerName) return
    const nextState = !isMyReady
    setLocalReadyMap((prev) => ({ ...prev, [currentPlayerName]: nextState }))
    if (onToggleReady) {
      onToggleReady(currentPlayerName, nextState)
    }
  }

  // Open Info Modal
  const openInfoModal = (zone: SubZone, levelName: string, colorClass: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveInfoZone({ zone, levelName, colorClass })
  }

  // Close Info Modal
  const closeInfoModal = () => {
    setActiveInfoZone(null)
  }

  // Texturas y fondos sutiles por nivel
  const getLevelBackgroundTexture = (level: number) => {
    switch (level) {
      case 5: // Cúspide Definitiva (Dorado / Apex)
        return 'bg-amber-500/[0.08] border-amber-400/40'
      case 4: // Experto (Púrpura / Violeta)
        return 'bg-purple-500/[0.06] border-purple-400/30'
      case 3: // Avanzado (Carmesí / Rose)
        return 'bg-rose-500/[0.06] border-rose-400/30'
      case 2: // Intermedio (Azul Zafiro / Sky)
        return 'bg-sky-500/[0.06] border-sky-400/30'
      case 1: // Base (Verde Esmeralda)
      default:
        return 'bg-emerald-500/[0.06] border-emerald-400/30'
    }
  }

  // Helper visual para calcular el estado y advertencia de tormenta por nivel (Matriz de 11 Rondas)
  const getLevelCountdownBadge = (levelNum: number, round: number) => {
    if (levelNum === 1) {
      if (round >= 5) {
        return { text: '🌩️ Consumido', badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
      }
      const left = 5 - round
      return { text: `🌩️ Cierra en ${left}r`, badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    }
    if (levelNum === 2) {
      if (round < 3) {
        const left = 3 - round
        return { text: `🔒 Abre en ${left}r`, badgeStyle: 'bg-white/5 text-white/50 border-white/10' }
      }
      if (round >= 8) {
        return { text: '🌩️ Consumido', badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
      }
      const left = 8 - round
      return { text: `🌩️ Cierra en ${left}r`, badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    }
    if (levelNum === 3) {
      if (round < 6) {
        const left = 6 - round
        return { text: `🔒 Abre en ${left}r`, badgeStyle: 'bg-white/5 text-white/50 border-white/10' }
      }
      if (round >= 10) {
        return { text: '🌩️ Consumido', badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
      }
      const left = 10 - round
      return { text: `🌩️ Cierra en ${left}r`, badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    }
    if (levelNum === 4) {
      if (round < 8) {
        const left = 8 - round
        return { text: `🔒 Abre en ${left}r`, badgeStyle: 'bg-white/5 text-white/50 border-white/10' }
      }
      if (round >= 11) {
        return { text: '🌩️ Consumido', badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
      }
      const left = 11 - round
      return { text: `🌩️ Cierra en ${left}r`, badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    }
    if (levelNum === 5) {
      if (round < 11) {
        const left = 11 - round
        return { text: `🔒 Abre en ${left}r`, badgeStyle: 'bg-white/5 text-white/50 border-white/10' }
      }
      return { text: '👑 Cúspide Abierta', badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse' }
    }
    return { text: '', badgeStyle: '' }
  }

  // Radar de Tormenta Dinámico (HUD Superior)
  const getStormRadarInfo = (round: number) => {
    if (round < 5) {
      const roundsLeft = 5 - round
      return {
        text: `🌩️ N1 cierra en ${roundsLeft} ${roundsLeft === 1 ? 'ronda' : 'rondas'}`,
        alertLevel: 'info'
      }
    }
    if (round >= 5 && round < 8) {
      const roundsLeft = 8 - round
      return {
        text: `🌩️ N2 cierra en ${roundsLeft} ${roundsLeft === 1 ? 'ronda' : 'rondas'}`,
        alertLevel: 'warn'
      }
    }
    if (round >= 8 && round < 10) {
      const roundsLeft = 10 - round
      return {
        text: `🌩️ N3 cierra en ${roundsLeft} ${roundsLeft === 1 ? 'ronda' : 'rondas'}`,
        alertLevel: 'warn'
      }
    }
    if (round >= 10 && round < 11) {
      const roundsLeft = 11 - round
      return {
        text: `🌩️ N4 cierra en ${roundsLeft} ${roundsLeft === 1 ? 'ronda' : 'rondas'}`,
        alertLevel: 'danger'
      }
    }
    return {
      text: `🌩️ Cúspide Definitiva Activa`,
      alertLevel: 'danger'
    }
  }
  const stormRadar = getStormRadarInfo(roundNumber)

  // Banner de Contexto Dinámico (El 'Por Qué')
  const getContextBannerInfo = () => {
    if (isGodMode) {
      return {
        text: '👁️ MODO ESPECTADOR - En vivo',
        style: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 shadow-md ring-1 ring-cyan-400/30 animate-pulse'
      }
    }
    if (isSpectator) {
      return {
        text: '💀 MODO ESPECTADOR (Eliminado)',
        style: 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-md ring-1 ring-rose-500/30'
      }
    }
    if (noReturnWarning) {
      return {
        text: '🚫 Sin retorno: No puedes retroceder a un nivel inferior.',
        style: 'bg-rose-950/80 border-rose-500/80 text-rose-100 animate-pulse ring-2 ring-rose-500/40 shadow-lg'
      }
    }
    if (roundNumber === 1) {
      return {
        text: '🪂 Desembarco: Elige una zona de Nivel 1.',
        style: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
      }
    }
    if (effectiveMandatoryZone) {
      return {
        text: '⚠️ ¡Atrapado! Debes repetir la zona que fallaste.',
        style: 'bg-rose-950/80 border-red-500/60 text-red-200 animate-pulse ring-1 ring-red-500/40'
      }
    }
    if (isMandatoryInStorm) {
      return {
        text: '🌩️ ¡Tormenta liberadora! Elige una nueva zona superior.',
        style: 'bg-amber-950/60 border-amber-400/50 text-amber-200 animate-pulse'
      }
    }
    if (me?.current_zone && completedZones.includes(me.current_zone) && !effectiveMandatoryZone) {
      return {
        text: '✅ ¡Zona Conquistada! Avanza a una nueva ubicación.',
        style: 'bg-emerald-950/60 border-emerald-400/50 text-emerald-200'
      }
    }
    return {
      text: '🗺️ Selecciona una zona abierta para avanzar.',
      style: 'bg-white/[0.03] border-white/10 text-white/80'
    }
  }
  const contextBanner = getContextBannerInfo()

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-1.5 font-sans relative select-none">
      
      {/* 1. HUD DE PARTIDA COMPACTO (Fondo Glassmorphism, integrado en barra superior) */}
      <div className="bg-white/[0.05] border border-white/[0.1] backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          {/* Indicador de Ronda */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-xs shadow-sm shrink-0">
            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Ronda {roundNumber}/11</span>
          </div>

          {/* Radar de Tormenta */}
          <div className={`px-2 py-0.5 rounded-lg border text-[10px] sm:text-[10.5px] font-bold flex items-center gap-1.5 min-w-0 truncate shadow-inner ${
            stormRadar.alertLevel === 'danger'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 animate-pulse'
              : stormRadar.alertLevel === 'warn'
              ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
              : 'bg-white/5 border-white/10 text-white/70'
          }`}>
            <span className="truncate">{stormRadar.text}</span>
          </div>

          {/* Temporizador y Botón de Ayuda */}
          <div className="flex items-center gap-1 shrink-0">
            {gamePhase === 'ZONE_SELECTION' && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-mono font-black shadow-sm ${
                landingTimer <= 5
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-ping'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{landingTimer}s</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLegendModal(true)}
              title="Ver Leyenda del Mapa"
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white font-black text-[11px] flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* 2. BANNER DE CONTEXTO DINÁMICO COMPACTO (Fase 1: Zero Waste) */}
      {positionsRevealed && gamePhase === 'ZONE_SELECTION' ? (
        <div className="bg-emerald-500/20 border border-emerald-400/50 py-1 px-2.5 rounded-xl text-center text-[11px] text-emerald-300 font-black flex items-center justify-center gap-1.5 shadow-md animate-pulse">
          <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">¡Posiciones reveladas! Entrando a combate...</span>
        </div>
      ) : (
        <div className={`py-1 px-2.5 rounded-xl border text-center text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm backdrop-blur-sm transition-all duration-300 ${contextBanner.style}`}>
          <span className="truncate">{contextBanner.text}</span>
        </div>
      )}

      {/* 3. MINI-HUD DE ESCUADRÓN (Fase 2: Flex Row Compacto con Barra de Salud Ultra-fina) */}
      <div className="w-full">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar scroll-smooth">
          {playersList.map((p, pIdx) => {
            const isMe = p.player_name === currentPlayerName
            const isPDead = (p.hp ?? 100) <= 0
            const isPReady = Boolean(localReadyMap[p.player_name])
            const pZone = p.current_zone || (isMe ? activeZone : null)
            const isTrapped = Boolean(p.mandatory_zone)
            const pHp = p.hp ?? 100

            const hpColorClass = isPDead
              ? 'text-zinc-500'
              : pHp <= 25
              ? 'text-rose-400'
              : pHp <= 50
              ? 'text-amber-400'
              : 'text-emerald-400'

            const hpBarBgClass = isPDead
              ? 'bg-zinc-700'
              : pHp <= 25
              ? 'bg-rose-500'
              : pHp <= 50
              ? 'bg-amber-400'
              : 'bg-emerald-400'

            return (
              <div
                key={p.id || pIdx}
                className={`min-w-[130px] sm:min-w-[145px] flex-1 p-1.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-1 shadow-sm shrink-0 relative overflow-hidden backdrop-blur-sm ${
                  isPDead
                    ? 'bg-white/[0.01] border-white/5 opacity-40 grayscale'
                    : isTrapped
                    ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                    : isMe
                    ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}
              >
                {/* Top Row: Avatar + Name + HP + Status Icon */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-sm shrink-0">{isPDead ? '💀' : p.avatar_icon || '🦊'}</span>
                    <span className={`font-black truncate text-[11px] ${isPDead ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {p.player_name}
                    </span>
                    {isMe && (
                      <span className="text-[7.5px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        TÚ
                      </span>
                    )}
                  </div>

                  {/* Right: HP & State Icon */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-mono font-black ${hpColorClass}`}>
                      {pHp}
                    </span>
                    {isPDead ? (
                      <span className="text-xs" title="Eliminado">💀</span>
                    ) : isPReady ? (
                      <span title="Listo">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      </span>
                    ) : (
                      <span title="Eligiendo...">
                        <Hourglass className="w-3 h-3 text-amber-400 animate-spin" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Ultra-thin HP progress bar pinned at the bottom */}
                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${hpBarBgClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, pHp))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. PIRÁMIDE TÁCTICA DE ZONAS (Fase 3: Glassmorphism, Botones Táctiles y Compresión Vertical) */}
      <div className="flex flex-col space-y-1.5 w-full pt-0.5">
        {levels.map((level) => {
          const isStorm = isLevelStorm(level.level, roundNumber)
          const isLocked = isLevelLocked(level.level, roundNumber)
          const countdownInfo = getLevelCountdownBadge(level.level, roundNumber)

          // COMPRESIÓN 1: ZONA EN TORMENTA (Banda delgada ultra-compacta)
          if (isStorm) {
            return (
              <div
                key={level.level}
                className="w-full py-1 px-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between shadow-sm opacity-80 transition-all duration-300"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-300 min-w-0">
                  <span className="text-xs shrink-0">🌩️</span>
                  <span className="uppercase tracking-wider text-[10px] truncate">{level.name}</span>
                </div>
                <span className="text-[8.5px] font-black uppercase bg-rose-500/20 text-rose-200 border border-rose-400/50 px-1.5 py-0.2 rounded-full shrink-0">
                  Tormenta Activa
                </span>
              </div>
            )
          }

          // COMPRESIÓN 2: ZONA BLOQUEADA (Banda delgada ultra-compacta)
          if (isLocked) {
            const unlockRound = level.level === 2 ? 3 : level.level === 3 ? 6 : level.level === 4 ? 8 : 11
            const roundsToUnlock = Math.max(1, unlockRound - roundNumber)
            return (
              <div
                key={level.level}
                className="w-full py-1 px-2.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between text-white/40 opacity-60 shadow-inner transition-all duration-300"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold min-w-0">
                  <Lock className="w-3 h-3 text-white/40 shrink-0" />
                  <span className="uppercase tracking-wider text-[10px] text-white/40 truncate">{level.name}</span>
                </div>
                <span className="text-[8.5px] font-mono font-bold bg-white/5 border border-white/10 text-white/50 px-1.5 py-0.2 rounded-full shrink-0">
                  🔒 Abre en R{unlockRound} ({roundsToUnlock}r)
                </span>
              </div>
            )
          }

          // ZONA ABIERTA Y DISPONIBLE: Renderizado táctil en cristal
          return (
            <div key={level.level} className="space-y-1 w-full bg-white/[0.02] border border-white/[0.06] p-1.5 sm:p-2 rounded-2xl shadow-sm backdrop-blur-xs">
              
              {/* Cabecera del Nivel */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${level.colorTheme.indicator}`} />
                  <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-white/80 truncate">
                    {level.name}
                  </span>
                </div>

                {/* Pastilla de Cuenta Atrás */}
                <span className={`text-[8.5px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shadow-sm shrink-0 ${countdownInfo.badgeStyle}`}>
                  {countdownInfo.text}
                </span>
              </div>

              {/* Rejilla de Subzonas: 2 zonas por fila para aprovechar al máximo el espacio */}
              <div
                className={`grid gap-2 sm:gap-2.5 w-full ${
                  level.level === 5 ? 'grid-cols-1' : 'grid-cols-2'
                }`}
              >
                {level.subzones.map((subzone, subzoneIdx) => {
                  const isSingleThird = level.subzones.length === 3 && subzoneIdx === 2
                  const isCurrent = (me?.current_zone === subzone.id) || activeZone === subzone.id
                  const isEliminated = eliminatedSet.has(subzone.id)

                  const isCompleted = completedZones.includes(subzone.id)
                  const isMandatory = Boolean(effectiveMandatoryZone && effectiveMandatoryZone === subzone.id)
                  const hasOtherMandatory = Boolean(effectiveMandatoryZone && effectiveMandatoryZone !== subzone.id)

                  // Estilo temático seguro de la subzona
                  const style = THEME_STYLES[subzone.themeColor || ''] || THEME_STYLES.default

                  // Jugadores que ya completaron esta subzona
                  const playersWhoCompleted = playersList.filter((p) =>
                    p.completed_zones?.includes(subzone.id) || (p.player_name === currentPlayerName && isCompleted)
                  )

                  // Jugadores actualmente posicionados aquí (que no la hayan completado previamente)
                  const currentLandedPlayers = playersList.filter((p) => {
                    const isHere = p.current_zone === subzone.id || (p.player_name === currentPlayerName && activeZone === subzone.id)
                    const isDone = p.completed_zones?.includes(subzone.id) || (p.player_name === currentPlayerName && isCompleted)
                    return isHere && !isDone
                  })

                  const visibleLandedPlayers = positionsRevealed
                    ? currentLandedPlayers
                    : currentLandedPlayers.filter((p) => p.player_name === currentPlayerName)

                  const aliveLanded = currentLandedPlayers.filter((p) => (p.hp ?? 100) > 0)
                  const hasLiveDuel = aliveLanded.length > 1 && !isStorm && !isLocked
                  const isDuelActive = isGodMode ? hasLiveDuel : (positionsRevealed && hasLiveDuel)
                  const isNoReturn = level.level < myHighestLevel

                  // Marca de agua dinámica de fondo
                  let watermarkIcon = subzone.icon || '📍'
                  if (isStorm) watermarkIcon = '🌩️'
                  else if (isMandatory) watermarkIcon = '⚠️'
                  else if (isCompleted) watermarkIcon = '✅'
                  else if (isDuelActive) watermarkIcon = '⚔️'
                  else if (isNoReturn) watermarkIcon = '🚫'

                  let cardClass = ''
                  let isClickable = !isSpectator

                  if (isGodMode) {
                    if (hasLiveDuel) {
                      cardClass = 'animate-shake bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.7)] z-20 pointer-events-none'
                    } else if (isCompleted) {
                      cardClass = 'bg-emerald-950/40 border-2 border-emerald-500/50 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)] pointer-events-none'
                    } else {
                      cardClass = `bg-gradient-to-br ${style.bg} bg-[#0B0F19]/80 border ${style.border} opacity-90 pointer-events-none`
                    }
                    isClickable = false
                  } else if (isSpectator) {
                    cardClass = 'opacity-40 grayscale cursor-not-allowed bg-black/40 border-white/5'
                    isClickable = false
                  } else if (isCompleted) {
                    cardClass = 'bg-emerald-950/40 border-2 border-emerald-500/60 text-emerald-300 shadow-[inset_0_0_25px_rgba(16,185,129,0.2)] opacity-90 pointer-events-none cursor-not-allowed'
                    isClickable = false
                  } else if (isNoReturn) {
                    cardClass = 'opacity-40 grayscale cursor-not-allowed bg-black/40 border-white/5 shadow-inner'
                    isClickable = false
                  } else if (isMandatory) {
                    cardClass = 'bg-red-900/30 border-red-500 ring-2 ring-red-600 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20 cursor-pointer'
                    isClickable = true
                  } else if (hasOtherMandatory) {
                    cardClass = 'opacity-40 grayscale pointer-events-none cursor-not-allowed bg-black/40 border-white/5'
                    isClickable = false
                  } else if (isDuelActive) {
                    cardClass = 'animate-shake bg-rose-950/60 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] z-20 cursor-pointer'
                  } else if (isCurrent) {
                    cardClass = `bg-gradient-to-br ${style.bg} bg-[#0B0F19]/90 border ${style.border} ring-2 ${style.glow} z-10 cursor-pointer scale-[1.02]`
                  } else {
                    cardClass = `bg-gradient-to-br ${style.bg} bg-[#0B0F19]/80 border ${style.border} hover:bg-white/[0.08] active:scale-95 cursor-pointer`
                  }

                  return (
                    <div
                      key={subzone.id}
                      onClick={() => {
                        if (isSpectator || isCompleted) return
                        if (isNoReturn) {
                          triggerNoReturnWarning()
                          return
                        }
                        if (isClickable) {
                          handleZoneClick(subzone, isStorm, isLocked, isCompleted, isMandatory, hasOtherMandatory)
                        }
                      }}
                      className={`relative group rounded-xl p-2.5 sm:p-3 border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-sm backdrop-blur-md min-h-[64px] sm:min-h-[70px] ${cardClass} ${isSingleThird ? 'col-span-2' : ''}`}
                    >
                      {/* Marca de agua (Watermark) de fondo */}
                      <span className="absolute -right-2 -bottom-2 text-5xl opacity-10 rotate-12 pointer-events-none select-none z-0">
                        {watermarkIcon}
                      </span>

                      {/* Top Row: Title + Indicator / Duel / Conquered Badge */}
                      <div className="flex items-start justify-between w-full gap-1.5 z-10">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          {isNoReturn ? (
                            <span className="text-xs shrink-0 opacity-60" title="Sin Retorno">🚫</span>
                          ) : isMandatory ? (
                            <span className="text-xs shrink-0 animate-bounce" title="Zona Obligatoria">⚠️</span>
                          ) : isCompleted ? (
                            <span className="text-xs shrink-0 text-emerald-400 font-black" title="Zona Conquistada">✅</span>
                          ) : level.level === 5 ? (
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          ) : null}

                          <span
                            className={`font-black tracking-tight leading-snug truncate text-xs sm:text-sm flex items-center gap-1 ${
                              isNoReturn
                                ? 'text-white/40 line-through decoration-white/40'
                                : isMandatory
                                ? 'text-rose-200 underline decoration-red-500'
                                : isCompleted
                                ? 'text-emerald-300 font-extrabold'
                                : isCurrent
                                ? `${style.text} font-extrabold`
                                : style.text
                            }`}
                          >
                            {subzone.icon && <span className="text-sm shrink-0">{subzone.icon}</span>}
                            <span className="truncate">{subzone.name}</span>
                          </span>
                        </div>

                        {/* BADGES: DUELO O CONQUISTADA */}
                        {isDuelActive ? (
                          <div className="flex items-center gap-1 bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-rose-300 animate-bounce shrink-0">
                            <Swords className="w-2.5 h-2.5 fill-current" />
                            <span>{gamePhase === 'COMBAT' ? 'COMBATE' : 'DUELO'}</span>
                          </div>
                        ) : isCompleted ? (
                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider shrink-0 shadow-sm">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span>HECHA</span>
                          </div>
                        ) : null}
                      </div>

                      {/* VISIBLE PLAYERS AVATARS BADGES CONTAINER (EMOTICONO + SÍMBOLO) */}
                      {(playersWhoCompleted.length > 0 || visibleLandedPlayers.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 my-1 z-10">
                          {/* Jugadores que ya completaron esta subzona */}
                          {playersWhoCompleted.map((cp) => {
                            const isCpMe = cp.player_name === currentPlayerName
                            return (
                              <div
                                key={`comp_${cp.id || cp.player_name}`}
                                title={`${cp.player_name} (Completada ✅)`}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-bold border shadow-sm ${
                                  isCpMe
                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                                    : 'bg-black/50 border-emerald-500/40 text-emerald-300'
                                }`}
                              >
                                <span className="text-sm leading-none">{cp.avatar_icon || '🦊'}</span>
                                <span className="text-[10px] leading-none text-emerald-400 font-black">✅</span>
                              </div>
                            )
                          })}

                          {/* Jugadores actualmente en la subzona */}
                          {visibleLandedPlayers.map((lp) => {
                            const isLpDead = (lp.hp ?? 100) <= 0
                            const isLpReady = Boolean(localReadyMap[lp.player_name])
                            const isLpTrapped = Boolean(lp.mandatory_zone && lp.mandatory_zone === subzone.id)
                            const isLpMe = lp.player_name === currentPlayerName

                            return (
                              <div
                                key={`land_${lp.id || lp.player_name}`}
                                title={`${lp.player_name} (${lp.hp} HP)`}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-bold border shadow-sm ${
                                  isLpDead
                                    ? 'bg-black/50 border-white/10 opacity-40 grayscale'
                                    : isDuelActive
                                    ? 'bg-rose-500/30 border-rose-400 text-rose-200 ring-1 ring-rose-400/40 animate-pulse'
                                    : isLpTrapped
                                    ? 'bg-rose-900/30 border-rose-500/60 text-rose-300 ring-1 ring-rose-500/40'
                                    : isLpReady
                                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                                    : isLpMe
                                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 ring-1 ring-amber-400/30'
                                    : 'bg-black/50 border-white/10 text-white/80'
                                }`}
                              >
                                <span className="text-sm leading-none">{lp.avatar_icon || '🦊'}</span>
                                {isLpDead ? (
                                  <span className="text-[10px] leading-none">💀</span>
                                ) : isLpTrapped ? (
                                  <span className="text-[10px] leading-none">⚠️</span>
                                ) : isLpReady ? (
                                  <span className="text-[10px] leading-none text-emerald-400 font-black">✔️</span>
                                ) : (
                                  <span className="text-[10px] leading-none text-amber-400">⏳</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Bottom Row: Info Popup & Ready Button / Conquered Note */}
                      <div className="flex items-center justify-between w-full pt-1 z-10 mt-auto">
                        <button
                          type="button"
                          onClick={(e) => openInfoModal(subzone, level.name, level.colorTheme.text, e)}
                          title="Ver información de la subzona"
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 transition-colors"
                        >
                          <Info className="w-3 h-3" />
                        </button>

                        {/* Conquered indicator or Direct Ready Confirmation Button */}
                        {isCompleted ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400/80">
                            🔒 No repetible
                          </span>
                        ) : gamePhase === 'ZONE_SELECTION' && !isSpectator && isCurrent && !hasOtherMandatory ? (
                          <button
                            type="button"
                            onClick={handleReadyToggle}
                            className={`py-1 px-2.5 sm:px-3 rounded-lg font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
                              isMyReady
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 animate-pulse'
                            }`}
                          >
                            {isMyReady ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>¡Listo!</span>
                              </>
                            ) : (
                              <>
                                <Navigation className="w-3 h-3" />
                                <span>Marcar Listo</span>
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DE LEYENDA Y NORMAS DEL MAPA (Glassmorphism) */}
      {showLegendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1424] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Leyenda del Mapa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLegendModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-white/80">
              <div className="flex items-start gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm shrink-0">✅</span>
                <div>
                  <span className="font-bold text-emerald-300">Conquistada:</span>
                  <p className="text-[10.5px] text-white/60 leading-snug">Zona ya superada con éxito. Queda sellada e injugable para ti.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-sm shrink-0">🌩️</span>
                <div>
                  <span className="font-bold text-rose-300">Tormenta:</span>
                  <p className="text-[10.5px] text-white/60 leading-snug">Nivel consumido por la tormenta tóxica. Inhabilitado e inaccesible.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <span className="text-sm shrink-0">⚠️</span>
                <div>
                  <span className="font-bold text-red-300">Obligatoria:</span>
                  <p className="text-[10.5px] text-white/60 leading-snug">Debes reintentar la subzona donde fallaste para poder progresar.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-sm shrink-0">🔒</span>
                <div>
                  <span className="font-bold text-white/70">Bloqueado:</span>
                  <p className="text-[10.5px] text-white/50 leading-snug">Se abre en rondas avanzadas del juego.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-sm shrink-0">🚫</span>
                <div>
                  <span className="font-bold text-rose-300">Sin Retorno:</span>
                  <p className="text-[10.5px] text-white/60 leading-snug">Al ascender a un nivel superior, las subzonas de niveles inferiores quedan bloqueadas.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-sm shrink-0">⚔️</span>
                <div>
                  <span className="font-bold text-amber-300">Duelo Directo:</span>
                  <p className="text-[10.5px] text-white/60 leading-snug">2 o más jugadores en la misma subzona compiten con las mismas preguntas.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLegendModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ALERTA DE IMPACTO DE TORMENTA */}
      {stormStrikeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e1424] border-2 border-rose-500 ring-4 ring-rose-500/30 p-5 rounded-3xl max-w-sm w-full text-center space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 mx-auto flex items-center justify-center text-2xl shadow-inner animate-pulse">
              ⚡
            </div>

            <div className="space-y-1">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full">
                ¡Alerta de Tormenta!
              </span>
              <h3 className="text-base font-black text-rose-100 leading-tight">
                🌩️ ¡LA TORMENTA TE HA ALCANZADO!
              </h3>
              <p className="text-xs text-white/70 leading-relaxed pt-0.5">
                Tu zona <strong className="text-amber-300">"{stormStrikeAlert.zoneName}"</strong> ha sido destruida.
              </p>
            </div>

            <div className="bg-rose-950/60 border border-rose-500/40 p-2 rounded-xl flex items-center justify-center gap-2 text-xs font-mono font-black text-rose-200">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Has sufrido -{stormStrikeAlert.damage} HP de daño</span>
            </div>

            <p className="text-[10.5px] text-amber-200 font-medium">
              ⚡ ¡Bloqueo roto! Huye hacia una zona abierta en un nivel superior.
            </p>

            <button
              type="button"
              onClick={() => setStormStrikeAlert(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 shadow-lg cursor-pointer"
            >
              ¡Entendido! A Huir 🚀
            </button>
          </div>
        </div>
      )}

      {/* Info Modal de Subzona */}
      {activeInfoZone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-white/10 rounded-3xl p-5 max-w-xs w-full space-y-3.5 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setActiveInfoZone(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/5 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-0.5">
              <span className={`text-[9.5px] font-black uppercase tracking-wider ${activeInfoZone.colorClass}`}>
                {activeInfoZone.levelName}
              </span>
              <h3 className="text-base font-black text-white">{activeInfoZone.zone.name}</h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              {activeInfoZone.zone.description}
            </p>

            <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Daño por Fallo:</span>
                <span className="text-rose-400 font-bold">
                  -{categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 5 ? 75 : categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 4 ? 55 : categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 3 ? 40 : categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 2 ? 25 : 15} HP
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Curación por Acierto:</span>
                <span className="text-emerald-400 font-bold">
                  +{categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 5 ? 20 : categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 4 ? 15 : categoryConfig.levels.find(l => l.name === activeInfoZone.levelName)?.level === 3 ? 10 : 0} HP
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveInfoZone(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

