/**
 * useEventProcessor.ts - 事件处理 Composable
 * 统一处理游戏事件
 */
import type { GameEvent, Achievement } from '../types/game'
import { EventTypes } from './useGameLogic'

export interface EventProcessorOptions {
  onShowStore?: (show: boolean) => void
  onShowAchievement?: (show: boolean, achievement: Achievement | null) => void
  onSelectionInfo?: (info: string) => void
}

export function useEventProcessor(options: EventProcessorOptions = {}) {
  function processEvents(events: GameEvent[], context: {
    addMessage: (msg: string) => void
    clearMessages: () => void
    setRollEnabled: (enabled: boolean) => void
    setDiceResult: (result: number) => void
    setGameEnded: (ended: boolean) => void
    playSound?: (type: string) => void
  }) {
    if (!events || !Array.isArray(events)) return

    for (const event of events) {
      switch (event.type) {
        case EventTypes.APPEND_MESSAGE:
          if (typeof event.payload === 'string') {
            context.addMessage(event.payload)
            // Auto-play sound based on message content
            if (context.playSound) {
              if (event.payload.includes('购买')) context.playSound('buy')
              else if (event.payload.includes('破产')) context.playSound('lose')
              else if (event.payload.includes('胜利')) context.playSound('win')
              else if (event.payload.includes('触发')) context.playSound('event')
            }
          }
          break

        case EventTypes.ROLL_BUTTON_ENABLED:
          context.setRollEnabled(event.payload as boolean)
          break

        case EventTypes.UPDATE_DICE:
          context.setDiceResult(event.payload as number)
          if (context.playSound) context.playSound('dice')
          break

        case EventTypes.CLEAR_MESSAGE:
          context.clearMessages()
          break

        case EventTypes.GAME_END:
          context.setGameEnded(true)
          context.setRollEnabled(false)
          break

        case EventTypes.SHOW_STORE:
          options.onShowStore?.(true)
          break

        case EventTypes.HIDE_STORE:
          options.onShowStore?.(false)
          break

        case EventTypes.SHOW_ACHIEVEMENT: {
          const payload = event.payload as { achievement: Achievement }
          options.onShowAchievement?.(true, payload.achievement)
          setTimeout(() => {
            options.onShowAchievement?.(false, null)
          }, 4000)
          break
        }

        case 'UPDATE_SELECTION_INFO':
          options.onSelectionInfo?.(event.payload as string)
          break
      }
    }
  }

  return {
    processEvents
  }
}
