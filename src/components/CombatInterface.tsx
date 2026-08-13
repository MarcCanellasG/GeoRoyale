'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, CheckCircle2, XCircle, MapPin, Users, Hourglass, Sparkles } from 'lucide-react'
import { Question } from '@/config/questionBank'
import { playTickSound, playTapSound, playChimeSound, playBuzzSound } from '@/lib/soundService'

interface CombatInterfaceProps {
  question: Question
  zoneName?: string
  duration?: number // Duración compartida en segundos (por defecto 10)
  playersAnswered?: number // Número de jugadores que han respondido
  totalPlayers?: number // Total de jugadores en la sala
  allPlayersAnswered?: boolean // Indicador multijugador si todos respondieron antes del tiempo
  onAnswer?: (selectedIndex: number | null, isCorrect: boolean) => void
  onClose?: () => void
}

export default function CombatInterface({
  question,
  zoneName = 'Archipiélago Físico',
  duration = 10,
  playersAnswered = 1,
  totalPlayers = 4,
  allPlayersAnswered = false,
  onAnswer,
  onClose
}: CombatInterfaceProps) {
  const [timeLeft, setTimeLeft] = useState<number>(duration)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const hasTriggeredCallback = useRef<boolean>(false)
  const lastTickedSecond = useRef<number>(-1)

  // Cuenta atrás global síncrona (ticks de 100ms) - Con reproducción de SFX en los últimos 3s
  useEffect(() => {
    setTimeLeft(duration)
    setSelectedOption(null)
    setIsAnswered(false)
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
  }, [question, duration])

  // La ronda finaliza cuando el reloj llega a 0 O cuando TODOS los jugadores han respondido
  useEffect(() => {
    const isRoundComplete = timeLeft === 0 || allPlayersAnswered || playersAnswered >= totalPlayers

    if (isRoundComplete && !hasTriggeredCallback.current) {
      hasTriggeredCallback.current = true

      const isCorrect = selectedOption !== null && selectedOption === question.correctIndex

      // Reproducir Chime (acierto) o Buzz (error)
      if (isCorrect) {
        playChimeSound()
      } else {
        playBuzzSound()
      }

      // Breve pausa final de 0.8s para cerrar sincronizadamente
      const timer = setTimeout(() => {
        if (onAnswer) {
          onAnswer(selectedOption, isCorrect)
        }
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [timeLeft, allPlayersAnswered, playersAnswered, totalPlayers, selectedOption, question.correctIndex, onAnswer])

  // Selección instantánea y definitiva para este jugador
  const handleSelectOption = (index: number) => {
    if (isAnswered || hasTriggeredCallback.current) return // Bloqueado: no se puede cambiar la respuesta

    playTapSound() // SFX Tap
    setSelectedOption(index)
    setIsAnswered(true)

    // Reproducir feedback de audio inmediato para este jugador
    if (index === question.correctIndex) {
      playChimeSound()
    } else {
      playBuzzSound()
    }
  }

  // Porcentaje del tiempo restante para la barra
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / duration) * 100))

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
              <span>RELOJ DE RONDA (COMPARTIDO)</span>
            </div>
            <span className={`font-mono text-sm font-black ${progressPercent <= 20 ? 'text-rose-400' : 'text-slate-200'}`}>
              {Math.ceil(timeLeft)}s
            </span>
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
          
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black tracking-wider uppercase">
            Desafío Royale
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-100 leading-snug tracking-tight">
            {question.question}
          </h2>

          {/* Multiplayer Status Message */}
          <div className="pt-1">
            {isAnswered ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 animate-in fade-in">
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>Respuesta registrada. Esperando a que finalice la ronda...</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium">
                Toca tu respuesta definitiva. El reloj continuará hasta llegar a 0s.
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

            if (isAnswered) {
              if (isCorrect) {
                // Opción correcta en verde
                buttonStyle = 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black ring-2 ring-emerald-400/40 shadow-lg scale-[1.01]'
                badgeIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-in zoom-in" />
              } else if (isSelected && !isCorrect) {
                // Opción errónea en rojo
                buttonStyle = 'bg-rose-500/25 border-rose-500 text-rose-300 font-black ring-2 ring-rose-500/40'
                badgeIcon = <XCircle className="w-5 h-5 text-rose-400 shrink-0 animate-in zoom-in" />
              } else {
                // Opciones neutras no elegidas
                buttonStyle = 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-40'
              }
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectOption(index)}
                disabled={isAnswered}
                className={`w-full min-h-[56px] h-14 rounded-2xl px-5 border text-sm sm:text-base font-extrabold flex items-center justify-between transition-all duration-150 active:scale-[0.98] shadow-md ${
                  isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${buttonStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-7 h-7 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
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
              disabled={isAnswered}
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
