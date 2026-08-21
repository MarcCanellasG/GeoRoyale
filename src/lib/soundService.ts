/**
 * Web Audio API synthesized sound service.
 * Provides zero-latency, 100% reliable, non-blocking audio effects.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * 1. Tick sound for countdown (3s, 2s, 1s)
 */
export function playTickSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 note

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch {}
}

/**
 * 2. Tap sound when selecting an answer option
 */
export function playTapSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  } catch {}
}

/**
 * 3. Chime sound for correct answer
 */
export function playChimeSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99] // C5, E5, G5 major triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06)

      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + idx * 0.06)
      osc.stop(ctx.currentTime + idx * 0.06 + 0.25)
    })
  } catch {}
}

/**
 * 4. Buzz sound for incorrect answer
 */
export function playBuzzSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {}
}

/**
 * 5. Glorious fanfare sound for Victory Royale
 */
export function playVictoryFanfare() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Fanfare arpeggio: C4, E4, G4, C5, G4, C5 (triumphant fanfare)
    const fanfare = [
      { freq: 261.63, time: 0.0, dur: 0.15 },
      { freq: 329.63, time: 0.15, dur: 0.15 },
      { freq: 392.00, time: 0.30, dur: 0.15 },
      { freq: 523.25, time: 0.45, dur: 0.4 },
      { freq: 392.00, time: 0.85, dur: 0.15 },
      { freq: 523.25, time: 1.00, dur: 0.8 }
    ]

    fanfare.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time)

      gain.gain.setValueAtTime(0.22, ctx.currentTime + time)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + time)
      osc.stop(ctx.currentTime + time + dur)
    })
  } catch {}
}
