'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Globe, Users, Copy, Check, LogOut, ShieldCheck, Heart, Crown, Play, RefreshCw, Compass, Gamepad2, Smile, Sparkles } from 'lucide-react'
import { getPlayersInRoom, subscribeToRoomPlayers, leaveRoom, sendRoomEmote, subscribeToRoomEmotes, ActivePlayer, EmoteEvent } from '@/lib/supabase/playersService'
import { GAME_CONFIG } from '@/config/gameConfig'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'
import GameMap from '@/components/GameMap'

type ActiveTab = 'players' | 'map'

const QUICK_EMOTES = ['🔥', '😂', '🎉', '👏', '🏆', '😱', '💪', '💩']

export default function RoomPage() {
  const params = useParams()
  const roomPin = (params?.pin as string) || '0000'
  const router = useRouter()

  const [players, setPlayers] = useState<ActivePlayer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('players')
  const [roomCategory, setRoomCategory] = useState<CategoryKey>('geografia')

  // Active floating emotes map: targetPlayerName -> array of active floating emotes
  const [floatingEmotes, setFloatingEmotes] = useState<Record<string, { id: string; emote: string; sender: string }[]>>({})

  // Emote menu open state per player
  const [activeEmoteMenuPlayer, setActiveEmoteMenuPlayer] = useState<string | null>(null)

  const activeCategoryInfo = GAME_CATEGORIES[roomCategory] || GAME_CATEGORIES.geografia
  const currentTheme = activeCategoryInfo.theme

  useEffect(() => {
    // Retrieve stored player name from session/local storage
    const savedName = localStorage.getItem('geo_royale_current_player') || 'Jugador'
    setCurrentPlayerName(savedName)

    // Initial load of players in this room
    async function loadPlayers() {
      setLoading(true)
      const data = await getPlayersInRoom(roomPin)
      setPlayers(data)
      if (data && data.length > 0 && data[0].category_key) {
        setRoomCategory(data[0].category_key as CategoryKey)
      }
      setLoading(false)
    }

    loadPlayers()

    // Subscribe to realtime updates for active_players in this PIN
    const unsubscribePlayers = subscribeToRoomPlayers(roomPin, (updatedPlayers) => {
      setPlayers(updatedPlayers)
      if (updatedPlayers && updatedPlayers.length > 0 && updatedPlayers[0].category_key) {
        setRoomCategory(updatedPlayers[0].category_key as CategoryKey)
      }
    })

    // Subscribe to realtime floating emotes
    const unsubscribeEmotes = subscribeToRoomEmotes(roomPin, (emoteData: EmoteEvent) => {
      const emoteId = `e_${Date.now()}_${Math.random()}`
      setFloatingEmotes((prev) => {
        const existing = prev[emoteData.targetName] || []
        return {
          ...prev,
          [emoteData.targetName]: [...existing, { id: emoteId, emote: emoteData.emote, sender: emoteData.senderName }]
        }
      })

      // Auto-remove floating emote after 2.5 seconds
      setTimeout(() => {
        setFloatingEmotes((prev) => {
          const existing = prev[emoteData.targetName] || []
          return {
            ...prev,
            [emoteData.targetName]: existing.filter((item) => item.id !== emoteId)
          }
        })
      }, 2500)
    })

    // Handle tab / window closing auto-leave
    const handleUnload = () => {
      if (savedName && roomPin) {
        leaveRoom(roomPin, savedName)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleUnload)
    }

    return () => {
      unsubscribePlayers()
      unsubscribeEmotes()
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleUnload)
      }
    }
  }, [roomPin])

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(roomPin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveRoom = async () => {
    if (currentPlayerName && roomPin) {
      await leaveRoom(roomPin, currentPlayerName)
    }
    router.push('/')
  }

  const handleSendEmote = (targetName: string, emote: string) => {
    sendRoomEmote(roomPin, currentPlayerName, targetName, emote)
    setActiveEmoteMenuPlayer(null)
  }

  return (
    <div className={`min-h-screen bg-slate-950 bg-gradient-to-b ${currentTheme.bgGradient} text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans transition-all duration-500 selection:bg-emerald-500 selection:text-slate-950`}>
      
      {/* Background Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2 pb-3">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-md"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Salir</span>
        </button>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black shadow-md backdrop-blur-md ${currentTheme.badgeClass}`}>
          <Globe className="w-3.5 h-3.5" />
          <span>{activeCategoryInfo.name}</span>
        </div>
      </header>

      {/* Main Room Lobby Container */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-start z-10 py-2 space-y-4">

        {/* Room PIN Display Box */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl text-center space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-black text-amber-400">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span>SALA: {activeCategoryInfo.name.toUpperCase()}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-300 font-bold">CÓDIGO PIN DE ACCESO</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-emerald-400 bg-slate-950 px-6 py-1.5 rounded-2xl border border-emerald-500/30 shadow-inner">
                {roomPin}
              </span>
              <button
                onClick={copyPinToClipboard}
                title="Copiar PIN"
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Jugadores vs Mapa) */}
        <div className="w-full grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-black shadow-lg">
          <button
            onClick={() => setActiveTab('players')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'players'
                ? `bg-gradient-to-r ${currentTheme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Jugadores ({players.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'map'
                ? `bg-gradient-to-r ${currentTheme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Ver Mapa</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'players' ? (
          /* Players List Section with Large Avatar & Reaccionar Button */
          <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-4 sm:p-5 rounded-3xl shadow-xl space-y-4 flex-1 flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-slate-100">Jugadores en la Sala</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400">
                {players.length} {players.length === 1 ? 'Jugador' : 'Jugadores'}
              </span>
            </div>

            {/* Loading state or Players Grid */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Cargando jugadores...
              </div>
            ) : players.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-xs space-y-2">
                <p>Esperando a que entren los jugadores...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-80 pr-1">
                {players.map((player, index) => {
                  const isHost = index === 0
                  const isMe = player.player_name === currentPlayerName
                  const avatarEmoji = player.avatar_icon || '🦊'
                  const playerFloatingEmotes = floatingEmotes[player.player_name] || []
                  const isEmoteMenuOpen = activeEmoteMenuPlayer === player.player_name

                  return (
                    <div
                      key={player.id || index}
                      className={`relative p-4 rounded-3xl border transition-all flex flex-col items-center justify-between text-center overflow-hidden animate-in fade-in slide-in-from-top-1 ${
                        isMe
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg'
                          : 'bg-slate-950/80 border-slate-800/80'
                      }`}
                    >
                      {/* Floating Animated Emotes Overlay */}
                      {playerFloatingEmotes.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
                          {playerFloatingEmotes.map((item) => (
                            <div
                              key={item.id}
                              className="animate-bounce text-4xl sm:text-5xl filter drop-shadow-lg transition-all duration-300"
                            >
                              {item.emote}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Top Host Crown or Badge */}
                      <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1">
                        {isHost ? (
                          <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Crown className="w-3 h-3 fill-current" /> Anfitrión
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">#{index + 1}</span>
                        )}

                        {isMe && (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-extrabold">
                            Tú
                          </span>
                        )}
                      </div>

                      {/* Large Avatar Centered in Soft Circular Background */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border-2 border-slate-800/90 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shadow-black/60 my-1 group-hover:scale-105 transition-transform">
                        {avatarEmoji}
                      </div>

                      {/* Player Name */}
                      <h3 className="text-sm font-black text-slate-100 tracking-wide mt-1 truncate max-w-[130px]">
                        {player.player_name}
                      </h3>

                      {/* HP Bar */}
                      <div className="flex items-center gap-1.5 mt-2 w-full px-2">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${player.hp}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-400 shrink-0">
                          {player.hp} HP
                        </span>
                      </div>

                      {/* Reaccionar Emote Button */}
                      <div className="mt-3 w-full relative">
                        <button
                          type="button"
                          onClick={() => setActiveEmoteMenuPlayer(isEmoteMenuOpen ? null : player.player_name)}
                          className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Smile className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reaccionar</span>
                        </button>

                        {/* Floating Quick Emote Selector Ribbon */}
                        {isEmoteMenuOpen && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 flex items-center gap-1.5 animate-in zoom-in-95 duration-150">
                            {QUICK_EMOTES.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => handleSendEmote(player.player_name, em)}
                                className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-slate-800 flex items-center justify-center text-lg transition-transform active:scale-125"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

            {/* Start Game Action Button */}
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full mt-auto py-3.5 px-6 bg-gradient-to-r ${currentTheme.buttonClass} font-black text-sm rounded-3xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ver Mapa ({activeCategoryInfo.name})</span>
            </button>

          </div>
        ) : (
          /* Interactive Game Map Tab with roomCategory */
          <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-3 rounded-3xl shadow-xl">
            <GameMap categoryKey={roomCategory} />
          </div>
        )}

        {/* Static Config Footer Note */}
        <div className="w-full bg-slate-900/40 border border-slate-800/60 p-3 rounded-2xl text-[11px] text-slate-300 font-medium flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Temática: {activeCategoryInfo.name}
          </span>
          <span className="text-slate-400 font-mono font-bold">100 HP Base</span>
        </div>

      </main>
    </div>
  )
}
