'use client'

import { useState } from 'react'
import GameMap from '@/components/GameMap'
import CombatInterface from '@/components/CombatInterface'
import { GAME_CATEGORIES, CategoryKey } from '@/config/mapConfig'
import { getQuestionsForZone, Question } from '@/config/questionBank'
import { MapPin, ShieldCheck, Globe, BookOpen, Trophy, Landmark, Swords, CheckCircle2 } from 'lucide-react'

export default function DemoMapPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('geografia')
  const [activeCombat, setActiveCombat] = useState<{
    zoneName: string
    question: Question
  } | null>(null)

  const [extractedData, setExtractedData] = useState<{
    zoneId: string
    questions: Question[]
  }>({
    zoneId: 'archipielago-fisico',
    questions: getQuestionsForZone('geografia', 'archipielago-fisico', 3)
  })

  const categoryIcons: Record<CategoryKey, any> = {
    general: BookOpen,
    geografia: Globe,
    cultura_general: BookOpen,
    deportes: Trophy,
    historia: Landmark
  }

  const handleZoneSelect = (subzoneId: string, questions: Question[]) => {
    setExtractedData({
      zoneId: subzoneId,
      questions
    })

    // Abrir automáticamente el combate de prueba para la primera pregunta de la zona
    if (questions && questions.length > 0) {
      setActiveCombat({
        zoneName: subzoneId,
        question: questions[0]
      })
    }
  }

  const handleSimulateCombat = () => {
    const questions = getQuestionsForZone(selectedCategory, extractedData.zoneId, 1)
    setActiveCombat({
      zoneName: extractedData.zoneId,
      question: questions[0]
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 relative overflow-hidden font-sans">
      
      {/* Top Demo Bar */}
      <header className="w-full max-w-md flex flex-col gap-3 z-10 py-3 mb-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase">
                INTERFAZ DE COMBATE & MAPA
              </h1>
              <p className="text-[10px] text-slate-400">Simulación del temporizador de 10s</p>
            </div>
          </div>

          <button
            onClick={handleSimulateCombat}
            className="flex items-center gap-1.5 text-[11px] text-slate-950 font-black bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 px-3 py-1.5 rounded-full shadow-lg transition-all active:scale-95"
          >
            <Swords className="w-4 h-4" />
            <span>Simular Combate (10s)</span>
          </button>
        </div>

        {/* Category Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(Object.keys(GAME_CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = GAME_CATEGORIES[key]
            const Icon = categoryIcons[key]
            const isSelected = selectedCategory === key

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key)
                  const firstZone = cat.levels[cat.levels.length - 1].subzones[0].id
                  const q = getQuestionsForZone(key, firstZone, 3)
                  setExtractedData({
                    zoneId: firstZone,
                    questions: q
                  })
                }}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{cat.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Render Interactive Game Map */}
      <main className="w-full max-w-md flex-1 space-y-4">
        <GameMap 
          categoryKey={selectedCategory} 
          onSelectZone={handleZoneSelect}
        />
      </main>

      {/* Fullscreen Combat Interface Overlay */}
      {activeCombat && (
        <CombatInterface
          questions={extractedData.questions}
          question={activeCombat.question}
          zoneName={activeCombat.zoneName}
          zoneId={extractedData.zoneId}
          duration={8}
          onAnswer={(selectedIdx, isCorrect) => {
            console.log('Resultado de respuesta:', { selectedIdx, isCorrect })
          }}
          onClose={() => setActiveCombat(null)}
        />
      )}

    </div>
  )
}
