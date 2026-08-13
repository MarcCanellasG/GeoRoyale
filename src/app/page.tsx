'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Users, KeyRound, Sparkles, ArrowRight, MapPin, RefreshCw, ChevronLeft, AlertCircle, Layers, BookOpen, Trophy, Landmark, CheckCircle2, Gamepad2, Smile } from 'lucide-react'
import { checkRoomExists, joinOrCreateRoom, getRoomCategoryKey } from '@/lib/supabase/playersService'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'

type ScreenMode = 'main' | 'join' | 'create'

const AVATAR_OPTIONS = ['🦊', '🤖', '👽', '🤠', '👻', '🦖', '🦁', '🚀', '👑', '🐼', '🦄', '🐯']

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<ScreenMode>('main')
  const [nickname, setNickname] = useState<string>('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🦊')
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('geografia')
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Active Category Theme styling
  const activeCategoryConfig = GAME_CATEGORIES[selectedCategory] || GAME_CATEGORIES.geografia
  const currentTheme = activeCategoryConfig.theme

  // Refs for 4-digit PIN input focus management
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // Pre-fill a fun default nickname and avatar if stored
  useEffect(() => {
    const savedName = localStorage.getItem('geo_royale_current_player')
    const savedAvatar = localStorage.getItem('geo_royale_current_avatar')
    
    if (savedName) {
      setNickname(savedName)
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      setNickname(`Jugador_${randomSuffix}`)
    }

    if (savedAvatar) {
      setSelectedAvatar(savedAvatar)
    } else {
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
      setSelectedAvatar(randomAvatar)
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

  // Handle Join Submission (Invitado) - 100% Non-Blocking & Instant
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const fullPin = pin.join('')
    if (fullPin.length !== 4) return

    const playerNick = nickname.trim() || `Jugador_${Math.floor(1000 + Math.random() * 9000)}`
    setIsJoining(true)

    try {
      // 1. Verify if room exists in Supabase/local (Max 400ms timeout)
      const roomExists = await checkRoomExists(fullPin)

      if (!roomExists) {
        setIsJoining(false)
        setErrorMessage(`No existe ninguna sala activa con el PIN ${fullPin}. Comprueba el código o crea una nueva sala.`)
        return
      }

      // 2. Fetch the host's room category_key (Max 400ms timeout)
      const roomCategory = await getRoomCategoryKey(fullPin)

      // 3. Register guest player with the SAME room category_key & selectedAvatar
      joinOrCreateRoom(fullPin, playerNick, roomCategory, selectedAvatar)
      localStorage.setItem('geo_royale_current_player', playerNick)
      localStorage.setItem('geo_royale_current_avatar', selectedAvatar)

      // 4. Instant navigation to /sala/[pin]
      setIsJoining(false)
      router.push(`/sala/${fullPin}`)
    } catch (error) {
      console.error('Error joining room:', error)
      setIsJoining(false)
      setErrorMessage('Error al conectar con la sala. Inténtalo de nuevo.')
    }
  }

  // Handle Create Room Submission (Anfitrión) - 100% Non-Blocking & Instant
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const playerNick = nickname.trim() || `Host_${Math.floor(1000 + Math.random() * 9000)}`
    setIsCreating(true)

    try {
      // 1. Generate random 4-digit PIN
      const generatedPin = Math.floor(1000 + Math.random() * 9000).toString()

      // 2. Register host player with selectedCategory & selectedAvatar
      joinOrCreateRoom(generatedPin, playerNick, selectedCategory, selectedAvatar)
      localStorage.setItem('geo_royale_current_player', playerNick)
      localStorage.setItem('geo_royale_current_avatar', selectedAvatar)

      // 3. Instant navigation to /sala/[pin]
      setIsCreating(false)
      router.push(`/sala/${generatedPin}`)
    } catch (error) {
      console.error('Error creating room:', error)
      setIsCreating(false)
      setErrorMessage('Error al crear la sala.')
    }
  }

  const categoryIconMap = {
    geografia: Globe,
    cultura_general: BookOpen,
    deportes: Trophy,
    historia: Landmark
  }

  const isPinComplete = pin.every((digit) => digit !== '')

  return (
    <div className={`min-h-screen bg-slate-950 bg-gradient-to-b ${currentTheme.bgGradient} text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans transition-all duration-500 selection:bg-emerald-500 selection:text-slate-950`}>
      
      {/* Dynamic Theme Glow Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header Status */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2 pb-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-xs font-bold text-slate-200 shadow-md backdrop-blur-md">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>Juego Multijugador</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-colors ${currentTheme.badgeClass}`}>
          <span>{activeCategoryConfig.name}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center z-10 py-2">

        {/* Friendly Hero Title */}
        <div className="text-center space-y-1.5 mb-4 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-1">
            <Sparkles className="w-7 h-7 text-amber-400 animate-spin-slow" />
          </div>
          <h1 className={`text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r ${currentTheme.heroTitleGradient} bg-clip-text text-transparent uppercase drop-shadow-md`}>
            GEO-ROYALE
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xs mx-auto font-medium">
            ¡El juego de preguntas y mapas para jugar con amigos y familia!
          </p>
        </div>

        {/* Player Profile & Avatar Selector Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-4 rounded-3xl shadow-xl mb-4 space-y-3 transition-all">
          
          {/* Avatar Selector Horizontal Ribbon */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" /> Elige tu Avatar
              </span>
              <span className="text-[11px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {selectedAvatar} Seleccionado
              </span>
            </label>

            {/* Horizontal Scrollable Emoji Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none">
              {AVATAR_OPTIONS.map((emoji) => {
                const isSelected = selectedAvatar === emoji
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(emoji)
                      localStorage.setItem('geo_royale_current_avatar', emoji)
                    }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400/20 border-2 border-amber-400 ring-2 ring-amber-400/30 scale-110 shadow-lg shadow-amber-400/20'
                        : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Nombre de Jugador</span>
              <button 
                type="button"
                onClick={() => setNickname(`Jugador_${Math.floor(1000 + Math.random() * 9000)}`)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Aleatorio
              </button>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                localStorage.setItem('geo_royale_current_player', e.target.value)
              }}
              placeholder="Escribe tu apodo..."
              maxLength={20}
              className="w-full bg-slate-950/90 border border-slate-700/60 rounded-2xl px-4 py-2.5 text-sm text-slate-100 font-extrabold focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
            />
          </div>

        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="w-full bg-rose-500/15 border border-rose-500/40 p-3.5 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5 mb-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Mode Views */}
        <div className="w-full">
          
          {/* MAIN MENU MODE */}
          {mode === 'main' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Join Game Button */}
              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-base py-3.5 px-6 rounded-3xl shadow-xl shadow-emerald-500/20 flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-slate-950/20 text-slate-950">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <span className="tracking-wide">Unirse a Partida</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Create Game Button */}
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full group bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-extrabold text-base py-3.5 px-6 rounded-3xl shadow-lg flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="tracking-wide">Crear Sala</span>
                </div>
                <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              </button>

            </div>
          )}

          {/* CREATE ROOM MODE (WITH DYNAMIC CATEGORY THEMES) */}
          {mode === 'create' && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <button
                  type="button"
                  onClick={() => setMode('main')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Elige la Temática
                </span>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                
                {/* 2x2 Dynamic Theme Category Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(GAME_CATEGORIES) as CategoryKey[]).map((key) => {
                    const cat = GAME_CATEGORIES[key]
                    const Icon = categoryIconMap[key] || Globe
                    const isSelected = selectedCategory === key

                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left space-y-2 relative overflow-hidden ${
                          isSelected
                            ? `${cat.theme.cardBg} ${cat.theme.activeBorder} shadow-xl scale-[1.02]`
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-2 rounded-xl border ${cat.badgeColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in" />
                          )}
                        </div>

                        <div>
                          <h4 className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {cat.name}
                          </h4>
                          <p className="text-[10px] text-slate-300 leading-tight mt-1 line-clamp-2 font-medium">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Selected Category Summary Banner */}
                <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-2xl text-center text-xs text-slate-200 font-bold">
                  Modo Seleccionado: <span className="text-amber-400">{activeCategoryConfig.name}</span>
                </div>

                {/* Submit Create Button */}
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`w-full py-3.5 px-6 bg-gradient-to-r ${currentTheme.buttonClass} font-black text-base rounded-3xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Crear Sala y Generar PIN</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

          {/* JOIN ROOM MODE (PIN ENTRY) */}
          {mode === 'join' && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Top Header inside card */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('main')
                    setErrorMessage(null)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Unirse con PIN</span>
              </div>

              {/* PIN Code Fields */}
              <form onSubmit={handleJoinSubmit} className="space-y-5">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-slate-200 font-bold">Introduce el PIN de 4 dígitos</p>
                  
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
                        className="w-13 h-16 sm:w-16 sm:h-20 bg-slate-950 border-2 border-slate-700/80 rounded-2xl text-center text-2xl sm:text-3xl font-mono font-black text-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {/* Enter Button */}
                <button
                  type="submit"
                  disabled={!isPinComplete || isJoining}
                  className={`w-full py-3.5 px-6 rounded-3xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isPinComplete && !isJoining
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:from-emerald-300 hover:to-cyan-300 active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  {isJoining ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
        <p className="text-[11px] text-slate-400 font-medium">
          Geo-Royale • Partidas divertidas para todos en tiempo real
        </p>
      </footer>

    </div>
  )
}
