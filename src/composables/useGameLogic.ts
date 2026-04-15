/**
 * useGameLogic.ts - 游戏规则引擎 (Vue 3 composable)
 */
import type { GameEvent, Cell, Player, Item, PlayerItem, WeatherType, PropertyLevel, GameStateContext, Character } from '../types/game'
import { boardCells, events as eventConfig, START_BONUS, ITEMS, WEATHER_EFFECTS, PROPERTY_LEVELS, SKILL_UPGRADE_THRESHOLD, ACHIEVEMENTS } from '../config'
import type { GameStateReturn } from '../stores/gameState'

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
  UPDATE_WEATHER: 'UPDATE_WEATHER'
}

export function useGameLogic(gameState: GameStateReturn) {

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
            // 检查反弹
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

  // 计算租金（考虑等级和天气）
  function calculateRent(cellData: Cell, weatherMod: number = 1): number {
    const baseRent = cellData.rent ?? 0
    const level = cellData.level ?? 0
    const levelConfig = PROPERTY_LEVELS[level]
    const rentMultiplier = levelConfig?.rentMultiplier ?? 1.0

    const weather = WEATHER_EFFECTS[gameState.state.weather]
    const weatherRentMod = weather?.rentModifier ?? 1.0

    return Math.floor(baseRent * rentMultiplier * weatherMod * weatherRentMod)
  }

  // 支付金币
  function payMoney(from: Player, to: Player | null, amount: number, events: GameEvent[]) {
    if (!from.inGame) return
    from.money -= amount
    if (to) {
      to.money += amount
    }
    if (from.money < 0) {
      from.inGame = false
      from.properties = []
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${from.character.name}破产，退出游戏！` })
      events.push({ type: EventTypes.PLAYER_BANKRUPT, payload: { playerId: from.id } })
      gameState.removePropertyOwners(from.id)
      checkGameEnd(events)
    }
  }

  // 检查游戏结束
  function checkGameEnd(events: GameEvent[]) {
    const alivePlayers = gameState.getAlivePlayers()
    if (alivePlayers.length <= 1) {
      gameState.state.gameInProgress = false
      gameState.state.gameEnded = true
      if (alivePlayers.length === 1) {
        gameState.state.winner = alivePlayers[0]
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `游戏结束！${alivePlayers[0].character.name}获得胜利！` })
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: '游戏结束！所有玩家都破产。' })
      }
      events.push({ type: EventTypes.GAME_END })
    }
  }

  // 处理格子动作
  function handleCellAction(player: Player, cellData: Cell, events: GameEvent[]) {
    const ctx = getGameContext()
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
    }
    // 检查成就
    checkAchievements(player, ctx, events)
  }

  // 获取游戏上下文（用于成就判定）
  function getGameContext(): GameStateContext {
    return {
      players: gameState.state.players,
      currentPlayerIndex: gameState.state.currentPlayerIndex,
      weather: gameState.state.weather,
      turnCount: gameState.state.turnCount,
      treasureCount: gameState.state.treasureCount
    }
  }

  // 检查成就
  function checkAchievements(player: Player, ctx: GameStateContext, events: GameEvent[]) {
    for (const achievement of ACHIEVEMENTS) {
      if (!player.achievements.includes(achievement.id)) {
        ctx.winner = gameState.state.winner ?? undefined
        if (achievement.condition(ctx)) {
          gameState.unlockAchievement(player.id, achievement.id)
          if (achievement.reward) {
            player.money += achievement.reward
          }
          events.push({
            type: EventTypes.SHOW_ACHIEVEMENT,
            payload: {
              playerId: player.id,
              achievement
            }
          })
        }
      }
    }
  }

  // 处理地产
  function handleProperty(player: Player, cellData: Cell, events: GameEvent[]) {
    const cellIndex = cellData.index ?? boardCells.indexOf(cellData)
    const ownerId = gameState.getPropertyOwner(cellIndex)

    if (!ownerId) {
      // 无主地产，可购买
      if (player.money >= (cellData.cost ?? 0)) {
        player.money -= cellData.cost ?? 0
        const newCell = { ...cellData, level: 0 as PropertyLevel }
        player.properties.push(newCell)
        gameState.setPropertyOwner(cellIndex, player.id, 0)
        player.consecutiveTurnsWithoutBuy = 0

        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}购买了${cellData.name}！` })

        // 技能效果
        const skillResult = applySkill(player, 'buyProperty', {})
        if (skillResult?.moneyChange) {
          player.money += skillResult.moneyChange
          if (skillResult.message) {
            events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
          }
        }

        // 检查技能升级
        if (gameState.checkSkillUpgrade(player.id)) {
          events.push({
            type: EventTypes.SKILL_UPGRADED,
            payload: { playerId: player.id, newLevel: player.skillLevel }
          })
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}的技能升级到${player.skillLevel}级！` })
        }
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}的资金不足，无法购买！` })
        player.consecutiveTurnsWithoutBuy++
      }
    } else if (ownerId === player.id) {
      // 自己的地产
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}抵达自己拥有的${cellData.name}。` })
      // 显示升级选项
      const level = cellData.level ?? 0
      if (level < (cellData.maxLevel ?? 3)) {
        const upgradeCost = cellData.upgradeCosts?.[level]
        if (upgradeCost && player.money >= upgradeCost) {
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `是否花费${upgradeCost}金币升级${cellData.name}？` })
        }
      }
    } else {
      // 需支付租金
      const owner = gameState.getPlayerById(ownerId)
      let rent = calculateRent(cellData)

      // 检查免罪符
      if (player.shieldActive) {
        player.shieldActive = false
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用免罪符免疫了租金！` })
      } else {
        const skillResult = applySkill(player, 'payRent', { amount: rent })
        if (skillResult) {
          rent = skillResult.amount ?? rent
          if (skillResult.message) {
            events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
          }
        }

        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}抵达${cellData.name}，需向${owner?.character.name}支付租金¥${rent}。` })
        payMoney(player, owner ?? null, rent, events)
      }
    }
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 升级地产
  function upgradeProperty(player: Player, cellIndex: number, events: GameEvent[]) {
    const cell = player.properties.find(p => p.index === cellIndex)
    if (!cell) return

    const level = cell.level ?? 0
    if (level >= (cell.maxLevel ?? 3)) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${cell.name}已达最高等级！` })
      return
    }

    const upgradeCost = cell.upgradeCosts?.[level]
    if (!upgradeCost || player.money < upgradeCost) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `金币不足，无法升级！` })
      return
    }

    player.money -= upgradeCost
    cell.level = (level + 1) as PropertyLevel

    const newLevelName = PROPERTY_LEVELS[cell.level!].name
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}将${cell.name}升级为${newLevelName}！` })
    events.push({ type: EventTypes.UPGRADE_PROPERTY, payload: { cellIndex, newLevel: cell.level } })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理事件
  function handleEvent(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig[cellData.eventId ?? '']
    if (!eventData) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}，未知事件。` })
      events.push({ type: EventTypes.UPDATE_SCOREBOARD })
      return
    }

    const ctx = getGameContext()
    ctx.lastEventAmount = eventData.amount ?? 0

    // 检查免罪符
    if (player.shieldActive && (eventData.amount ?? 0) < 0) {
      player.shieldActive = false
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用免罪符免疫了负面影响！` })
      checkAchievements(player, ctx, events)
      events.push({ type: EventTypes.UPDATE_SCOREBOARD })
      return
    }

    // 技能免疫
    const skillResult = applySkill(player, 'event', { amount: eventData.amount })
    if (skillResult?.cancel) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}，但技能免疫负面影响。` })
      if (skillResult.bounce) {
        player.money += skillResult.bounce
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `反弹效果：获得${skillResult.bounce}金币！` })
      }
    } else {
      const amount = eventData.amount ?? 0
      if (amount >= 0) {
        player.money += amount
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}：${eventData.description}` })
      } else {
        const loss = -amount
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}：${eventData.description}` })
        payMoney(player, null, loss, events)
      }
    }
    checkAchievements(player, ctx, events)
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理宝箱
  function handleTreasure(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig.treasure
    if (!eventData?.effects) return

    gameState.state.treasureCount++

    // 随机抽取效果
    const totalWeight = eventData.effects.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight

    for (const effect of eventData.effects) {
      random -= effect.weight
      if (random <= 0) {
        if (effect.type === 'money') {
          player.money += effect.amount ?? 0
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}开启宝箱：获得${effect.amount}金币！` })
        } else if (effect.type === 'item') {
          const item = createItem(effect.itemId!)
          if (item) {
            const playerItem: PlayerItem = { ...item, ownedAt: Date.now() }
            gameState.addItem(player.id, playerItem)
            events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}开启宝箱：获得${item.icon}${item.name}！` })
          }
        }
        break
      }
    }

    const ctx = getGameContext()
    checkAchievements(player, ctx, events)
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理华容道（选择事件）
  function handleHuarong(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig.huarong
    if (!eventData?.options) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发华容道，但事件配置错误。` })
      return
    }

    // 显示选择给玩家
    events.push({
      type: EventTypes.SHOW_CHOICE,
      payload: {
        playerId: player.id,
        cellIndex: cellData.index,
        options: eventData.options.map(opt => ({ text: opt.text, result: opt.result }))
      }
    })
  }

  // 处理华容道选择结果
  function handleHuarongChoice(playerId: number, cellIndex: number, choiceIndex: number, events: GameEvent[]) {
    const player = gameState.getPlayerById(playerId)
    if (!player) return

    const eventData = eventConfig.huarong
    if (!eventData?.options?.[choiceIndex]) return

    const option = eventData.options[choiceIndex]
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}选择${option.text}：${option.result}` })

    if (option.effect.amount) {
      const amount = option.effect.amount
      if (amount >= 0) {
        player.money += amount
      } else {
        payMoney(player, null, -amount, events)
      }
    }

    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理招募
  function handleRecruit(player: Player, cellData: Cell, events: GameEvent[]) {
    const eventData = eventConfig.recruit
    const amount = eventData?.amount ?? 30

    player.money += amount
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}招募士兵，获得${amount}金币战力支持！` })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 处理税收
  function handleTax(player: Player, cellData: Cell, events: GameEvent[]) {
    // 检查免罪符
    if (player.shieldActive) {
      player.shieldActive = false
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用免罪符免疫了税收！` })
    } else {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}需要缴纳税收¥${cellData.amount}。` })
      payMoney(player, null, cellData.amount ?? 50, events)
    }
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  // 移动玩家
  function movePlayer(player: Player, steps: number, events: GameEvent[]) {
    const oldPos = player.position
    const newPos = (oldPos + steps) % boardCells.length

    // 经过起点
    if (newPos <= oldPos) {
      player.money += START_BONUS
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}经过起点，获得200金币！` })
    }

    player.position = newPos
    player.lastDiceRoll = steps
    events.push({ type: EventTypes.UPDATE_TOKENS })
    handleCellAction(player, boardCells[newPos], events)
  }

  // 购买道具
  function buyItem(player: Player, itemId: string, events: GameEvent[]): boolean {
    const item = createItem(itemId)
    if (!item) return false

    if (player.money < item.cost) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}金币不足，无法购买${item.name}！` })
      return false
    }

    player.money -= item.cost
    const playerItem: PlayerItem = { ...item, ownedAt: Date.now() }
    gameState.addItem(player.id, playerItem)

    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}购买了${item.icon}${item.name}！` })
    events.push({ type: EventTypes.BUY_ITEM, payload: { playerId: player.id, item } })
    events.push({ type: EventTypes.HIDE_STORE })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })

    // 检查成就
    const ctx = getGameContext()
    checkAchievements(player, ctx, events)

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
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${item.icon}${item.name}，指定骰子为${item.value}点！` })
        events.push({ type: EventTypes.UPDATE_DICE, payload: item.value })
        break

      case 'shield':
        player.shieldActive = true
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${item.icon}${item.name}，免疫下一次负面效果！` })
        break

      case 'steal':
        const alivePlayers = gameState.getAlivePlayers().filter(p => p.id !== player.id)
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          const stealAmount = Math.min(item.value, target.money)
          target.money -= stealAmount
          player.money += stealAmount
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${item.icon}${item.name}，从${target.character.name}抢夺${stealAmount}金币！` })
        }
        break

      case 'teleport':
        // 需要指定目标地产，在 UI 层处理
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${item.icon}${item.name}，请选择传送目标！` })
        break

      case 'luck':
        if (player.lastDiceRoll) {
          player.lastDiceRoll += item.value
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${item.icon}${item.name}，本回合骰子+${item.value}！` })
          events.push({ type: EventTypes.UPDATE_DICE, payload: player.lastDiceRoll })
        }
        break
    }

    events.push({ type: EventTypes.USE_ITEM, payload: { playerId: player.id, itemId } })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
    return true
  }

  // 选择角色
  function selectCharacter(character: Character, existingCharacters: Character[], events: GameEvent[] = []) {
    if (gameState.state.gameInProgress) {
      return events
    }
    const existingPlayer = gameState.state.players.find(p => p.character.id === character.id)
    if (existingPlayer) {
      events.push({
        type: EventTypes.APPEND_MESSAGE,
        payload: '该角色已被选择，请选其他英雄！'
      })
      return events
    }

    gameState.addPlayer(character, false)
    if (gameState.state.selectingPlayerIndex < 2) {
      const msg = `已选择 ${gameState.state.players.length} 名玩家，继续选择玩家 ${gameState.state.selectingPlayerIndex + 1} 的角色`
      events.push({ type: 'UPDATE_SELECTION_INFO', payload: msg })
    } else {
      events.push({ type: EventTypes.SHOW_GAME })
      startGame(events)
    }
    return events
  }

  // 开始游戏
  function startGame(events: GameEvent[]) {
    gameState.state.gameInProgress = true
    events.push({ type: EventTypes.UPDATE_TOKENS })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
    events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: true })
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: '游戏开始！玩家1先行动。' })
    events.push({ type: EventTypes.UPDATE_WEATHER, payload: gameState.state.weather })
  }

  // 掷骰子
  function rollDice(): GameEvent[] {
    const events: GameEvent[] = []
    if (!gameState.state.gameInProgress) return events

    events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: false })
    events.push({ type: EventTypes.CLEAR_MESSAGE })

    const player = gameState.getCurrentPlayer()
    if (!player || !player.inGame) {
      return nextTurnLogic()
    }

    // 使用道具指定的点数或随机
    let roll = player.lastDiceRoll ?? (Math.floor(Math.random() * 6) + 1)
    player.lastDiceRoll = undefined  // 清除

    // 天气修正
    const weather = WEATHER_EFFECTS[gameState.state.weather]
    if (weather?.diceModifier) {
      roll = Math.max(1, roll + weather.diceModifier)
    }

    // 技能效果
    const skillResult = applySkill(player, 'rollDice', { roll })
    if (skillResult) {
      roll = skillResult.roll ?? roll
      if (skillResult.message) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
      }
    }

    // 幸运符效果
    for (const item of player.items) {
      if (item.type === 'luck') {
        roll += item.value
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}的幸运符生效，+${item.value}点！` })
        player.items = player.items.filter(i => i.id !== item.id)
        break
      }
    }

    events.push({ type: EventTypes.UPDATE_DICE, payload: roll })
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}掷出了${roll}点` })

    movePlayer(player, roll, events)

    return events
  }

  // 下一回合逻辑
  function nextTurnLogic(): GameEvent[] {
    const events: GameEvent[] = []
    if (!gameState.state.gameInProgress) return events

    events.push({ type: EventTypes.UPDATE_SCOREBOARD, payload: gameState.state.currentPlayerIndex })
    const nextPlayer = gameState.nextTurn()
    if (nextPlayer) {
      events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: true })
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `轮到${nextPlayer.character.name}行动。` })
      events.push({ type: EventTypes.UPDATE_WEATHER, payload: gameState.state.weather })
    }
    return events
  }

  // AI 回合计数
  function executeAITurn(): GameEvent[] {
    // AI 逻辑由 useAI 模块处理，这里只做基础验证
    const events = nextTurnLogic()
    return events
  }

  return {
    selectCharacter,
    startGame,
    rollDice,
    nextTurnLogic,
    executeAITurn,
    applySkill,
    checkGameEnd,
    buyItem,
    useItem,
    upgradeProperty,
    handleHuarongChoice,
    handleCellAction,
    calculateRent,
    getGameContext,
    EventTypes
  }
}
