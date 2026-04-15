/**
 * 游戏类型定义 - 地图增强版本
 */

// ============== 道具系统 ==============

export type ItemType = 'dice' | 'shield' | 'steal' | 'teleport' | 'luck' | 'freeze' | 'reverse' | 'mortgage'

export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  value: number
  cost: number
  usable: boolean
  icon: string
}

export interface PlayerItem extends Item {
  ownedAt: number
}

// ============== 地产升级系统 ==============

export type PropertyLevel = 0 | 1 | 2 | 3

export interface PropertyLevelConfig {
  level: PropertyLevel
  name: string
  rentMultiplier: number
  upgradeCost?: number
}

// ============== 天气系统 ==============

export type WeatherType = 'sunny' | 'rainy' | 'foggy' | 'stormy'

export interface WeatherEffect {
  type: WeatherType
  description: string
  diceModifier: number
  rentModifier: number
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
  skillLevel: number
  skillUpgrades: SkillUpgrade[]
  skillMinRoll?: number
  skillBonus?: number
  skillMoneyBonus?: number
  skillReduction?: number
  skillImmune?: boolean
  skillBounce?: boolean
  weatherImmune?: boolean
}

// ============== 地图系统 ==============

export type MapSize = 'small' | 'standard' | 'large' | 'giant'

export const MAP_SIZES: Record<MapSize, { grid: number; boardSize: number }> = {
  small: { grid: 4, boardSize: 12 },
  standard: { grid: 5, boardSize: 16 },
  large: { grid: 6, boardSize: 20 },
  giant: { grid: 7, boardSize: 24 }
}

export type TerrainType = 'normal' | 'mountain' | 'water' | 'castle' | 'wasteland'
export type AreaType = 'wei' | 'shu' | 'wu' | 'neutral'
export type MapTheme = 'threekingdoms' | 'water margin' | 'investiture' | 'journey'

export interface TerrainEffect {
  terrain: TerrainType
  diceModifier: number    // 骰子修正
  rentModifier: number    // 租金倍率
  costModifier: number     // 购买价格倍率
  description: string
}

export interface AreaBonus {
  area: AreaType
  name: string
  bonusType: 'dice' | 'rent' | 'skill' | 'money'
  bonusValue: number
  threshold: number        // 占领多少处触发
}

// ============== 传送阵系统 ==============

export interface TeleportPair {
  id: string
  entryIndex: number
  exitIndex: number
  name: string
}

// ============== 驿站系统 ==============

export interface StationConfig {
  cost: number           // 使用费用
  extraMoves: number    // 额外移动步数
  maxUsesPerTurn: number // 每回合最大使用次数
}

// ============== 障碍物系统 ==============

export type ObstacleType = 'bandit' | 'construction' | 'ruins'

export interface Obstacle {
  id: string
  type: ObstacleType
  position: number
  defeated: boolean
  defeatedBy?: number    // 被哪个玩家击败
  reward?: number        // 击败奖励
  rebuildCost?: number   // 重建费用
}

// ============== 方向系统 ==============

export type Direction = 'forward' | 'backward' | 'left' | 'right' | 'any'

export interface DirectionRestriction {
  allowed: Direction
  forcedDirection?: Direction  // 死路时必须走的方向
  isDeadEnd: boolean
}

// ============== 命运与机会 ==============

export type FateType = 'global' | 'personal' | 'choice'

export interface FateCard {
  id: string
  name: string
  description: string
  type: FateType
  effect: FateEffect
  icon: string
}

export interface FateEffect {
  type: 'money' | 'teleport' | 'skill' | 'weather' | 'obstacle' | 'property'
  value?: number
  targetPosition?: number
  affectAll?: boolean
  playerId?: number
}

// ============== 格子类型扩展 ==============

export type CellType =
  | 'start'
  | 'property'
  | 'event'
  | 'store'
  | 'tax'
  | 'ambush'
  | 'treasure'
  | 'huarong'
  | 'recruit'
  | 'teleport_entry'
  | 'teleport_exit'
  | 'station'
  | 'port'
  | 'obstacle'
  | 'fate'
  | 'opportunity'
  | 'prison'
  | 'direction'

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

export interface TreasureEffect {
  type: 'money' | 'item'
  weight: number
  amount?: number
  itemId?: string
}

export interface Cell {
  id: string
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
  upgradeCosts?: number[]
  rentByLevel?: number[]

  // 事件扩展
  choice?: boolean
  options?: EventOption[]
  effects?: TreasureEffect[]

  // 地图增强
  terrain?: TerrainType        // 地形类型
  area?: AreaType             // 所属区域
  teleportPairId?: string      // 传送阵配对ID
  stationConfig?: StationConfig // 驿站配置
  portTargetIndex?: number     // 港口目标格子
  obstacleId?: string          // 障碍物ID
  fateCardId?: string          // 命运牌ID
  directionRestriction?: DirectionRestriction  // 方向限制
  theme?: MapTheme            // 适用主题
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
  items: PlayerItem[]
  skillLevel: number
  achievements: string[]
  isAI: boolean
  aiConfig?: AIConfig
  shieldActive: boolean
  lastDiceRoll?: number
  consecutiveTurnsWithoutBuy: number

  // 地图增强
  frozenTurns: number          // 冻结回合数
  areaControl: Record<AreaType, number>  // 各区域占领数
  usedStations: number          // 本回合已使用驿站次数
  defeatedObstacles: string[]  // 击败的障碍物ID列表
}

export interface AIConfig {
  buyPropertyThreshold: number
  eventRiskTolerance: number
  upgradeAggression: number
  itemUsageThreshold: number
  terrainPreference: Record<TerrainType, number>
}

// ============== 成就系统 ==============

export type AchievementCondition = (gameState: GameStateContext) => boolean

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: AchievementCondition
  reward?: number
  secret?: boolean
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
  mapSize: MapSize
  mapTheme: MapTheme
  terrainEffects: Record<TerrainType, TerrainEffect>
  areaBonuses: AreaBonus[]
  teleportPairs: TeleportPair[]
  stations: StationConfig
  fateCards: FateCard[]
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
  obstacles: Obstacle[]
  mapSize: MapSize
  mapTheme: MapTheme
}

export interface GameStateContext {
  players: Player[]
  currentPlayerIndex: number
  weather: WeatherType
  turnCount: number
  lastEventAmount?: number
  lastPurchaseCount?: number
  winner?: Player
  treasureCount?: number
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
  | 'TELEPORT'
  | 'USE_STATION'
  | 'DEFEAT_OBSTACLE'
  | 'SHOW_FATE'
  | 'FREEZE_PLAYER'
  | 'AREA_BONUS'
  | 'SHOW_DIRECTION_CHOICE'

export interface GameEvent {
  type: GameEventType
  payload?: any
}

export type EventHandler = (event: GameEvent) => void

// ============== AI 决策 ==============

export type AIAction = 'buy' | 'upgrade' | 'skip' | 'use_item' | 'accept' | 'reject' | 'buy_item' | 'roll' | 'end_turn' | 'use_station' | 'teleport' | 'defeat_obstacle'

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
  propertyOwners: Record<number, { playerId: number; level: PropertyLevel }>
  weather: WeatherType
  turnCount: number
  messages: string[]
  timestamp: number
  obstacles: Obstacle[]
  mapSize: MapSize
  mapTheme: MapTheme
}

// ============== 地图编辑器 ==============

export interface MapEditorCell {
  type: CellType
  name: string
  cost?: number
  rent?: number
  terrain?: TerrainType
  area?: AreaType
}

export interface MapPreset {
  id: string
  name: string
  theme: MapTheme
  size: MapSize
  cells: MapEditorCell[]
  description: string
}
