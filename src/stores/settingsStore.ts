/**
 * settingsStore.ts - Pinia 设置状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Settings {
  INITIAL_MONEY: number
  START_BONUS: number
  aiCount: number
  aiDifficulty: 'easy' | 'normal' | 'hard'
  volume: number
  muted: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    INITIAL_MONEY: 1000,
    START_BONUS: 200,
    aiCount: 0,
    aiDifficulty: 'normal',
    volume: 0.5,
    muted: false
  })

  const showSettings = ref(false)

  function updateSettings(newSettings: Partial<Settings>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  function setVolume(volume: number) {
    settings.value.volume = Math.max(0, Math.min(1, volume))
  }

  function setMuted(muted: boolean) {
    settings.value.muted = muted
  }

  function openSettings() {
    showSettings.value = true
  }

  function closeSettings() {
    showSettings.value = false
  }

  return {
    settings,
    showSettings,
    updateSettings,
    setVolume,
    setMuted,
    openSettings,
    closeSettings
  }
})
