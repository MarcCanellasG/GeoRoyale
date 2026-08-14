'use client'

import { useState, useEffect, useRef } from 'react'
import { Crown, MapPin, Skull, Zap, Radio, Compass, Info, X, CheckCircle2, Lock, Navigation, Swords, Check, Clock } from 'lucide-react'
import { GAME_CATEGORIES, CategoryKey, MapLevel, SubZone } from '@/config/mapConfig'
import { getQuestionsForZone, Question } from '@/config/questionBank'
import { ActivePlayer, updatePlayerZone, broadcastGameState, sendPlayerReady } from '@/lib/supabase/playersService'

interface GameMapProps {
  categoryKey?: CategoryKey
  currentZoneId?: string
  eliminatedZoneIds?: string[]
  players?: ActivePlayer[]
  currentPlayerName?: string
  roomPin?: string
  gamePhase?: string
  readyMap?: Record<string, boolean>
  onSelectZone?: (subzoneId: string, questions: Question[]) => void
  onToggleReady?: (playerName: string, isReady: boolean) => void
  onStartCombat?: (selectedZoneId: string) => void
}

const LANDING_TIMEOUT_SECONDS = 15

export default function GameMap({
  categoryKey = 'geografia',
  currentZoneId,
  eliminatedZoneIds = [],
  players = [],
  currentPlayerName = '',
  roomPin = '',
  gamePhase = 'ZONE_SELECTION',
  readyMap = {},
  onSelectZone,
  onToggleReady,
  onStartCombat
}: GameMapProps) {
  const categoryConfig = GAME_CATEGORIES[categoryKey] || GAME_CATEGORIES.geografia
  const levels = categoryConfig.levels

  // Find current player object
  const me = players.find((p) => p.player_name === currentPlayerName)

  const defaultZoneId = levels[levels.length - 1]?.subzones[0]?.id || 'archipielago-fisico'
  const [selectedZone, setSelectedZone] = useState<string>(me?.current_zone || currentZoneId || defaultZoneId)
  const [localReadyMap, setLocalReadyMap] = useState<Record<string, boolean>>(readyMap)
  const [landingTimer, setLandingTimer] = useState<number>(LANDING_TIMEOUT_SECONDS)

  // Track auto-transition trigger to avoid duplicate broadcasts
  const autoTransitionTriggeredRef = useRef<boolean>(false)

  useEffect(() => {
    setLocalReadyMap(readyMap)
  }, [readyMap])

  // Sync selectedZone if player's current_zone changes
  useEffect(() => {
    if (me?.current_zone) {
      setSelectedZone(me.current_zone)
    }
  }, [me?.current_zone])

  const activeZone = selectedZone || me?.current_zone || defaultZoneId
  const hasLanded = Boolean(activeZone)

  const [eliminatedSet, setEliminatedSet] = useState<Set<string>>(
    new Set(eliminatedZoneIds)
  )

  // Modals
  const [activeInfoZone, setActiveInfoZone] = useState<{
    zone: SubZone
    levelName: string
    colorClass: string
  } | null>(null)

  // Check if ALL connected players have selected a zone AND are marked ready
  const playersList = players.length > 0 ? players : [{ id: 'p1', room_pin: roomPin, player_name: currentPlayerName || 'Jugador', hp: 100 }]
  const playersWithZone = playersList.filter((p) => Boolean(p.current_zone || (p.player_name === currentPlayerName && activeZone)))
  
  const isMyReady = Boolean(currentPlayerName && localReadyMap[currentPlayerName])
  
  const allPlayersSelectedZone = playersWithZone.length === playersList.length
  const allPlayersReadyOnMap = playersList.every((p) => Boolean(localReadyMap[p.player_name])) || (playersList.length === 1 && isMyReady)
  const isAssaultReady = allPlayersSelectedZone && allPlayersReadyOnMap

  // 1. Landing Phase Countdown Timer (15 seconds)
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION') {
      setLandingTimer(LANDING_TIMEOUT_SECONDS)
      autoTransitionTriggeredRef.current = false
      return
    }

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
  }, [gamePhase])

  // 2. Auto-Assign Default Zone & Auto-Transition when Timer reaches 0s
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION' || landingTimer > 0) return
    if (autoTransitionTriggeredRef.current) return

    autoTransitionTriggeredRef.current = true

    const finalZone = activeZone || defaultZoneId
    setSelectedZone(finalZone)

    if (roomPin && currentPlayerName) {
      updatePlayerZone(roomPin, currentPlayerName, finalZone)
      sendPlayerReady(roomPin, currentPlayerName, true)
    }

    setLocalReadyMap((prev) => ({ ...prev, [currentPlayerName]: true }))

    // Trigger combat transition for all clients and local player
    if (roomPin) {
      broadcastGameState(roomPin, 'COMBAT', { activeZoneId: finalZone })
    }
    if (onStartCombat) {
      onStartCombat(finalZone)
    }
  }, [landingTimer, gamePhase, activeZone, defaultZoneId, roomPin, currentPlayerName, onStartCombat])

  // 3. Automatic Transition to COMBAT when 100% of players are ready
  useEffect(() => {
    if (gamePhase !== 'ZONE_SELECTION') return
    if (isAssaultReady && !autoTransitionTriggeredRef.current) {
      autoTransitionTriggeredRef.current = true
      
      const finalZone = activeZone || defaultZoneId
      if (roomPin) {
        broadcastGameState(roomPin, 'COMBAT', { activeZoneId: finalZone })
      }
      if (onStartCombat) {
        onStartCombat(finalZone)
      }
    }
  }, [isAssaultReady, gamePhase, activeZone, defaultZoneId, roomPin, onStartCombat])

  const handleZoneClick = (subzone: SubZone, isLevel1: boolean) => {
    if (eliminatedSet.has(subzone.id)) return

    // Validacion de Aterrizaje: Si estamos en ZONE_SELECTION y el jugador no ha aterrizado, solo Nivel 1 es clicable
    const isLandingPhase = gamePhase === 'ZONE_SELECTION'
    if (isLandingPhase && !hasLanded && !isLevel1) {
      return
    }

    setSelectedZone(subzone.id)

    // Actualiza la subzona en Supabase y estado local
    if (roomPin && currentPlayerName) {
      updatePlayerZone(roomPin, currentPlayerName, subzone.id)
    }

    const questions = getQuestionsForZone(categoryKey, subzone.id, 3)
    if (onSelectZone) {
      onSelectZone(subzone.id, questions)
    }
  }

  const handleToggleZoneReady = () => {
    if (!currentPlayerName) return
    const finalZone = activeZone || defaultZoneId
    if (!me?.current_zone && roomPin) {
      updatePlayerZone(roomPin, currentPlayerName, finalZone)
    }

    const nextState = !isMyReady
    setLocalReadyMap((prev) => ({ ...prev, [currentPlayerName]: nextState }))

    if (roomPin) {
      sendPlayerReady(roomPin, currentPlayerName, nextState)
    }

    if (onToggleReady) {
      onToggleReady(currentPlayerName, nextState)
    }
  }

  const toggleEliminate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(eliminatedSet)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setEliminatedSet(next)
  }

  const openInfoModal = (zone: SubZone, levelName: string, colorClass: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveInfoZone({ zone, levelName, colorClass })
  }

  // Texturas de fondo por nivel
  const getLevelBackgroundTexture = (level: number) => {
    switch (level) {
      case 4: // Épico (Dorado/Amber)
        return 'bg-slate-900/90 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_70%)]'
      case 3: // Difícil (Carmesí/Rose)
        return 'bg-slate-900/70 bg-[repeating-linear-gradient(45deg,rgba(244,63,94,0.03)_0,rgba(244,63,94,0.03)_8px,transparent_8px,transparent_16px)]'
      case 2: // Medio (Azul Zafiro/Sky)
        return 'bg-slate-900/70 bg-[radial-gradient(rgba(56,189,248,0.08)_1px,transparent_1px)] [background-size:12px_12px]'
      case 1: // Fácil (Verde Esmeralda)
      default:
        return 'bg-slate-900/70 bg-[radial-gradient(rgba(16,185,129,0.08)_1px,transparent_1px)] [background-size:10px_10px]'
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between p-2 sm:p-3 space-y-3 font-sans relative">
      
      {/* Header Badge with Landing Countdown Timer */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow shrink-0" />
          <span className="font-bold text-slate-200">{categoryConfig.subtitle}</span>
        </div>
        
        {/* Landing Timer & Player Ready Counter */}
        <div className="flex items-center gap-2">
          {gamePhase === 'ZONE_SELECTION' && (
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-black shadow-sm ${
              landingTimer <= 5
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-ping'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{landingTimer}s</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 shrink-0">
            <span>{playersWithZone.length}/{playersList.length} Zonas</span>
          </div>
        </div>
      </div>

      {/* Landing Phase Instruction Banner */}
      {!hasLanded && gamePhase === 'ZONE_SELECTION' && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-2.5 rounded-2xl text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <Navigation className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Toca una zona verde (Nivel 1) para desembarcar tu personaje.</span>
        </div>
      )}

      {/* Vertical Tower Pyramid Layout */}
      <div className="flex flex-col space-y-3 w-full">
        {levels.map((level) => {
          const isEpic = level.level === 4
          const isLevel3 = level.level === 3
          const isLevel2 = level.level === 2
          const isLevel1 = level.level === 1

          return (
            <div key={level.level} className="space-y-1.5 w-full">
              
              {/* Level Header Badge */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${level.colorTheme.indicator}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {level.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {level.subzones.length} {level.subzones.length === 1 ? 'Zona' : 'Subzonas'}
                </span>
              </div>

              {/* Grid Layout */}
              <div
                className={`grid gap-2 w-full ${
                  isLevel1 ? 'grid-cols-3' : isLevel2 || isLevel3 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {level.subzones.map((subzone) => {
                  const isCurrent = (me?.current_zone === subzone.id) || activeZone === subzone.id
                  const isEliminated = eliminatedSet.has(subzone.id)

                  // Bloqueo de Aterrizaje: Si es fase de selección y no ha aterrizado, niveles 2, 3 y 4 están bloqueados
                  const isLocked = !hasLanded && gamePhase === 'ZONE_SELECTION' && !isLevel1

                  // Jugadores que se encuentran o han aterrizado en esta subzona
                  const landedPlayers = playersList.filter((p) => p.current_zone === subzone.id || (p.player_name === currentPlayerName && activeZone === subzone.id))

                  return (
                    <div
                      key={subzone.id}
                      onClick={() => handleZoneClick(subzone, isLevel1)}
                      className={`relative group rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm min-h-[76px] ${
                        isLocked
                          ? 'bg-slate-950/90 border-slate-900 opacity-60 cursor-not-allowed'
                          : isEliminated
                          ? 'bg-slate-950/80 border-slate-900 text-slate-600 grayscale opacity-40 cursor-pointer'
                          : isCurrent
                          ? 'bg-slate-900/90 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg scale-[1.01] z-10 cursor-pointer'
                          : `${getLevelBackgroundTexture(level.level)} ${level.colorTheme.border} hover:border-slate-700 cursor-pointer`
                      }`}
                    >
                      {/* Storm Overlay */}
                      {isEliminated && (
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(225,29,72,0.08)_0,rgba(225,29,72,0.08)_8px,transparent_8px,transparent_16px)] pointer-events-none" />
                      )}

                      {/* Top Row: Title + Indicator Dot / Lock */}
                      <div className="flex items-start justify-between w-full gap-1 z-10">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          {isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          ) : isEpic ? (
                            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${isEliminated ? 'bg-slate-600' : level.colorTheme.indicator}`} />
                          )}

                          <span
                            className={`font-bold tracking-tight leading-snug break-words ${
                              isEpic ? 'text-xs sm:text-sm text-amber-300' : isLevel1 ? 'text-[10.5px] sm:text-xs' : 'text-xs'
                            } ${
                              isLocked
                                ? 'text-slate-500 font-medium'
                                : isEliminated
                                ? 'text-slate-600 line-through'
                                : isCurrent
                                ? 'text-emerald-400 font-extrabold'
                                : 'text-slate-100'
                            }`}
                          >
                            {subzone.name}
                          </span>
                        </div>
                      </div>

                      {/* LANDED PLAYERS AVATARS BADGES CONTAINER */}
                      {landedPlayers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 my-1 z-10">
                          {landedPlayers.map((lp) => {
                            const isLpReady = Boolean(localReadyMap[lp.player_name])
                            return (
                              <div
                                key={lp.id || lp.player_name}
                                title={`${lp.player_name} (${lp.hp} HP)`}
                                className={`flex items-center gap-1 border px-1.5 py-0.5 rounded-full text-xs shadow-md animate-in zoom-in-75 duration-300 ${
                                  isLpReady
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                    : 'bg-slate-950/90 border-slate-700/80 text-slate-200'
                                }`}
                              >
                                <span className="text-xs sm:text-sm animate-bounce duration-500">{lp.avatar_icon || '🦊'}</span>
                                <span className="text-[9.5px] font-bold truncate max-w-[60px]">{lp.player_name}</span>
                                {isLpReady && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Bottom Row: Info Popup Only */}
                      <div className="flex items-center justify-between w-full pt-1.5 z-10 mt-auto">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openInfoModal(subzone, level.name, level.colorTheme.text, e)}
                            title="Ver información de la subzona"
                            className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700/60 transition-colors"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status / Storm Toggle */}
                        {isLocked ? (
                          <span className="text-[9px] text-slate-500 font-mono">Bloqueada</span>
                        ) : isEliminated ? (
                          <div className="flex items-center gap-1 text-rose-400 text-[10px]" title="Zona devorada">
                            <Skull className="w-3.5 h-3.5 text-rose-500/80" />
                          </div>
                        ) : isCurrent ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-[9.5px] font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            <Zap className="w-2.5 h-2.5 fill-current animate-pulse" />
                            <span>Aquí</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => toggleEliminate(subzone.id, e)}
                            title="Simular Tormenta"
                            className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors px-1"
                          >
                            ⚡
                          </button>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>

            </div>
          )
        })}
      </div>

      {/* Confirmation Area (Strictly for ZONE_SELECTION, NO manual assault button) */}
      {gamePhase === 'ZONE_SELECTION' && roomPin && (
        <div className="sticky bottom-2 z-30 pt-2 space-y-2 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-2xl">
          
          {/* Player Individual Ready Button on Selected Zone */}
          <button
            type="button"
            onClick={handleToggleZoneReady}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
              isMyReady
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 ring-1 ring-emerald-400/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>{isMyReady ? '✓ Zona Confirmada (Pulsar para Cambiar)' : '¡Confirmar mi Zona y Marcar Listo!'}</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center font-medium pt-0.5">
            ⚡ El combate iniciará automáticamente cuando todos confirmen zona o venza el tiempo ({landingTimer}s).
          </div>
        </div>
      )}

      {/* Info Popover Modal */}
      {activeInfoZone && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveInfoZone(null)}
        >
          <div 
            className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {activeInfoZone.levelName}
                </span>
                <h4 className={`text-base font-black ${activeInfoZone.colorClass}`}>
                  {activeInfoZone.zone.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfoZone(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeInfoZone.zone.description}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInfoZone(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
