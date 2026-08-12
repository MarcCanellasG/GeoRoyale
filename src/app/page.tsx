'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, Users, KeyRound, Sparkles, ArrowRight, ShieldCheck, Trophy, MapPin, RefreshCw, ChevronLeft } from 'lucide-react'

type ScreenMode = 'main' | 'join' | 'create'

export default function Home() {
  const [mode, setMode] = useState<ScreenMode>('main')
  const [nickname, setNickname] = useState<string>('')
  const [pin, setPin] = useState<string[]>(['', '', '', ''])
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)

  // Game creation options
  const [rounds, setRounds] = useState<number>(5)
  const [timePerRound, setTimePerRound] = useState<number>(60)
  const [mapType, setMapType] = useState<string>('Mundo')

  // Refs for 4-digit PIN input focus management
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // Pre-fill a fun default nickname if empty
  useEffect(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setNickname(`Explorador_${randomSuffix}`)
  }, [])

  // Auto focus first PIN input when switching to 'join' mode
  useEffect(() => {
    if (mode === 'join') {
      setTimeout(() => {
        pinInputRefs[0].current?.focus()
      }, 100)
    }
  }, [mode])

  // Handle PIN digit change
  const handlePinChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)

    // Auto-focus next input if digit entered
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

  // Handle Join Submission
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullPin = pin.join('')
    if (fullPin.length !== 4) return
    setIsJoining(true)
    
    // Simulate connecting to room
    setTimeout(() => {
      setIsJoining(false)
      alert(`Conectando a la sala con PIN: ${fullPin} como ${nickname || 'Jugador'}`)
    }, 1000)
  }

  // Handle Create Room Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString()

    setTimeout(() => {
      setIsCreating(false)
      alert(`¡Sala Creada con Éxito!\nPIN de la Sala: ${generatedPin}\nRondas: ${rounds}\nTiempo por ronda: ${timePerRound}s\nMapa: ${mapType}`)
    }, 1000)
  }

  const isPinComplete = pin.every((digit) => digit !== '')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Decorative Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Bar / Status */}
      <header className="w-full max-w-md flex items-center justify-between z-10 pt-2 pb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-emerald-400 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Supabase Conectado</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/80">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>v1.0 • Multijugador</span>
        </div>
      </header>

      {/* Main Content Area (Mobile-First Container) */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center z-10 py-6">

        {/* Hero Title */}
        <div className="text-center space-y-2 mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-500/10">
            <MapPin className="w-8 h-8 text-emerald-400 animate-bounce" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent uppercase drop-shadow-sm">
            GEO-ROYALE
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto">
            Demuestra tus conocimientos geográficos compitiendo en salas privadas en tiempo real.
          </p>
        </div>

        {/* Player Profile Card (Nickname) */}
        <div className="w-full bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl shadow-xl mb-6 space-y-2 transition-all">
          <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Tu Apodo / Jugador</span>
            <button 
              type="button"
              onClick={() => setNickname(`Explorador_${Math.floor(1000 + Math.random() * 9000)}`)}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Aleatorio
            </button>
          </label>
          <div className="relative">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Introduce tu nombre..."
              maxLength={20}
              className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Dynamic Mode Views */}
        <div className="w-full">
          
          {/* MAIN MENU MODE */}
          {mode === 'main' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Join Game Button */}
              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-950/20 text-slate-950">
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
                className="w-full group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-base py-4 px-6 rounded-2xl shadow-md flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="tracking-wide">Crear Sala</span>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </button>

            </div>
          )}

          {/* JOIN ROOM MODE (PIN ENTRY) */}
          {mode === 'join' && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Top Header inside card */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMode('main')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Unirse con PIN</span>
              </div>

              {/* PIN Code Fields */}
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-slate-300 font-medium">Introduce el PIN de 4 dígitos</p>
                  
                  {/* 4 Digit Slots */}
                  <div className="flex justify-center gap-3 pt-2">
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
                        className="w-14 h-16 sm:w-16 sm:h-20 bg-slate-950 border-2 border-slate-700/80 rounded-2xl text-center text-2xl sm:text-3xl font-mono font-bold text-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {/* Enter Button */}
                <button
                  type="submit"
                  disabled={!isPinComplete || isJoining}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isPinComplete && !isJoining
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98]'
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

          {/* CREATE ROOM MODE */}
          {mode === 'create' && (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMode('main')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Volver
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Configurar Sala</span>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                
                {/* Rondas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Número de Rondas</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRounds(num)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          rounds === num
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {num} Rondas
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tiempo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tiempo por Ronda</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[30, 60, 90].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => setTimePerRound(seconds)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          timePerRound === seconds
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Mapa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tipo de Mapa</label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Mundo">Mundo (Países y Capitales)</option>
                    <option value="España">España (Provincias y Comunidades)</option>
                    <option value="Monumentos">Monumentos Famosos</option>
                  </select>
                </div>

                {/* Submit Create Button */}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Crear Sala Privada</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

        </div>

      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center py-3 z-10">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Geo-Royale • Partidas Privadas con PIN de 4 Dígitos</span>
        </p>
      </footer>

    </div>
  )
}
