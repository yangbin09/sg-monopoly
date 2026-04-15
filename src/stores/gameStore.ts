/**
 * gameStore.ts - Pinia 游戏状态管理 (超大地图版)
 * 统一管理所有游戏相关状态
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Player, Cell, Character, WeatherType, PlayerItem, Achievement, UnlockedAchievement, PropertyLevel, MapLayer, SeasonType, TimeOfDay, CellState, FactionType, TerrainType } from '../types/game'
import { boardCells as defaultBoardCells, characters as defaultCharacters, INITIAL_MONEY, START_BONUS, SEASONS, TIMES_OF_DAY, FACTIONS, TERRAIN_EFFECTS, TELEPORT_PAIRS, STATIONS, PORTS, OBSTACLES, RESOURCE_NODES, SECRET_PASSAGES, BOSS_LAIRS, MAP_EVENTS } from '../config'
import { eventBus } from '../eventBus'

export const useGameStore = defineStore('game', () => {
  // ============== 基础状态 ==============
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

  // ============== 超大地图系统状态 ==============
  const mapSize = ref<'tiny' | 'small' | 'standard' | 'large' | 'giant' | 'epic'>('epic')
  const currentSeason = ref<SeasonType>('spring')
  const currentTimeOfDay = ref<TimeOfDay>('day')
  const cellStates = reactive<Record<string, CellState>>({})  // key: "layer-index"
  const seasonTurnCounter = ref(0)
  const timeOfDayTurnCounter = ref(0)

  // 格子状态初始化
  function initializeCellStates() {
    for (const cell of defaultBoardCells) {
      const layer = (cell as any).layer || 'ground'
      const key = `${layer}-${cell.index ?? 0}`
      cellStates[key] = {
        cellIndex: cell.index ?? 0,
        layer: layer as MapLayer,
        terrain: (cell as any).terrain || 'normal',
        faction: (cell as any).faction || 'neutral',
        ownerId: undefined,
        level: 0,
        revealed: false,
        hasObstacle: !!(cell as any).obstacleId,
        obstacleHp: (cell as any).obstacleId ? (OBSTACLES.find(o => o.id === (cell as any).obstacleId)?.hp ?? 0) : undefined,
        isSecretRevealed: false
      }
    }
  }

  // ============== 计算属性 ==============
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  const alivePlayers = computed(() => players.value.filter(p => p.inGame))
  const playerCount = computed(() => players.value.length)

  // 获取当前季节效果
  const currentSeasonEffect = computed(() => SEASONS[currentSeason.value])
  // 获取当前时间效果
  const currentTimeEffect = computed(() => TIMES_OF_DAY[currentTimeOfDay.value])

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
      // 超大地图系统
      currentLayer: 'ground',
      revealedCells: new Set(['ground-0']),  // 起点已探索
      controlledFactions: [],
      defeatedBosses: [],
      defeatedObstacles: [],
      discoveredSecrets: [],
      frozenTurns: 0,
      stationUses: {},
      turnIncome: 0,
      activeBuffs: []
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

    // 季节轮换 (每10回合)
    seasonTurnCounter.value++
    if (seasonTurnCounter.value >= 10) {
      seasonTurnCounter.value = 0
      const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter']
      const currentIdx = seasons.indexOf(currentSeason.value)
      currentSeason.value = seasons[(currentIdx + 1) % seasons.length]
      eventBus.emit({ type: 'SEASON_CHANGE', payload: { season: currentSeason.value } })
    }

    // 昼夜轮换 (每3回合)
    timeOfDayTurnCounter.value++
    if (timeOfDayTurnCounter.value >= 3) {
      timeOfDayTurnCounter.value = 0
      const times: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night']
      const currentIdx = times.indexOf(currentTimeOfDay.value)
      currentTimeOfDay.value = times[(currentIdx + 1) % times.length]
      eventBus.emit({ type: 'TIME_OF_DAY_CHANGE', payload: { timeOfDay: currentTimeOfDay.value } })
    }

    // 应用回合收入
    const player = players.value[nextIndex]
    if (player) {
      // 基础收入 + 时间加成
      player.turnIncome = currentTimeEffect.value.incomeBonus
      // 势力加成
      const controlledCells = defaultBoardCells.filter(c => player.properties.some(p => p.index === c.index))
      for (const cell of controlledCells) {
        const faction = (cell as any).faction as FactionType
        if (faction && FACTIONS[faction]) {
          player.turnIncome += FACTIONS[faction].incomePerTurn
        }
      }
      player.money += player.turnIncome
    }

    return players.value[nextIndex]
  }

  // 外部玩家数据源 - 用于与 gameState 保持同步
  let externalPlayersSource: Ref<Player[]> | null = null

  function setPlayersSource(source: Ref<Player[]>) {
    externalPlayersSource = source
  }

  function getPlayerById(playerId: number): Player | undefined {
    if (externalPlayersSource) {
      return externalPlayersSource.value.find(p => p.id === playerId)
    }
    return players.value.find(p => p.id === playerId)
  }

  function getAlivePlayers(): Player[] {
    if (externalPlayersSource) {
      return externalPlayersSource.value.filter(p => p.inGame)
    }
    return players.value.filter(p => p.inGame)
  }

  // ============== 格子探索 ==============
  function revealCell(layer: MapLayer, cellIndex: number, playerId: number) {
    const key = `${layer}-${cellIndex}`
    if (!cellStates[key]) return

    const player = getPlayerById(playerId)
    if (!player) return

    if (!cellStates[key].revealed) {
      cellStates[key].revealed = true
      player.revealedCells.add(key)
      eventBus.emit({ type: 'REVEAL_CELL', payload: { layer, cellIndex, playerId } })
    }
  }

  function isCellRevealed(layer: MapLayer, cellIndex: number, playerId: number): boolean {
    const player = getPlayerById(playerId)
    if (!player) return false
    const key = `${layer}-${cellIndex}`
    return player.revealedCells.has(key)
  }

  // ============== 层级切换 ==============
  function changeLayer(playerId: number, targetLayer: MapLayer, targetCell: number, cost: number = 0): boolean {
    const player = getPlayerById(playerId)
    if (!player) return false

    if (cost > 0 && player.money < cost) {
      return false
    }

    if (cost > 0) {
      player.money -= cost
    }

    player.currentLayer = targetLayer
    player.position = targetCell

    eventBus.emit({ type: 'LAYER_TRANSITION', payload: { playerId, fromLayer: player.currentLayer, toLayer: targetLayer, targetCell } })
    return true
  }

  // ============== 传送门 ==============
  function handleTeleport(playerId: number, teleportPairId: string): { success: boolean; message: string } {
    const pair = TELEPORT_PAIRS.find(t => t.id === teleportPairId)
    if (!pair) return { success: false, message: '传送门不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, message: '玩家不存在' }

    const currentCellIndex = player.position
    const isEntry = pair.entryCells.includes(currentCellIndex)
    const exitCells = isEntry ? pair.exitCells : pair.entryCells
    const nextCell = exitCells[Math.floor(Math.random() * exitCells.length)]

    if (pair.activationCost && player.money < pair.activationCost) {
      return { success: false, message: `激活需要${pair.activationCost}金币` }
    }

    if (pair.activationCost) {
      player.money -= pair.activationCost
    }

    player.position = nextCell

    eventBus.emit({ type: 'TELEPORT', payload: { playerId, teleportPairId, targetCell: nextCell } })
    return { success: true, message: `传送到${nextCell}` }
  }

  // ============== 驿站 ==============
  function useStation(playerId: number, stationId: string): { success: boolean; extraMoves: number; message: string } {
    const station = STATIONS.find(s => s.id === stationId)
    if (!station) return { success: false, extraMoves: 0, message: '驿站不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, extraMoves: 0, message: '玩家不存在' }

    const currentUses = player.stationUses[stationId] || 0
    if (currentUses >= station.maxUsesPerGame) {
      return { success: false, extraMoves: 0, message: `本场游戏已用完${station.name}的使用次数` }
    }

    if (station.factionRequired && player.controlledFactions.indexOf(station.factionRequired) === -1) {
      return { success: false, extraMoves: 0, message: `需要${FACTIONS[station.factionRequired].name}势力才能使用` }
    }

    player.stationUses[stationId] = currentUses + 1
    eventBus.emit({ type: 'USE_STATION', payload: { playerId, stationId } })
    return { success: true, extraMoves: station.extraMoves, message: `使用${station.name}，额外移动${station.extraMoves}步` }
  }

  // ============== 冻结玩家 ==============
  function freezePlayer(playerId: number, turns: number) {
    const player = getPlayerById(playerId)
    if (player) {
      player.frozenTurns = turns
      eventBus.emit({ type: 'FREEZE_PLAYER', payload: { playerId, turns } })
    }
  }

  // ============== 障碍物战斗 ==============
  function defeatObstacle(playerId: number, obstacleId: string): { success: boolean; reward: number; message: string } {
    const obstacle = OBSTACLES.find(o => o.id === obstacleId)
    if (!obstacle) return { success: false, reward: 0, message: '障碍物不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, reward: 0, message: '玩家不存在' }

    const key = `${obstacle.layer}-${obstacle.cellIndex}`
    const cellState = cellStates[key]
    if (!cellState || !cellState.hasObstacle) {
      return { success: false, reward: 0, message: '障碍物已被清除' }
    }

    cellState.hasObstacle = false
    cellState.obstacleHp = 0
    player.defeatedObstacles.push(obstacleId)
    player.money += obstacle.defeatReward

    eventBus.emit({ type: 'OBSTACLE_DEFEATED', payload: { playerId, obstacleId, reward: obstacle.defeatReward } })
    return { success: true, reward: obstacle.defeatReward, message: `击败${obstacle.name}，获得${obstacle.defeatReward}金币` }
  }

  // ============== BOSS战斗 ==============
  function defeatBoss(playerId: number, bossLairId: string): { success: boolean; reward: number; message: string } {
    const boss = BOSS_LAIRS.find(b => b.id === bossLairId)
    if (!boss) return { success: false, reward: 0, message: 'BOSS不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, reward: 0, message: '玩家不存在' }

    if (player.defeatedBosses.includes(bossLairId)) {
      return { success: false, reward: 0, message: '该BOSS已被击败' }
    }

    player.defeatedBosses.push(bossLairId)
    player.money += boss.defeatReward

    // 控制据点
    for (const cell of boss.cells) {
      const key = `${cell.layer}-${cell.index}`
      if (cellStates[key]) {
        cellStates[key].faction = player.id === 0 ? 'wei' : player.id === 1 ? 'shu' : 'wu'
        cellStates[key].ownerId = player.id
      }
    }

    player.controlledFactions.push(boss.id as any)

    eventBus.emit({ type: 'BOSS_DEFEATED', payload: { playerId, bossLairId, reward: boss.defeatReward } })
    return { success: true, reward: boss.defeatReward, message: `击败${boss.bossName}，获得${boss.defeatReward}金币并控制${boss.name}` }
  }

  // ============== 秘密通道发现 ==============
  function discoverSecret(playerId: number, passageId: string): { success: boolean; destination: { layer: MapLayer; cell: number }; message: string } {
    const passage = SECRET_PASSAGES.find(s => s.id === passageId)
    if (!passage) return { success: false, destination: { layer: 'ground', cell: 0 }, message: '秘密通道不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, destination: { layer: 'ground', cell: 0 }, message: '玩家不存在' }

    if (player.discoveredSecrets.includes(passageId)) {
      return { success: false, destination: { layer: passage.toLayer, cell: passage.toCell }, message: '该秘密通道已发现' }
    }

    // 判定发现
    const roll = Math.random()
    if (roll > passage.discoveryChance) {
      return { success: false, destination: { layer: 'ground', cell: 0 }, message: '未发现秘密通道' }
    }

    player.discoveredSecrets.push(passageId)
    const destination = { layer: passage.toLayer, cell: passage.toCell }
    player.position = passage.toCell
    player.currentLayer = passage.toLayer

    eventBus.emit({ type: 'SECRET_REVEALED', payload: { playerId, passageId, destination } })
    return { success: true, destination, message: `发现秘密通道，传送到${FACTIONS[passage.toLayer]?.name || passage.toLayer}的${passage.toCell}号格子` }
  }

  // ============== 资源采集 ==============
  function collectResource(playerId: number, resourceNodeId: string): { success: boolean; yield: number; message: string } {
    const resource = RESOURCE_NODES.find(r => r.id === resourceNodeId)
    if (!resource) return { success: false, yield: 0, message: '资源点不存在' }

    const player = getPlayerById(playerId)
    if (!player) return { success: false, yield: 0, message: '玩家不存在' }

    const key = `${resource.layer}-${resource.cellIndex}`
    const cellState = cellStates[key]
    if (!cellState) return { success: false, yield: 0, message: '格子状态异常' }

    if (resource.maxCapacity > 0 && (cellState.resourceYield ?? 0) <= 0) {
      return { success: false, yield: 0, message: '资源已耗尽' }
    }

    let yield_ = resource.yield
    if (resource.maxCapacity > 0) {
      cellState.resourceYield = (cellState.resourceYield ?? resource.yield) - resource.yield
      yield_ = Math.min(resource.yield, cellState.resourceYield ?? 0)
    }

    switch (resource.resourceType) {
      case 'gold':
        player.money += yield_
        break
      case 'item':
        // 给予道具
        const shieldItem: PlayerItem = {
          id: `shield_${Date.now()}`,
          name: '免罪符',
          description: '免疫一次负面效果',
          type: 'shield',
          value: 1,
          cost: 200,
          usable: true,
          icon: '🛡️',
          ownedAt: Date.now()
        }
        player.items.push(shieldItem)
        break
      case 'buff':
        player.activeBuffs.push({ type: 'luck', remainingTurns: 3 })
        break
    }

    eventBus.emit({ type: 'RESOURCE_COLLECTED', payload: { playerId, resourceNodeId, yield: yield_ } })
    return { success: true, yield: yield_, message: `采集${resource.name}，获得${yield_}${resource.resourceType === 'gold' ? '金币' : resource.resourceType === 'item' ? '道具' : 'buff'}` }
  }

  // ============== 势力控制检查 ==============
  function checkFactionControl(playerId: number): { faction: FactionType | null; bonus: number } {
    const player = getPlayerById(playerId)
    if (!player) return { faction: null, bonus: 0 }

    // 统计各势力格子数
    const factionCounts: Record<string, number> = {}
    for (const cell of player.properties) {
      const cellData = defaultBoardCells.find(c => c.index === cell.index)
      if (cellData) {
        const faction = (cellData as any).faction as string
        if (faction && faction !== 'neutral') {
          factionCounts[faction] = (factionCounts[faction] || 0) + 1
        }
      }
    }

    // 找到控制最多的势力
    let maxFaction: FactionType | null = null
    let maxCount = 0
    for (const [faction, count] of Object.entries(factionCounts)) {
      if (count > maxCount && count >= 3) {  // 至少3格才算是控制
        maxCount = count
        maxFaction = faction as FactionType
      }
    }

    if (maxFaction && FACTIONS[maxFaction]) {
      return { faction: maxFaction, bonus: FACTIONS[maxFaction].incomePerTurn }
    }

    return { faction: null, bonus: 0 }
  }

  // ============== 地形效果获取 ==============
  function getTerrainEffect(layer: MapLayer, cellIndex: number): { moveCost: number; rentModifier: number; diceModifier: number } {
    const key = `${layer}-${cellIndex}`
    const state = cellStates[key]
    if (!state) return { moveCost: 1, rentModifier: 1.0, diceModifier: 0 }

    const terrain = state.terrain
    const terrainEffect = TERRAIN_EFFECTS[terrain]
    if (!terrainEffect) return { moveCost: 1, rentModifier: 1.0, diceModifier: 0 }

    // 季节修正
    const seasonEffect = currentSeasonEffect.value?.terrainEffects?.[terrain]
    const moveCost = seasonEffect?.moveCost ?? terrainEffect.moveCost
    const rentModifier = seasonEffect?.rentModifier ?? terrainEffect.rentModifier

    return { moveCost, rentModifier, diceModifier: terrainEffect.diceModifier }
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
    currentSeason.value = 'spring'
    currentTimeOfDay.value = 'day'
    seasonTurnCounter.value = 0
    timeOfDayTurnCounter.value = 0
    initializeCellStates()
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
    Object.keys(cellStates).forEach(key => delete cellStates[key])
    diceResult.value = 0
    messages.value = []
    rollButtonEnabled.value = false
    gameEnded.value = false
    winner.value = null
    isAITurn.value = false
    turnCount.value = 0
    treasureCount.value = 0
    currentSeason.value = 'spring'
    currentTimeOfDay.value = 'day'
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

  // 获取当前玩家
  function getCurrentPlayer(): Player | undefined {
    return players.value[currentPlayerIndex.value]
  }

  // 检查技能升级
  function checkSkillUpgrade(playerId: number): boolean {
    const player = getPlayerById(playerId)
    if (!player) return false
    // 购买3处房产后技能升级
    if (player.properties.length > 0 && player.properties.length % 3 === 0 && player.skillLevel < 3) {
      player.skillLevel++
      return true
    }
    return false
  }

  return {
    // 基础状态
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

    // 超大地图系统状态
    mapSize,
    currentSeason,
    currentTimeOfDay,
    cellStates,
    seasonTurnCounter,
    timeOfDayTurnCounter,

    // 计算属性
    currentPlayer,
    alivePlayers,
    playerCount,
    currentSeasonEffect,
    currentTimeEffect,

    // 玩家操作
    addPlayer,
    nextTurn,
    getPlayerById,
    getAlivePlayers,
    getCurrentPlayer,
    checkSkillUpgrade,
    setPlayersSource,

    // 格子探索
    revealCell,
    isCellRevealed,

    // 层级切换
    changeLayer,

    // 传送门
    handleTeleport,

    // 驿站
    useStation,

    // 冻结
    freezePlayer,

    // 障碍物
    defeatObstacle,

    // BOSS
    defeatBoss,

    // 秘密通道
    discoverSecret,

    // 资源
    collectResource,

    // 势力
    checkFactionControl,
    getTerrainEffect,

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
