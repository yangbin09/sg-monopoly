/**
 * gameStore.ts - Pinia 游戏状态管理
 * 统一管理所有游戏相关状态
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Player, Cell, Character, WeatherType, PlayerItem, Achievement, UnlockedAchievement, PropertyLevel } from '../types/game'
import { boardCells as defaultBoardCells, characters as defaultCharacters, INITIAL_MONEY, START_BONUS } from '../config'
import { eventBus } from '../eventBus'

export const useGameStore = defineStore('game', () => {
  // ============== 状态 ==============
  const players = ref<Player[]>([])
  const currentPlayerIndex = ref(0)
  const gameInProgress = ref(false)
  const selectingPlayerIndex = ref(0)
  const propertyOwners = reactive<Record<number, { playerId: number; level: PropertyLevel }>>({})
  const diceResult = ref(0)
  const messages = ref<string[]>([])
  const rollButtonEnabled = ref(false)
  const gameEnded = ref(false)
  const winner = ref<Player | null>(null)
  const isAITurn = ref(false)
  const weather = ref<WeatherType>('sunny')
  const turnCount = ref(0)
  const treasureCount = ref(0)

  // ============== 计算属性 ==============
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const alivePlayers = computed(() => players.value.filter(p => p.inGame))
  const playerCount = computed(() => players.value.length)

  // ============== 玩家操作 ==============
  function addPlayer(character: Character): Player {
    const player: Player = {
      id: selectingPlayerIndex.value,
      name: `玩家${selectingPlayerIndex.value + 1}`,
      character: { ...character },
      money: INITIAL_MONEY,
      position: 0,
      properties: [],
      inGame: true,
      items: [],
      skillLevel: 1,
      achievements: [],
      isAI: false,
      shieldActive: false,
      consecutiveTurnsWithoutBuy: 0
    }
    players.value.push(player)
    selectingPlayerIndex.value++
    return player
  }

  function nextTurn(): Player | null {
    if (players.value.length === 0) return null
    let nextIndex = currentPlayerIndex.value
    for (let i = 1; i <= players.value.length; i++) {
      const idx = (currentPlayerIndex.value + i) % players.value.length
      if (players.value[idx].inGame) {
        nextIndex = idx
        break
      }
    }
    currentPlayerIndex.value = nextIndex
    turnCount.value++
    return currentPlayer.value
  }

  function getPlayerById(playerId: number): Player | undefined {
    return players.value.find(p => p.id === playerId)
  }

  function getAlivePlayers(): Player[] {
    return players.value.filter(p => p.inGame)
  }

  // ============== 地产操作 ==============
  function setPropertyOwner(cellIndex: number, playerId: number, level: PropertyLevel = 0) {
    propertyOwners[cellIndex] = { playerId, level }
  }

  function getPropertyOwner(cellIndex: number): { playerId: number; level: PropertyLevel } | null {
    return propertyOwners[cellIndex] ?? null
  }

  function removePropertyOwners(playerId: number) {
    for (const cellIndex in propertyOwners) {
      if (propertyOwners[cellIndex].playerId === playerId) {
        delete propertyOwners[cellIndex]
      }
    }
  }

  function upgradeProperty(cellIndex: number, newLevel: PropertyLevel) {
    if (propertyOwners[cellIndex]) {
      propertyOwners[cellIndex].level = newLevel
    }
  }

  // ============== 道具操作 ==============
  function addItem(playerId: number, item: PlayerItem) {
    const player = getPlayerById(playerId)
    if (player) {
      player.items.push(item)
    }
  }

  function removeItem(playerId: number, itemId: string) {
    const player = getPlayerById(playerId)
    if (player) {
      const index = player.items.findIndex(i => i.id === itemId)
      if (index !== -1) {
        player.items.splice(index, 1)
      }
    }
  }

  // ============== 成就操作 ==============
  function unlockAchievement(playerId: number, achievementId: string) {
    const player = getPlayerById(playerId)
    if (player && !player.achievements.includes(achievementId)) {
      player.achievements.push(achievementId)
    }
  }

  // ============== 游戏流程 ==============
  function startGame() {
    gameInProgress.value = true
    rollButtonEnabled.value = true
    turnCount.value = 1
    eventBus.emit({ type: 'SHOW_GAME' })
  }

  function endGame(winPlayer?: Player) {
    gameInProgress.value = false
    gameEnded.value = true
    winner.value = winPlayer ?? null
    rollButtonEnabled.value = false
    isAITurn.value = false
  }

  function resetGame() {
    players.value = []
    currentPlayerIndex.value = 0
    gameInProgress.value = false
    selectingPlayerIndex.value = 0
    Object.keys(propertyOwners).forEach(key => delete propertyOwners[key])
    diceResult.value = 0
    messages.value = []
    rollButtonEnabled.value = false
    gameEnded.value = false
    winner.value = null
    isAITurn.value = false
    turnCount.value = 0
    treasureCount.value = 0
  }

  // ============== 消息 ==============
  function addMessage(text: string) {
    messages.value.push(text)
    eventBus.emit({ type: 'APPEND_MESSAGE', payload: text })
  }

  function clearMessages() {
    messages.value = []
    eventBus.emit({ type: 'CLEAR_MESSAGE' })
  }

  return {
    // 状态
    players,
    currentPlayerIndex,
    gameInProgress,
    selectingPlayerIndex,
    propertyOwners,
    diceResult,
    messages,
    rollButtonEnabled,
    gameEnded,
    winner,
    isAITurn,
    weather,
    turnCount,
    treasureCount,

    // 计算属性
    currentPlayer,
    alivePlayers,
    playerCount,

    // 玩家操作
    addPlayer,
    nextTurn,
    getPlayerById,
    getAlivePlayers,

    // 地产操作
    setPropertyOwner,
    getPropertyOwner,
    removePropertyOwners,
    upgradeProperty,

    // 道具操作
    addItem,
    removeItem,

    // 成就操作
    unlockAchievement,

    // 游戏流程
    startGame,
    endGame,
    resetGame,

    // 消息
    addMessage,
    clearMessages
  }
})
