/**
 * gameStore.ts - Pinia 游戏状态管理
 * 统一管理所有游戏相关状态 - 地图增强版
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Character, WeatherType, PlayerItem, PropertyLevel, Obstacle, MapSize, MapTheme, AreaType, Cell } from '../types/game'
import { boardCells, INITIAL_MONEY, START_BONUS, WEATHER_EFFECTS, TERRAIN_EFFECTS, TELEPORT_PAIRS, MAP_SIZES, STATION_CONFIG, FATE_CARDS } from '../config'

export const useGameStore = defineStore('game', () => {
  // ============== 状态 ==============
  const players = ref<Player[]>([])
  const currentPlayerIndex = ref(0)
  const gameInProgress = ref(false)
  const selectingPlayerIndex = ref(0)
  const propertyOwners = ref<Record<number, { playerId: number; level: PropertyLevel }>>({})
  const diceResult = ref(0)
  const messages = ref<string[]>([])
  const rollButtonEnabled = ref(false)
  const gameEnded = ref(false)
  const winner = ref<Player | null>(null)
  const isAITurn = ref(false)
  const weather = ref<WeatherType>('sunny')
  const turnCount = ref(0)
  const treasureCount = ref(0)

  // 地图增强状态
  const mapSize = ref<MapSize>('standard')
  const mapTheme = ref<MapTheme>('threekingdoms')
  const obstacles = ref<Obstacle[]>([])
  const teleportPairs = ref(TELEPORT_PAIRS)
  const usedStationsThisTurn = ref<Record<number, number>>({})  // 玩家ID -> 使用次数

  // ============== 计算属性 ==============
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const alivePlayers = computed(() => players.value.filter(p => p.inGame))
  const playerCount = computed(() => players.value.length)
  const currentBoardCells = computed(() => {
    const size = MAP_SIZES[mapSize.value]
    return boardCells.slice(0, size.boardSize)
  })

  // ============== 玩家操作 ==============
  function addPlayer(character: Character, isAI: boolean = false): Player {
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
      isAI,
      shieldActive: false,
      consecutiveTurnsWithoutBuy: 0,
      frozenTurns: 0,
      areaControl: { wei: 0, shu: 0, wu: 0, neutral: 0 },
      usedStations: 0,
      defeatedObstacles: []
    }
    players.value.push(player)
    selectingPlayerIndex.value++
    return player
  }

  function getCurrentPlayer(): Player | undefined {
    return players.value[currentPlayerIndex.value]
  }

  function nextTurn(): Player | null {
    if (players.value.length === 0) return null

    let nextIndex = currentPlayerIndex.value
    for (let i = 1; i <= players.value.length; i++) {
      const idx = (currentPlayerIndex.value + i) % players.value.length
      if (players.value[idx].inGame) {
        // 检查冻结状态
        if (players.value[idx].frozenTurns > 0) {
          players.value[idx].frozenTurns--
          addMessage(`${players.value[idx].character.name}被冻结，跳过一回合`)
          if (players.value[idx].frozenTurns === 0) {
            addMessage(`${players.value[idx].character.name}解除冻结`)
          }
          continue
        }
        nextIndex = idx
        break
      }
    }

    currentPlayerIndex.value = nextIndex
    turnCount.value++

    // 重置驿站使用次数
    const current = getCurrentPlayer()
    if (current) {
      current.usedStations = 0
    }

    // 每10回合换一次天气
    if (turnCount.value % 10 === 0) {
      changeWeather()
    }

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
    propertyOwners.value[cellIndex] = { playerId, level }

    // 更新区域占领计数
    const cell = currentBoardCells.value[cellIndex]
    if (cell?.area) {
      const player = getPlayerById(playerId)
      if (player) {
        player.areaControl[cell.area as AreaType]++
      }
    }
  }

  function getPropertyOwner(cellIndex: number): { playerId: number; level: PropertyLevel } | null {
    return propertyOwners.value[cellIndex] ?? null
  }

  function removePropertyOwners(playerId: number) {
    for (const cellIndex in propertyOwners.value) {
      const idx = parseInt(cellIndex)
      if (propertyOwners.value[idx].playerId === playerId) {
        const cell = currentBoardCells.value[idx]
        if (cell?.area) {
          const player = getPlayerById(playerId)
          if (player) {
            player.areaControl[cell.area as AreaType] = Math.max(0, player.areaControl[cell.area as AreaType] - 1)
          }
        }
        delete propertyOwners.value[idx]
      }
    }
  }

  function upgradeProperty(cellIndex: number, newLevel: PropertyLevel) {
    if (propertyOwners.value[cellIndex]) {
      propertyOwners.value[cellIndex].level = newLevel
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

  // ============== 传送阵系统 ==============
  function handleTeleport(player: Player, cellIndex: number): number {
    const cell = currentBoardCells.value[cellIndex]
    if (!cell || cell.type !== 'teleport_entry') return cellIndex

    const pair = teleportPairs.value.find(tp => tp.entryIndex === cellIndex)
    if (pair) {
      addMessage(`${player.character.name}使用传送阵：从${cell.name}传送至出口`)
      return pair.exitIndex
    }
    return cellIndex
  }

  function getTeleportExit(cellIndex: number): number | null {
    const pair = teleportPairs.value.find(tp => tp.entryIndex === cellIndex)
    return pair?.exitIndex ?? null
  }

  // ============== 驿站系统 ==============
  function useStation(player: Player, extraMoves: number = 2): boolean {
    if (player.usedStations >= STATION_CONFIG.maxUsesPerTurn) {
      addMessage(`${player.character.name}本回合已使用过驿站`)
      return false
    }

    if (player.money < STATION_CONFIG.cost) {
      addMessage(`${player.character.name}金币不足，无法使用驿站`)
      return false
    }

    player.money -= STATION_CONFIG.cost
    player.usedStations++
    addMessage(`${player.character.name}使用驿站，额外移动${extraMoves}步（花费${STATION_CONFIG.cost}金币）`)
    return true
  }

  // ============== 冻结系统 ==============
  function freezePlayer(playerId: number, turns: number = 1) {
    const player = getPlayerById(playerId)
    if (player) {
      player.frozenTurns += turns
      addMessage(`${player.character.name}被冻结${turns}回合`)
    }
  }

  // ============== 障碍物系统 ==============
  function initializeObstacles() {
    obstacles.value = []
  }

  function defeatObstacle(playerId: number, obstacleIndex: number) {
    const obstacle = obstacles.value[obstacleIndex]
    if (!obstacle || obstacle.defeated) return

    obstacle.defeated = true
    obstacle.defeatedBy = playerId

    const player = getPlayerById(playerId)
    if (player && obstacle.reward) {
      player.money += obstacle.reward
      addMessage(`${player.character.name}击败${obstacle.type === 'bandit' ? '山贼' : '障碍物'}，获得${obstacle.reward}金币`)
    }
  }

  function getObstacleAt(cellIndex: number): Obstacle | undefined {
    return obstacles.value.find(o => o.position === cellIndex && !o.defeated)
  }

  // ============== 区域增益 ==============
  function checkAreaBonus(player: Player): { bonus: string; value: number } | null {
    for (const [area, count] of Object.entries(player.areaControl)) {
      if (area !== 'neutral' && count >= 3) {
        switch (area) {
          case 'wei':
            return { bonus: '租金+10%', value: 1.1 }
          case 'shu':
            return { bonus: '技能+1级', value: 1 }
          case 'wu':
            return { bonus: '过路+50金币', value: 50 }
        }
      }
    }
    return null
  }

  // ============== 技能升级检查 ==============
  function checkSkillUpgrade(playerId: number): boolean {
    const player = getPlayerById(playerId)
    if (!player || player.skillLevel >= 3) return false

    const purchaseCount = player.properties.length
    const threshold = player.skillLevel * 3

    if (purchaseCount >= threshold) {
      player.skillLevel++
      const upgrade = player.character.skillUpgrades?.[player.skillLevel - 1]
      switch (player.character.skillType) {
        case 'buyProperty':
          player.character.skillMoneyBonus = upgrade?.bonusValue ?? 50
          break
        case 'payRent':
          player.character.skillReduction = upgrade?.bonusValue ?? 10
          break
        case 'rollDice':
          player.character.skillMinRoll = upgrade?.bonusValue ?? 3
          break
        case 'event':
          player.character.skillBounce = player.skillLevel >= 2
          break
      }
      return true
    }
    return false
  }

  // ============== 天气系统 ==============
  function changeWeather() {
    const weatherTypes: WeatherType[] = ['sunny', 'rainy', 'foggy', 'stormy']
    const currentIndex = weatherTypes.indexOf(weather.value)
    weather.value = weatherTypes[(currentIndex + 1) % weatherTypes.length]
    addMessage(`天气变化：${WEATHER_EFFECTS[weather.value].description}`)
  }

  function getWeatherEffect() {
    return WEATHER_EFFECTS[weather.value]
  }

  // ============== 地形效果 ==============
  function getTerrainEffect(cell: Cell) {
    if (!cell.terrain) return TERRAIN_EFFECTS.normal
    return TERRAIN_EFFECTS[cell.terrain] ?? TERRAIN_EFFECTS.normal
  }

  // ============== 成就操作 ==============
  function unlockAchievement(playerId: number, achievementId: string): boolean {
    const player = getPlayerById(playerId)
    if (player && !player.achievements.includes(achievementId)) {
      player.achievements.push(achievementId)
      return true
    }
    return false
  }

  // ============== 地图设置 ==============
  function setMapSize(size: MapSize) {
    mapSize.value = size
  }

  function setMapTheme(theme: MapTheme) {
    mapTheme.value = theme
  }

  // ============== 游戏流程 ==============
  function startGame() {
    gameInProgress.value = true
    rollButtonEnabled.value = true
    turnCount.value = 1
    initializeObstacles()
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
    propertyOwners.value = {}
    diceResult.value = 0
    messages.value = []
    rollButtonEnabled.value = false
    gameEnded.value = false
    winner.value = null
    isAITurn.value = false
    turnCount.value = 0
    treasureCount.value = 0
    obstacles.value = []
  }

  // ============== 消息 ==============
  function addMessage(text: string) {
    messages.value.push(text)
    if (messages.value.length > 100) {
      messages.value.shift()
    }
  }

  function clearMessages() {
    messages.value = []
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
    mapSize,
    mapTheme,
    obstacles,
    teleportPairs,

    // 计算属性
    currentPlayer,
    alivePlayers,
    playerCount,
    currentBoardCells,

    // 玩家操作
    addPlayer,
    getCurrentPlayer,
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

    // 传送阵
    handleTeleport,
    getTeleportExit,

    // 驿站
    useStation,

    // 冻结
    freezePlayer,

    // 障碍物
    initializeObstacles,
    defeatObstacle,
    getObstacleAt,

    // 区域
    checkAreaBonus,

    // 技能升级
    checkSkillUpgrade,

    // 天气
    changeWeather,
    getWeatherEffect,

    // 地形
    getTerrainEffect,

    // 成就
    unlockAchievement,

    // 地图设置
    setMapSize,
    setMapTheme,

    // 游戏流程
    startGame,
    endGame,
    resetGame,

    // 消息
    addMessage,
    clearMessages
  }
})
