'use client'

import { useState, useEffect, useRef } from 'react'
import { Crown, Heart, Trophy, Clock, Check, X, ShieldAlert, Sparkles } from 'lucide-react'
import { ActivePlayer, broadcastGameState } from '@/lib/supabase/playersService'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'

export interface LastBurstOutcome {
  damageDealt?: number
  healingDealt?: number
  isCorrect?: boolean
  correctCount?: number
}

interface RoundResultProps {
  roomPin: string
  players: ActivePlayer[]
  currentPlayerName: string
  isHost?: boolean
  roundNumber?: number
  lastBurstOutcome?: LastBurstOutcome | null
  onNextRound?: () => void
  onVictory?: (winner?: ActivePlayer, isDraw?: boolean) => void
}

const RESULT_DURATION_SECONDS = 5.0

// Helper para obtener nombre e icono de la subzona a partir de su ID
function getSubZoneDetails(zoneId?: string | null) {
  if (!zoneId) return { name: 'Sin zona', icon: '📍' }
  for (const catKey of Object.keys(GAME_CATEGORIES)) {
    const cat = GAME_CATEGORIES[catKey as CategoryKey]
    if (cat) {
      for (const lvl of cat.levels) {
        const found = lvl.subzones.find((sz) => sz.id === zoneId)
        if (found) return { name: found.name, icon: found.icon || '📍' }
      }
    }
  }
  return { name: zoneId, icon: '📍' }
}

export default function RoundResult({
  roomPin,
  players = [],
  currentPlayerName,
  isHost = false,
  roundNumber = 1,
  lastBurstOutcome,
  onNextRound,
  onVictory
}: RoundResultProps) {
  const [timeLeft, setTimeLeft] = useState<number>(RESULT_DURATION_SECONDS)
  const hasTriggeredNextRound = useRef<boolean>(false)

  // Fase 1: Evaluar supervivientes con hp > 0
  const survivors = players.filter((p) => (p.hp ?? 100) > 0)
  const isGameOver = players.length >= 2 && survivors.length <= 1
  const isDraw = isGameOver && survivors.length === 0
  const winner = isGameOver && survivors.length === 1 ? survivors[0] : undefined

  // Sort leaderboard: Supervivientes arriba por HP descendente, eliminados al fondo
  const alivePlayers = [...survivors].sort((a, b) => (b.hp ?? 100) - (a.hp ?? 100))
  const deadPlayers = [...players].filter((p) => (p.hp ?? 100) <= 0)
  const sortedPlayers = [...alivePlayers, ...deadPlayers]

  // 1. Temporizador de 5 segundos
  useEffect(() => {
    setTimeLeft(RESULT_DURATION_SECONDS)
    hasTriggeredNextRound.current = false

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval)
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // 2. Transición automatizada
  useEffect(() => {
    if (timeLeft === 0 && !hasTriggeredNextRound.current) {
      hasTriggeredNextRound.current = true

      if (isGameOver) {
        if (onVictory) {
          onVictory(winner, isDraw)
        }
        if (isHost && roomPin) {
          broadcastGameState(roomPin, 'VICTORY', { winnerPlayer: winner, isDraw })
        }
        return
      }

      if (onNextRound) {
        onNextRound()
      }

      if (isHost && roomPin) {
        broadcastGameState(roomPin, 'ZONE_SELECTION', { round_number: roundNumber + 1 })
      }
    }
  }, [timeLeft, isGameOver, winner, isDraw, onVictory, onNextRound, isHost, roomPin, roundNumber])

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / RESULT_DURATION_SECONDS) * 100))

  return (
    <div className="w-full max-w-md mx-auto bg-[#0B0F19] border border-white/10 p-4 sm:p-5 rounded-3xl shadow-2xl space-y-3.5 text-center font-sans animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      
      {/* Halo de luz superior de acento */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/20 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Cabecera Principal */}
      <div className="space-y-1 z-10 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-black text-amber-400 uppercase tracking-wider backdrop-blur-sm">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>Ronda {roundNumber} &bull; Clasificación</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400 tracking-tight">
          📊 RESULTADOS DE LA RONDA
        </h2>
        <p className="text-[11px] text-white/50 font-medium">
          Duelo táctico y estado de salud de los exploradores
        </p>
      </div>

      {/* Lista de Jugadores (Mini-Dashboards Glassmorphism) */}
      <div className="space-y-2 max-h-[330px] overflow-y-auto pr-0.5 z-10 relative text-left">
        {sortedPlayers.map((player, index) => {
          const isMe = player.player_name === currentPlayerName
          const isDead = (player.hp ?? 100) <= 0
          const rank = index + 1

          // Deducción de Estado Táctico
          const currentZoneId = player.current_zone
          const isConquered = Boolean(currentZoneId && player.completed_zones?.includes(currentZoneId))
          const isTrapped = Boolean(player.mandatory_zone && player.mandatory_zone === currentZoneId)
          const zoneDetails = getSubZoneDetails(currentZoneId)

          // Deducción de ráfaga y cambio de HP
          let correctCount = isConquered ? 2 : isTrapped ? 1 : 0
          let hpDiffBadge: string | null = null

          if (isMe && lastBurstOutcome) {
            if (lastBurstOutcome.correctCount !== undefined) {
              correctCount = lastBurstOutcome.correctCount
            } else if (lastBurstOutcome.isCorrect) {
              correctCount = 2
            }
            if ((lastBurstOutcome.damageDealt ?? 0) > 0) {
              hpDiffBadge = `-${lastBurstOutcome.damageDealt} HP`
            } else if ((lastBurstOutcome.healingDealt ?? 0) > 0) {
              hpDiffBadge = `+${lastBurstOutcome.healingDealt} HP`
            }
          }

          return (
            <div
              key={player.id || index}
              className={`rounded-xl p-3 flex flex-col gap-2 shadow-lg backdrop-blur-md transition-all border ${
                isDead
                  ? 'bg-black/40 border-white/5 grayscale opacity-50 shadow-inner'
                  : isMe
                  ? 'bg-white/[0.06] border-indigo-500/40 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-white/[0.03] border-white/[0.08]'
              }`}
            >
              {/* FILA SUPERIOR: IDENTIDAD Y SALUD */}
              <div className="flex items-center justify-between gap-2">
                {/* Izquierda: Avatar y Nombre */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-base shrink-0 shadow-inner">
                    {isDead ? '💀' : player.avatar_icon || '🦊'}
                  </div>

                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className={`text-xs sm:text-sm font-black truncate ${isDead ? 'line-through text-white/40' : 'text-white'}`}>
                      {player.player_name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                        Tú
                      </span>
                    )}
                    {rank === 1 && !isDead && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Derecha: HP Actual y Diferencia */}
                <div className="flex items-center gap-2 shrink-0">
                  {hpDiffBadge && (
                    <span className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse ${
                      hpDiffBadge.startsWith('+')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {hpDiffBadge}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Heart className={`w-3.5 h-3.5 ${isDead ? 'text-gray-500 fill-gray-500' : 'text-rose-500 fill-rose-500'}`} />
                    <span className={`font-mono text-xs sm:text-sm font-black ${isDead ? 'text-white/40' : 'text-emerald-400'}`}>
                      {player.hp ?? 0} HP
                    </span>
                  </div>
                </div>
              </div>

              {/* FILA INFERIOR: ANALÍTICA Y CONSECUENCIA TÁCTICA */}
              <div className="flex items-center justify-between w-full pt-1.5 border-t border-white/5 text-xs">
                {isDead ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10.5px] text-white/40 italic">
                      Vagando como espectador...
                    </span>
                    <span className="bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full text-[9.5px] font-black">
                      💀 ELIMINADO
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Rendimiento en Ráfaga: Zona + Aciertos */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-white/70 truncate flex items-center gap-1 font-bold">
                        <span>{zoneDetails.icon}</span>
                        <span className="truncate max-w-[90px] sm:max-w-[120px]">{zoneDetails.name}</span>
                      </span>

                      {/* Aciertos [✅][✅] */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span className="text-[10px]">
                          {correctCount >= 1 ? '✅' : '❌'}
                        </span>
                        <span className="text-[10px]">
                          {correctCount === 2 ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>

                    {/* Estado Táctico Destino */}
                    <div className="shrink-0">
                      {isConquered ? (
                        <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-wider shadow-sm flex items-center gap-1">
                          🚀 AVANZA
                        </span>
                      ) : (
                        <span className="bg-rose-500/15 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-wider shadow-sm flex items-center gap-1">
                          ⚠️ ATRAPADO
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>
          )
        })}
      </div>

      {/* Temporizador y Barra de Progreso Automatizada */}
      <div className="w-full space-y-1.5 pt-1.5 z-10 border-t border-white/10 relative">
        <div className="flex items-center justify-between text-xs font-bold px-1 text-white/70">
          <span className="flex items-center gap-1.5 text-amber-300 text-[11px]">
            <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
            {isDraw
              ? 'Muerte Súbita Inminente'
              : isGameOver
              ? 'Proclamando Ganador...'
              : 'Volviendo al Mapa'}
          </span>
          <span className="font-mono text-xs font-black text-emerald-400">
            {timeLeft.toFixed(1)}s
          </span>
        </div>

        {/* Barra ultra-fina */}
        <div className="w-full h-1.5 bg-black/50 border border-white/10 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(99,102,241,0.8)] ${
              isDraw
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : isGameOver
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                : 'bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[10px] text-white/40 font-medium">
          {isGameOver
            ? `Transicionando a la Pantalla de Victoria en ${Math.ceil(timeLeft)}s...`
            : `Siguiente asalto en ${Math.ceil(timeLeft)}s. No se requiere pulsar nada.`}
        </p>
      </div>

    </div>
  )
}

