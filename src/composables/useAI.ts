/**
 * useAI.ts - AI 对手逻辑 (增强版)
 */
import type { Player, Cell, Item, PlayerItem, WeatherType, AIAction, AIDecision, GameStateContext } from '../types/game'
import { ITEMS, WEATHER_EFFECTS, boardCells } from '../config'

export interface AIConfig {
  buyPropertyThreshold: number     // 购买房产的资金阈值比例 (0-1)
  eventRiskTolerance: number      // 事件风险容忍度 (0-1)
  upgradeAggression: number        // 升级激进程度 (0-1)
  itemUsageThreshold: number       // 道具使用阈值
  skillUsageTiming: number         // 技能使用时机 (0-1)
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  buyPropertyThreshold: 0.3,     // 资金 > 30% 时购买
  eventRiskTolerance: 0.4,       // 40% 概率接受负面事件
  upgradeAggression: 0.5,         // 50% 概率升级
  itemUsageThreshold: 0.6,       // 60% 概率使用道具
  skillUsageTiming: 0.7           // 70% 概率在有利时机使用技能
}

export function useAI(config: AIConfig = DEFAULT_AI_CONFIG) {

  // 评估地产价值
  function evaluatePropertyValue(cell: Cell, player: Player, gameContext: GameStateContext): number {
    if (!cell.cost) return 0

    const baseRent = cell.rent ?? 0
    const level = cell.level ?? 0
    const weather = WEATHER_EFFECTS[gameContext.weather]

    // 基础价值 = 租金 × 预期回收回合数
    const expectedTurns = cell.cost / (baseRent * (level + 1) * (weather?.rentModifier ?? 1))
    const baseValue = 100 / expectedTurns

    // 位置价值 - 计算其他玩家经过此地的概率
    let positionBonus = 0
    for (const other of gameContext.players) {
      if (other.id !== player.id && other.inGame) {
        // 简化：假设每个玩家每回合走 3.5 格
        const distance = Math.abs(other.position - (cell.index ?? 0))
        if (distance < 5) {
          positionBonus += 20
        }
      }
    }

    // 升级潜力
    const upgradePotential = cell.maxLevel && cell.maxLevel > level ? 30 : 0

    return baseValue + positionBonus + upgradePotential
  }

  // 决定是否购买地产
  function shouldBuyProperty(player: Player, cell: Cell, gameContext: GameStateContext): boolean {
    if (!cell.cost) return false

    const propertyValue = evaluatePropertyValue(cell, player, gameContext)
    const moneyRatio = player.money / cell.cost

    // 资金充足度
    if (moneyRatio < 1.5) return false

    // 价值评估
    if (propertyValue < 30) return false

    // AI 风格：激进型更愿意购买
    const threshold = config.buyPropertyThreshold * (1.5 - config.upgradeAggression)
    return moneyRatio > (1 / threshold)
  }

  // 决定是否升级地产
  function shouldUpgradeProperty(player: Player, cellIndex: number): boolean {
    const cell = player.properties.find(p => p.index === cellIndex)
    if (!cell || !cell.upgradeCosts) return false

    const level = cell.level ?? 0
    if (level >= (cell.maxLevel ?? 3)) return false

    const upgradeCost = cell.upgradeCosts[level]
    if (player.money < upgradeCost * 2) return false  // 保留一倍升级费用

    // 激进型 AI 更愿意升级
    return Math.random() < config.upgradeAggression
  }

  // 决定是否使用道具
  function shouldUseItem(player: Player, item: PlayerItem, gameContext: GameStateContext): boolean {
    switch (item.type) {
      case 'shield':
        // 负面事件高发时使用
        return gameContext.weather === 'stormy' && Math.random() < config.itemUsageThreshold

      case 'dice':
        // 控制特定点数时使用（如触发技能）
        if (player.character.skillType === 'rollDice') {
          const targetMin = player.character.skillMinRoll ?? 3
          const targetRoll = Math.floor(Math.random() * 6) + 1
          return targetRoll < targetMin && Math.random() < config.itemUsageThreshold
        }
        return Math.random() < config.itemUsageThreshold * 0.5

      case 'luck':
        // 高价值地产附近时使用
        for (const cell of boardCells) {
          const distance = Math.abs(player.position - (cell.index ?? 0))
          if (distance <= 3 && cell.type === 'property' && !gameContext.players.some(p => p.id !== player.id && gameContext.players.some(po => po.properties.some(prop => prop.index === cell.index)))) {
            return Math.random() < config.itemUsageThreshold
          }
        }
        return false

      case 'steal':
        // 对手资金充足时使用
        const richOpponent = gameContext.players.find(p => p.id !== player.id && p.money > 200)
        return richOpponent !== undefined && Math.random() < config.itemUsageThreshold

      case 'teleport':
        // 有己方地产且当前位置不利时使用
        return player.properties.length > 0 && Math.random() < config.itemUsageThreshold * 0.3

      default:
        return false
    }
  }

  // 决定是否接受风险事件
  function shouldAcceptEvent(eventAmount: number): boolean {
    if (eventAmount >= 0) return true
    // 负面事件根据风险容忍度决定
    return Math.random() < config.eventRiskTolerance
  }

  // 选择最优道具使用
  function selectBestItem(player: Player, gameContext: GameStateContext): PlayerItem | null {
    let bestItem: PlayerItem | null = null
    let bestScore = 0

    for (const item of player.items) {
      if (!item.usable) continue

      let score = 0
      switch (item.type) {
        case 'shield':
          score = gameContext.weather === 'stormy' ? 80 : 40
          break
        case 'dice':
          score = 50
          break
        case 'luck':
          score = 60
          break
        case 'steal':
          const maxOpponentMoney = Math.max(...gameContext.players.filter(p => p.id !== player.id).map(p => p.money))
          score = maxOpponentMoney > 100 ? 70 : 30
          break
        case 'teleport':
          score = player.properties.length > 0 ? 55 : 10
          break
      }

      if (score > bestScore) {
        bestScore = score
        bestItem = item
      }
    }

    return bestItem
  }

  // 选择升级目标
  function selectUpgradeTarget(player: Player): number | null {
    const upgradeable = player.properties.filter(p => {
      const level = p.level ?? 0
      return level < (p.maxLevel ?? 3) && p.upgradeCosts && player.money >= p.upgradeCosts[level] * 1.5
    })

    if (upgradeable.length === 0) return null

    // 选择租金价值最高的
    upgradeable.sort((a, b) => {
      const rentA = (a.rentByLevel?.[(a.level ?? 0) + 1] ?? a.rent ?? 0)
      const rentB = (b.rentByLevel?.[(b.level ?? 0) + 1] ?? b.rent ?? 0)
      return rentB - rentA
    })

    return upgradeable[0].index ?? null
  }

  // 预测对手位置
  function predictOpponentPosition(opponent: Player): number[] {
    // 简化：返回对手最可能的位置（当前 +- 3 格范围）
    const positions: number[] = []
    for (let i = -3; i <= 3; i++) {
      positions.push((opponent.position + i + 16) % 16)
    }
    return positions
  }

  // 选择商店购买
  function selectShopPurchase(player: Player): string | null {
    if (player.money < 100) return null

    // 优先购买保护类道具
    const shield = ITEMS.find(i => i.type === 'shield')
    if (shield && player.money >= shield.cost && !player.items.some(i => i.type === 'shield')) {
      return shield.id
    }

    // 随机购买其他道具
    const affordable = ITEMS.filter(i => player.money >= i.cost && !player.items.some(p => p.id === i.id))
    if (affordable.length > 0) {
      return affordable[Math.floor(Math.random() * affordable.length)].id
    }

    return null
  }

  // 执行 AI 回合决策
  function executeAITurn(
    player: Player,
    gameContext: GameStateContext,
    currentCell: Cell
  ): AIDecision {
    const reasoning: string[] = []

    // 1. 检查道具使用
    const bestItem = selectBestItem(player, gameContext)
    if (bestItem && shouldUseItem(player, bestItem, gameContext)) {
      reasoning.push(`使用${bestItem.name}`)
      return {
        action: 'use_item',
        reasoning: reasoning.join(', '),
        itemId: bestItem.id
      }
    }

    // 2. 检查地产升级
    const upgradeTarget = selectUpgradeTarget(player)
    if (upgradeTarget !== null && Math.random() < config.upgradeAggression) {
      reasoning.push(`升级地产`)
      return {
        action: 'upgrade',
        reasoning: reasoning.join(', '),
        targetCell: upgradeTarget
      }
    }

    // 3. 检查是否购买地产
    if (currentCell.type === 'property' && !gameContext.players.some(p =>
      p.properties.some(prop => prop.index === currentCell.index)
    )) {
      if (shouldBuyProperty(player, currentCell, gameContext)) {
        reasoning.push(`购买${currentCell.name}`)
        return {
          action: 'buy',
          reasoning: reasoning.join(', '),
          targetCell: currentCell.index
        }
      } else {
        reasoning.push(`跳过购买${currentCell.name}`)
      }
    }

    // 4. 检查是否在商店购买
    if (currentCell.type === 'store') {
      const purchaseId = selectShopPurchase(player)
      if (purchaseId) {
        reasoning.push(`购买道具`)
        return {
          action: 'buy_item',
          reasoning: reasoning.join(', '),
          itemId: purchaseId
        }
      }
    }

    // 5. 事件决策
    if (currentCell.type === 'event') {
      // 需要在调用处获取具体事件金额
      return {
        action: 'accept',
        reasoning: '接受事件'
      }
    }

    // 6. 默认掷骰子
    return {
      action: 'roll',
      reasoning: '继续行动'
    }
  }

  return {
    shouldBuyProperty,
    shouldUpgradeProperty,
    shouldUseItem,
    shouldAcceptEvent,
    selectBestItem,
    selectUpgradeTarget,
    executeAITurn,
    evaluatePropertyValue,
    predictOpponentPosition,
    config
  }
}
