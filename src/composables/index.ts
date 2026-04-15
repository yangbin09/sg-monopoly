/**
 * Composables index - 统一导出所有 composables
 */
export { useGameLogic, EventTypes } from './useGameLogic'
export { useGameStorage } from './useGameStorage'
export { useAI, DEFAULT_AI_CONFIG } from './useAI'
export { useAchievements } from './useAchievements'
export { useEventProcessor } from './useEventProcessor'

// types
export type { AIConfig } from './useAI'
export type { EventProcessorOptions } from './useEventProcessor'
