/**
 * gameState.ts - 游戏状态管理 (Vue 3 reactive store)
 */
import { reactive, computed } from 'vue'
import type { Character, Player, Cell, WeatherType, PlayerItem, PropertyLevel, MapLayer } from '../types/game'
import { INITIAL_MONEY, WEATHER_EFFECTS } from '../config'

export function createGameState() {
  const state = reactive<{
    players: Player[]
    currentPlayerIndex: number
    gameInProgress: boolean
    selectingPlayerIndex: number
    propertyOwners: Record<number, number>
    weather: WeatherType
    turnCount: number
    messages: string[]
    gameEnded: boolean
    winner: Player | null
    treasureCount: number  // 成就追踪
  }>({
    players: [],
    currentPlayerIndex: 0,
    gameInProgress: false,
    selectingPlayerIndex: 0,
    propertyOwners: {},
    weather: 'sunny',
    turnCount: 0,
    messages: [],
    gameEnded: false,
    winner: null,
    treasureCount: 0
  })

  // 初始化玩家
  function addPlayer(character: Character, isAI: boolean = false): Player {
    const player: Player = {
      id: state.selectingPlayerIndex,
      name: `玩家${state.selectingPlayerIndex + 1}`,
      character: { ...character, skillLevel: 1 },
      money: INITIAL_MONEY,
      position: 0,
      properties: [],
      inGame: true,
      items: [],
      skillLevel: 1,
      achievements: [],
      isAI,
      shieldActive: false,
      consecutiveTurnsWithoutBuy: 0,
      // 超大地图系统
      currentLayer: 'ground',
      revealedCells: new Set(),
      controlledFactions: [],
      defeatedBosses: [],
      activeBuffs: [],
      turnIncome: 0,
      defeatedObstacles: [],
      discoveredSecrets: [],
      frozenTurns: 0,
      stationUses: {}
    }
    state.players.push(player)
    state.selectingPlayerIndex++
    return player
  }

  // 获取当前玩家
  function getCurrentPlayer(): Player | undefined {
    return state.players[state.currentPlayerIndex]
  }

  // 切换到下一个玩家
  function nextTurn(): Player | null {
    if (state.players.length === 0) return null

    let nextIndex = state.currentPlayerIndex
    for (let i = 1; i <= state.players.length; i++) {
      const idx = (state.currentPlayerIndex + i) % state.players.length
      if (state.players[idx].inGame) {
        nextIndex = idx
        break
      }
    }

    state.currentPlayerIndex = nextIndex
    state.turnCount++

    // 每10回合换一次天气
    if (state.turnCount % 10 === 0) {
      changeWeather()
    }

    return getCurrentPlayer() ?? null
  }

  // 获取存活玩家
  function getAlivePlayers(): Player[] {
    return state.players.filter(p => p.inGame)
  }

  // 地产所有权
  function setPropertyOwner(cellIndex: number, playerId: number, level: PropertyLevel = 0) {
    state.propertyOwners[cellIndex] = playerId
  }

  function getPropertyOwner(cellIndex: number): number | null {
    return state.propertyOwners[cellIndex] ?? null
  }

  function removePropertyOwners(playerId: number) {
    for (const cellIndex in state.propertyOwners) {
      if (state.propertyOwners[cellIndex] === playerId) {
        delete state.propertyOwners[cellIndex]
      }
    }
  }

  function getPlayerById(playerId: number): Player | undefined {
    return state.players.find(p => p.id === playerId)
  }

  // 道具管理
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

  // 技能升级检查
  function checkSkillUpgrade(playerId: number) {
    const player = getPlayerById(playerId)
    if (!player || player.skillLevel >= 3) return false

    const purchaseCount = player.properties.length
    const threshold = player.skillLevel * 3  // 3, 6, 9 处

    if (purchaseCount >= threshold) {
      player.skillLevel++
      // 更新技能数值
      const upgrade = player.character.skillUpgrades[player.skillLevel - 1]
      switch (player.character.skillType) {
        case 'buyProperty':
          player.character.skillMoneyBonus = upgrade.bonusValue
          break
        case 'payRent':
          player.character.skillReduction = upgrade.bonusValue
          break
        case 'rollDice':
          player.character.skillMinRoll = upgrade.bonusValue
          break
        case 'event':
          player.character.skillBounce = player.skillLevel >= 2
          break
      }
      return true
    }
    return false
  }

  // 天气系统
  function changeWeather() {
    const weatherTypes: WeatherType[] = ['sunny', 'rainy', 'foggy', 'stormy']
    const currentIndex = weatherTypes.indexOf(state.weather)
    const nextIndex = (currentIndex + 1) % weatherTypes.length
    state.weather = weatherTypes[nextIndex]
  }

  function getWeatherEffect() {
    return WEATHER_EFFECTS[state.weather]
  }

  // 成就解锁
  function unlockAchievement(playerId: number, achievementId: string) {
    const player = getPlayerById(playerId)
    if (player && !player.achievements.includes(achievementId)) {
      player.achievements.push(achievementId)
      return true
    }
    return false
  }

  // 重置游戏
  function reset() {
    state.players = []
    state.currentPlayerIndex = 0
    state.gameInProgress = false
    state.selectingPlayerIndex = 0
    state.propertyOwners = {}
    state.weather = 'sunny'
    state.turnCount = 0
    state.messages = []
    state.gameEnded = false
    state.winner = null
    state.treasureCount = 0
  }

  // 添加消息
  function addMessage(msg: string) {
    state.messages.push(msg)
    if (state.messages.length > 100) {
      state.messages.shift()
    }
  }

  // 清除消息
  function clearMessages() {
    state.messages = []
  }

  // 存根属性 - 用于兼容 useGameLogic.ts
  // 这些属性在 Pinia store 中是 computed properties
  const currentSeasonEffect = { value: null }
  const currentTimeEffect = { value: null }

  // 获取地形效果
  function getTerrainEffect(layer: MapLayer, cellIndex: number) {
    // 默认地形效果
    return {
      moveCost: 1,
      rentModifier: 1.0,
      specialEffect: null
    }
  }

  // 超大地图系统存根函数
  function handleTeleport(playerId: number, teleportPairId: string) {
    return { success: false, message: '传送门功能暂不可用' }
  }

  function useStation(playerId: number, stationId: string) {
    return { success: false, message: '驿站功能暂不可用', extraMoves: 0 }
  }

  function defeatObstacle(playerId: number, obstacleId: string) {
    return { success: false, message: '障碍功能暂不可用' }
  }

  function freezePlayer(playerId: number, turns: number) {
    // 冻结玩家回合
    const player = getPlayerById(playerId)
    if (player) {
      player.frozenTurns = turns
    }
  }

  function collectResource(playerId: number, resourceNodeId: string) {
    return { success: false, message: '资源功能暂不可用' }
  }

  function discoverSecret(playerId: number, secretPassageId: string) {
    return { success: false, message: '秘密通道功能暂不可用' }
  }

  function revealCell(layer: MapLayer, cellIndex: number, playerId: number) {
    // 记录已探索的格子
    const player = getPlayerById(playerId)
    if (player) {
      const key = `${layer}-${cellIndex}`
      player.revealedCells.add(key)
    }
  }

  return {
    state,
    currentSeasonEffect,
    currentTimeEffect,
    addPlayer,
    getCurrentPlayer,
    nextTurn,
    getAlivePlayers,
    setPropertyOwner,
    getPropertyOwner,
    removePropertyOwners,
    getPlayerById,
    addItem,
    removeItem,
    checkSkillUpgrade,
    changeWeather,
    getWeatherEffect,
    unlockAchievement,
    reset,
    addMessage,
    clearMessages,
    getTerrainEffect,
    handleTeleport,
    useStation,
    defeatObstacle,
    freezePlayer,
    collectResource,
    discoverSecret,
    revealCell
  }
}

export type GameStateReturn = ReturnType<typeof createGameState>
