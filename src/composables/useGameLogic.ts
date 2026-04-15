/**
 * useGameLogic.ts - 游戏规则引擎 (Vue 3 composable - 超大地图版)
 */
import type { GameEvent, Cell, Player, Item, PlayerItem, WeatherType, PropertyLevel, GameStateContext, Character, MapLayer, TerrainType } from '../types/game'
import { boardCells, events as eventConfig, START_BONUS, ITEMS, WEATHER_EFFECTS, PROPERTY_LEVELS, SKILL_UPGRADE_THRESHOLD, ACHIEVEMENTS, TERRAIN_EFFECTS, FACTIONS, SEASONS, TIMES_OF_DAY, BOSS_LAIRS, OBSTACLES } from '../config'
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
  UPDATE_WEATHER: 'UPDATE_WEATHER',
  // 超大地图系统事件
  SEASON_CHANGE: 'SEASON_CHANGE',
  TIME_OF_DAY_CHANGE: 'TIME_OF_DAY_CHANGE',
  REVEAL_CELL: 'REVEAL_CELL',
  LAYER_TRANSITION: 'LAYER_TRANSITION',
  TELEPORT: 'TELEPORT',
  USE_STATION: 'USE_STATION',
  OBSTACLE_DEFEATED: 'OBSTACLE_DEFEATED',
  BOSS_DEFEATED: 'BOSS_DEFEATED',
  SECRET_REVEALED: 'SECRET_REVEALED',
  FACTION_CONTROL: 'FACTION_CONTROL',
  RESOURCE_COLLECTED: 'RESOURCE_COLLECTED',
  BUFF_APPLIED: 'BUFF_APPLIED',
  FREEZE_PLAYER: 'FREEZE_PLAYER',
  SHOW_BOSS: 'SHOW_BOSS'
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
      // 超大地图系统新增格子类型
      case 'teleport_entry':
        handleTeleportCell(player, cellData, events)
        break
      case 'station':
        handleStationCell(player, cellData, events)
        break
      case 'port':
        handlePortCell(player, cellData, events)
        break
      case 'obstacle':
        handleObstacleCell(player, cellData, events)
        break
      case 'fate':
        handleFateCell(player, cellData, events)
        break
      case 'prison':
        handlePrisonCell(player, cellData, events)
        break
      case 'boss':
        handleBossCell(player, cellData, events)
        break
      case 'resource':
        handleResourceCell(player, cellData, events)
        break
      case 'secret':
        handleSecretCell(player, cellData, events)
        break
      case 'layer_stairs_up':
      case 'layer_stairs_down':
        handleLayerTransition(player, cellData, events)
        break
    }
    // 检查成就
    checkAchievements(player, ctx, events)
  }

  // 传送门格子
  function handleTeleportCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.teleportPairId) {
      const result = gameState.handleTeleport(player.id, cellData.teleportPairId)
      if (result.success) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用传送门：${result.message}` })
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}尝试使用传送门：${result.message}` })
      }
    }
  }

  // 驿站格子
  function handleStationCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.stationId) {
      const result = gameState.useStation(player.id, cellData.stationId)
      if (result.success) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}使用${cellData.name}：${result.message}` })
        events.push({ type: EventTypes.USE_STATION, payload: { extraMoves: result.extraMoves } })
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}无法使用驿站：${result.message}` })
      }
    }
  }

  // 港口格子
  function handlePortCell(player: Player, cellData: Cell, events: GameEvent[]) {
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}到达港口，可以使用水路前往其他地区。` })
  }

  // 障碍物格子
  function handleObstacleCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.obstacleId) {
      const obstacle = OBSTACLES.find(o => o.id === cellData.obstacleId)
      if (obstacle) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}遭遇${obstacle.icon}${obstacle.name}！(HP: ${obstacle.hp})` })
        // 自动触发战斗
        const result = gameState.defeatObstacle(player.id, cellData.obstacleId)
        if (result.success) {
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: result.message })
        }
      }
    }
  }

  // 命运格子
  function handleFateCell(player: Player, cellData: Cell, events: GameEvent[]) {
    const effects = [
      { type: 'gold' as const, value: 100, description: '发现路人丢失的钱袋，获得100金币' },
      { type: 'gold' as const, value: -80, description: '遭遇小偷，损失80金币' },
      { type: 'buff' as const, value: 1, duration: 3, description: '获得幸运buff，持续3回合' },
      { type: 'debuff' as const, value: 1, duration: 2, description: '被诅咒，骰子-1，持续2回合' }
    ]
    const effect = effects[Math.floor(Math.random() * effects.length)]

    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发命运：${effect.description}` })

    if (effect.type === 'gold') {
      if (effect.value > 0) {
        player.money += effect.value
      } else {
        payMoney(player, null, -effect.value, events)
      }
    } else if (effect.type === 'buff') {
      player.activeBuffs.push({ type: 'luck', remainingTurns: effect.duration ?? 3 })
      events.push({ type: EventTypes.BUFF_APPLIED, payload: { playerId: player.id, buffType: 'luck' } })
    } else if (effect.type === 'debuff') {
      player.activeBuffs.push({ type: 'curse', remainingTurns: effect.duration ?? 2 })
      events.push({ type: EventTypes.BUFF_APPLIED, payload: { playerId: player.id, buffType: 'curse' } })
    }
  }

  // 监狱格子
  function handlePrisonCell(player: Player, cellData: Cell, events: GameEvent[]) {
    gameState.freezePlayer(player.id, 2)
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}被捕入狱，冻结2回合！` })
    events.push({ type: EventTypes.FREEZE_PLAYER, payload: { playerId: player.id, turns: 2 } })
  }

  // BOSS格子
  function handleBossCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.bossLairId) {
      const boss = BOSS_LAIRS.find(b => b.id === cellData.bossLairId)
      if (boss) {
        if (player.defeatedBosses.includes(boss.id)) {
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${boss.name}已被击败，可自由通行。` })
        } else {
          events.push({ type: EventTypes.SHOW_BOSS, payload: { boss, playerId: player.id } })
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}遭遇BOSS：${boss.bossName}！(HP: ${boss.bossHp}/${boss.bossMaxHp})` })
        }
      }
    }
  }

  // 资源格子
  function handleResourceCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.resourceNodeId) {
      const result = gameState.collectResource(player.id, cellData.resourceNodeId)
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}${result.message}` })
    }
  }

  // 秘密通道格子
  function handleSecretCell(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.secretPassageId) {
      const result = gameState.discoverSecret(player.id, cellData.secretPassageId)
      if (result.success) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}：${result.message}` })
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}尝试发现秘密通道：${result.message}` })
      }
    }
  }

  // 层级切换格子
  function handleLayerTransition(player: Player, cellData: Cell, events: GameEvent[]) {
    if (cellData.layerTransition) {
      const { targetLayer, targetCell, cost } = cellData.layerTransition
      const layerName = targetLayer === 'underground' ? '地下层' : targetLayer === 'sky' ? '天空层' : '地面'
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}准备进入${layerName}，需要${cost || 0}金币` })
      // 实际切换由UI触发
    }
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
  function movePlayer(player: Player, steps: number, events: GameEvent[], extraMoves: number = 0) {
    // 检查冻结状态
    if (player.frozenTurns > 0) {
      player.frozenTurns--
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}被冻结，回合跳过！剩余${player.frozenTurns}回合` })
      return
    }

    // 处理buff
    const hasCurse = player.activeBuffs.some(b => b.type === 'curse')
    if (hasCurse) {
      steps = Math.max(1, steps - 1)
      const curse = player.activeBuffs.find(b => b.type === 'curse')
      if (curse) {
        curse.remainingTurns--
        if (curse.remainingTurns <= 0) {
          player.activeBuffs = player.activeBuffs.filter(b => b.type !== 'curse')
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}的诅咒buff消散了` })
        }
      }
    }

    // 处理季节效果
    const seasonEffect = gameState.currentSeasonEffect.value
    if (seasonEffect) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `当前季节：${seasonEffect.icon}${seasonEffect.name} - ${seasonEffect.specialEffect}` })
    }

    const oldPos = player.position
    let totalMoves = steps + extraMoves
    let newPos = (oldPos + totalMoves) % boardCells.length

    // 经过起点
    if (newPos <= oldPos) {
      player.money += START_BONUS
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}经过起点，获得${START_BONUS}金币！` })
    }

    // 获取地形效果
    const layer = player.currentLayer
    const terrainEffect = gameState.getTerrainEffect(layer, newPos)

    if (terrainEffect.moveCost > 1) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}进入${terrainEffect.moveCost > 2 ? '困难' : '较难'}地形，移动消耗增加！` })
    }

    player.position = newPos
    player.lastDiceRoll = steps
    events.push({ type: EventTypes.UPDATE_TOKENS })

    // 探索格子
    gameState.revealCell(layer, newPos, player.id)

    // 处理到达的格子
    const cellData = boardCells[newPos]
    handleCellAction(player, cellData, events)
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

    // 昼夜修正
    const timeEffect = gameState.currentTimeEffect.value
    if (timeEffect?.diceModifier) {
      roll = Math.max(1, roll + timeEffect.diceModifier)
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}受到${timeEffect.icon}${timeEffect.name}影响，骰子${timeEffect.diceModifier > 0 ? '+' : ''}${timeEffect.diceModifier}点` })
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

    // 检查是否有驿站的额外移动
    // extraMoves 会通过事件从驿站使用后传递
    movePlayer(player, roll, events, 0)

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
