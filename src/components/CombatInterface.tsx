'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, CheckCircle2, XCircle, MapPin, Users, Hourglass, Sparkles, Check, ArrowRight, Flame, Heart } from 'lucide-react'
import { Question } from '@/config/questionBank'
import { DIFFICULTY_SETTINGS, DifficultyMode, calculateDamageOrHealing } from '@/config/gameConfig'
import { playTickSound, playTapSound, playChimeSound, playBuzzSound } from '@/lib/soundService'
import { broadcastGameState, applyPlayerDamage, applyPlayerHealing } from '@/lib/supabase/playersService'

interface CombatInterfaceProps {
  question: Question
  zoneName?: string
  zoneId?: string
  categoryKey?: string
  localPlayerId?: string
  localPlayerHp?: number
  difficultyMode?: DifficultyMode
  roomPin?: string
  isHost?: boolean
  duration?: number // Opcional, si no se indica usa el del difficultyMode
  playersAnswered?: number
  totalPlayers?: number
  allPlayersAnswered?: boolean
  onAnswer?: (selectedIndex: number | null, isCorrect: boolean, damageDealt: number, healingDealt: number) => void
  onClose?: () => void
}

export default function CombatInterface({
  question,
  zoneName = 'Archipiélago Físico',
  zoneId = 'archipielago-fisico',
  categoryKey = 'geografia',
  localPlayerId,
  localPlayerHp = 100,
  difficultyMode = 'normal',
  roomPin,
  isHost = false,
  duration,
  playersAnswered = 1,
  totalPlayers = 4,
  allPlayersAnswered = false,
  onAnswer,
  onClose
}: CombatInterfaceProps) {
  // Extraer configuración según el modo de dificultad (10s Normal / 7s Hardcore)
  const diffConfig = DIFFICULTY_SETTINGS[difficultyMode] || DIFFICULTY_SETTINGS.normal
  const activeDuration = duration || diffConfig.timer

  const [timeLeft, setTimeLeft] = useState<number>(activeDuration)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [isRevealed, setIsRevealed] = useState<boolean>(false)
  const [resultOutcome, setResultOutcome] = useState<{ damage: number; healing: number }>({ damage: 0, healing: 0 })

  const hasTriggeredCallback = useRef<boolean>(false)
  const lastTickedSecond = useRef<number>(-1)

  // 1. Cuenta atrás síncrona según el temporizador configurado (10s o 7s)
  useEffect(() => {
    setTimeLeft(activeDuration)
    setSelectedOption(null)
    setIsAnswered(false)
    setIsRevealed(false)
    hasTriggeredCallback.current = false
    lastTickedSecond.current = -1

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const currentSecond = Math.ceil(prev)

        // Reproducir sonido de Tick en los últimos 3 segundos (3, 2, 1)
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
  }, [question, activeDuration])

  // 2. Revelar resultados a 0s y aplicar daño o curación según el modo de dificultad elegido
  useEffect(() => {
    const isRoundComplete = timeLeft === 0 || allPlayersAnswered || playersAnswered >= totalPlayers

    if (isRoundComplete && !hasTriggeredCallback.current) {
      hasTriggeredCallback.current = true
      setIsRevealed(true)

      const isCorrect = selectedOption !== null && selectedOption === question.correctIndex
      const outcome = calculateDamageOrHealing(difficultyMode, categoryKey, zoneId, isCorrect)
      setResultOutcome(outcome)

      // Reproducir Chime (acierto) o Buzz (error) al revelar la respuesta correcta a 0s
      if (isCorrect) {
        playChimeSound()

        // Si acierta y hay curación configurada en esta zona/dificultad, invocar curación en Supabase
        if (localPlayerId && outcome.healing > 0) {
          applyPlayerHealing(localPlayerId, outcome.healing, localPlayerHp)
        }
      } else {
        playBuzzSound()

        // Si falla, invocar la RPC apply_damage en Supabase con el daño configurado
        if (localPlayerId && outcome.damage > 0) {
          applyPlayerDamage(localPlayerId, outcome.damage)
        }
      }

      // Tras 3.5 segundos de mostrar la revelación brillante, emitir broadcast y transicionar
      const timer = setTimeout(() => {
        if (roomPin) {
          broadcastGameState(roomPin, 'ROUND_RESULT')
        }

        if (onAnswer) {
          onAnswer(selectedOption, isCorrect, outcome.damage, outcome.healing)
        }
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [timeLeft, allPlayersAnswered, playersAnswered, totalPlayers, selectedOption, question.correctIndex, difficultyMode, categoryKey, zoneId, localPlayerId, localPlayerHp, roomPin, isHost, onAnswer])

  // Direct manual trigger to prevent hanging if Realtime broadcast is delayed
  const handleForceFinish = () => {
    const isCorrect = selectedOption !== null && selectedOption === question.correctIndex
    const outcome = calculateDamageOrHealing(difficultyMode, categoryKey, zoneId, isCorrect)
    if (roomPin) {
      broadcastGameState(roomPin, 'ROUND_RESULT')
    }
    if (onAnswer) {
      onAnswer(selectedOption, isCorrect, outcome.damage, outcome.healing)
    }
  }

  // 3. Registrar selección local táctil sin revelar corrección verde/roja hasta llegar a cero
  const handleSelectOption = (index: number) => {
    if (isAnswered || isRevealed || hasTriggeredCallback.current) return

    playTapSound()
    setSelectedOption(index)
    setIsAnswered(true)
  }

  // Porcentaje del tiempo restante para la barra
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / activeDuration) * 100))

  // Color de la barra de tiempo (Verde -> Amarillo -> Rojo)
  const getProgressBarColor = () => {
    if (progressPercent > 50) return 'bg-emerald-400'
    if (progressPercent > 20) return 'bg-amber-400'
    return 'bg-rose-500 animate-pulse'
  }

  const isAllReady = playersAnswered >= totalPlayers || allPlayersAnswered

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none font-sans animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & TIMED SYNCHRONIZED BAR */}
      <div className="w-full max-w-md mx-auto space-y-3 z-10">
        
        {/* Progress Bar Container */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black px-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className={`w-4 h-4 ${progressPercent <= 20 ? 'text-rose-400 animate-spin-slow' : 'text-amber-400'}`} />
              <span>RELOJ DE RONDA ({diffConfig.name.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-2">
              {difficultyMode === 'hard' && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400" /> Hardcore (7s)
                </span>
              )}
              <span className={`font-mono text-sm font-black ${progressPercent <= 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                {Math.ceil(timeLeft)}s
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${getProgressBarColor()}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Zone Header Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-slate-300">Zona: <span className="text-emerald-400 font-extrabold">{zoneName}</span></span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
            <Users className="w-3 h-3" /> Ronda Multijugador
          </span>
        </div>

      </div>

      {/* 2. CENTER QUESTION CONTAINER */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-3 z-10">
        <div className="w-full bg-slate-900/95 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4 text-center relative overflow-hidden">
          
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black tracking-wider uppercase">
              Desafío Royale
            </div>
            {difficultyMode === 'hard' && (
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black tracking-wider uppercase">
                ⚡ Hardcore
              </div>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-100 leading-snug tracking-tight">
            {question.question}
          </h2>

          {/* Outcome & Multiplayer Status Message */}
          <div className="pt-1 flex flex-col items-center gap-2">
            {isRevealed ? (
              <>
                {resultOutcome.healing > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black animate-bounce">
                    <Heart className="w-3.5 h-3.5 fill-current text-emerald-400" />
                    <span>¡+ {resultOutcome.healing} HP de Curación!</span>
                  </div>
                )}
                {resultOutcome.damage > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs font-black animate-pulse">
                    <span>¡- {resultOutcome.damage} HP de Daño!</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>¡Respuesta revelada! Cambiando a la Clasificación en 3.5s...</span>
                </div>
                <button
                  type="button"
                  onClick={handleForceFinish}
                  className="mt-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                  <span>Ir a Clasificación ahora</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            ) : isAnswered ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 animate-in fade-in">
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>Respuesta registrada. Esperando a que el reloj llegue a 0s...</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium">
                Toca tu opción. La corrección se revelará al agotarse los {activeDuration} segundos.
              </p>
            )}
          </div>

        </div>
      </main>

      {/* 3. BOTTOM ANSWER OPTIONS & LIVE PLAYERS BADGE */}
      <footer className="w-full max-w-md mx-auto space-y-3 z-10 pb-2">
        <div className="flex flex-col space-y-2.5 w-full">
          {question.options.map((optionText, index) => {
            const isSelected = selectedOption === index
            const isCorrect = index === question.correctIndex

            let buttonStyle = 'bg-slate-900/90 border-slate-800/90 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
            let badgeIcon = null

            if (isRevealed) {
              // Revelación brillante al llegar a cero (Verde para la correcta, Rojo para la incorrecta elegida)
              if (isCorrect) {
                buttonStyle = 'bg-green-500 text-white font-black animate-pulse shadow-xl ring-4 ring-green-400/50 scale-[1.02]'
                badgeIcon = <CheckCircle2 className="w-5 h-5 text-white shrink-0 animate-in zoom-in" />
              } else if (isSelected && !isCorrect) {
                buttonStyle = 'bg-red-500 text-white font-black ring-4 ring-red-500/50'
                badgeIcon = <XCircle className="w-5 h-5 text-white shrink-0 animate-in zoom-in" />
              } else {
                buttonStyle = 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-30'
              }
            } else if (isAnswered) {
              // Registrado antes de llegar a cero (sin revelar verde/rojo todavía)
              if (isSelected) {
                buttonStyle = 'bg-amber-500/20 border-amber-400 text-amber-300 font-black ring-2 ring-amber-400/40'
                badgeIcon = <Check className="w-5 h-5 text-amber-400 shrink-0" />
              } else {
                buttonStyle = 'bg-slate-950/60 border-slate-900 text-slate-500 opacity-50'
              }
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectOption(index)}
                disabled={isAnswered || isRevealed}
                className={`w-full min-h-[56px] h-14 rounded-2xl px-5 border text-sm sm:text-base font-extrabold flex items-center justify-between transition-all duration-150 active:scale-[0.98] shadow-md ${
                  isAnswered || isRevealed ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${buttonStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className={`w-7 h-7 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                    isRevealed && isCorrect ? 'bg-white/20 text-white' : 'bg-slate-950/80 border border-slate-800'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-left truncate">{optionText}</span>
                </div>

                {badgeIcon}
              </button>
            )
          })}
        </div>

        {/* 4. LIVE PLAYERS ANSWERED BADGE */}
        <div className="flex items-center justify-center pt-1">
          <div
            className={`px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all duration-300 shadow-md ${
              isAllReady
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40 animate-pulse'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            {isAllReady ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>¡Todos listos!</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-amber-400" />
                <span>{playersAnswered}/{totalPlayers} jugadores listos</span>
              </>
            )}
          </div>
        </div>

        {/* Optional Manual Close / Cancel */}
        {onClose && (
          <div className="pt-0.5 text-center">
            <button
              onClick={onClose}
              disabled={isAnswered || isRevealed}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-300 underline transition-colors disabled:opacity-30"
            >
              Cancelar Desafío
            </button>
          </div>
        )}
      </footer>

    </div>
  )
}
