/**
 * useGameLogic.ts - 游戏规则引擎 (Vue 3 composable)
 * 地图增强版
 */
import type { GameEvent, Cell, Player, Item, PlayerItem, WeatherType, PropertyLevel, GameStateContext, Obstacle } from '../types/game'
import { boardCells, events as eventConfig, START_BONUS, ITEMS, WEATHER_EFFECTS, PROPERTY_LEVELS, STATION_CONFIG, FATE_CARDS, TERRAIN_EFFECTS } from '../config'
import { useGameStore } from '../stores/gameStore'

export const EventTypes = {
  APPEND_MESSAGE: 'APPEND_MESSAGE',
  UPDATE_TOKENS: 'UPDATE_TOKENS',
  UPDATE_SCOREBOARD: 'UPDATE_SCOREBOARD',
  SHOW_GAME: 'SHOW_GAME',
  ROLL_BUTTON_ENABLED: 'ROLL_BUTTON_ENABLED',
  GAME_END: 'GAME_END',
  UPDATE_DICE: 'UPDATE_DICE',
  CLEAR_MESSAGE: 'CLEAR_MESSAGE',
  SHOW_STORE: 'SHOW_STORE',
  HIDE_STORE: 'HIDE_STORE',
  BUY_ITEM: 'BUY_ITEM',
  USE_ITEM: 'USE_ITEM',
  UPGRADE_PROPERTY: 'UPGRADE_PROPERTY',
  WEATHER_CHANGE: 'WEATHER_CHANGE',
  SHOW_ACHIEVEMENT: 'SHOW_ACHIEVEMENT',
  SHOW_CHOICE: 'SHOW_CHOICE',
  PLAYER_BANKRUPT: 'PLAYER_BANKRUPT',
  SKILL_UPGRADED: 'SKILL_UPGRADED',
  UPDATE_WEATHER: 'UPDATE_WEATHER',
  TELEPORT: 'TELEPORT',
  USE_STATION: 'USE_STATION',
  DEFEAT_OBSTACLE: 'DEFEAT_OBSTACLE',
  SHOW_FATE: 'SHOW_FATE',
  FREEZE_PLAYER: 'FREEZE_PLAYER',
  AREA_BONUS: 'AREA_BONUS',
  SHOW_DIRECTION_CHOICE: 'SHOW_DIRECTION_CHOICE'
} as const

export function useGameLogic(gameStore = useGameStore()) {

  // 创建道具实例
  function createItem(itemId: string): Item | undefined {
    return ITEMS.find(i => i.id === itemId)
  }

  // 应用角色技能
  function applySkill(player: Player, action: string, context: { roll?: number; amount?: number }) {
    const char = player.character
    switch (char.skillType) {
      case 'rollDice':
        if (action === 'rollDice' && context.roll !== undefined && context.roll < (char.skillMinRoll ?? 3)) {
          return {
            roll: context.roll + (char.skillBonus ?? 1),
            message: `${char.name}发动技能：点数 +1！`
          }
        }
        break
      case 'buyProperty':
        if (action === 'buyProperty') {
          return {
            moneyChange: char.skillMoneyBonus ?? 50,
            message: `${char.name}发动技能：额外获得${char.skillMoneyBonus}金币！`
          }
        }
        break
      case 'payRent':
        if (action === 'payRent' && context.amount !== undefined) {
          const reduction = Math.min(char.skillReduction ?? 10, context.amount)
          return {
            amount: context.amount - reduction,
            message: `${char.name}发动技能：租金减少${reduction}金币！`
          }
        }
        break
      case 'event':
        if (action === 'event' && context.amount !== undefined && context.amount < 0) {
          if (char.skillImmune) {
            if (char.skillBounce && player.skillLevel >= 2) {
              const bounceAmount = Math.floor(Math.abs(context.amount) * (player.skillLevel >= 3 ? 1 : 0.5))
              return { cancel: true, bounce: bounceAmount }
            }
            return { cancel: true }
          }
        }
        break
    }
    return null
  }

  // 计算租金（考虑等级、天气、地形）
  function calculateRent(cellData: Cell, weatherMod: number = 1): number {
    const baseRent = cellData.rent ?? 0
    const level = cellData.level ?? 0
    const levelConfig = PROPERTY_LEVELS[level]
    const rentMultiplier = levelConfig?.rentMultiplier ?? 1.0

    const weather = WEATHER_EFFECTS[gameStore.weather]
    const weatherRentMod = weather?.rentModifier ?? 1.0

    const terrainEffect = gameStore.getTerrainEffect(cellData)
    const terrainRentMod = terrainEffect?.rentModifier ?? 1.0

    return Math.floor(baseRent * rentMultiplier * weatherMod * weatherRentMod * terrainRentMod)
  }

  // 计算购买价格（考虑地形）
  function calculateCost(cellData: Cell): number {
    const baseCost = cellData.cost ?? 0
    const terrainEffect = gameStore.getTerrainEffect(cellData)
    const costMultiplier = terrainEffect?.costModifier ?? 1.0
    return Math.floor(baseCost * costMultiplier)
  }

  // 支付金币
  function payMoney(from: Player, to: Player | null, amount: number): boolean {
    if (!from.inGame) return false
    from.money -= amount
    if (to) {
      to.money += amount
    }
    if (from.money < 0) {
      from.inGame = false
      from.properties = []
      gameStore.addMessage(`${from.character.name}破产，退出游戏！`)
      gameStore.removePropertyOwners(from.id)
      checkGameEnd()
      return false
    }
    return true
  }

  // 检查游戏结束
  function checkGameEnd() {
    const alivePlayers = gameStore.getAlivePlayers()
    if (alivePlayers.length <= 1) {
      gameStore.gameInProgress = false
      gameStore.gameEnded = true
      if (alivePlayers.length === 1) {
        gameStore.winner = alivePlayers[0]
        gameStore.addMessage(`游戏结束！${alivePlayers[0].character.name}获得胜利！`)
      } else {
        gameStore.addMessage('游戏结束！所有玩家都破产。')
      }
    }
  }

  // 处理格子动作
  function handleCellAction(player: Player, cellData: Cell, events: GameEvent[]) {
    switch (cellData.type) {
      case 'start':
        events.push({ type: EventTypes.UPDATE_SCOREBOARD })
        break
      case 'property':
        handleProperty(player, cellData, events)
        break
      case 'event':
        handleEvent(player, cellData, events)
        break
      case 'store':
        events.push({ type: EventTypes.SHOW_STORE })
        break
      case 'tax':
        handleTax(player, cellData, events)
        break
      case 'treasure':
        handleTreasure(player, cellData, events)
        break
      case 'huarong':
        handleHuarong(player, cellData, events)
        break
      case 'recruit':
        handleRecruit(player, cellData, events)
        break
      case 'teleport_entry':
        handleTeleport(player, cellData, events)
        break
      case 'station':
        handleStation(player, cellData, events)
        break
      case 'port':
        handlePort(player, cellData, events)
        break
      case 'obstacle':
        handleObstacle(player, cellData, events)
        break
      case 'fate':
      case 'opportunity':
        handleFate(player, cellData, events)
        break
      case 'prison':
        handlePrison(player, cellData, events)
        break
    }
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理地产
  function handleProperty(player: Player, cellData: Cell, events: GameEvent[]) {
    const cellIndex = cellData.index ?? 0
    const owner = gameStore.getPropertyOwner(cellIndex)

    if (!owner) {
      const cost = calculateCost(cellData)
      if (player.money >= cost) {
        player.money -= cost
        player.properties.push({ ...cellData, level: 0 as PropertyLevel })
        gameStore.setPropertyOwner(cellIndex, player.id, 0)
        player.consecutiveTurnsWithoutBuy = 0
        gameStore.addMessage(`${player.character.name}购买了${cellData.name}！`)

        const skillResult = applySkill(player, 'buyProperty', {})
        if (skillResult?.moneyChange) {
          player.money += skillResult.moneyChange
          if (skillResult.message) {
            gameStore.addMessage(skillResult.message)
          }
        }

        if (gameStore.checkSkillUpgrade(player.id)) {
          events.push({ type: EventTypes.SKILL_UPGRADED, payload: { playerId: player.id, newLevel: player.skillLevel } })
          gameStore.addMessage(`${player.character.name}的技能升级到${player.skillLevel}级！`)
        }
      } else {
        gameStore.addMessage(`${player.character.name}的资金不足，无法购买！`)
        player.consecutiveTurnsWithoutBuy++
      }
    } else if (owner.playerId === player.id) {
      gameStore.addMessage(`${player.character.name}抵达自己拥有的${cellData.name}。`)
    } else {
      const ownerPlayer = gameStore.getPlayerById(owner.playerId)
      if (player.shieldActive) {
        player.shieldActive = false
        gameStore.addMessage(`${player.character.name}使用免罪符免疫了租金！`)
      } else {
        let rent = calculateRent(cellData)

        const skillResult = applySkill(player, 'payRent', { amount: rent })
        if (skillResult) {
          rent = skillResult.amount ?? rent
          if (skillResult.message) {
            gameStore.addMessage(skillResult.message)
          }
        }

        gameStore.addMessage(`${player.character.name}抵达${cellData.name}，需向${ownerPlayer?.character.name}支付租金¥${rent}。`)
        payMoney(player, ownerPlayer ?? null, rent)
      }
    }
  }

  // 处理事件
  function handleEvent(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig[cellData.eventId ?? '']
    if (!eventData) {
      gameStore.addMessage(`${player.character.name}触发${cellData.name}，未知事件。`)
      return
    }

    if (player.shieldActive && (eventData.amount ?? 0) < 0) {
      player.shieldActive = false
      gameStore.addMessage(`${player.character.name}使用免罪符免疫了负面影响！`)
      return
    }

    const skillResult = applySkill(player, 'event', { amount: eventData.amount })
    if (skillResult?.cancel) {
      gameStore.addMessage(`${player.character.name}触发${cellData.name}，但技能免疫负面影响。`)
      if (skillResult.bounce) {
        player.money += skillResult.bounce
        gameStore.addMessage(`反弹效果：获得${skillResult.bounce}金币！`)
      }
    } else {
      const amount = eventData.amount ?? 0
      if (amount >= 0) {
        player.money += amount
        gameStore.addMessage(`${player.character.name}触发${cellData.name}：${eventData.description}`)
      } else {
        const loss = -amount
        gameStore.addMessage(`${player.character.name}触发${cellData.name}：${eventData.description}`)
        payMoney(player, null, loss)
      }
    }
  }

  // 处理宝箱
  function handleTreasure(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig.treasure
    if (!eventData?.effects) return

    gameStore.treasureCount++

    const totalWeight = eventData.effects.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight

    for (const effect of eventData.effects) {
      random -= effect.weight
      if (random <= 0) {
        if (effect.type === 'money') {
          player.money += effect.amount ?? 0
          gameStore.addMessage(`${player.character.name}开启宝箱：获得${effect.amount}金币！`)
        } else if (effect.type === 'item') {
          const item = createItem(effect.itemId!)
          if (item) {
            gameStore.addItem(player.id, { ...item, ownedAt: Date.now() })
            gameStore.addMessage(`${player.character.name}开启宝箱：获得${item.icon}${item.name}！`)
          }
        }
        break
      }
    }
  }

  // 处理华容道
  function handleHuarong(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig.huarong
    if (!eventData?.options) return

    events.push({
      type: EventTypes.SHOW_CHOICE,
      payload: {
        playerId: player.id,
        cellIndex: cellData.index,
        options: eventData.options.map(opt => ({ text: opt.text, result: opt.result }))
      }
    })
  }

  // 处理招募
  function handleRecruit(player: Player, cellData: Cell, events: GameEvent[]) {
    const amount = 30
    player.money += amount
    gameStore.addMessage(`${player.character.name}招募士兵，获得${amount}金币战力支持！`)
  }

  // 处理传送阵
  function handleTeleport(player: Player, cellData: Cell, events: GameEvent[]) {
    const exitIndex = gameStore.getTeleportExit(cellData.index ?? 0)
    if (exitIndex !== null) {
      events.push({ type: EventTypes.TELEPORT, payload: { from: cellData.index, to: exitIndex } })
    }
  }

  // 处理驿站
  function handleStation(player: Player, cellData: Cell, events: GameEvent[]) {
    if (gameStore.useStation(player)) {
      events.push({ type: EventTypes.USE_STATION })
    }
  }

  // 处理港口
  function handlePort(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.portTargetIndex !== undefined) {
      const passageCost = TERRAIN_EFFECTS.water.passageCost ?? 10
      if (player.money >= passageCost) {
        player.money -= passageCost
        gameStore.addMessage(`${player.character.name}使用港口，支付${passageCost}金币船费`)
        events.push({ type: EventTypes.TELEPORT, payload: { from: cellData.index, to: cellData.portTargetIndex } })
      } else {
        gameStore.addMessage(`${player.character.name}金币不足，无法使用港口`)
      }
    }
  }

  // 处理障碍物
  function handleObstacle(player: Player, cellData: Cell, events: GameEvent[]) {
    const obstacle = gameStore.getObstacleAt(cellData.index ?? 0)
    if (obstacle && !obstacle.defeated) {
      if (player.money >= (obstacle.reward ?? 0)) {
        gameStore.defeatObstacle(player.id, gameStore.obstacles.findIndex(o => o === obstacle))
        player.defeatedObstacles.push(obstacle.id)
      } else {
        gameStore.addMessage(`${player.character.name}金币不足，无法击败障碍物`)
      }
    }
  }

  // 处理命运牌
  function handleFate(player: Player, cellData: Cell, events: GameEvent[]) {
    const randomIndex = Math.floor(Math.random() * FATE_CARDS.length)
    const card = FATE_CARDS[randomIndex]

    gameStore.addMessage(`${player.character.name}抽取命运牌：${card.icon}${card.name} - ${card.description}`)
    events.push({ type: EventTypes.SHOW_FATE, payload: { card, playerId: player.id } })

    switch (card.effect.type) {
      case 'money':
        if (card.effect.affectAll) {
          gameStore.players.forEach(p => {
            if (p.id !== player.id && p.inGame) {
              p.money += card.effect.value ?? 0
              gameStore.addMessage(`${p.character.name}损失${Math.abs(card.effect.value ?? 0)}金币`)
            }
          })
        } else {
          player.money += card.effect.value ?? 0
        }
        break
      case 'weather':
        const weatherTypes: WeatherType[] = ['sunny', 'rainy', 'foggy', 'stormy']
        gameStore.weather = weatherTypes[card.effect.value ?? 0]
        break
      case 'skill':
        if (player.skillLevel < 3) {
          player.skillLevel++
          gameStore.addMessage(`${player.character.name}技能升级到${player.skillLevel}级`)
        }
        break
      case 'freeze':
        const targetIndex = (gameStore.currentPlayerIndex + 1) % gameStore.players.length
        gameStore.freezePlayer(gameStore.players[targetIndex].id, 1)
        break
    }
  }

  // 处理监狱
  function handlePrison(player: Player, cellData: Cell, events: GameEvent[]) {
    player.frozenTurns += 1
    gameStore.addMessage(`${player.character.name}被关进监狱，停留1回合`)
    events.push({ type: EventTypes.FREEZE_PLAYER, payload: { playerId: player.id, turns: 1 } })
  }

  // 处理税收
  function handleTax(player: Player, cellData: Cell, events: GameEvent[]) {
    if (player.shieldActive) {
      player.shieldActive = false
      gameStore.addMessage(`${player.character.name}使用免罪符免疫了税收！`)
    } else {
      gameStore.addMessage(`${player.character.name}需要缴纳税收¥${cellData.amount ?? 50}。`)
      payMoney(player, null, cellData.amount ?? 50)
    }
  }

  // 移动玩家
  function movePlayer(player: Player, steps: number, events: GameEvent[]) {
    const oldPos = player.position
    const boardSize = gameStore.currentBoardCells.length
    const newPos = (oldPos + steps) % boardSize

    if (newPos <= oldPos) {
      player.money += START_BONUS
      gameStore.addMessage(`${player.character.name}经过起点，获得200金币！`)
    }

    player.position = newPos
    events.push({ type: EventTypes.UPDATE_TOKENS })

    // 检查地形效果
    const terrainEffect = gameStore.getTerrainEffect(gameStore.currentBoardCells[newPos])
    if (terrainEffect.diceModifier !== 0) {
      gameStore.addMessage(`地形效果：${terrainEffect.description}`)
    }

    handleCellAction(player, gameStore.currentBoardCells[newPos], events)
  }

  // 移动到指定位置（传送）
  function teleportTo(player: Player, targetIndex: number, events: GameEvent[]) {
    player.position = targetIndex
    gameStore.addMessage(`${player.character.name}被传送至${gameStore.currentBoardCells[targetIndex]?.name}`)
    events.push({ type: EventTypes.UPDATE_TOKENS })
    handleCellAction(player, gameStore.currentBoardCells[targetIndex], events)
  }

  // 掷骰子
  function rollDice(): GameEvent[] {
    const events: GameEvent[] = []
    if (!gameStore.gameInProgress) return events

    events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: false })
    events.push({ type: EventTypes.CLEAR_MESSAGE })

    const player = gameStore.currentPlayer
    if (!player || !player.inGame) {
      return events
    }

    let roll = Math.floor(Math.random() * 6) + 1

    // 天气修正
    const weather = WEATHER_EFFECTS[gameStore.weather]
    if (weather?.diceModifier) {
      roll = Math.max(1, roll + weather.diceModifier)
    }

    // 技能效果
    const skillResult = applySkill(player, 'rollDice', { roll })
    if (skillResult) {
      roll = skillResult.roll ?? roll
      if (skillResult.message) {
        gameStore.addMessage(skillResult.message)
      }
    }

    events.push({ type: EventTypes.UPDATE_DICE, payload: roll })
    gameStore.addMessage(`${player.character.name}掷出了${roll}点`)

    movePlayer(player, roll, events)

    return events
  }

  // 下一回合
  function nextTurnLogic(): GameEvent[] {
    const events: GameEvent[] = []
    if (!gameStore.gameInProgress) return events

    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
    gameStore.nextTurn()
    const nextPlayer = gameStore.currentPlayer
    if (nextPlayer) {
      events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: true })
      gameStore.addMessage(`轮到${nextPlayer.character.name}行动。`)
    }
    return events
  }

  // 购买道具
  function buyItem(player: Player, itemId: string): boolean {
    const item = createItem(itemId)
    if (!item) return false

    if (player.money < item.cost) {
      gameStore.addMessage(`${player.character.name}金币不足，无法购买${item.name}！`)
      return false
    }

    player.money -= item.cost
    gameStore.addItem(player.id, { ...item, ownedAt: Date.now() })
    gameStore.addMessage(`${player.character.name}购买了${item.icon}${item.name}！`)
    return true
  }

  // 使用道具
  function useItem(player: Player, itemId: string, events: GameEvent[]): boolean {
    const itemIndex = player.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return false

    const item = player.items[itemIndex]
    player.items.splice(itemIndex, 1)

    switch (item.type) {
      case 'dice':
        player.lastDiceRoll = item.value
        gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，指定骰子为${item.value}点！`)
        events.push({ type: EventTypes.UPDATE_DICE, payload: item.value })
        break
      case 'shield':
        player.shieldActive = true
        gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，免疫下一次负面效果！`)
        break
      case 'steal':
        const alivePlayers = gameStore.getAlivePlayers().filter(p => p.id !== player.id)
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          const stealAmount = Math.min(item.value, target.money)
          target.money -= stealAmount
          player.money += stealAmount
          gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，从${target.character.name}抢夺${stealAmount}金币！`)
        }
        break
      case 'freeze':
        const targetIndex = (gameStore.currentPlayerIndex + 1) % gameStore.players.length
        gameStore.freezePlayer(gameStore.players[targetIndex].id, item.value)
        gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，冻结对手1回合！`)
        break
      case 'reverse':
        const otherPlayers = gameStore.getAlivePlayers().filter(p => p.id !== player.id)
        if (otherPlayers.length > 0) {
          const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
          const tempPos = player.position
          player.position = target.position
          target.position = tempPos
          gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，与${target.character.name}交换位置！`)
          events.push({ type: EventTypes.UPDATE_TOKENS })
        }
        break
      case 'teleport':
        gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，请选择传送目标！`)
        break
      case 'luck':
        if (player.lastDiceRoll) {
          player.lastDiceRoll += item.value
          gameStore.addMessage(`${player.character.name}使用${item.icon}${item.name}，本回合骰子+${item.value}！`)
          events.push({ type: EventTypes.UPDATE_DICE, payload: player.lastDiceRoll })
        }
        break
    }

    events.push({ type: EventTypes.USE_ITEM, payload: { playerId: player.id, itemId } })
    return true
  }

  return {
    selectCharacter,
    startGame,
    rollDice,
    nextTurnLogic,
    applySkill,
    checkGameEnd,
    buyItem,
    useItem,
    movePlayer,
    teleportTo,
    handleCellAction,
    calculateRent,
    calculateCost,
    EventTypes
  }

  // 以下是补充的函数
  function selectCharacter(character: any): GameEvent[] {
    const events: GameEvent[] = []
    if (gameStore.gameInProgress) return events

    const existingPlayer = gameStore.players.find(p => p.character.id === character.id)
    if (existingPlayer) {
      gameStore.addMessage('该角色已被选择，请选其他英雄！')
      return events
    }

    gameStore.addPlayer(character)

    if (gameStore.selectingPlayerIndex < 2) {
      gameStore.addMessage(`已选择 ${gameStore.players.length} 名玩家，继续选择玩家 ${gameStore.selectingPlayerIndex + 1} 的角色`)
    } else {
      startGame()
      gameStore.addMessage('游戏开始！玩家1先行动。')
    }
    return events
  }

  function startGame() {
    gameStore.startGame()
  }
}
