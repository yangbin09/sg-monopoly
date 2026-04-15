/**
 * useAudio.ts - 音效支持
 */

export type SoundType = 'dice' | 'buy' | 'sell' | 'event' | 'win' | 'lose' | 'click'

interface AudioOptions {
  volume: number
  muted: boolean
}

const DEFAULT_AUDIO_OPTIONS: AudioOptions = {
  volume: 0.5,
  muted: false
}

// 使用 Web Audio API 生成简单的音效
export function useAudio(options: AudioOptions = DEFAULT_AUDIO_OPTIONS) {
  let audioContext: AudioContext | null = null
  let currentOptions = { ...options }

  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext
  }

  function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (currentOptions.muted) return

    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type
      gainNode.gain.value = currentOptions.volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn('Audio playback failed:', e)
    }
  }

  const sounds: Record<SoundType, () => void> = {
    dice: () => {
      // 骰子滚动音效 - 快速连续的声音
      playTone(200, 0.1, 'square')
      setTimeout(() => playTone(300, 0.1, 'square'), 50)
      setTimeout(() => playTone(400, 0.1, 'square'), 100)
    },
    buy: () => {
      // 购买成功音效 - 上升音调
      playTone(400, 0.15, 'sine')
      setTimeout(() => playTone(600, 0.15, 'sine'), 100)
      setTimeout(() => playTone(800, 0.2, 'sine'), 200)
    },
    sell: () => {
      // 出售音效 - 下降音调
      playTone(600, 0.15, 'sine')
      setTimeout(() => playTone(400, 0.15, 'sine'), 100)
      setTimeout(() => playTone(200, 0.2, 'sine'), 200)
    },
    event: () => {
      // 事件触发音效
      playTone(300, 0.2, 'triangle')
      setTimeout(() => playTone(500, 0.2, 'triangle'), 150)
    },
    win: () => {
      // 胜利音效 - 欢快的上升音调
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sine'), i * 150)
      })
    },
    lose: () => {
      // 失败音效 - 下降音调
      const notes = [400, 300, 200, 100]
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sawtooth'), i * 200)
      })
    },
    click: () => {
      // 点击音效 - 短促的提示音
      playTone(800, 0.05, 'sine')
    }
  }

  function play(sound: SoundType) {
    sounds[sound]?.()
  }

  function setVolume(volume: number) {
    currentOptions.volume = Math.max(0, Math.min(1, volume))
  }

  function setMuted(muted: boolean) {
    currentOptions.muted = muted
  }

  function getOptions() {
    return { ...currentOptions }
  }

  return {
    play,
    setVolume,
    setMuted,
    getOptions
  }
}
