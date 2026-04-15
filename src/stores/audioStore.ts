/**
 * audioStore.ts - Pinia 音效状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type SoundType = 'dice' | 'buy' | 'sell' | 'event' | 'win' | 'lose' | 'click' | 'levelUp' | 'achievement'

export const useAudioStore = defineStore('audio', () => {
  const volume = ref(0.5)
  const muted = ref(false)

  let audioContext: AudioContext | null = null

  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext
  }

  function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (muted.value) return

    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type
      gainNode.gain.value = volume.value
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }

  const sounds: Record<SoundType, () => void> = {
    dice: () => {
      playTone(200, 0.1, 'square')
      setTimeout(() => playTone(300, 0.1, 'square'), 50)
      setTimeout(() => playTone(400, 0.1, 'square'), 100)
    },
    buy: () => {
      playTone(400, 0.15, 'sine')
      setTimeout(() => playTone(600, 0.15, 'sine'), 100)
      setTimeout(() => playTone(800, 0.2, 'sine'), 200)
    },
    sell: () => {
      playTone(600, 0.15, 'sine')
      setTimeout(() => playTone(400, 0.15, 'sine'), 100)
      setTimeout(() => playTone(200, 0.2, 'sine'), 200)
    },
    event: () => {
      playTone(300, 0.2, 'triangle')
      setTimeout(() => playTone(500, 0.2, 'triangle'), 150)
    },
    win: () => {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sine'), i * 150)
      })
    },
    lose: () => {
      const notes = [400, 300, 200, 100]
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sawtooth'), i * 200)
      })
    },
    click: () => {
      playTone(800, 0.05, 'sine')
    },
    levelUp: () => {
      playTone(400, 0.15, 'sine')
      setTimeout(() => playTone(500, 0.15, 'sine'), 100)
      setTimeout(() => playTone(600, 0.15, 'sine'), 200)
      setTimeout(() => playTone(800, 0.25, 'sine'), 300)
    },
    achievement: () => {
      const notes = [523, 659, 784, 1047, 1319]
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'triangle'), i * 100)
      })
    }
  }

  function play(sound: SoundType) {
    sounds[sound]?.()
  }

  function setVolume(newVolume: number) {
    volume.value = Math.max(0, Math.min(1, newVolume))
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  return {
    volume,
    muted,
    play,
    setVolume,
    toggleMute
  }
})
