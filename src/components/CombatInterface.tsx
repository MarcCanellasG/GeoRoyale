'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, CheckCircle2, XCircle, Users, Hourglass, Sparkles, Check, Flame, Heart, Trophy, Globe, Swords, ShieldAlert, Zap, BookOpen } from 'lucide-react'
import { Question } from '@/config/questionBank'
import { DIFFICULTY_SETTINGS, DifficultyMode, calculateDamageOrHealing } from '@/config/gameConfig'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'
import { playTickSound, playChimeSound, playBuzzSound } from '@/lib/soundService'
import { applyPlayerDamage, applyPlayerHealing, sendPlayerAnswered, recordPlayerZoneOutcome } from '@/lib/supabase/playersService'

export type CombatPhase = 'READING' | 'ANSWERING' | 'REVEAL'

interface CombatInterfaceProps {
  question?: Question
  questions?: Question[]
  zoneName?: string
  zoneId?: string
  categoryKey?: string
  localPlayerId?: string
  localPlayerHp?: number
  currentPlayerName?: string
  difficultyMode?: DifficultyMode
  roomPin?: string
  isHost?: boolean
  isDuel?: boolean
  duelOpponents?: string[]
  roundNumber?: number
  completedZones?: string[]
  duration?: number
  playersAnswered?: number
  totalPlayers?: number
  allPlayersAnswered?: boolean
  isSpectator?: boolean
  players?: any[]
  answeredMap?: Record<string, boolean>
  onAnswer?: (selectedIndex: number | null, isCorrect: boolean, damageDealt: number, healingDealt: number) => void
  onClose?: () => void
}

const CATEGORY_HEADER_ICONS: Record<CategoryKey, any> = {
  general: Sparkles,
  geografia: Globe,
  cultura_general: Sparkles,
  deportes: Trophy,
  historia: Flame
}

export interface BurstOutcome {
  correctCount: number
  finalDamage: number
  healing: number
  outcomeType: 'double_success' | 'tie' | 'double_fail'
  isDuelDamage: boolean
}

const READING_DURATION_SECONDS = 3.0

export default function CombatInterface({
  question,
  questions,
  zoneName = 'Deportes',
  zoneId = 'general_l1_deportes',
  categoryKey = 'general',
  localPlayerId,
  localPlayerHp = 100,
  currentPlayerName = '',
  difficultyMode = 'normal',
  roomPin,
  isHost = false,
  isDuel = false,
  duelOpponents = [],
  roundNumber = 1,
  completedZones = [],
  duration,
  playersAnswered = 0,
  totalPlayers = 2,
  allPlayersAnswered = false,
  isSpectator = false,
  players = [],
  answeredMap = {},
  onAnswer,
  onClose
}: CombatInterfaceProps) {
  // Category Theme configuration
  const categoryConfig = GAME_CATEGORIES[(categoryKey as CategoryKey)] || GAME_CATEGORIES.general
  const CategoryIcon = CATEGORY_HEADER_ICONS[(categoryKey as CategoryKey)] || Globe

  // Normalizar array de 2 preguntas de combate
  const burstQuestions: Question[] = (questions && questions.length >= 2)
    ? questions
    : (questions && questions.length === 1)
    ? [questions[0], questions[0]]
    : question
    ? [question, question]
    : [
        {
          id: 'fallback_1',
          question: 'Pregunta 1 de combate',
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctIndex: 0
        },
        {
          id: 'fallback_2',
          question: 'Pregunta 2 de combate',
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctIndex: 1
        }
      ]

  // Extraer configuración según el modo de dificultad (8s Normal -> 7s / 5s Hardcore -> 4s)
  const diffConfig = DIFFICULTY_SETTINGS[difficultyMode] || DIFFICULTY_SETTINGS.normal
  const isLevel5 = zoneId === 'general_l5_1' || zoneId?.includes('_l5_') || zoneName?.toLowerCase().includes('definitivo')
  const baseDuration = isLevel5 ? 5 : (duration || diffConfig.timer)
  const answeringDuration = Math.max(2, baseDuration - 1)

  // Estados locales del asalto
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0) // 0 o 1
  const [combatPhase, setCombatPhase] = useState<CombatPhase>('READING')
  const [readingTimeLeft, setReadingTimeLeft] = useState<number>(READING_DURATION_SECONDS)
  const [timeLeft, setTimeLeft] = useState<number>(answeringDuration)
  const [stepIndicators, setStepIndicators] = useState<[boolean | null, boolean | null]>([null, null])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isStepAnswered, setIsStepAnswered] = useState<boolean>(false)
  const [burstSummary, setBurstSummary] = useState<BurstOutcome | null>(null)

  const hasAnsweredCurrentStepRef = useRef<boolean>(false)
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickedSecond = useRef<number>(-1)
  const stepResultsRef = useRef<Array<{ selectedOption: number | null; isCorrect: boolean }>>([])

  // Pregunta activa actual (Paso 1 o Paso 2)
  const currentQuestion = burstQuestions[currentStepIndex] || burstQuestions[0]
  const questionHeadingText = currentQuestion.question || (currentQuestion as any).questionText || 'Pregunta de combate'

  // Duel header title
  const opponentNamesText = duelOpponents.length > 0 ? duelOpponents.join(', ') : 'Rival'
  const headerTitle = isDuel 
    ? `⚔️ ¡DUELO! Tú vs ${opponentNamesText}` 
    : zoneName

  // 1. Iniciar cada paso en 'READING'
  useEffect(() => {
    setCombatPhase('READING')
    setReadingTimeLeft(READING_DURATION_SECONDS)
    setTimeLeft(answeringDuration)
    setSelectedOption(null)
    setIsStepAnswered(false)
    hasAnsweredCurrentStepRef.current = false
    lastTickedSecond.current = -1

    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current)
      stepTimeoutRef.current = null
    }
  }, [currentStepIndex, answeringDuration])

  // 2. Temporizador de Fase de Lectura (3.0 segundos)
  useEffect(() => {
    if (combatPhase !== 'READING') return

    const interval = setInterval(() => {
      setReadingTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval)
          setCombatPhase('ANSWERING')
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [combatPhase, currentStepIndex])

  // 3. Temporizador de Fase de Respuesta
  useEffect(() => {
    if (combatPhase !== 'ANSWERING') return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const currentSecond = Math.ceil(prev)

        // Tick sonoro en los últimos 3 segundos (3, 2, 1)
        if (currentSecond <= 3 && currentSecond > 0 && currentSecond !== lastTickedSecond.current) {
          lastTickedSecond.current = currentSecond
          playTickSound()
        }

        if (prev <= 0.1) {
          clearInterval(interval)
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [combatPhase, currentStepIndex])

  // 4. Manejo de Timeout al llegar a 0s en Fase de Respuesta
  useEffect(() => {
    if (combatPhase === 'ANSWERING' && timeLeft <= 0 && !hasAnsweredCurrentStepRef.current) {
      handleProcessAnswer(null, false)
    }
  }, [timeLeft, combatPhase])

  // 5. Procesar Respuesta
  const handleProcessAnswer = (optionIdx: number | null, isManualClick: boolean = false) => {
    if (isSpectator || hasAnsweredCurrentStepRef.current) return
    hasAnsweredCurrentStepRef.current = true

    const isCorrect = optionIdx !== null && optionIdx === currentQuestion.correctIndex
    setSelectedOption(optionIdx)
    setIsStepAnswered(true)
    setCombatPhase('REVEAL')

    if (isCorrect) {
      playChimeSound()
    } else {
      playBuzzSound()
    }

    setStepIndicators((prev) => {
      const copy: [boolean | null, boolean | null] = [...prev]
      copy[currentStepIndex] = isCorrect
      return copy
    })

    stepResultsRef.current[currentStepIndex] = { selectedOption: optionIdx, isCorrect }

    // Pausa dramática de 2.0s de revelación antes de avanzar
    stepTimeoutRef.current = setTimeout(() => {
      if (currentStepIndex === 0 && burstQuestions.length > 1) {
        setCurrentStepIndex(1)
      } else {
        finalizeBurstCombat()
      }
    }, 2000)
  }

  // 6. Evaluación de la Matriz de Ráfaga de 2 Preguntas
  const finalizeBurstCombat = () => {
    const r1 = stepResultsRef.current[0]?.isCorrect || false
    const r2 = stepResultsRef.current[1]?.isCorrect || false
    const correctCount = (r1 ? 1 : 0) + (r2 ? 1 : 0)

    const { damage: baseDamage, healing: baseHealing } = calculateDamageOrHealing(
      difficultyMode,
      categoryKey,
      zoneId,
      correctCount === 2
    )

    let finalDamage = 0
    let finalHealing = 0
    let outcomeType: 'double_success' | 'tie' | 'double_fail' = 'tie'

    if (correctCount === 2) {
      finalDamage = 0
      finalHealing = baseHealing
      outcomeType = 'double_success'

      if (localPlayerId && zoneId) {
        recordPlayerZoneOutcome(localPlayerId, zoneId, true, completedZones)
      }
      if (localPlayerId && finalHealing > 0) {
        applyPlayerHealing(localPlayerId, finalHealing, localPlayerHp)
      }
    } else if (correctCount === 1) {
      finalDamage = Math.round(baseDamage * (isDuel ? 1.5 : 1))
      finalHealing = 0
      outcomeType = 'tie'

      if (localPlayerId && zoneId) {
        recordPlayerZoneOutcome(localPlayerId, zoneId, false, completedZones)
      }
      if (localPlayerId && finalDamage > 0) {
        applyPlayerDamage(localPlayerId, finalDamage)
      }
    } else {
      finalDamage = Math.round((baseDamage * 2) * (isDuel ? 1.5 : 1))
      finalHealing = 0
      outcomeType = 'double_fail'

      if (localPlayerId && zoneId) {
        recordPlayerZoneOutcome(localPlayerId, zoneId, false, completedZones)
      }
      if (localPlayerId && finalDamage > 0) {
        applyPlayerDamage(localPlayerId, finalDamage)
      }
    }

    const outcome: BurstOutcome = {
      correctCount,
      finalDamage,
      healing: finalHealing,
      outcomeType,
      isDuelDamage: isDuel && correctCount < 2
    }
    setBurstSummary(outcome)

    if (onAnswer) {
      onAnswer(null, correctCount === 2, finalDamage, finalHealing)
    }
    if (roomPin && currentPlayerName) {
      sendPlayerAnswered(roomPin, currentPlayerName)
    }

    finalTransitionTimeoutRef.current = setTimeout(() => {
      if (onClose) {
        onClose()
      }
    }, 2200)
  }

  // Cleanup de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
      if (finalTransitionTimeoutRef.current) clearTimeout(finalTransitionTimeoutRef.current)
    }
  }, [])

  const alivePlayersList = players.filter((p: any) => (p.hp ?? 100) > 0)
  const isAllReady = allPlayersAnswered || (totalPlayers > 0 && playersAnswered >= totalPlayers)
  const isCurrentChoiceCorrect = selectedOption === currentQuestion.correctIndex

  return (
    <div className="w-full min-h-[540px] sm:min-h-[580px] flex flex-col justify-between p-2.5 sm:p-4 relative font-sans select-none animate-in fade-in duration-300">
      
      {/* 1. HUD SUPERIOR PREMIUM (Clean & Glassmorphism) */}
      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-2">
          
          {/* Izquierda: Ráfaga (círculos luminosos) y Salud HP */}
          <div className="flex items-center gap-3">
            {/* 2 círculos luminosos de ráfaga */}
            <div className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-full border transition-all ${
                stepIndicators[0] === true
                  ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                  : stepIndicators[0] === false
                  ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : currentStepIndex === 0
                  ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                  : 'bg-white/5 border-white/20'
              }`} />
              <div className={`w-3.5 h-3.5 rounded-full border transition-all ${
                stepIndicators[1] === true
                  ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                  : stepIndicators[1] === false
                  ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : currentStepIndex === 1
                  ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse'
                  : 'bg-white/5 border-white/20'
              }`} />
            </div>

            {/* Salud HP fina */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">{localPlayerHp} HP</span>
            </div>
          </div>

          {/* Centro: Badge de Zona / Duelo */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 truncate max-w-[140px]">
            {isDuel ? <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0" /> : <CategoryIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="truncate">{headerTitle}</span>
          </div>

          {/* Derecha: Reloj Gigante */}
          <div className="flex items-center gap-1.5">
            {combatPhase === 'READING' ? (
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Lectura
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-indigo-300 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">
                  {Math.ceil(readingTimeLeft)}s
                </span>
              </div>
            ) : (
              <span className={`text-3xl sm:text-4xl font-mono font-black transition-all ${
                timeLeft <= 3
                  ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse'
                  : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
              }`}>
                {Math.ceil(timeLeft)}s
              </span>
            )}
          </div>

        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL: ESPECTADOR, FASE DE LECTURA O FASE DE RESPUESTA */}
      {isSpectator ? (
        <div className="w-full max-w-md mx-auto my-auto space-y-3.5 text-center z-10 py-2">
          <div className="bg-white/[0.03] border border-white/[0.08] p-5 rounded-3xl shadow-2xl backdrop-blur-md space-y-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl animate-pulse">👁️</span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Observando el combate...
                  </h3>
                  <p className="text-[10.5px] text-white/50">
                    Supervivientes en batalla ({alivePlayersList.length})
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                💀 Espectador
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {alivePlayersList.map((p: any) => {
                const hasAnswered = Boolean(answeredMap[p.player_name])
                return (
                  <div
                    key={p.id || p.player_name}
                    className="p-2.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{p.avatar_icon || '🦊'}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block text-xs">
                          {p.player_name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {p.hp} HP
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {hasAnswered ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Ráfaga Completada
                        </span>
                      ) : (
                        <span className="bg-amber-500/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Hourglass className="w-3 h-3 animate-spin" />
                          En Ráfaga...
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : combatPhase === 'READING' ? (
        /* 3. UI DE LA FASE DE LECTURA (Focus Mode & Tensión) */
        <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center space-y-6 text-center z-10 py-6 animate-in zoom-in-95 duration-200">
          <div className="space-y-2">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full inline-block">
              📖 Fase de Lectura &bull; Pregunta {currentStepIndex + 1}/2
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] max-w-sm sm:max-w-md">
            {questionHeadingText}
          </h2>

          {/* Barra de progreso ultra-fina de 3 segundos */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                style={{ width: `${Math.max(0, Math.min(100, (readingTimeLeft / READING_DURATION_SECONDS) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Las opciones aparecerán en breve...
            </p>
          </div>
        </div>
      ) : (
        /* 4. UI DE LA FASE DE RESPUESTA Y REVELACIÓN (Opciones Premium) */
        <>
          {/* Question Statement Card */}
          <div className="w-full max-w-md mx-auto my-auto space-y-3 text-center z-10 py-2">
            
            {/* Burst Summary Banner (al terminar la pregunta 2) */}
            {burstSummary && (
              <div className="animate-in zoom-in-95 duration-200">
                {burstSummary.outcomeType === 'double_success' && (
                  <div className="bg-emerald-500/25 border-2 border-emerald-400 p-4 rounded-3xl text-emerald-200 text-xs font-black flex flex-col items-center justify-center gap-1 shadow-2xl backdrop-blur-xl ring-2 ring-emerald-400/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                      <span className="text-sm sm:text-base">¡DOBLE ACIERTO! (2/2)</span>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-bold">
                      🏆 ¡Zona Conquistada! {burstSummary.healing > 0 ? `(+${burstSummary.healing} HP)` : '(Sin Daño)'}
                    </span>
                  </div>
                )}

                {burstSummary.outcomeType === 'tie' && (
                  <div className="bg-amber-500/25 border-2 border-amber-500 p-4 rounded-3xl text-amber-100 text-xs font-black flex flex-col items-center justify-center gap-1 shadow-2xl backdrop-blur-xl ring-2 ring-amber-500/30">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-sm sm:text-base">EMPATE (1/2)</span>
                    </div>
                    <span className="text-[11px] text-amber-200 font-bold">
                      ⚠️ Zona Atrapada &bull; Daño Base (-{burstSummary.finalDamage} HP)
                    </span>
                  </div>
                )}

                {burstSummary.outcomeType === 'double_fail' && (
                  <div className="bg-rose-500/30 border-2 border-rose-500 p-4 rounded-3xl text-rose-100 text-xs font-black flex flex-col items-center justify-center gap-1 shadow-2xl backdrop-blur-xl ring-2 ring-rose-500/40">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                      <span className="text-sm sm:text-base">¡FRACASO CRÍTICO! (0/2)</span>
                    </div>
                    <span className="text-[11px] text-rose-200 font-bold">
                      💀 Zona Atrapada &bull; ¡Daño Doble x2! (-{burstSummary.finalDamage} HP)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Question Box */}
            <div className="relative bg-[#0B0F19]/60 border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md space-y-2 overflow-hidden text-left animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-amber-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  RÁFAGA: PREGUNTA {currentStepIndex + 1} DE 2
                </span>
                <span className="font-mono text-white/50">Ronda {roundNumber}</span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white leading-snug tracking-tight relative z-10">
                {questionHeadingText}
              </h2>
            </div>

          </div>

          {/* Multiple Choice Options List */}
          <footer className="w-full max-w-md mx-auto space-y-2.5 z-10">
            <div className="space-y-2">
              {currentQuestion.options.map((optionText, index) => {
                const isSelected = selectedOption === index
                const isCorrect = index === currentQuestion.correctIndex

                let buttonStyle = 'bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.08]'
                let letterStyle = 'bg-black/40 border border-white/20 text-indigo-300'
                let badgeIcon = null

                if (combatPhase === 'REVEAL') {
                  if (isCorrect) {
                    buttonStyle = 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.4)] text-emerald-100 font-black scale-[1.01]'
                    letterStyle = 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                    badgeIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                  } else if (isSelected && !isCorrect) {
                    buttonStyle = 'bg-rose-500/25 border-rose-500 ring-2 ring-rose-500/50 shadow-lg text-rose-100 font-black'
                    letterStyle = 'bg-rose-500 text-white border-rose-400 font-black'
                    badgeIcon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  } else {
                    buttonStyle = 'bg-black/40 border-white/5 text-white/30 opacity-30 pointer-events-none'
                    letterStyle = 'bg-black/60 border-white/10 text-white/20'
                  }
                } else if (isSelected) {
                  buttonStyle = 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white'
                  letterStyle = 'bg-indigo-500 text-white border-indigo-300'
                }

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleProcessAnswer(index, true)}
                    disabled={combatPhase === 'REVEAL' || isStepAnswered || burstSummary !== null}
                    className={`w-full min-h-[50px] sm:min-h-[56px] rounded-xl px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-150 active:scale-[0.98] shadow-md backdrop-blur-sm ${
                      combatPhase === 'REVEAL' || isStepAnswered || burstSummary !== null
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:scale-[1.01]'
                    } ${buttonStyle}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
                      <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-mono font-bold flex items-center justify-center shrink-0 shadow-inner ${letterStyle}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-left text-xs sm:text-sm font-extrabold truncate leading-tight">
                        {optionText}
                      </span>
                    </div>

                    {badgeIcon}
                  </button>
                )
              })}
            </div>

            {/* Live Players Answered Badge */}
            <div className="flex items-center justify-center pt-1">
              <div
                className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-2 transition-all duration-300 shadow-lg ${
                  burstSummary
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 animate-pulse'
                    : isAllReady
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40 animate-pulse'
                    : 'bg-white/[0.03] border-white/10 text-white/70'
                }`}
              >
                {burstSummary ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Calculando clasificación de la ronda...</span>
                  </>
                ) : isAllReady ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Todos los supervivientes listos!</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Supervivientes que terminaron: {playersAnswered} / {totalPlayers}</span>
                  </>
                )}
              </div>
            </div>

          </footer>
        </>
      )}

    </div>
  )
}

