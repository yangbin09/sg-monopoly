/**
 * 游戏类型定义 - 扩展版本
 */

// ============== 道具系统 ==============

export type ItemType = 'dice' | 'shield' | 'steal' | 'teleport' | 'luck'

export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  value: number      // 效果值 (骰子点数/掠夺金额等)
  cost: number       // 购买价格
  usable: boolean
  icon: string
}

export interface PlayerItem extends Item {
  ownedAt: number   // 获得时间戳
}

// ============== 地产升级系统 ==============

export type PropertyLevel = 0 | 1 | 2 | 3  // 空地/茅屋/砖房/宫殿

export interface PropertyLevelConfig {
  level: PropertyLevel
  name: string
  rentMultiplier: number
  upgradeCost?: number  // 升至该等级需要的费用
}

// ============== 天气系统 ==============

export type WeatherType = 'sunny' | 'rainy' | 'foggy' | 'stormy'

export interface WeatherEffect {
  type: WeatherType
  description: string
  diceModifier: number   // 骰子修正
  rentModifier: number   // 租金倍率
}

// ============== 角色技能 ==============

export type SkillType = 'rollDice' | 'buyProperty' | 'payRent' | 'event' | 'weather'

export interface SkillUpgrade {
  level: number
  description: string
  bonusValue: number
}

export interface Character {
  id: string
  name: string
  image: string
  skill: string
  skillType: SkillType
  skillLevel: number              // 当前等级 1-3
  skillUpgrades: SkillUpgrade[]    // 每级升级配置
  // rollDice 技能
  skillMinRoll?: number
  skillBonus?: number
  // buyProperty 技能
  skillMoneyBonus?: number
  // payRent 技能
  skillReduction?: number
  // event 技能
  skillImmune?: boolean
  skillBounce?: boolean            // 反弹负面事件
  // weather 技能
  weatherImmune?: boolean
}

// ============== 格子扩展 ==============

export type CellType = 'start' | 'property' | 'event' | 'store' | 'tax' | 'ambush' | 'treasure' | 'huarong' | 'recruit'

export interface EventOption {
  text: string
  effect: {
    amount?: number
    effectType?: 'money' | 'item' | 'teleport' | 'soldiers'
    itemId?: string
    targetPosition?: number
  }
  result: string
}

export interface Cell {
  name: string
  type: CellType
  cost?: number
  rent?: number
  amount?: number
  eventId?: string
  index?: number
  // 地产升级
  level?: PropertyLevel
  maxLevel?: PropertyLevel
  upgradeCosts?: number[]        // 每级升级费用 [100, 200]
  rentByLevel?: number[]         // 每级租金 [40, 80, 160]
  // 事件扩展
  choice?: boolean               // 是否有选择
  options?: EventOption[]         // 选择选项
  effects?: TreasureEffect[]     // 宝箱效果
}

export interface TreasureEffect {
  type: 'money' | 'item'
  weight: number                 // 概率权重
  amount?: number
  itemId?: string
}

// ============== 玩家扩展 ==============

export interface Player {
  id: number
  name: string
  character: Character
  money: number
  position: number
  properties: Cell[]
  inGame: boolean
  // 新增
  items: PlayerItem[]             // 持有的道具
  skillLevel: number               // 技能等级 1-3
  achievements: string[]           // 已解锁成就 ID 列表
  isAI: boolean                   // 是否为 AI
  aiConfig?: AIConfig             // AI 配置
  // 状态
  shieldActive: boolean           // 免罪符是否激活
  lastDiceRoll?: number           // 上次骰子点数
  consecutiveTurnsWithoutBuy: number  // 连续未购买地产回合
}

export interface AIConfig {
  buyPropertyThreshold: number     // 购买房产的资金阈值比例 (0-1)
  eventRiskTolerance: number      // 事件风险容忍度 (0-1)
  upgradeAggression: number        // 升级激进程度 (0-1)
  itemUsageThreshold: number       // 道具使用阈值
}

// ============== 成就系统 ==============

export type AchievementCondition = (gameState: GameStateContext) => boolean

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: AchievementCondition
  reward?: number                 // 金币奖励
  secret?: boolean                // 是否隐藏
}

export interface UnlockedAchievement {
  achievementId: string
  unlockedAt: number              // 解锁时间戳
  notified: boolean              // 是否已显示通知
}

// ============== 游戏配置 ==============

export interface GameConfig {
  BOARD_SIZE: number
  GRID_SIZE: number
  INITIAL_MONEY: number
  START_BONUS: number
  boardCells: Cell[]
  characters: Character[]
  events: Record<string, EventConfig>
  items: Item[]
  weatherEffects: Record<WeatherType, WeatherEffect>
  achievements: Achievement[]
}

export interface EventConfig {
  amount?: number
  description?: string
  choice?: boolean
  options?: EventOption[]
  effects?: TreasureEffect[]
}

// ============== 游戏状态 ==============

export interface GameState {
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
}

export interface GameStateContext {
  players: Player[]
  currentPlayerIndex: number
  weather: WeatherType
  turnCount: number
  lastEventAmount?: number
  lastPurchaseCount?: number
}

// ============== 游戏事件 ==============

export type GameEventType =
  | 'APPEND_MESSAGE'
  | 'UPDATE_TOKENS'
  | 'UPDATE_SCOREBOARD'
  | 'SHOW_GAME'
  | 'ROLL_BUTTON_ENABLED'
  | 'GAME_END'
  | 'UPDATE_DICE'
  | 'CLEAR_MESSAGE'
  | 'SHOW_STORE'
  | 'HIDE_STORE'
  | 'BUY_ITEM'
  | 'USE_ITEM'
  | 'UPGRADE_PROPERTY'
  | 'WEATHER_CHANGE'
  | 'SHOW_ACHIEVEMENT'
  | 'SHOW_CHOICE'
  | 'PLAYER_BANKRUPT'
  | 'SKILL_UPGRADED'
  | 'UPDATE_WEATHER'

export interface GameEvent {
  type: GameEventType
  payload?: any
}

export type EventHandler = (event: GameEvent) => void

// ============== AI 决策 ==============

export type AIAction = 'buy' | 'upgrade' | 'skip' | 'use_item' | 'accept' | 'reject' | 'buy_item' | 'roll' | 'end_turn'

export interface AIDecision {
  action: AIAction
  reasoning: string
  targetCell?: number
  itemId?: string
  diceValue?: number
}

// ============== 存档系统 ==============

export interface SavedGame {
  version: number
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  weather: WeatherType
  turnCount: number
  messages: string[]
  timestamp: number
}
