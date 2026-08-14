'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Globe, Users, Copy, Check, LogOut, ShieldCheck, Heart, Crown, Play, RefreshCw, Compass, Gamepad2, Smile, Sparkles, Swords, Trophy, ArrowRight, RotateCcw, Navigation, AlertCircle, CheckCircle2, Clock, Flame, Zap, Landmark, BookOpen } from 'lucide-react'
import { 
  getPlayersInRoom, 
  subscribeToRoomPlayers, 
  leaveRoom, 
  leaveRoomOnTabClose,
  sendRoomEmote, 
  subscribeToRoomEmotes, 
  sendPlayerReady,
  subscribeToPlayerReady,
  broadcastGameState,
  subscribeToGameStateBroadcast,
  getTabPlayerName,
  ActivePlayer, 
  EmoteEvent 
} from '@/lib/supabase/playersService'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'
import { getQuestionsForZone, Question } from '@/config/questionBank'
import { DIFFICULTY_SETTINGS, DifficultyMode } from '@/config/gameConfig'
import { useGameState, GamePhase } from '@/hooks/useGameState'
import GameMap from '@/components/GameMap'
import CombatInterface from '@/components/CombatInterface'
import RoundResult from '@/components/RoundResult'

const QUICK_EMOTES = ['🔥', '😂', '🎉', '👏', '🏆', '😱', '💪', '💩']

const CATEGORY_HEADER_ICONS = {
  geografia: Globe,
  cultura_general: BookOpen,
  deportes: Trophy,
  historia: Landmark
}

export default function RoomPage() {
  const params = useParams()
  const roomPin = (params?.pin as string) || '0000'
  const router = useRouter()

  // 1. Game State Manager Hook
  const {
    currentPhase,
    activeZoneId,
    currentQuestion,
    lastResult,
    winner,
    startGame,
    enterCombat,
    showResults,
    nextRound,
    endGame,
    resetToLobby,
    syncState
  } = useGameState('LOBBY')

  const [players, setPlayers] = useState<ActivePlayer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('')
  const [roomCategory, setRoomCategory] = useState<CategoryKey>('geografia')
  const [roomDifficulty, setRoomDifficulty] = useState<DifficultyMode>('normal')
  const [roomClosedMessage, setRoomClosedMessage] = useState<string | null>(null)

  // Realtime Player Ready Map: playerName -> boolean
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({})

  // Ref to always hold fresh players list without causing useEffect re-renders
  const playersRef = useRef<ActivePlayer[]>([])
  useEffect(() => {
    playersRef.current = players
  }, [players])

  // Active floating emotes map: targetPlayerName -> array of active floating emotes
  const [floatingEmotes, setFloatingEmotes] = useState<Record<string, { id: string; emote: string; sender: string }[]>>({})
  const [activeEmoteMenuPlayer, setActiveEmoteMenuPlayer] = useState<string | null>(null)

  const activeCategoryInfo = GAME_CATEGORIES[roomCategory] || GAME_CATEGORIES.geografia
  const currentTheme = activeCategoryInfo.theme
  const diffConfig = DIFFICULTY_SETTINGS[roomDifficulty] || DIFFICULTY_SETTINGS.normal
  const ThemeIcon = CATEGORY_HEADER_ICONS[roomCategory] || Globe

  useEffect(() => {
    // Retrieve tab-isolated stored player name
    const savedName = getTabPlayerName() || localStorage.getItem('geo_royale_current_player') || 'Jugador'
    setCurrentPlayerName(savedName)

    // Initial load of players in this room with fail-safe try/finally
    async function loadPlayers() {
      try {
        const data = await getPlayersInRoom(roomPin)
        if (data && data.length > 0) {
          setPlayers(data)
          if (data[0].category_key) {
            setRoomCategory(data[0].category_key as CategoryKey)
          }
          if (data[0].difficulty_mode) {
            setRoomDifficulty(data[0].difficulty_mode as DifficultyMode)
          }
        }
      } catch (err) {
        console.error('Error al cargar jugadores:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()

    // 1. Subscribe to realtime updates for active_players in this PIN
    const unsubscribePlayers = subscribeToRoomPlayers(roomPin, (updatedPlayers) => {
      setPlayers(updatedPlayers)
      if (updatedPlayers && updatedPlayers.length > 0) {
        if (updatedPlayers[0].category_key) {
          setRoomCategory(updatedPlayers[0].category_key as CategoryKey)
        }
        if (updatedPlayers[0].difficulty_mode) {
          setRoomDifficulty(updatedPlayers[0].difficulty_mode as DifficultyMode)
        }
      }
      setLoading(false)
    })

    // 2. Subscribe to realtime floating emotes
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

    // 3. Subscribe to Realtime Broadcast State Changes (State Sync & Room Closure)
    const unsubscribeGameState = subscribeToGameStateBroadcast(roomPin, (newState, payload) => {
      if (newState === 'ROOM_CLOSED' || payload?.roomClosed) {
        setRoomClosedMessage('El anfitrión ha salido y la sala ha sido eliminada.')
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      // Reset readyMap on phase changes to force new zone selection readiness
      if (newState === 'ZONE_SELECTION' || newState === 'ROUND_RESULT') {
        setReadyMap({})
      }

      syncState(newState as GamePhase, payload)
    })

    // 4. Subscribe to Realtime Player Ready Toggles
    const unsubscribeReady = subscribeToPlayerReady(roomPin, (playerName, isReady) => {
      setReadyMap((prev) => ({ ...prev, [playerName]: isReady }))
    })

    // 5. Tab Closure / Window Close Event Listener (Guaranteed HTTP DELETE via fetch keepalive)
    const handleTabClose = () => {
      const currentList = playersRef.current
      const isHost = currentList.length > 0 && currentList[0].player_name === savedName
      leaveRoomOnTabClose(roomPin, savedName, isHost)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleTabClose)
    }

    return () => {
      unsubscribePlayers()
      unsubscribeEmotes()
      unsubscribeGameState()
      unsubscribeReady()
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleTabClose)
      }
    }
  }, [roomPin, syncState, router])

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(roomPin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle explicit Exit (Salir): deletes user/room from Supabase database
  const isHost = players.length > 0 && players[0].player_name === currentPlayerName

  const handleLeaveRoom = async () => {
    if (currentPlayerName && roomPin) {
      await leaveRoom(roomPin, currentPlayerName, isHost)
    }
    router.push('/')
  }

  const handleSendEmote = (targetName: string, emote: string) => {
    sendRoomEmote(roomPin, currentPlayerName, targetName, emote)
    setActiveEmoteMenuPlayer(null)
  }

  // Toggle ready state for local player
  const handleToggleReady = (pName: string, nextState: boolean) => {
    setReadyMap((prev) => ({ ...prev, [pName]: nextState }))
    sendPlayerReady(roomPin, pName, nextState)
  }

  // Check if ALL players in the room are ready
  const allPlayersReady = players.length > 0 && players.every((p) => Boolean(readyMap[p.player_name]))

  // Host Action: Start Game -> Broadcasts ZONE_SELECTION to ALL connected players
  const handleHostStartGame = () => {
    if (!allPlayersReady) return
    startGame()
    setReadyMap({})
    broadcastGameState(roomPin, 'ZONE_SELECTION')
  }

  // Handle Zone selection on Map
  const handleZoneSelectOnMap = (subzoneId: string, questions: Question[]) => {
    // Selection handled smoothly per player without forcing immediate combat overlay
  }

  // Determine local player's specific zone and dynamic zone question during COMBAT phase
  const me = players.find((p) => p.player_name === currentPlayerName)
  const activePlayerZone = me?.current_zone || activeZoneId || 'archipielago-fisico'
  
  // Extract specific question corresponding strictly to local player's landed zone
  const playerZoneQuestions = getQuestionsForZone(roomCategory, activePlayerZone, 1)
  const activeCombatQuestion = playerZoneQuestions[0] || currentQuestion

  // Get human-readable zone name
  const findZoneName = (zoneId: string): string => {
    for (const lvl of activeCategoryInfo.levels) {
      const found = lvl.subzones.find((s) => s.id === zoneId)
      if (found) return found.name
    }
    return zoneId
  }
  const displayZoneName = findZoneName(activePlayerZone)

  return (
    <div className={`min-h-screen bg-slate-950 bg-gradient-to-b ${currentTheme.bgGradient} text-slate-100 flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-hidden font-sans transition-all duration-700 selection:bg-amber-400 selection:text-slate-950`}>
      
      {/* Category Theme Glow Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className={`absolute -top-36 -left-36 w-96 h-96 ${currentTheme.glowColor} rounded-full blur-3xl pointer-events-none animate-pulse`} />
      <div className={`absolute -bottom-36 -right-36 w-96 h-96 ${currentTheme.glowColor} rounded-full blur-3xl pointer-events-none animate-pulse`} />

      {/* Sleek Top Navigation Header */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-1 pb-2">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-black text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-md"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Salir</span>
        </button>

        <div className="flex items-center gap-2">
          {roomDifficulty === 'hard' && (
            <div className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black shadow-md flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Hardcore
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black shadow-md backdrop-blur-md transition-colors ${currentTheme.badgeClass}`}>
            <ThemeIcon className="w-3.5 h-3.5" />
            <span>{activeCategoryInfo.name}</span>
          </div>
        </div>
      </header>

      {/* Room Closed Banner */}
      {roomClosedMessage && (
        <div className="w-full max-w-md z-30 bg-rose-500/20 border border-rose-500/50 p-4 rounded-3xl text-rose-300 text-xs font-bold flex items-center gap-3 shadow-2xl animate-in zoom-in-95">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
          <span>{roomClosedMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-start z-10 py-1 space-y-3">

        {/* ROOM PIN & CODE BANNER: VISIBLE ONLY IN LOBBY PHASE */}
        {currentPhase === 'LOBBY' && (
          <div className={`w-full ${currentTheme.bannerBg} backdrop-blur-xl border ${currentTheme.cardBorder} p-4 rounded-3xl shadow-xl text-center space-y-2 relative overflow-hidden transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-black text-amber-400">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Sala de Espera</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-black bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Users className="w-3 h-3" />
                <span>{players.length} Jugadores</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-black tracking-wider text-amber-300 uppercase">
                CÓDIGO PIN DE ACCESO
              </p>
              <div className="flex items-center justify-center gap-3 pt-0.5">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-300 bg-slate-950/90 px-5 py-1 rounded-2xl border border-emerald-500/40 shadow-inner">
                  {roomPin}
                </span>
                <button
                  onClick={copyPinToClipboard}
                  title="Copiar PIN"
                  className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all active:scale-95 shadow-md"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONDITIONAL RENDER PER GAME PHASE (LOBBY, ZONE_SELECTION, COMBAT, RESULT, VICTORY) */}
        {/* ========================================================================= */}

        {/* 1. LOBBY PHASE */}
        {currentPhase === 'LOBBY' && (
          <div className={`w-full ${currentTheme.cardBg} backdrop-blur-xl border ${currentTheme.cardBorder} p-4 sm:p-5 rounded-3xl shadow-xl space-y-4 flex-1 flex flex-col animate-in fade-in duration-300`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-slate-100">Exploradores en la Sala</h2>
              </div>

              {allPlayersReady ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-black text-emerald-300 animate-pulse flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ¡Todos Listos!
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Confirmando Listos
                </span>
              )}
            </div>

            {/* Players Grid */}
            {loading && players.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Cargando exploradores...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-80 pr-1">
                {players.map((player, index) => {
                  const isPlayerHost = index === 0
                  const isMe = player.player_name === currentPlayerName
                  const isPlayerReady = Boolean(readyMap[player.player_name])
                  const avatarEmoji = player.avatar_icon || '🦊'
                  const playerFloatingEmotes = floatingEmotes[player.player_name] || []
                  const isEmoteMenuOpen = activeEmoteMenuPlayer === player.player_name

                  return (
                    <div
                      key={player.id || index}
                      className={`relative p-3.5 rounded-3xl border transition-all flex flex-col items-center justify-between text-center overflow-hidden ${
                        isMe
                          ? `${currentTheme.activeBorder} bg-slate-900/90 shadow-lg`
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

                      <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1">
                        {isPlayerHost ? (
                          <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Crown className="w-3 h-3 fill-current" /> Anfitrión
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">#{index + 1}</span>
                        )}

                        {isPlayerReady ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" /> Listo
                          </span>
                        ) : (
                          <span className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-medium">
                            Esperando...
                          </span>
                        )}
                      </div>

                      <div className="w-14 h-14 rounded-full bg-slate-900/90 border-2 border-slate-800/90 flex items-center justify-center text-3xl shadow-inner my-1">
                        {avatarEmoji}
                      </div>

                      <h3 className="text-xs font-black text-slate-100 tracking-wide mt-0.5 truncate max-w-[130px]">
                        {player.player_name} {isMe && <span className="text-emerald-400">(Tú)</span>}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1.5 w-full px-2">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full"
                            style={{ width: `${player.hp}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-slate-400 shrink-0">
                          {player.hp} HP
                        </span>
                      </div>

                      {/* Emote reactions menu ONLY visible on YOUR player card (isMe) */}
                      {isMe && (
                        <div className="mt-2.5 w-full relative">
                          <button
                            type="button"
                            onClick={() => setActiveEmoteMenuPlayer(isEmoteMenuOpen ? null : player.player_name)}
                            className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <Smile className="w-3 h-3 text-amber-400" />
                            <span>Mi Reacción</span>
                          </button>

                          {isEmoteMenuOpen && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 flex items-center gap-1.5 animate-in zoom-in-95 duration-150">
                              {QUICK_EMOTES.map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => handleSendEmote(player.player_name, em)}
                                  className="w-7 h-7 rounded-xl bg-slate-950 hover:bg-slate-800 flex items-center justify-center text-base transition-transform active:scale-125"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )}

            {/* Toggle "¡Estoy Listo!" Button for Local Player */}
            <div className="space-y-2 pt-1 mt-auto">
              <button
                type="button"
                onClick={() => handleToggleReady(currentPlayerName, !Boolean(readyMap[currentPlayerName]))}
                className={`w-full py-3 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                  readyMap[currentPlayerName]
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{readyMap[currentPlayerName] ? '✓ ¡Estás Listo! (Pulsar para Cancelar)' : '¡Marcar como Listo!'}</span>
              </button>

              {/* Start Game Action Button for Host */}
              {isHost && (
                <button
                  onClick={handleHostStartGame}
                  disabled={!allPlayersReady}
                  className={`w-full py-3.5 px-6 font-black text-sm rounded-3xl shadow-xl flex items-center justify-center gap-2 transition-all ${
                    allPlayersReady
                      ? `bg-gradient-to-r ${currentTheme.buttonClass} active:scale-[0.98] animate-pulse`
                      : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {allPlayersReady
                      ? 'Comenzar Expedición (Todos Listos)'
                      : 'Esperando a que todos estén Listos...'}
                  </span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* 2. ZONE_SELECTION PHASE (LANDING MAP NAVIGATION) */}
        {(currentPhase === 'ZONE_SELECTION' || currentPhase === 'COMBAT') && (
          <div className={`w-full ${currentTheme.cardBg} backdrop-blur-xl border ${currentTheme.cardBorder} p-3 rounded-3xl shadow-xl space-y-3 animate-in fade-in duration-200`}>
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                <Navigation className="w-4 h-4" /> Mapa de Aterrizaje
              </span>
              <button
                onClick={() => {
                  resetToLobby()
                  broadcastGameState(roomPin, 'LOBBY')
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Volver a la Sala
              </button>
            </div>

            <GameMap 
              categoryKey={roomCategory} 
              players={players}
              currentPlayerName={currentPlayerName}
              roomPin={roomPin}
              gamePhase={currentPhase}
              readyMap={readyMap}
              onSelectZone={handleZoneSelectOnMap}
              onToggleReady={handleToggleReady}
              onStartCombat={(zId) => {
                const targetZone = zId || me?.current_zone || 'archipielago-fisico'
                const questions = getQuestionsForZone(roomCategory, targetZone, 1)
                enterCombat(targetZone, questions[0])
              }}
            />
          </div>
        )}

        {/* 3. COMBAT PHASE (DYNAMIC INDIVIDUAL PER-PLAYER QUESTION) */}
        {currentPhase === 'COMBAT' && activeCombatQuestion && (
          <CombatInterface
            question={activeCombatQuestion}
            zoneName={displayZoneName}
            zoneId={activePlayerZone}
            categoryKey={roomCategory}
            localPlayerId={me?.id}
            localPlayerHp={me?.hp || 100}
            difficultyMode={roomDifficulty}
            roomPin={roomPin}
            isHost={isHost}
            playersAnswered={1}
            totalPlayers={players.length || 2}
            onAnswer={(selectedIndex, isCorrect, damageDealt, healingDealt) => {
              const resPayload = {
                selectedOption: selectedIndex,
                isCorrect,
                damageDealt,
                healingDealt,
                activeZoneId: activePlayerZone
              }
              showResults(resPayload)
            }}
            onClose={() => {
              syncState('ZONE_SELECTION')
              broadcastGameState(roomPin, 'ZONE_SELECTION')
            }}
          />
        )}

        {/* 4. ROUND_RESULT PHASE (CLASIFICACIÓN Y RECUENTO) */}
        {currentPhase === 'ROUND_RESULT' && (
          <RoundResult
            roomPin={roomPin}
            players={players}
            currentPlayerName={currentPlayerName}
            isHost={isHost}
            onNextRound={() => syncState('ZONE_SELECTION')}
          />
        )}

        {/* 5. VICTORY PHASE */}
        {currentPhase === 'VICTORY' && (
          <div className="w-full bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 p-6 rounded-3xl shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/40 animate-bounce">
              <Crown className="w-10 h-10 fill-current text-amber-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">¡VICTORIA ROYALE!</span>
              <h2 className="text-2xl font-black text-slate-100">
                {winner?.player_name || 'Gran Ganador'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">¡Último superviviente en pie en el mapa!</p>
            </div>

            <div className="text-5xl my-2">
              {winner?.avatar_icon || '👑'}
            </div>

            <button
              onClick={() => {
                resetToLobby()
                broadcastGameState(roomPin, 'LOBBY')
              }}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-sm rounded-3xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Volver a la Sala de Espera</span>
            </button>
          </div>
        )}

      </main>

    </div>
  )
}
