'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface EmotePickerProps {
  targetPlayerName: string
  onSelectEmote: (emote: string) => void
  onClose: () => void
}

const EMOTES = ['👍', '🔥', '😂', '👑', '💀', '⚔️', '🎯', '🚀']

export default function EmotePicker({
  targetPlayerName,
  onSelectEmote,
  onClose
}: EmotePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Listen for clicks outside the container and Escape key
  useEffect(() => {
    let active = true

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!active) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 50)

    return () => {
      active = false
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-900 border border-slate-700/90 p-3 rounded-2xl shadow-2xl ring-4 ring-slate-950/70 space-y-2 font-sans animate-in zoom-in-95 duration-150 relative min-w-[190px] backdrop-blur-2xl z-50 pointer-events-auto"
    >
      <div className="flex items-center justify-between px-1 text-[10.5px] font-black text-slate-400">
        <span className="tracking-wider">MI REACCIÓN</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
        {EMOTES.map((emote) => (
          <button
            key={emote}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectEmote(emote)
            }}
            className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/60 flex items-center justify-center text-xl transition-all active:scale-90 shadow-sm hover:scale-105 cursor-pointer"
          >
            {emote}
          </button>
        ))}
      </div>
    </div>
  )
}
