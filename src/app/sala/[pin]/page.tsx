'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Globe, Users, Trophy, Flame, Play, LogOut, CheckCircle2, ShieldCheck, RefreshCw, Copy, Check, Clock, Sparkles, AlertCircle, UserPlus, Compass, Eye, Crown, MessageSquare, Hourglass, Zap, Heart, Info, X, Skull, Shield, Layers, MapPin } from 'lucide-react'
import { GAME_CATEGORIES, CategoryKey, MapLevel, SubZone } from '@/config/mapConfig'
import { Question, getQuestionsForZone } from '@/config/questionBank'
import { DIFFICULTY_SETTINGS, DifficultyMode } from '@/config/gameConfig'
import { 
  ActivePlayer, 
  getPlayersInRoom, 
  joinOrCreateRoom, 
  leaveRoom, 
  leaveRoomOnTabClose, 
  subscribeToRoomPlayers,
  broadcastGameState,
  subscribeToGameStateBroadcast,
  sendPlayerReady,
  subscribeToPlayerReady,
  sendPlayerAnswered,
  subscribeToPlayerAnswered,
  getTabPlayerName,
  getTabAvatar
} from '@/lib/supabase/playersService'
import { useGameState, GamePhase } from '@/hooks/useGameState'

// Components
import GameMap from '@/components/GameMap'
import CombatInterface from '@/components/CombatInterface'
import RoundResult from '@/components/RoundResult'
import VictoryRoyale from '@/components/VictoryRoyale'

const CATEGORY_HEADER_ICONS: Record<CategoryKey, any> = {
  general: Sparkles,
  geografia: Globe,
  cultura_general: Sparkles,
  deportes: Trophy,
  historia: Flame
}

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  
  // Extract PIN safely from Next router params
  const rawPin = (params?.pin as string) || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '')
  const roomPin = String(rawPin || '').trim().toUpperCase()

  const [players, setPlayers] = useState<ActivePlayer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('')
  const [roomCategory, setRoomCategory] = useState<CategoryKey>('geografia')
  const [roomDifficulty, setRoomDifficulty] = useState<DifficultyMode>('normal')
  const [roomMaxPlayers, setRoomMaxPlayers] = useState<number>(4)
  const [roomClosedMessage, setRoomClosedMessage] = useState<string | null>(null)
  const [showThemeInfo, setShowThemeInfo] = useState<boolean>(false)
  const [showDifficultyInfo, setShowDifficultyInfo] = useState<boolean>(false)

  // Player Ready Status Map per PIN
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({})

  // Player Answered Status Map per PIN (COMBAT phase real-time answer counter)
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({})

  // Last burst combat outcome for round results screen
  const [lastBurstOutcome, setLastBurstOutcome] = useState<{
    damageDealt?: number
    healingDealt?: number
    isCorrect?: boolean
    correctCount?: number
  } | null>(null)

  // Omniscient God Mode Spectator state
  const [hasDied, setHasDied] = useState<boolean>(false)
  const [isSpectatingMode, setIsSpectatingMode] = useState<boolean>(false)

  // Central Game Loop state management
  const { currentPhase, roundNumber, activeZoneId, currentQuestion, lastResult, winner, startGame, enterCombat, showResults, nextRound, endGame, resetToLobby, syncState } = useGameState('LOBBY')

  const playersRef = useRef<ActivePlayer[]>(players)
  playersRef.current = players

  const hostPlayerNameRef = useRef<string | null>(null)
  const autoStartTriggeredRef = useRef<boolean>(false)

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
          if (!hostPlayerNameRef.current) {
            hostPlayerNameRef.current = data[0].player_name
          }
          const foundMax = data.find((p) => p.max_players)?.max_players
          if (foundMax) {
            setRoomMaxPlayers(Number(foundMax))
          }
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
        if (!hostPlayerNameRef.current) {
          hostPlayerNameRef.current = updatedPlayers[0].player_name
        }
        const foundMax = updatedPlayers.find((p) => p.max_players)?.max_players
        if (foundMax) {
          setRoomMaxPlayers(Number(foundMax))
        }
        if (updatedPlayers[0].category_key) {
          setRoomCategory(updatedPlayers[0].category_key as CategoryKey)
        }
        if (updatedPlayers[0].difficulty_mode) {
          setRoomDifficulty(updatedPlayers[0].difficulty_mode as DifficultyMode)
        }

        // Check if the host player has left the room
        if (hostPlayerNameRef.current && !updatedPlayers.some((p) => p.player_name === hostPlayerNameRef.current)) {
          if (savedName !== hostPlayerNameRef.current) {
            setRoomClosedMessage('El anfitrión ha abandonado la sala. Volviendo al menú principal...')
            setTimeout(() => {
              router.push('/')
            }, 1500)
          }
        }
      } else {
        // Room is completely empty (host deleted the room)
        if (savedName && hostPlayerNameRef.current && savedName !== hostPlayerNameRef.current) {
          setRoomClosedMessage('El anfitrión ha abandonado la sala. Volviendo al menú principal...')
          setTimeout(() => {
            router.push('/')
          }, 1500)
        }
      }
      setLoading(false)
    })

    // 2. Subscribe to Realtime Broadcast State Changes (State Sync & Room Closure)
    const unsubscribeGameState = subscribeToGameStateBroadcast(roomPin, (newState, payload) => {
      if (newState === 'ROOM_CLOSED' || payload?.roomClosed) {
        setRoomClosedMessage('El anfitrión ha abandonado la sala. Volviendo al menú principal...')
        setTimeout(() => {
          router.push('/')
        }, 1500)
        return
      }

      // Reset readyMap & answeredMap on phase changes
      if (newState === 'LOBBY') {
        resetToLobby()
        setReadyMap({})
        setAnsweredMap({})
        setHasDied(false)
        setIsSpectatingMode(false)
        return
      }

      if (newState === 'VICTORY') {
        endGame(payload?.winnerPlayer || null)
        syncState('VICTORY', payload)
        return
      }

      if (newState === 'ZONE_SELECTION' || newState === 'ROUND_RESULT' || newState === 'COMBAT') {
        setReadyMap({})
        setAnsweredMap({})
      }

      syncState(newState as GamePhase, payload)
    })

    // 4. Subscribe to Realtime Player Ready Toggles
    const unsubscribeReady = subscribeToPlayerReady(roomPin, (playerName, isReady) => {
      setReadyMap((prev) => ({ ...prev, [playerName]: isReady }))
    })

    // 5. Subscribe to Realtime Player Answered events (COMBAT answer counter)
    const unsubscribeAnswered = subscribeToPlayerAnswered(roomPin, (playerName) => {
      setAnsweredMap((prev) => ({ ...prev, [playerName]: true }))
    })

    // 6. Tab Closure / Window Close Event Listener (Guaranteed HTTP DELETE via fetch keepalive)
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
      unsubscribeGameState()
      unsubscribeReady()
      unsubscribeAnswered()
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

  // Ready Status Controls in Lobby
  const isMyReadyInLobby = Boolean(currentPlayerName && readyMap[currentPlayerName])

  const handleToggleMyReady = () => {
    const nextState = !isMyReadyInLobby
    setReadyMap((prev) => ({ ...prev, [currentPlayerName]: nextState }))
    sendPlayerReady(roomPin, currentPlayerName, nextState)
  }

  // Check if ALL connected players in room are marked "Listo"
  const allPlayersReady = players.length > 0 && players.every((p) => Boolean(readyMap[p.player_name]))
  const isRoomFull = players.length >= roomMaxPlayers

  // Automated Lobby Start: Triggered when room reaches capacity AND 100% of players are Ready
  useEffect(() => {
    if (currentPhase !== 'LOBBY') {
      autoStartTriggeredRef.current = false
      return
    }

    if (isRoomFull && allPlayersReady && !autoStartTriggeredRef.current) {
      autoStartTriggeredRef.current = true
      setTimeout(() => {
        startGame()
        setReadyMap({})
        setAnsweredMap({})
        broadcastGameState(roomPin, 'ZONE_SELECTION', { round_number: 1 })
      }, 600)
    }
  }, [currentPhase, isRoomFull, allPlayersReady, roomPin, startGame])

  // Host Action: Manual Start Game (allowed if all connected players are ready, even if room is not full)
  const handleHostStartGame = () => {
    if (!allPlayersReady) return
    startGame()
    setReadyMap({})
    setAnsweredMap({})
    broadcastGameState(roomPin, 'ZONE_SELECTION', { round_number: 1 })
  }

  // Handle Zone selection on Map
  const handleZoneSelectOnMap = (subzoneId: string, questions: Question[]) => {
    // Selection handled smoothly per player
  }

  // Determine local player's specific zone and evaluate Duel state
  const me = players.find((p) => p.player_name === currentPlayerName)
  const isDead = Boolean(me && (me.hp ?? 100) <= 0)
  const isLocalSpectator = isDead || isSpectatingMode
  const showDeathModal = Boolean(isDead && !hasDied && !isSpectatingMode && currentPhase !== 'LOBBY')
  const activePlayerZone = me?.current_zone || activeZoneId || 'general_l1_deportes'

  // Regla 8: Duelo si 2 o más jugadores comparten la misma subzona (solo vivos)
  const alivePlayers = players.filter((p) => (p.hp ?? 100) > 0)
  const playersInMyZone = alivePlayers.filter((p) => (p.current_zone || activePlayerZone) === activePlayerZone)
  const isDuel = playersInMyZone.length > 1
  const duelOpponents = playersInMyZone
    .filter((p) => p.player_name !== currentPlayerName)
    .map((p) => p.player_name)
  
  // Extract specific questions (2-question burst) corresponding strictly to local player's landed zone
  const playerZoneQuestions = getQuestionsForZone(roomCategory, activePlayerZone, roundNumber, 2)
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

  // Realtime Answer Counter for COMBAT Phase (Fase 1: Filtro estricto de supervivientes con hp > 0)
  const aliveAnsweredCount = alivePlayers.filter((p) => Boolean(answeredMap[p.player_name])).length
  const totalAlivePlayers = alivePlayers.length > 0 ? alivePlayers.length : (players.length > 0 ? players.length : 1)
  const isAllPlayersAnswered = alivePlayers.length > 0 && alivePlayers.every((p) => Boolean(answeredMap[p.player_name]))

  // Calculate empty slots to render premium placeholder cards
  const emptySlotsCount = Math.max(0, roomMaxPlayers - players.length)
  const progressPercent = Math.min(100, Math.max(8, (players.length / roomMaxPlayers) * 100))

  return (
    <div className={`min-h-screen bg-[#0B0F19] text-white flex flex-col items-center ${currentPhase === 'LOBBY' ? 'justify-between p-3 sm:p-5' : 'justify-start px-2.5 pt-1 pb-2.5 sm:p-4'} relative overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white`}>
      
      {/* Background Lighting & Glow Mesh */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-600/20 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 right-0 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Sleek Top Navigation Header (Only in Active Game Phases, Hidden in Lobby) */}
      {currentPhase !== 'LOBBY' && (
        <header className="w-full max-w-md flex items-center justify-between z-10 pt-0.5 pb-1">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.1] transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Salir</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Category Theme Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm text-xs font-bold text-gray-300 shadow-md">
              <ThemeIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeCategoryInfo.name}</span>
            </div>

            {/* Difficulty Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm text-xs font-bold text-amber-400 shadow-md">
              <span>{diffConfig.name}</span>
            </div>
          </div>
        </header>
      )}

      {/* Room Closure Alert Banner */}
      {roomClosedMessage && (
        <div className="fixed top-5 z-50 max-w-sm w-full bg-rose-500 text-white font-bold text-xs p-3.5 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-rose-400 animate-in slide-in-from-top-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{roomClosedMessage}</span>
        </div>
      )}

      {/* MAIN VIEW SYSTEM BASED ON GAME PHASE */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-start items-center z-10 py-0.5">
        
        {/* FASE 3: OVERRIDE MODO ESPECTADOR OMNISCIENTE (MODO DIOS ANCLADO AL MAPA) */}
        {isSpectatingMode && currentPhase !== 'LOBBY' && currentPhase !== 'VICTORY' ? (
          <div className="w-full animate-in fade-in duration-300">
            <GameMap
              categoryKey={roomCategory}
              currentZoneId={activeZoneId || undefined}
              players={players}
              currentPlayerName={currentPlayerName}
              roomPin={roomPin}
              gamePhase={currentPhase}
              roundNumber={roundNumber}
              readyMap={readyMap}
              isGodMode={true}
              onSelectZone={() => {}}
              onToggleReady={() => {}}
              onStartCombat={() => {}}
            />
          </div>
        ) : (
          <>
            {/* 1. LOBBY PHASE (SALA DE ESPERA CON CAPACIDAD, LISTA DE JUGADORES & ACCIONES) */}
            {currentPhase === 'LOBBY' && (
              <div className="w-full space-y-3.5 animate-in fade-in zoom-in-95 duration-300 pb-28 sm:pb-4">
                
                {/* 1. Command Center & Mission Card (Temática, Dificultad y Salir) */}
                <div className="bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md space-y-3.5">
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-300">
                        Sala de espera
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Salir de la Sala</span>
                    </button>
                  </div>

                  {/* 2 Prominent Visual Feature Blocks for Temática & Dificultad */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {/* Temática Block */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col justify-between gap-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="p-1 rounded-md bg-indigo-500/15 text-indigo-400">
                            <ThemeIcon className="w-3 h-3" />
                          </div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-300">
                            Temática
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowThemeInfo(true)}
                          className="w-5 h-5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0"
                          title="Información de la temática"
                          aria-label="Información de la temática"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white leading-tight break-words">
                        {activeCategoryInfo.name}
                      </div>
                    </div>

                    {/* Dificultad Block */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col justify-between gap-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`p-1 rounded-md ${roomDifficulty === 'hard' ? 'bg-rose-500/15 text-rose-400' : 'bg-blue-500/15 text-blue-400'}`}>
                            {roomDifficulty === 'hard' ? <Flame className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          </div>
                          <span className={`text-[9.5px] font-bold uppercase tracking-wider ${roomDifficulty === 'hard' ? 'text-rose-300' : 'text-blue-300'}`}>
                            Dificultad
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDifficultyInfo(true)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 ${
                            roomDifficulty === 'hard'
                              ? 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-white border-rose-500/30'
                              : 'bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 hover:text-white border-blue-500/30'
                          }`}
                          title="Información de dificultad"
                          aria-label="Información de dificultad"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white leading-tight break-words">
                        {diffConfig.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Unified Room PIN & Capacity Card (Glassmorphism) */}
                <div className="bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm">
                        #
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">Código de Sala</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                            {roomPin}
                          </span>
                          <button
                            type="button"
                            onClick={copyPinToClipboard}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="Copiar PIN"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Badge */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">Capacidad</span>
                      <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-black text-white">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>{players.length} / {roomMaxPlayers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reactive Room Capacity Progress Bar */}
                  <div className="w-full space-y-1">
                    <div className="w-full h-2.5 bg-black/40 shadow-inner rounded-full overflow-hidden border border-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* PLAYERS LIST & SLOTS GRID */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1 text-xs font-bold text-white/80">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      Exploradores Conectados ({players.length}/{roomMaxPlayers})
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      {players.filter((p) => Boolean(readyMap[p.player_name])).length} Listos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {/* Render connected players */}
                    {players.map((p, idx) => {
                      const isMe = p.player_name === currentPlayerName
                      const isPlayerHost = idx === 0
                      const isReady = Boolean(readyMap[p.player_name])

                      return (
                        <div
                          key={p.id || p.player_name}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 shadow-lg backdrop-blur-md flex flex-col justify-between gap-3 ${
                            isMe
                              ? 'bg-emerald-950/20 border-emerald-500/30 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'bg-white/[0.04] border-white/[0.08]'
                          }`}
                        >
                          {/* Top: Avatar & Name + Badges */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border ${
                              isMe 
                                ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                : 'bg-black/30 border-white/[0.08]'
                            }`}>
                              {p.avatar_icon || '🦊'}
                            </div>

                            {/* Name & Badges */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                                {p.player_name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                {isMe && (
                                  <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md shrink-0">
                                    TÚ
                                  </span>
                                )}
                                {isPlayerHost && (
                                  <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/50 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0" title="Anfitrión">
                                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                                    Anfitrión
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom: Ready Status Badge */}
                          <div className="w-full pt-2 border-t border-white/[0.06] flex items-center justify-center">
                            {isReady ? (
                              <span className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-[10.5px] font-black py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Listo
                              </span>
                            ) : (
                              <span className="w-full bg-white/5 text-gray-400 border border-dashed border-white/20 text-[10.5px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5">
                                <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                Esperando
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Render empty placeholders for remaining slots (Fantasmas) */}
                    {Array.from({ length: emptySlotsCount }).map((_, i) => (
                      <div
                        key={`empty_${i}`}
                        className="p-3.5 rounded-2xl bg-transparent border-2 border-dashed border-white/10 opacity-50 grayscale flex flex-col justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/30 shrink-0">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white/40 text-xs block truncate">Hueco Libre</span>
                            <span className="text-[10px] text-white/30 font-medium truncate block">Esperando...</span>
                          </div>
                        </div>
                        <div className="w-full pt-2 border-t border-white/5 flex items-center justify-center">
                          <span className="text-[9.5px] font-mono font-bold text-white/30 uppercase">
                            Disponible
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTONS: READY TOGGLE & START GAME (Sticky Bottom Mobile & Desktop) */}
                <div className="fixed sm:static bottom-0 left-0 w-full p-4 sm:p-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent sm:bg-none z-20 space-y-2">
                  
                  {/* Local Player Ready Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleMyReady}
                    className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer ${
                      isMyReadyInLobby
                        ? 'bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 hover:bg-emerald-500 text-white'
                        : 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/50 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isMyReadyInLobby ? (
                      <>
                        <Check className="w-5 h-5 text-white" />
                        <span>✓ ¡Estás Listo! (Toca para cancelar)</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-white fill-white" />
                        <span>¡Estoy Listo para Explorar!</span>
                      </>
                    )}
                  </button>

                  {/* Host Start Game Controls or Waiting Notice */}
                  {isHost ? (
                    <div className="space-y-1.5">
                      {isRoomFull && allPlayersReady ? (
                        <div className="bg-emerald-500/20 border border-emerald-400/60 p-3 rounded-2xl text-center text-xs font-black text-emerald-300 flex items-center justify-center gap-2 animate-pulse shadow-lg">
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                          <span>¡Sala completa y todos listos! Iniciando automáticamente...</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleHostStartGame}
                          disabled={!allPlayersReady}
                          className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                            allPlayersReady
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.4)] border border-amber-400/50'
                              : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>
                            {allPlayersReady
                              ? 'Iniciar Partida Ahora'
                              : `Esperando a que todos estén listos (${players.filter((p) => Boolean(readyMap[p.player_name])).length}/${players.length})`}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md p-2.5 rounded-2xl text-center text-xs text-white/50 font-medium">
                      <span>⏳ Esperando a que el anfitrión inicie o se llene la sala ({players.length}/{roomMaxPlayers})...</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. ZONE_SELECTION PHASE (MAPA TÁCTICO PIRAMIDAL CON RONDAS Y TORMENTA) */}
            {currentPhase === 'ZONE_SELECTION' && (
              <div className="w-full animate-in fade-in duration-300">
                <GameMap
                  categoryKey={roomCategory}
                  currentZoneId={activeZoneId || undefined}
                  players={players}
                  currentPlayerName={currentPlayerName}
                  roomPin={roomPin}
                  gamePhase={currentPhase}
                  roundNumber={roundNumber}
                  readyMap={readyMap}
                  onSelectZone={handleZoneSelectOnMap}
                  onToggleReady={(pName, isReady) => {
                    setReadyMap((prev) => ({ ...prev, [pName]: isReady }))
                    sendPlayerReady(roomPin, pName, isReady)
                  }}
                  onStartCombat={(zoneId) => {
                    const questions = getQuestionsForZone(roomCategory, zoneId, roundNumber, 2)
                    const q = questions[0]
                    enterCombat(zoneId, q)
                    broadcastGameState(roomPin, 'COMBAT', { zoneId, round_number: roundNumber })
                  }}
                />
              </div>
            )}

            {/* 3. COMBAT PHASE (DYNAMIC INDIVIDUAL/DUEL QUESTION & REALTIME COUNTER) */}
            {currentPhase === 'COMBAT' && (activeCombatQuestion || isLocalSpectator) && (
              <CombatInterface
                questions={playerZoneQuestions}
                question={activeCombatQuestion || { id: 'spec', question: 'Modo Espectador', options: [], correctIndex: 0 }}
                zoneName={displayZoneName}
                zoneId={activePlayerZone}
                categoryKey={roomCategory}
                localPlayerId={me?.id}
                localPlayerHp={me?.hp ?? 100}
                currentPlayerName={currentPlayerName}
                difficultyMode={roomDifficulty}
                roomPin={roomPin}
                isHost={isHost}
                isDuel={isDuel}
                duelOpponents={duelOpponents}
                roundNumber={roundNumber}
                completedZones={me?.completed_zones || []}
                playersAnswered={aliveAnsweredCount}
                totalPlayers={totalAlivePlayers}
                allPlayersAnswered={isAllPlayersAnswered}
                isSpectator={isLocalSpectator}
                players={players}
                answeredMap={answeredMap}
                onAnswer={(selectedIndex, isCorrect, damageDealt, healingDealt) => {
                  setLastBurstOutcome({
                    damageDealt,
                    healingDealt,
                    isCorrect,
                    correctCount: isCorrect ? 2 : damageDealt > 0 ? 1 : 0
                  })
                  if (roomPin && currentPlayerName && !isLocalSpectator) {
                    sendPlayerAnswered(roomPin, currentPlayerName)
                    setAnsweredMap((prev) => ({ ...prev, [currentPlayerName]: true }))
                  }
                  // Do NOT transition phase here; wait for timer 0s and onClose
                }}
                onClose={() => {
                  syncState('ROUND_RESULT', { roundNumber })
                  if (isHost) {
                    broadcastGameState(roomPin, 'ROUND_RESULT', { round_number: roundNumber })
                  }
                }}
              />
            )}

            {/* 4. ROUND_RESULT PHASE (CLASIFICACIÓN Y RECUENTO AUTOMÁTICO DE 5S) */}
            {currentPhase === 'ROUND_RESULT' && (
              <RoundResult
                roomPin={roomPin}
                players={players}
                currentPlayerName={currentPlayerName}
                isHost={isHost}
                roundNumber={roundNumber}
                lastBurstOutcome={lastBurstOutcome}
                onVictory={(winnerPlayer, isDraw) => {
                  endGame(winnerPlayer || null)
                  syncState('VICTORY', { winner: winnerPlayer || null, roundNumber })
                }}
                onNextRound={() => {
                  const nextR = roundNumber + 1
                  syncState('ZONE_SELECTION', { roundNumber: nextR })
                  if (isHost) {
                    broadcastGameState(roomPin, 'ZONE_SELECTION', { round_number: nextR })
                  }
                }}
              />
            )}

            {/* 5. VICTORY PHASE (VICTORY ROYALE & REMATCH CONTROLS) */}
            {currentPhase === 'VICTORY' && (
              <VictoryRoyale
                roomPin={roomPin}
                winner={winner || (alivePlayers.length === 1 ? alivePlayers[0] : null)}
                isDraw={alivePlayers.length === 0}
                players={players}
                currentPlayerName={currentPlayerName}
                isHost={isHost}
                roundNumber={roundNumber}
                onPlayAgain={() => {
                  resetToLobby()
                  setReadyMap({})
                  setAnsweredMap({})
                  setHasDied(false)
                  setIsSpectatingMode(false)
                }}
              />
            )}
          </>
        )}

      </main>

      {/* Sleek Footer Attribution */}
      <footer className="w-full max-w-md text-center text-[10px] text-slate-400 pt-2 pb-1 font-mono font-medium z-10">
        <span>Geo-Royale &copy; 2026 &bull; Duelo Geográfico en Tiempo Real</span>
      </footer>

      {/* THEME RULES INFO MODAL */}
      {showThemeInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowThemeInfo(false)}
        >
          <div 
            className="bg-[#0e1424] border border-white/10 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ThemeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Normas de la Temática</h3>
                  <p className="text-[11px] text-indigo-300 font-bold">{activeCategoryInfo.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeInfo(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Compact Levels & Disciplines Chips */}
            <div className="space-y-2.5">
              {[...activeCategoryInfo.levels]
                .sort((a, b) => a.level - b.level)
                .map((lvl) => {
                  const levelOptionsCount = lvl.level >= 4 ? '5 opciones' : '4 opciones'
                  const questionsCount = lvl.level === 5 ? '1 pregunta' : '2 preguntas'
                  
                  const lvlBorder = 
                    lvl.level === 5 ? 'border-amber-500/40 bg-amber-500/5' :
                    lvl.level === 4 ? 'border-purple-500/30 bg-purple-500/5' :
                    lvl.level === 3 ? 'border-rose-500/30 bg-rose-500/5' :
                    lvl.level === 2 ? 'border-sky-500/30 bg-sky-500/5' :
                    'border-emerald-500/30 bg-emerald-500/5'

                  const lvlBadge = 
                    lvl.level === 5 ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' :
                    lvl.level === 4 ? 'bg-purple-400/20 text-purple-300 border-purple-400/40' :
                    lvl.level === 3 ? 'bg-rose-400/20 text-rose-300 border-rose-400/40' :
                    lvl.level === 2 ? 'bg-sky-400/20 text-sky-300 border-sky-400/40' :
                    'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'

                  return (
                    <div key={lvl.level} className={`p-3 rounded-2xl border ${lvlBorder} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${lvlBadge}`}>
                          Nivel {lvl.level} • {lvl.difficulty}
                        </span>
                        <span className="text-[10px] font-mono text-white/50 font-bold">
                          {questionsCount} • {levelOptionsCount}
                        </span>
                      </div>

                      {/* Compact Subzones Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {lvl.subzones.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white shadow-sm"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => setShowThemeInfo(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* DIFFICULTY RULES INFO MODAL */}
      {showDifficultyInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowDifficultyInfo(false)}
        >
          <div 
            className="bg-[#0e1424] border border-white/10 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${roomDifficulty === 'hard' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {roomDifficulty === 'hard' ? <Flame className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Normas de Dificultad y Juego</h3>
                  <p className={`text-[11px] font-bold ${roomDifficulty === 'hard' ? 'text-rose-300' : 'text-blue-300'}`}>
                    {diffConfig.name} (Sala Actual)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDifficultyInfo(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Mode Detailed Card */}
            <div className="space-y-3">
              {roomDifficulty === 'normal' ? (
                /* Normal Mode Full Breakdown */
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-blue-300 flex items-center gap-1.5">
                      🛡️ Modo Normal
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      Configuración Activa
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Clock className="w-4 h-4 text-blue-400 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Tiempo</div>
                      <div className="text-xs sm:text-sm font-black text-white">8s</div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Heart className="w-4 h-4 text-emerald-400 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Curación</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400">+10 a +20 HP</div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Skull className="w-4 h-4 text-rose-400 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Daño / Fallo</div>
                      <div className="text-xs sm:text-sm font-black text-rose-300">15 - 75 HP</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] text-white/70 leading-relaxed pt-1">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-blue-300 block mb-0.5">⏱️ Tiempos de Respuesta</strong>
                      8 segundos por pregunta en Niveles 1 al 4 (5 segundos en Nivel 5 Clímax).
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-rose-300 block mb-0.5">💥 Daño por Fallo Escalonado</strong>
                      N1: 15 HP • N2: 25 HP • N3: 40 HP • N4: 55 HP • N5: 75 HP.
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-emerald-300 block mb-0.5">💚 Curación por Racha</strong>
                      Doble acierto restaura salud: +10 HP en N3, +15 HP en N4 y +20 HP en N5.
                    </div>
                  </div>
                </div>
              ) : (
                /* Hardcore Mode Full Breakdown */
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-rose-300 flex items-center gap-1.5">
                      🔥 Modo Hardcore
                    </span>
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                      Configuración Activa
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Clock className="w-4 h-4 text-rose-400 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Tiempo</div>
                      <div className="text-xs sm:text-sm font-black text-white">5s</div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Heart className="w-4 h-4 text-zinc-400 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Curación</div>
                      <div className="text-xs sm:text-sm font-black text-zinc-300">0 a +10 HP</div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                      <Skull className="w-4 h-4 text-rose-500 mx-auto" />
                      <div className="text-[9.5px] text-white/50">Daño / Fallo</div>
                      <div className="text-xs sm:text-sm font-black text-rose-400">25 - 100 HP</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] text-white/70 leading-relaxed pt-1">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-rose-300 block mb-0.5">⏱️ Tiempos de Respuesta Extremos</strong>
                      Solo 5 segundos por pregunta en todos los niveles. Máxima velocidad y reflejos.
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-rose-400 block mb-0.5">💀 Daño Crítico y Letal</strong>
                      N1: 25 HP • N2: 40 HP • N3: 60 HP • N4: 80 HP • N5: 100 HP (muerte instantánea).
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <strong className="text-zinc-300 block mb-0.5">❤️‍🩹 Curaciones Mínimas</strong>
                      Solo se permite curación de +10 HP al completar con éxito el Nivel 5.
                    </div>
                  </div>
                </div>
              )}

              {/* Duels */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Mecánica de Duelos Directos</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Si 2 o más exploradores eligen la <strong>misma subzona</strong>, entran automáticamente en un <strong>Duelo Directo</strong> con las mismas preguntas sincronizadas en tiempo real.
                </p>
              </div>

              {/* Victory Royale */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span>Condición de Victoria Royale</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Sé el último jugador con vida o el explorador con mayor puntuación y zonas dominadas para coronarte como <strong>Campeón Royale</strong>.
                </p>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => setShowDifficultyInfo(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
