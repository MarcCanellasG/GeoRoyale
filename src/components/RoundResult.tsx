'use client'

import { Crown, Heart, Play, ShieldCheck, Trophy, Users, ArrowRight, Sparkles, Navigation } from 'lucide-react'
import { ActivePlayer, broadcastGameState } from '@/lib/supabase/playersService'

interface RoundResultProps {
  roomPin: string
  players: ActivePlayer[]
  currentPlayerName: string
  isHost?: boolean
  onNextRound?: () => void
}

export default function RoundResult({
  roomPin,
  players = [],
  currentPlayerName,
  isHost = false,
  onNextRound
}: RoundResultProps) {
  // Sort leaderboard by HP descending (highest HP first)
  const sortedPlayers = [...players].sort((a, b) => b.hp - a.hp)

  const handleNextAssaultClick = () => {
    if (onNextRound) {
      onNextRound()
    }
    broadcastGameState(roomPin, 'ZONE_SELECTION')
  }

  return (
    <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-5 text-center font-sans animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="space-y-1.5 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-xs font-black text-amber-400 uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Clasificación de Ronda</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          ¡Ronda Finalizada!
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Estado actual de la sala y puntos de vida (HP) de los competidores
        </p>
      </div>

      {/* Leaderboard Grid */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 z-10">
        {sortedPlayers.map((player, index) => {
          const isMe = player.player_name === currentPlayerName
          const rank = index + 1

          return (
            <div
              key={player.id || index}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isMe
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              {/* Rank & Avatar */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-black flex items-center justify-center shrink-0">
                  {rank === 1 ? (
                    <Crown className="w-4 h-4 text-amber-400 fill-current" />
                  ) : (
                    <span className="text-slate-400">#{rank}</span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                  {player.avatar_icon || '🦊'}
                </div>

                <div className="text-left truncate min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-100 truncate">
                      {player.player_name}
                    </h4>
                    {isMe && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                        Tú
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {player.current_zone ? `Zona: ${player.current_zone}` : 'Sin zona'}
                  </span>
                </div>
              </div>

              {/* HP Bar */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full"
                    style={{ width: `${player.hp}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-200 w-12 text-right">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                  <span>{player.hp}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Footer Button / Host Action */}
      <div className="pt-2 z-10">
        {isHost ? (
          <button
            onClick={handleNextAssaultClick}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-sm rounded-3xl shadow-xl hover:shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play className="w-4.5 h-4.5 fill-current" />
            <span>Siguiente Asalto (Volver al Mapa)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>Esperando a que el Anfitrión inicie el Siguiente Asalto...</span>
          </div>
        )}
      </div>

    </div>
  )
}
