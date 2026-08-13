'use client'

import { useState } from 'react'
import { Crown, MapPin, Skull, Zap, Radio, Compass, Info, X, HelpCircle, CheckCircle2 } from 'lucide-react'
import { GAME_CATEGORIES, CategoryKey, MapLevel, SubZone } from '@/config/mapConfig'
import { getQuestionsForZone, Question } from '@/config/questionBank'

interface GameMapProps {
  categoryKey?: CategoryKey
  currentZoneId?: string
  eliminatedZoneIds?: string[]
  onSelectZone?: (subzoneId: string, questions: Question[]) => void
}

export default function GameMap({
  categoryKey = 'geografia',
  currentZoneId,
  eliminatedZoneIds = [],
  onSelectZone
}: GameMapProps) {
  const categoryConfig = GAME_CATEGORIES[categoryKey] || GAME_CATEGORIES.geografia
  const levels = categoryConfig.levels

  const defaultCurrentZone = currentZoneId || levels[levels.length - 1]?.subzones[0]?.id || ''

  const [selectedZone, setSelectedZone] = useState<string>(defaultCurrentZone)
  const [eliminatedSet, setEliminatedSet] = useState<Set<string>>(
    new Set(eliminatedZoneIds)
  )

  // Modals
  const [activeInfoZone, setActiveInfoZone] = useState<{
    zone: SubZone
    levelName: string
    colorClass: string
  } | null>(null)

  const [activeQuestionsModal, setActiveQuestionsModal] = useState<{
    zone: SubZone
    questions: Question[]
  } | null>(null)

  const handleZoneClick = (subzone: SubZone) => {
    if (eliminatedSet.has(subzone.id)) return
    setSelectedZone(subzone.id)
    const questions = getQuestionsForZone(categoryKey, subzone.id, 3)
    
    if (onSelectZone) {
      onSelectZone(subzone.id, questions)
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

  const openQuestionsModal = (zone: SubZone, e: React.MouseEvent) => {
    e.stopPropagation()
    const questions = getQuestionsForZone(categoryKey, zone.id, 3)
    setActiveQuestionsModal({ zone, questions })
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
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl backdrop-blur-md text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow shrink-0" />
          <span className="font-bold text-slate-200">{categoryConfig.subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 shrink-0">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Tormenta</span>
        </div>
      </div>

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

              {/* Grid Layout without text truncation */}
              <div
                className={`grid gap-2 w-full ${
                  isLevel1 ? 'grid-cols-3' : isLevel2 || isLevel3 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {level.subzones.map((subzone) => {
                  const isCurrent = selectedZone === subzone.id
                  const isEliminated = eliminatedSet.has(subzone.id)

                  return (
                    <div
                      key={subzone.id}
                      onClick={() => handleZoneClick(subzone)}
                      className={`relative group rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm min-h-[68px] ${
                        isEliminated
                          ? 'bg-slate-950/80 border-slate-900 text-slate-600 grayscale opacity-40'
                          : isCurrent
                          ? 'bg-slate-900/90 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg scale-[1.01] z-10'
                          : `${getLevelBackgroundTexture(level.level)} ${level.colorTheme.border} hover:border-slate-700`
                      }`}
                    >
                      {/* Storm Diagonal Overlay */}
                      {isEliminated && (
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(225,29,72,0.08)_0,rgba(225,29,72,0.08)_8px,transparent_8px,transparent_16px)] pointer-events-none" />
                      )}

                      {/* Top Row: Title + Indicator Dot */}
                      <div className="flex items-start justify-between w-full gap-1 z-10">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          {isEpic ? (
                            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${isEliminated ? 'bg-slate-600' : level.colorTheme.indicator}`} />
                          )}

                          <span
                            className={`font-bold tracking-tight leading-snug break-words ${
                              isEpic ? 'text-xs sm:text-sm text-amber-300' : isLevel1 ? 'text-[10.5px] sm:text-xs' : 'text-xs'
                            } ${
                              isEliminated
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

                      {/* Bottom Row: Info Popup + Question Bank Trigger */}
                      <div className="flex items-center justify-between w-full pt-2 z-10 mt-auto">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openInfoModal(subzone, level.name, level.colorTheme.text, e)}
                            title="Ver información"
                            className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700/60 transition-colors"
                          >
                            <Info className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => openQuestionsModal(subzone, e)}
                            title="Ver preguntas asignadas"
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-0.5 text-[9px] font-bold"
                          >
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status / Storm Toggle */}
                        {isEliminated ? (
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

      {/* Question Bank Extraction Modal */}
      {activeQuestionsModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveQuestionsModal(null)}
        >
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Motor de Extracción (getQuestionsForZone)
                </span>
                <h4 className="text-sm font-black text-slate-100">
                  Subzona: {activeQuestionsModal.zone.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuestionsModal(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {activeQuestionsModal.questions.map((q, idx) => (
                <div key={q.id || idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Pregunta #{idx + 1}</span>
                    <span className="text-emerald-400 font-bold">{q.id}</span>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-100 leading-snug">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex
                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl text-[11px] font-medium border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveQuestionsModal(null)}
              className="w-full py-3 bg-emerald-500 text-slate-950 font-black text-xs rounded-2xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Cerrar Vista de Preguntas
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
