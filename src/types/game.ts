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

// ============== 超大地图系统 ==============

// 地图尺寸
export type MapSize = 'tiny' | 'small' | 'standard' | 'large' | 'giant' | 'epic'
export const MAP_SIZE_CONFIG: Record<MapSize, { size: number; cols: number; rows: number; total: number }> = {
  tiny: { size: 4, cols: 4, rows: 4, total: 16 },
  small: { size: 5, cols: 5, rows: 5, total: 25 },
  standard: { size: 6, cols: 6, rows: 6, total: 36 },
  large: { size: 8, cols: 8, rows: 8, total: 64 },
  giant: { size: 10, cols: 10, rows: 10, total: 100 },
  epic: { size: 12, cols: 12, rows: 12, total: 144 }
}

// 地图层级
export type MapLayer = 'underground' | 'ground' | 'sky'
export const MAP_LAYERS: MapLayer[] = ['underground', 'ground', 'sky']

// 地形类型
export type TerrainType = 'normal' | 'mountain' | 'water' | 'castle' | 'wasteland' | 'forest' | 'volcano' | 'swamp'

export interface TerrainEffect {
  type: TerrainType
  name: string
  icon: string
  moveCost: number        // 移动消耗 (1=正常, 2=双倍)
  rentModifier: number     // 租金倍率
  diceModifier: number     // 骰子修正
  color: string           // 地形颜色
}

// 天气对地形的影响
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter'
export interface SeasonEffect {
  type: SeasonType
  name: string
  icon: string
  terrainModifier: Partial<Record<TerrainType, { moveCost?: number; rentModifier?: number }>>
  specialEffect?: string
}

// 昼夜系统
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
export interface TimeOfDayEffect {
  type: TimeOfDay
  name: string
  icon: string
  diceModifier: number
  rentModifier: number
  incomeBonus: number  // 每回合额外收入
}

// 区域势力
export type FactionType = 'wei' | 'shu' | 'wu' | 'neutral' | 'boss'

export interface FactionBonus {
  type: FactionType
  name: string
  color: string
  icon: string
  incomePerTurn: number      // 每回合固定收入
  rentBonus: number          // 区域内租金减免
  specialAbility?: string     // 特殊能力描述
}

// 传送门配对
export interface TeleportPair {
  id: string
  name: string
  entryCells: number[]       // 入口格子索引 [a, b]
  exitCells: number[]        // 出口格子索引 [c, d]
  layerFrom: MapLayer
  layerTo: MapLayer
  bidirectional: boolean
  activationCost?: number     // 激活消耗的金币
}

// 驿站系统
export interface StationConfig {
  id: string
  name: string
  cellIndex: number
  layer: MapLayer
  extraMoves: number         // 额外移动步数
  maxUsesPerGame: number     // 每场游戏最大使用次数
  factionRequired?: FactionType
}

// 港口系统
export interface PortConfig {
  id: string
  name: string
  fromCell: number
  fromLayer: MapLayer
  toCell: number
  toLayer: MapLayer
  travelCost: number         // 旅行花费
}

// 可破坏障碍物
export interface ObstacleConfig {
  id: string
  cellIndex: number
  layer: MapLayer
  name: string
  icon: string
  hp: number                // 生命值
  maxHp: number
  defeatReward: number      // 击败奖励
  respawnTurns: number      // 复活回合数 (0=不复活)
  damagedState?: string      // 损坏状态描述
}

// 资源采集点
export interface ResourceNode {
  id: string
  cellIndex: number
  layer: MapLayer
  name: string
  icon: string
  resourceType: 'gold' | 'item' | 'buff'
  yield: number             // 产出量
  yieldInterval: number     // 产出间隔(回合)
  maxCapacity: number       // 最大容量 (0=无限)
  currentYield: number       // 当前剩余
  factionOwner?: FactionType
}

// 秘密通道
export interface SecretPassage {
  id: string
  fromCell: number
  fromLayer: MapLayer
  toCell: number
  toLayer: MapLayer
  discoveryChance: number   // 发现概率 0-1
  revealed: boolean         // 是否已发现
  factionRequired?: FactionType
}

// BOSS据点 (多格区域)
export interface BossLair {
  id: string
  name: string
  icon: string
  cells: { index: number; layer: MapLayer }[]
  faction: FactionType
  bossName: string
  bossHp: number
  bossMaxHp: number
  defeatReward: number
  controlBonus: number      // 控制据点后的加成
  isDefeated: boolean
  respawnTurns: number
}

// 地图事件
export interface MapEvent {
  id: string
  cellIndex: number
  layer: MapLayer
  name: string
  icon: string
  triggerChance: number     // 触发概率
  effects: {
    type: 'buff' | 'debuff' | 'teleport' | 'gold' | 'item' | 'trap'
    value?: number
    itemId?: string
    duration?: number        // 持续回合
    description: string
  }[]
}

// 格子状态
export interface CellState {
  cellIndex: number
  layer: MapLayer
  terrain: TerrainType
  faction: FactionType
  ownerId?: number
  level: PropertyLevel
  revealed: boolean          // 是否已探索 (战争迷雾)
  hasObstacle: boolean
  obstacleHp?: number
  resourceYield?: number
  isSecretRevealed?: boolean
  buff?: {
    type: string
    remainingTurns: number
  }
}

// 扩展格子类型
export type CellType = 'start' | 'property' | 'event' | 'store' | 'tax' | 'ambush' | 'treasure' | 'huarong' | 'recruit'
  | 'teleport_entry' | 'station' | 'port' | 'obstacle' | 'fate' | 'prison' | 'boss' | 'resource' | 'secret'
  | 'layer_stairs_up' | 'layer_stairs_down'

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
  id: string
  name: string
  type: CellType
  cost?: number
  rent?: number
  amount?: number
  eventId?: string
  index?: number
  layer?: MapLayer
  // 地产升级
  level?: PropertyLevel
  maxLevel?: PropertyLevel
  upgradeCosts?: number[]        // 每级升级费用 [100, 200]
  rentByLevel?: number[]         // 每级租金 [40, 80, 160]
  // 事件扩展
  choice?: boolean               // 是否有选择
  options?: EventOption[]         // 选择选项
  effects?: TreasureEffect[]     // 宝箱效果
  // 地图扩展
  terrain?: TerrainType
  faction?: FactionType
  teleportPairId?: string
  stationId?: string
  portId?: string
  obstacleId?: string
  resourceNodeId?: string
  secretPassageId?: string
  bossLairId?: string
  mapEventId?: string
  layerTransition?: { targetLayer: MapLayer; targetCell: number; cost?: number }
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
  // 超大地图系统
  currentLayer: MapLayer          // 当前所在层级
  revealedCells: Set<string>      // 已探索的格子 (格式: "layer-index")
  controlledFactions: FactionType[]  // 控制的势力
  defeatedBosses: string[]        // 击败的BOSS ID列表
  defeatedObstacles: string[]     // 击败的障碍物ID列表
  discoveredSecrets: string[]      // 发现的秘密通道ID列表
  frozenTurns: number             // 冻结回合数 (监狱)
  stationUses: Record<string, number>  // 各驿站使用次数
  turnIncome: number              // 本回合额外收入
  activeBuffs: { type: string; remainingTurns: number }[]  // 当前激活的buff
  seasonImmunity?: SeasonType     // 免疫的季节效果
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
  // 超大地图系统配置
  mapSize: MapSize
  mapLayers: MapLayer[]
  terrainEffects: Record<TerrainType, TerrainEffect>
  seasonEffects: Record<SeasonType, SeasonEffect>
  timeOfDayEffects: Record<TimeOfDay, TimeOfDayEffect>
  factionBonuses: Record<FactionType, FactionBonus>
  teleportPairs: TeleportPair[]
  stations: StationConfig[]
  ports: PortConfig[]
  obstacles: ObstacleConfig[]
  resourceNodes: ResourceNode[]
  secretPassages: SecretPassage[]
  bossLairs: BossLair[]
  mapEvents: MapEvent[]
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
  // 超大地图系统状态
  currentSeason: SeasonType
  currentTimeOfDay: TimeOfDay
  cellStates: Record<string, CellState>  // key: "layer-index"
  activeEvents: MapEvent[]
  seasonTurnCounter: number              // 季节轮换计数
  timeOfDayTurnCounter: number          // 昼夜轮换计数
}

export interface GameStateContext {
  players: Player[]
  currentPlayerIndex: number
  weather: WeatherType
  turnCount: number
  lastEventAmount?: number
  lastPurchaseCount?: number
  currentSeason?: SeasonType
  currentTimeOfDay?: TimeOfDay
  currentLayer?: MapLayer
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
  // 超大地图系统事件
  | 'SEASON_CHANGE'
  | 'TIME_OF_DAY_CHANGE'
  | 'REVEAL_CELL'
  | 'LAYER_TRANSITION'
  | 'TELEPORT'
  | 'USE_STATION'
  | 'OBSTACLE_DEFEATED'
  | 'BOSS_DEFEATED'
  | 'SECRET_REVEALED'
  | 'FACTION_CONTROL'
  | 'RESOURCE_COLLECTED'
  | 'BUFF_APPLIED'
  | 'FREEZE_PLAYER'
  | 'SHOW_BOSS'

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
