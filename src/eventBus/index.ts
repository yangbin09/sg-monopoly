/**
 * eventBus.ts - 事件总线
 * 解耦游戏逻辑和 UI
 */
import type { GameEvent } from '../types/game'

type EventCallback = (event: GameEvent) => void

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    // 返回取消订阅函数
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  off(eventType: string, callback: EventCallback): void {
    this.listeners.get(eventType)?.delete(callback)
  }

  emit(event: GameEvent): void {
    const callbacks = this.listeners.get(event.type)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
        }
      })
    }

    // 也触发通配符监听器
    const wildcardCallbacks = this.listeners.get('*')
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(cb => {
        try {
          cb(event)
        } catch (error) {
          console.error(`Error in wildcard event handler:`, error)
        }
      })
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

// 单例
export const eventBus = new EventBus()

// 便捷方法
export const onGameEvent = (callback: EventCallback) => eventBus.on('*', callback)
export const offGameEvent = (callback: EventCallback) => eventBus.off('*', callback)
