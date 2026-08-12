import { Globe, Users, ShieldCheck, KeyRound, Play } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl w-full flex flex-col items-center text-center z-10 space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 tracking-wide uppercase shadow-inner">
          <Globe className="w-4 h-4 animate-spin-slow text-emerald-400" />
          <span>Geo-Royale • Entorno Local Listo</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Geo-Royale
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto font-medium">
            Juego multijugador online de geolocalización en tiempo real. Compite con tus amigos en salas privadas con código PIN.
          </p>
        </div>

        {/* Join / Create Room Demo Card */}
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          <div className="text-left space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              Unirse a Sala Privada
            </h2>
            <p className="text-xs text-slate-400">Introduce el PIN de 6 dígitos para entrar a la partida</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="Ej. 482910"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              <Play className="w-4 h-4 fill-current" />
              Entrar
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>¿Quieres ser el anfitrión?</span>
            <button className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Crear nueva sala
            </button>
          </div>
        </div>

        {/* Local Env & Supabase Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl pt-6">
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-left space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Next.js 16 + Tailwind CSS v4
            </div>
            <p className="text-xs text-slate-500">App Router configurado y funcional</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-left space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Conexión Supabase Local
            </div>
            <p className="text-xs text-slate-500">@supabase/ssr y cliente listos en src/lib/supabase</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-left space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Salas por PIN
            </div>
            <p className="text-xs text-slate-500">Arquitectura de partidas privadas preparada</p>
          </div>
        </div>

      </div>
    </main>
  )
}
