'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Users, KeyRound, Sparkles, ArrowRight, RefreshCw, ChevronLeft, AlertCircle, Layers, Crown, Shield, Flame, UserPlus, Zap, Gamepad2, Compass, Info, X, Clock, Heart, Skull, Plus, Minus } from 'lucide-react'
import { 
  checkRoomExists, 
  joinOrCreateRoom, 
  getRoomCategoryKey, 
  getRoomDifficultyMode, 
  getRoomMaxPlayers, 
  getTabPlayerName, 
  setTabPlayerName, 
  getTabAvatar, 
  setTabAvatar 
} from '@/lib/supabase/playersService'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'
import { DIFFICULTY_SETTINGS, DifficultyMode } from '@/config/gameConfig'

type ScreenMode = 'main' | 'join' | 'create'

const AVATAR_OPTIONS = ['🦊', '🤖', '👽', '🤠', '👻', '🦖', '🦁', '🚀', '👑', '🐼', '🦄', '🐯']
const PLAYER_PRESETS = [
  { label: 'Duelo', count: 2 },
  { label: 'Squad', count: 4 },
  { label: 'Grupo', count: 8 },
  { label: 'Máx', count: 12 }
]

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<ScreenMode>('main')
  const [nickname, setNickname] = useState<string>('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊')
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('geografia')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyMode>('normal')
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState<number>(4)
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDifficultyInfo, setShowDifficultyInfo] = useState<boolean>(false)

  const activeCategoryConfig = GAME_CATEGORIES[selectedCategory] || GAME_CATEGORIES.geografia

  // Refs for 4-digit PIN input focus management
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // Pre-fill tab-isolated default nickname and avatar
  useEffect(() => {
    const savedName = getTabPlayerName()
    const savedAvatar = getTabAvatar()
    
    if (savedName) {
      setNickname(savedName)
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const newNick = `Explorador_${randomSuffix}`
      setNickname(newNick)
      setTabPlayerName(newNick)
    }

    if (savedAvatar) {
      setSelectedAvatar(savedAvatar)
    } else {
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
      setSelectedAvatar(randomAvatar)
      setTabAvatar(randomAvatar)
    }
  }, [])

  // Auto focus first PIN input when switching to 'join' mode
  useEffect(() => {
    if (mode === 'join') {
      setErrorMessage(null)
      setTimeout(() => {
        pinInputRefs[0].current?.focus()
      }, 100)
    }
  }, [mode])

  // Handle PIN digit change
  const handlePinChange = (index: number, value: string) => {
    setErrorMessage(null)
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)

    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus()
    }
  }

  // Handle backspace key on PIN inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus()
    }
  }

  // Handle Join Submission (Invitado)
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const fullPin = pin.join('')
    if (fullPin.length !== 4) return

    const playerNick = nickname.trim() || `Explorador_${Math.floor(1000 + Math.random() * 9000)}`
    setIsJoining(true)

    try {
      // 1. Verify if room exists in Supabase
      const roomExists = await checkRoomExists(fullPin)

      if (!roomExists) {
        setIsJoining(false)
        setErrorMessage(`No existe ninguna sala activa con el PIN ${fullPin}. Comprueba el código o crea una nueva sala.`)
        return
      }

      // 2. Fetch the host's room category_key, difficulty_mode & max_players from Supabase
      const roomCategory = await getRoomCategoryKey(fullPin)
      const roomDifficulty = await getRoomDifficultyMode(fullPin)
      const roomMax = await getRoomMaxPlayers(fullPin)

      // 3. Register guest player in Supabase active_players
      await joinOrCreateRoom(fullPin, playerNick, roomCategory, selectedAvatar, roomDifficulty, roomMax)
      setTabPlayerName(playerNick)
      setTabAvatar(selectedAvatar)

      // 4. Navigation to /sala/[pin]
      setIsJoining(false)
      router.push(`/sala/${fullPin}`)
    } catch (error) {
      console.error('Error joining room:', error)
      setIsJoining(false)
      setErrorMessage('Error al conectar con la sala. Inténtalo de nuevo.')
    }
  }

  // Handle Create Room Submission (Anfitrión)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const playerNick = nickname.trim() || `Anfitrion_${Math.floor(1000 + Math.random() * 9000)}`
    setIsCreating(true)

    try {
      // 1. Generate random 4-digit PIN
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString()

      // 2. Register host player in Supabase active_players with selectedMaxPlayers
      await joinOrCreateRoom(generatedPin, playerNick, selectedCategory, selectedAvatar, selectedDifficulty, selectedMaxPlayers)
      setTabPlayerName(playerNick)
      setTabAvatar(selectedAvatar)

      // 3. Navigation to /sala/[pin]
      setIsCreating(false)
      router.push(`/sala/${generatedPin}`)
    } catch (error) {
      console.error('Error creating room:', error)
      setIsCreating(false)
      setErrorMessage('Error al crear la sala. Inténtalo de nuevo.')
    }
  }

  const isPinComplete = pin.every((digit) => digit !== '')

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Lighting & Glow Mesh */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-600/20 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-32 right-0 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header Status */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2 pb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-xs font-semibold text-white/80 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Geo-Royale Online</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-indigo-300 shadow-lg">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{activeCategoryConfig.name}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center z-10 py-2">

        {/* Hero Title & Crown (Only in Main Menu) */}
        {mode === 'main' && (
          <div className="text-center space-y-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-2xl backdrop-blur-md mb-2">
              <Crown className="w-8 h-8 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              GEO-ROYALE
            </h1>
          </div>
        )}

        {/* Player Profile Setup Card (Only in Main Menu) */}
        {mode === 'main' && (
          <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-2xl rounded-2xl p-4 sm:p-5 mb-5 space-y-4 animate-in fade-in duration-300">
            
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> Tu Perfil
              </span>
            </div>

            {/* Avatar Horizontal Ribbon */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                <span>Elige tu Avatar</span>
                <span className="text-[11px] text-indigo-400 font-bold">
                  {selectedAvatar} Seleccionado
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
                {AVATAR_OPTIONS.map((emoji) => {
                  const isSelected = selectedAvatar === emoji
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(emoji)
                        setTabAvatar(emoji)
                      }}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 bg-indigo-500/20 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.4)] grayscale-0 opacity-100 border border-indigo-400/50'
                          : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100 bg-black/20 border border-white/[0.05]'
                      }`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nickname Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                <span>Nombre de Combate</span>
                <button 
                  type="button"
                  onClick={() => {
                    const newNick = `Explorador_${Math.floor(1000 + Math.random() * 9000)}`
                    setNickname(newNick)
                    setTabPlayerName(newNick)
                  }}
                  className="text-white/50 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Aleatorio
                </button>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value)
                    setTabPlayerName(e.target.value)
                  }}
                  placeholder="Escribe tu apodo..."
                  maxLength={20}
                  className="w-full bg-black/40 border-b border-white/20 focus:border-indigo-500 focus:bg-black/60 rounded-xl px-4 py-3 text-base sm:text-lg font-bold text-center text-white placeholder-white/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="w-full bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5 mb-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Mode Views */}
        <div className="w-full">
          
          {/* MAIN MENU MODE */}
          {mode === 'main' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Primary Button: Create Room */}
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/50 hover:bg-indigo-500 text-white font-black text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-95 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="tracking-wide">Crear Sala</span>
                </div>
                <Compass className="w-5 h-5 text-indigo-200 group-hover:rotate-45 transition-transform" />
              </button>

              {/* Secondary Button: Join Room (Ghost / Glass Style) */}
              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-95 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 text-white/70 group-hover:text-white">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <span className="tracking-wide">Unirse a Partida</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

            </div>
          )}

          {/* CREATE ROOM MODE (TACTICAL CONFIGURATION MENU) */}
          {mode === 'create' && (
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-2xl rounded-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200 pb-24 sm:pb-5">
              
              {/* Tactical Top Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <button
                  type="button"
                  onClick={() => setMode('main')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Configuración de Sala
                </span>
              </div>

              {/* Locked Player Profile Summary */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                    {selectedAvatar}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> Anfitrión
                    </div>
                    <div className="text-sm font-black text-white truncate max-w-[160px] sm:max-w-[200px]">
                      {nickname || 'Anfitrión'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                  Perfil fijado
                </span>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-5">
                
                {/* Tactical Mission Banner */}
                <div className="p-3.5 rounded-xl border border-white/[0.08] bg-black/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {activeCategoryConfig.name}
                      </h4>
                      <p className="text-[11px] text-white/50 font-medium">
                        Pirámide de 5 Niveles • 12 Disciplinas
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white/5 text-white/70 border border-white/10 px-2 py-0.5 rounded-full">
                    MVP General
                  </span>
                </div>

                {/* Tactical Stepper: Max Players Selector (2 to 12) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                    <span className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Capacidad de Jugadores
                    </span>
                    <span className="text-[10px] font-mono text-white/50 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      2 - 12 Jugadores
                    </span>
                  </div>

                  {/* Stepper Main Box */}
                  <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                    {/* Minus Button */}
                    <button
                      type="button"
                      disabled={selectedMaxPlayers <= 2}
                      onClick={() => setSelectedMaxPlayers((prev) => Math.max(2, prev - 1))}
                      className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Reducir jugadores"
                    >
                      <Minus className="w-5 h-5 text-white" />
                    </button>

                    {/* Center Counter Display */}
                    <div className="flex-1 text-center space-y-0.5">
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-3xl font-black text-white font-mono tracking-tight">
                          {selectedMaxPlayers}
                        </span>
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Jugadores
                        </span>
                      </div>
                      <p className="text-[10.5px] font-medium text-white/50">
                        {selectedMaxPlayers === 2
                          ? 'Duelo 1v1 • Máxima tensión'
                          : selectedMaxPlayers <= 4
                          ? 'Escuadrón • Partida recomendada'
                          : selectedMaxPlayers <= 8
                          ? 'Grupo • Alta competencia'
                          : 'Batalla Masiva • Caos total (12 Máx)'}
                      </p>
                    </div>

                    {/* Plus Button */}
                    <button
                      type="button"
                      disabled={selectedMaxPlayers >= 12}
                      onClick={() => setSelectedMaxPlayers((prev) => Math.min(12, prev + 1))}
                      className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Aumentar jugadores"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Quick Presets Chips */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {PLAYER_PRESETS.map((preset) => {
                      const isSelected = selectedMaxPlayers === preset.count
                      return (
                        <button
                          key={preset.count}
                          type="button"
                          onClick={() => setSelectedMaxPlayers(preset.count)}
                          className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-[1.02]'
                              : 'bg-black/30 border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-black leading-tight">{preset.count}</div>
                          <div className="text-[9px] font-semibold opacity-70 leading-tight">{preset.label}</div>
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-[10.5px] text-white/40 font-medium px-1 text-center sm:text-left">
                    La partida se iniciará automáticamente en cuanto entren los {selectedMaxPlayers} jugadores y marquen Listo.
                  </p>
                </div>

                {/* Visual Cards: Difficulty Selector (Clean, without subtext) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" /> Modo de Dificultad
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDifficultyInfo(true)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver diferencias</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Normal Mode Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('normal')}
                      className={`py-3.5 px-4 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                        selectedDifficulty === 'normal'
                          ? 'border-blue-500/50 bg-blue-500/15 ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <span className="text-base">🛡️</span>
                      <span className="text-xs font-black text-white">Modo Normal</span>
                    </button>

                    {/* Hardcore Mode Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedDifficulty('hard')}
                      className={`py-3.5 px-4 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                        selectedDifficulty === 'hard'
                          ? 'border-rose-500/50 bg-rose-500/15 ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <span className="text-base">🔥</span>
                      <span className="text-xs font-black text-rose-300">Modo Hardcore</span>
                    </button>

                  </div>
                </div>

                {/* Sticky Bottom CTA (Mobile First & Desktop) */}
                <div className="fixed sm:static bottom-0 left-0 w-full p-4 sm:p-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent sm:bg-none z-20">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Crear Sala ({selectedMaxPlayers} Jugadores)</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* JOIN ROOM MODE (PIN ENTRY) */}
          {mode === 'join' && (
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-2xl rounded-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('main')
                    setErrorMessage(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Unirse con PIN</span>
              </div>

              {/* Locked Player Profile Summary */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                    {selectedAvatar}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> Jugador Invitado
                    </div>
                    <div className="text-sm font-black text-white truncate max-w-[160px] sm:max-w-[200px]">
                      {nickname || 'Explorador'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                  Perfil fijado
                </span>
              </div>

              {/* PIN Code Fields */}
              <form onSubmit={handleJoinSubmit} className="space-y-5">
                <div className="space-y-3 text-center">
                  <p className="text-xs text-white/70 font-semibold">Introduce el código PIN de 4 dígitos</p>
                  
                  {/* 4 Digit Slots */}
                  <div className="flex justify-center gap-2.5 pt-1">
                    {pin.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={pinInputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-14 h-16 sm:w-16 sm:h-20 bg-black/40 border-2 border-white/15 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-2xl text-center text-2xl sm:text-3xl font-mono font-black text-indigo-300 focus:outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {/* Enter CTA */}
                <button
                  type="submit"
                  disabled={!isPinComplete || isJoining}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer ${
                    isPinComplete && !isJoining
                      ? 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white'
                      : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {isJoining ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar a la Sala</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center py-2 z-10">
        <p className="text-[11px] text-white/40 font-medium">
          Geo-Royale • Batalla de conocimiento en tiempo real
        </p>
      </footer>

      {/* Difficulty Comparison Info Modal */}
      {showDifficultyInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowDifficultyInfo(false)}
        >
          <div 
            className="bg-[#0e1424] border border-white/10 p-5 sm:p-6 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Comparativa de Modos</h3>
                  <p className="text-[11px] text-white/50">Métricas y balance de combate</p>
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

            {/* Mode Comparison Cards */}
            <div className="space-y-3">
              {/* Normal Mode */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                    🛡️ Modo Normal
                  </span>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Equilibrado
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Tiempo</div>
                    <div className="text-xs font-black text-white">8s</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Heart className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Curación</div>
                    <div className="text-xs font-black text-emerald-400">+10 a +20 HP</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Skull className="w-3.5 h-3.5 text-rose-400 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Daño / Fallo</div>
                    <div className="text-xs font-black text-rose-300">15 - 75 HP</div>
                  </div>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed pt-1">
                  8 segundos por pregunta (5s en Nivel 5). Permite recuperarse mediante curaciones por acierto consecutivo en Niveles 3, 4 y 5.
                </p>
              </div>

              {/* Hardcore Mode */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                    🔥 Modo Hardcore
                  </span>
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Extremo &bull; Daño Letal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-rose-400 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Tiempo</div>
                    <div className="text-xs font-black text-white">5s</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Heart className="w-3.5 h-3.5 text-zinc-400 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Curación</div>
                    <div className="text-xs font-black text-zinc-300">0 a +10 HP</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                    <Skull className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                    <div className="text-[9.5px] text-white/50">Daño / Fallo</div>
                    <div className="text-xs font-black text-rose-400">25 - 100 HP</div>
                  </div>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed pt-1">
                  Ráfaga frenética de 5 segundos. Daño masivo de 25 a 100 HP (un fallo en Nivel 5 es eliminación instantánea). Curaciones mínimas.
                </p>
              </div>
            </div>

            {/* Close Button */}
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
