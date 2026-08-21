'use client'

import { useState, useEffect } from 'react'
import { Trophy, Crown, RefreshCw, LogOut, Heart, Swords, Skull, Sparkles, Flame, ShieldAlert, Award } from 'lucide-react'
import { ActivePlayer, broadcastGameState, resetRoomForRematch, leaveRoom } from '@/lib/supabase/playersService'
import { playVictoryFanfare } from '@/lib/soundService'
import { useRouter } from 'next/navigation'

interface VictoryRoyaleProps {
  roomPin: string
  winner?: ActivePlayer | null
  isDraw?: boolean
  players: ActivePlayer[]
  currentPlayerName: string
  isHost?: boolean
  roundNumber?: number
  onPlayAgain?: () => void
}

export default function VictoryRoyale({
  roomPin,
  winner,
  isDraw = false,
  players = [],
  currentPlayerName,
  isHost = false,
  roundNumber = 1,
  onPlayAgain
}: VictoryRoyaleProps) {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState<boolean>(false)

  // Play fanfare sound upon mounting
  useEffect(() => {
    playVictoryFanfare()
  }, [])

  // Sort players for the final definitive leaderboard
  const alivePlayers = [...players].filter((p) => (p.hp ?? 100) > 0).sort((a, b) => b.hp - a.hp)
  const deadPlayers = [...players].filter((p) => (p.hp ?? 100) <= 0)
  const sortedPlayers = [...alivePlayers, ...deadPlayers]

  // Host Action: Trigger Rematch (Mass database reset + broadcast LOBBY)
  const handleHostRematch = async () => {
    if (!isHost || isResetting || !roomPin) return
    setIsResetting(true)

    try {
      // 1. Reset Supabase database records
      await resetRoomForRematch(roomPin)

      // 2. Broadcast LOBBY state to all connected clients
      broadcastGameState(roomPin, 'LOBBY', { round_number: 1 })

      // 3. Trigger local reset handler
      if (onPlayAgain) {
        onPlayAgain()
      }
    } catch (err) {
      console.error('[VictoryRoyale] Error during rematch reset:', err)
    } finally {
      setIsResetting(false)
    }
  }

  const handleExitGame = async () => {
    if (currentPlayerName && roomPin) {
      await leaveRoom(roomPin, currentPlayerName, isHost)
    }
    router.push('/')
  }

  const isLocalWinner = Boolean(winner && winner.player_name === currentPlayerName)

  return (
    <div className="w-full max-w-md mx-auto space-y-4 text-center font-sans animate-in zoom-in-95 duration-500 relative select-none">
      
      {/* Background Golden Glow & Ambience */}
      <div className="absolute -top-28 -left-28 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-28 -right-28 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* 1. HERO VICTORY CARD */}
      <div className={`p-6 sm:p-7 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-4 relative overflow-hidden border ${
        isDraw
          ? 'bg-slate-900/95 border-rose-500/60 shadow-rose-950/50'
          : 'bg-gradient-to-b from-slate-900/95 via-amber-950/40 to-slate-900/95 border-amber-400/60 shadow-amber-900/40'
      }`}>
        
        {/* Animated Trophy / Crown Header */}
        <div className="flex justify-center">
          {isDraw ? (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center text-3xl shadow-xl animate-bounce">
              💀
            </div>
          ) : (
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-3xl shadow-2xl animate-bounce">
                👑
              </div>
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-spin" />
            </div>
          )}
        </div>

        {/* Title & Winner Name */}
        <div className="space-y-1 z-10">
          <span className={`text-xs font-black uppercase tracking-widest ${
            isDraw ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {isDraw ? 'MUERTE SÚBITA SIMULTÁNEA' : '¡VICTORIA ROYALE!'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {isDraw ? '¡Aniquilación Total!' : winner?.player_name || 'Gran Campeón'}
          </h2>

          <p className="text-xs text-slate-300 font-medium max-w-xs mx-auto">
            {isDraw
              ? 'Todos los exploradores han caído en combate. ¡Empate final!'
              : isLocalWinner
              ? '¡Enhorabuena! Has conquistado el mapa y sobrevivido a todos tus rivales.'
              : `¡El explorador ${winner?.player_name} se corona como el único superviviente!`}
          </p>
        </div>

        {/* Big Avatar Display */}
        {!isDraw && winner && (
          <div className="py-1">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 shadow-inner">
              <span className="text-5xl animate-in zoom-in-75 duration-300">
                {winner.avatar_icon || '🦊'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 2. FINAL DEFINITIVE LEADERBOARD */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl backdrop-blur-xl space-y-3 text-left">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Clasificación Final</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Ronda {roundNumber} &bull; {players.length} Jugadores
          </span>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {sortedPlayers.map((player, index) => {
            const isMe = player.player_name === currentPlayerName
            const isDead = (player.hp ?? 100) <= 0
            const isFirst = index === 0 && !isDraw

            return (
              <div
                key={player.id || index}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 text-xs shadow-sm ${
                  isFirst
                    ? 'bg-amber-500/15 border-amber-400/50 ring-1 ring-amber-400/30'
                    : isDead
                    ? 'bg-slate-950/80 border-slate-900 opacity-60 grayscale'
                    : isMe
                    ? 'bg-emerald-500/15 border-emerald-500/50'
                    : 'bg-slate-950/90 border-slate-800'
                }`}
              >
                {/* Rank & Avatar */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                    {isFirst ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    ) : isDead ? (
                      <span>💀</span>
                    ) : (
                      <span className="text-slate-400">#{index + 1}</span>
                    )}
                  </div>

                  <span className="text-base shrink-0">{isDead ? '💀' : player.avatar_icon || '🦊'}</span>

                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1">
                      <span className={`font-black truncate text-xs ${isDead ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {player.player_name}
                      </span>
                      {isMe && (
                        <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded-full">
                          Tú
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* HP / Status Badge */}
                <div className="shrink-0">
                  {isDead ? (
                    <span className="text-[9.5px] font-mono font-black bg-rose-950/80 text-rose-400 border border-rose-600/40 px-2 py-0.5 rounded-full">
                      Eliminado
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 shrink-0" />
                      <span>{player.hp} HP</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. HOST REMATCH CONTROLS & EXIT BUTTON */}
      <div className="space-y-2 pt-1">
        {isHost ? (
          <button
            type="button"
            onClick={handleHostRematch}
            disabled={isResetting}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Reiniciando Sala...' : '🔄 Jugar Revancha (Volver al Lobby)'}</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Esperando a que el Anfitrión inicie la revancha...</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleExitGame}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-black text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Salir al Menú Principal</span>
        </button>
      </div>

    </div>
  )
}
