'use client'

import { useState, useCallback } from 'react'
import { Question } from '@/config/questionBank'
import { ActivePlayer } from '@/lib/supabase/playersService'

export type GamePhase = 
  | 'LOBBY' 
  | 'ZONE_SELECTION' 
  | 'COMBAT' 
  | 'ROUND_RESULT' 
  | 'VICTORY'

export interface RoundResultPayload {
  selectedOption: number | null
  isCorrect: boolean
  damageDealt: number
  activeZoneId: string
  winnerPlayer?: ActivePlayer
}

export interface GameState {
  phase: GamePhase
  roundNumber: number
  activeZoneId: string | null
  currentQuestion: Question | null
  lastResult: RoundResultPayload | null
  winner: ActivePlayer | null
}

export function useGameState(initialPhase: GamePhase = 'LOBBY', initialRound: number = 1) {
  const [state, setState] = useState<GameState>({
    phase: initialPhase,
    roundNumber: initialRound,
    activeZoneId: null,
    currentQuestion: null,
    lastResult: null,
    winner: null
  })

  /**
   * Transición 1: LOBBY -> ZONE_SELECTION (Iniciar Partida en Ronda 1)
   */
  const startGame = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'LOBBY') {
        console.warn(`[useGameState] Transición inválida: de ${prev.phase} a ZONE_SELECTION. Debe iniciarse desde LOBBY.`)
        return prev
      }
      return {
        ...prev,
        phase: 'ZONE_SELECTION',
        roundNumber: 1,
        lastResult: null,
        winner: null
      }
    })
  }, [])

  /**
   * Transición 2: ZONE_SELECTION -> COMBAT (Entrar en Combate de Subzona)
   */
  const enterCombat = useCallback((zoneId: string, question: Question) => {
    setState((prev) => {
      if (prev.phase !== 'ZONE_SELECTION') {
        console.warn(`[useGameState] Transición denegada por seguridad: Imposible entrar a COMBAT desde ${prev.phase}. Se requiere estar en ZONE_SELECTION.`)
        return prev
      }
      return {
        ...prev,
        phase: 'COMBAT',
        activeZoneId: zoneId,
        currentQuestion: question
      }
    })
  }, [])

  /**
   * Transición 3: COMBAT -> ROUND_RESULT (Resultados de la Ronda)
   */
  const showResults = useCallback((resultPayload: RoundResultPayload) => {
    setState((prev) => {
      if (prev.phase !== 'COMBAT') {
        console.warn(`[useGameState] Transición denegada: Imposible ir a ROUND_RESULT desde ${prev.phase}. Se requiere estar en COMBAT.`)
        return prev
      }
      return {
        ...prev,
        phase: 'ROUND_RESULT',
        lastResult: resultPayload
      }
    })
  }, [])

  /**
   * Transición 4: ROUND_RESULT -> ZONE_SELECTION (Incrementar Ronda)
   */
  const nextRound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'ZONE_SELECTION',
      roundNumber: prev.roundNumber + 1,
      activeZoneId: null,
      currentQuestion: null
    }))
  }, [])

  /**
   * Transición 5: Cualquier Fase -> VICTORY (Pantalla Final de Gran Ganador o Empate)
   */
  const endGame = useCallback((winnerPlayer?: ActivePlayer | null) => {
    setState((prev) => ({
      ...prev,
      phase: 'VICTORY',
      winner: winnerPlayer || null
    }))
  }, [])

  /**
   * Reinicio manual: Cualquier Fase -> LOBBY (Reset Ronda a 1)
   */
  const resetToLobby = useCallback(() => {
    setState({
      phase: 'LOBBY',
      roundNumber: 1,
      activeZoneId: null,
      currentQuestion: null,
      lastResult: null,
      winner: null
    })
  }, [])

  /**
   * Método de Sincronización Remota (Preparado para Supabase Realtime)
   */
  const syncState = useCallback((newPhase: GamePhase, payload?: Partial<GameState> & { round_number?: number }) => {
    setState((prev) => {
      let nextRoundNumber = prev.roundNumber
      if (payload?.round_number !== undefined) {
        nextRoundNumber = payload.round_number
      } else if (payload?.roundNumber !== undefined) {
        nextRoundNumber = payload.roundNumber
      } else if (newPhase === 'ZONE_SELECTION' && prev.phase === 'ROUND_RESULT') {
        nextRoundNumber = prev.roundNumber + 1
      }

      return {
        ...prev,
        phase: newPhase,
        ...payload,
        roundNumber: nextRoundNumber
      }
    })
  }, [])

  return {
    currentPhase: state.phase,
    roundNumber: state.roundNumber,
    activeZoneId: state.activeZoneId,
    currentQuestion: state.currentQuestion,
    lastResult: state.lastResult,
    winner: state.winner,
    // Acciones de transición
    startGame,
    enterCombat,
    showResults,
    nextRound,
    endGame,
    resetToLobby,
    syncState
  }
}
