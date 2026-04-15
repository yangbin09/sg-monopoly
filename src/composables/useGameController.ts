/**
 * useGameController.ts - 游戏控制器 Composable
 * 协调 Pinia stores 和事件总线
 */
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAudioStore } from '../stores/audioStore'
import { useAI, DEFAULT_AI_CONFIG } from './useAI'
import { eventBus } from '../eventBus'
import { characters, boardCells, WEATHER_EFFECTS } from '../config'
import type { Character, GameEvent, Cell, Player, PlayerItem, PropertyLevel } from '../types/game'

export function useGameController() {
  const gameStore = useGameStore()
  const settingsStore = useSettingsStore()
  const audioStore = useAudioStore()
  const ai = useAI(DEFAULT_AI_CONFIG)

  // 计算上下文（用于 AI 决策）
  const gameContext = computed(() => ({
    players: gameStore.players,
    currentPlayerIndex: gameStore.currentPlayerIndex,
    weather: gameStore.weather,
    turnCount: gameStore.turnCount,
    treasureCount: gameStore.treasureCount
  }))

  // 获取当前玩家
  const currentPlayer = computed(() => gameStore.currentPlayer)

  // 选择角色
  function selectCharacter(character: Character): GameEvent[] {
    const events: GameEvent[] = []

    if (gameStore.gameInProgress) {
      return events
    }

    const existingPlayer = gameStore.players.find(p => p.character.id === character.id)
    if (existingPlayer) {
      events.push({
        type: 'APPEND_MESSAGE',
        payload: '该角色已被选择，请选其他英雄！'
      } as GameEvent)
      return events
    }

    gameStore.addPlayer(character)

    if (gameStore.selectingPlayerIndex < 2) {
      events.push({
        type: 'UPDATE_SELECTION_INFO',
        payload: `已选择 ${gameStore.players.length} 名玩家，继续选择玩家 ${gameStore.selectingPlayerIndex + 1} 的角色`
      } as GameEvent)
    } else {
      events.push({ type: 'SHOW_GAME' } as GameEvent)
      startGame(events)
    }

    return events
  }

  // 开始游戏
  function startGame(events: GameEvent[]): void {
    gameStore.startGame()
    events.push({ type: 'UPDATE_TOKENS' } as GameEvent)
    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
    events.push({ type: 'ROLL_BUTTON_ENABLED', payload: true } as GameEvent)
    events.push({ type: 'APPEND_MESSAGE', payload: '游戏开始！玩家1先行动。' } as GameEvent)
  }

  // 掷骰子
  function rollDice(): GameEvent[] {
    const events: GameEvent[] = []

    if (!gameStore.gameInProgress) return events

    events.push({ type: 'ROLL_BUTTON_ENABLED', payload: false } as GameEvent)
    events.push({ type: 'CLEAR_MESSAGE' } as GameEvent)

    const player = gameStore.currentPlayer
    if (!player || !player.inGame) {
      return nextTurnLogic()
    }

    // 随机掷骰子
    let roll = Math.floor(Math.random() * 6) + 1

    // 天气修正
    const weather = WEATHER_EFFECTS[gameStore.weather]
    if (weather?.diceModifier) {
      roll = Math.max(1, roll + weather.diceModifier)
    }

    // 幸运符效果
    for (const item of player.items) {
      if (item.type === 'luck') {
        roll += item.value
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}的幸运符生效，+${item.value}点！`
        } as GameEvent)
        gameStore.removeItem(player.id, item.id)
        break
      }
    }

    gameStore.diceResult = roll
    events.push({ type: 'UPDATE_DICE', payload: roll } as GameEvent)
    events.push({ type: 'APPEND_MESSAGE', payload: `${player.character.name}掷出了${roll}点` } as GameEvent)

    movePlayer(player, roll, events)

    return events
  }

  // 移动玩家
  function movePlayer(player: Player, steps: number, events: GameEvent[]): void {
    const oldPos = player.position
    const newPos = (oldPos + steps) % boardCells.length

    // 经过起点
    if (newPos <= oldPos) {
      player.money += 200
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}经过起点，获得200金币！`
      } as GameEvent)
    }

    player.position = newPos
    events.push({ type: 'UPDATE_TOKENS' } as GameEvent)

    // 处理格子
    const cell = boardCells[newPos]
    handleCellAction(player, cell, events)
  }

  // 处理格子动作
  function handleCellAction(player: Player, cell: Cell, events: GameEvent[]): void {
    const ctx = gameContext.value

    switch (cell.type) {
      case 'property':
        handlePropertyCell(player, cell, events)
        break
      case 'event':
        handleEventCell(player, cell, events)
        break
      case 'store':
        events.push({ type: 'SHOW_STORE' } as GameEvent)
        break
      case 'tax':
        handleTaxCell(player, cell, events)
        break
      case 'treasure':
        handleTreasureCell(player, cell, events)
        break
    }

    // 检查游戏结束
    checkGameEnd(events)
  }

  // 处理地产格子
  function handlePropertyCell(player: Player, cell: Cell, events: GameEvent[]): void {
    const cellIndex = cell.index ?? boardCells.indexOf(cell)
    const owner = gameStore.getPropertyOwner(cellIndex)

    if (!owner) {
      // 无主地产，可购买
      if (player.money >= (cell.cost ?? 0)) {
        player.money -= cell.cost ?? 0
        const newProperty = { ...cell, level: 0 as PropertyLevel }
        player.properties.push(newProperty)
        gameStore.setPropertyOwner(cellIndex, player.id, 0)

        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}购买了${cell.name}！`
        } as GameEvent)

        audioStore.play('buy')
      } else {
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}的资金不足，无法购买！`
        } as GameEvent)
      }
    } else if (owner.playerId === player.id) {
      // 自己的地产 - 检查升级
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}抵达自己拥有的${cell.name}。`
      } as GameEvent)

      const level = cell.level ?? 0
      if (level < (cell.maxLevel ?? 3)) {
        const upgradeCost = cell.upgradeCosts?.[level]
        if (upgradeCost && player.money >= upgradeCost) {
          events.push({
            type: 'APPEND_MESSAGE',
            payload: `是否花费${upgradeCost}金币升级${cell.name}？`
          } as GameEvent)
        }
      }
    } else {
      // 需支付租金
      const ownerPlayer = gameStore.getPlayerById(owner.playerId)
      const baseRent = cell.rent ?? 0
      const levelConfig = PROPERTY_LEVELS[owner.level]
      const weatherEffect = WEATHER_EFFECTS[gameStore.weather]
      const rent = Math.floor(
        baseRent * (levelConfig?.rentMultiplier ?? 1) * (weatherEffect?.rentModifier ?? 1)
      )

      if (player.shieldActive) {
        player.shieldActive = false
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}使用免罪符免疫了租金！`
        } as GameEvent)
      } else {
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}抵达${cell.name}，需向${ownerPlayer?.character.name}支付租金¥${rent}。`
        } as GameEvent)

        player.money -= rent
        if (ownerPlayer) {
          ownerPlayer.money += rent
        }

        if (player.money < 0) {
          player.inGame = false
          player.properties = []
          gameStore.removePropertyOwners(player.id)
          events.push({
            type: 'APPEND_MESSAGE',
            payload: `${player.character.name}破产，退出游戏！`
          } as GameEvent)
          events.push({ type: 'PLAYER_BANKRUPT', payload: { playerId: player.id } } as GameEvent)
        }
      }
    }

    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
  }

  // 处理事件格子
  function handleEventCell(player: Player, cell: Cell, events: GameEvent[]): void {
    const eventConfig = cell.eventId

    if (player.shieldActive && cell.type === 'event') {
      player.shieldActive = false
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}使用免罪符免疫了负面影响！`
      } as GameEvent)
      return
    }

    // 简化：随机事件
    const amount = Math.floor(Math.random() * 200) - 50

    if (amount >= 0) {
      player.money += amount
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}触发${cell.name}：获得${amount}金币！`
      } as GameEvent)
    } else {
      player.money += amount
      if (player.money < 0) {
        player.inGame = false
        gameStore.removePropertyOwners(player.id)
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}破产，退出游戏！`
        } as GameEvent)
      }
    }

    audioStore.play('event')
    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
  }

  // 处理税收格子
  function handleTaxCell(player: Player, cell: Cell, events: GameEvent[]): void {
    const tax = cell.amount ?? 50

    if (player.shieldActive) {
      player.shieldActive = false
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}使用免罪符免疫了税收！`
      } as GameEvent)
    } else {
      player.money -= tax
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}需要缴纳税收¥${tax}。`
      } as GameEvent)

      if (player.money < 0) {
        player.inGame = false
        gameStore.removePropertyOwners(player.id)
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}破产，退出游戏！`
        } as GameEvent)
      }
    }

    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
  }

  // 处理宝箱格子
  function handleTreasureCell(player: Player, cell: Cell, events: GameEvent[]): void {
    gameStore.treasureCount++

    const rewards = [
      { type: 'money', amount: 50 },
      { type: 'money', amount: 100 },
      { type: 'money', amount: 200 },
      { type: 'item', itemId: 'shield' }
    ]

    const reward = rewards[Math.floor(Math.random() * rewards.length)]

    if (reward.type === 'money') {
      player.money += reward.amount ?? 0
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}开启宝箱：获得${reward.amount}金币！`
      } as GameEvent)
    } else {
      const item = ITEMS.find(i => i.id === reward.itemId)
      if (item) {
        const playerItem: PlayerItem = { ...item, ownedAt: Date.now() }
        gameStore.addItem(player.id, playerItem)
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}开启宝箱：获得${item.icon}${item.name}！`
        } as GameEvent)
      }
    }

    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
  }

  // 升级地产
  function upgradeProperty(cellIndex: number): GameEvent[] {
    const events: GameEvent[] = []
    const player = gameStore.currentPlayer

    if (!player) return events

    const property = player.properties.find(p => p.index === cellIndex)
    if (!property) return events

    const level = property.level ?? 0
    if (level >= (property.maxLevel ?? 3)) {
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${property.name}已达最高等级！`
      } as GameEvent)
      return events
    }

    const upgradeCost = property.upgradeCosts?.[level]
    if (!upgradeCost || player.money < upgradeCost) {
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `金币不足，无法升级！`
      } as GameEvent)
      return events
    }

    player.money -= upgradeCost
    gameStore.upgradeProperty(cellIndex, (level + 1) as PropertyLevel)

    events.push({
      type: 'APPEND_MESSAGE',
      payload: `${player.character.name}将${property.name}升级！`
    } as GameEvent)
    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)

    return events
  }

  // 检查游戏结束
  function checkGameEnd(events: GameEvent[]): void {
    const alivePlayers = gameStore.alivePlayers

    if (alivePlayers.length <= 1) {
      gameStore.gameInProgress = false
      gameStore.gameEnded = true

      if (alivePlayers.length === 1) {
        gameStore.winner = alivePlayers[0]
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `游戏结束！${alivePlayers[0].character.name}获得胜利！`
        } as GameEvent)
        audioStore.play('win')
      } else {
        events.push({
          type: 'APPEND_MESSAGE',
          payload: '游戏结束！所有玩家都破产。'
        } as GameEvent)
        audioStore.play('lose')
      }

      events.push({ type: 'GAME_END' } as GameEvent)
    }
  }

  // 下一回合
  function nextTurnLogic(): GameEvent[] {
    const events: GameEvent[] = []

    if (!gameStore.gameInProgress) return events

    events.push({ type: 'UPDATE_SCOREBOARD', payload: gameStore.currentPlayerIndex } as GameEvent)
    gameStore.nextTurn()

    // 每10回合换一次天气
    if (gameStore.turnCount % 10 === 0) {
      const weatherTypes: WeatherType[] = ['sunny', 'rainy', 'foggy', 'stormy']
      const currentIndex = weatherTypes.indexOf(gameStore.weather)
      gameStore.weather = weatherTypes[(currentIndex + 1) % weatherTypes.length]
      events.push({ type: 'WEATHER_CHANGE', payload: gameStore.weather } as GameEvent)
    }

    events.push({ type: 'ROLL_BUTTON_ENABLED', payload: true } as GameEvent)
    events.push({
      type: 'APPEND_MESSAGE',
      payload: `轮到${gameStore.currentPlayer?.character.name}行动。`
    } as GameEvent)

    return events
  }

  // AI 回合
  async function executeAITurn(): Promise<GameEvent[]> {
    const events: GameEvent[] = []
    const player = gameStore.currentPlayer

    if (!player || !player.isAI) return events

    // AI 决策
    const currentCell = boardCells[player.position]
    const decision = ai.executeAITurn(player, gameContext.value, currentCell)

    switch (decision.action) {
      case 'buy':
        if (currentCell.type === 'property' && currentCell.cost && player.money >= currentCell.cost) {
          player.money -= currentCell.cost
          const newProperty = { ...currentCell, level: 0 as PropertyLevel }
          player.properties.push(newProperty)
          gameStore.setPropertyOwner(currentCell.index ?? 0, player.id, 0)
          events.push({
            type: 'APPEND_MESSAGE',
            payload: `${player.character.name}购买了${currentCell.name}！`
          } as GameEvent)
        }
        break
      case 'upgrade':
        if (decision.targetCell !== undefined) {
          events.push(...upgradeProperty(decision.targetCell))
        }
        break
    }

    return events
  }

  // 购买道具
  function buyItem(itemId: string): GameEvent[] {
    const events: GameEvent[] = []
    const player = gameStore.currentPlayer

    if (!player) return events

    const item = ITEMS.find(i => i.id === itemId)
    if (!item || player.money < item.cost) {
      events.push({
        type: 'APPEND_MESSAGE',
        payload: `${player.character.name}金币不足，无法购买${item?.name}！`
      } as GameEvent)
      return events
    }

    player.money -= item.cost
    const playerItem: PlayerItem = { ...item, ownedAt: Date.now() }
    gameStore.addItem(player.id, playerItem)

    events.push({
      type: 'APPEND_MESSAGE',
      payload: `${player.character.name}购买了${item.icon}${item.name}！`
    } as GameEvent)
    events.push({ type: 'HIDE_STORE' } as GameEvent)
    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)

    return events
  }

  // 使用道具
  function useItem(itemId: string): GameEvent[] {
    const events: GameEvent[] = []
    const player = gameStore.currentPlayer

    if (!player) return events

    const itemIndex = player.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return events

    const item = player.items[itemIndex]
    player.items.splice(itemIndex, 1)

    switch (item.type) {
      case 'dice':
        gameStore.diceResult = item.value
        events.push({
          type: 'UPDATE_DICE',
          payload: item.value
        } as GameEvent)
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}使用${item.icon}${item.name}，指定骰子为${item.value}点！`
        } as GameEvent)
        break

      case 'shield':
        player.shieldActive = true
        events.push({
          type: 'APPEND_MESSAGE',
          payload: `${player.character.name}使用${item.icon}${item.name}，免疫下一次负面效果！`
        } as GameEvent)
        break

      case 'steal':
        const alivePlayers = gameStore.alivePlayers.filter(p => p.id !== player.id)
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          const stealAmount = Math.min(item.value, target.money)
          target.money -= stealAmount
          player.money += stealAmount
          events.push({
            type: 'APPEND_MESSAGE',
            payload: `${player.character.name}使用${item.icon}${item.name}，从${target.character.name}抢夺${stealAmount}金币！`
          } as GameEvent)
        }
        break
    }

    events.push({ type: 'UPDATE_SCOREBOARD' } as GameEvent)
    return events
  }

  return {
    // State
    gameStore,
    settingsStore,
    audioStore,
    currentPlayer,
    gameContext,

    // Actions
    selectCharacter,
    startGame,
    rollDice,
    nextTurnLogic,
    executeAITurn,
    upgradeProperty,
    buyItem,
    useItem,
    movePlayer,
    handleCellAction
  }
}

// 临时引用（需在 config 中定义）
const PROPERTY_LEVELS: Record<number, { name: string; rentMultiplier: number }> = {
  0: { name: '空地', rentMultiplier: 1.0 },
  1: { name: '房屋', rentMultiplier: 1.5 },
  2: { name: '高楼', rentMultiplier: 2.0 },
  3: { name: '酒店', rentMultiplier: 3.0 }
}

const ITEMS = [
  { id: 'shield', name: '免罪符', icon: '🛡️', type: 'shield' as const, cost: 100, value: 0, usable: true },
  { id: 'dice', name: '遥控骰子', icon: '🎲', type: 'dice' as const, cost: 150, value: 6, usable: true },
  { id: 'luck', name: '幸运符', icon: '🍀', type: 'luck' as const, cost: 80, value: 2, usable: true }
]

type WeatherType = 'sunny' | 'rainy' | 'foggy' | 'stormy'
