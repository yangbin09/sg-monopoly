/**
 * config.js
 *
 * 游戏配置数据：棋盘格子定义、角色定义、常量、道具、天气、成就
 */

// ============== 基础常量 ==============

export const BOARD_SIZE = 5
export const GRID_SIZE = 16
export const INITIAL_MONEY = 1000
export const START_BONUS = 200
export const SKILL_UPGRADE_THRESHOLD = 3  // 购买3处房产后技能升级

// ============== 超大地图系统常量 ==============

// 地图尺寸配置
export const MAP_SIZES = {
  tiny: { size: 4, label: '微型 (4x4)', description: '16格 - 适合新手' },
  small: { size: 5, label: '小型 (5x5)', description: '25格 - 快速对局' },
  standard: { size: 6, label: '标准 (6x6)', description: '36格 - 经典模式' },
  large: { size: 8, label: '大型 (8x8)', description: '64格 - 史诗对决' },
  giant: { size: 10, label: '巨型 (10x10)', description: '100格 - 宏大战场' },
  epic: { size: 12, label: '史诗 (12x12)', description: '144格 - 终极挑战' }
}

// 层级配置
export const MAP_LAYERS = {
  underground: { id: 'underground', name: '地下', icon: '⛏️', color: '#4a3728' },
  ground: { id: 'ground', name: '地面', icon: '🏔️', color: '#2d5a27' },
  sky: { id: 'sky', name: '天空', icon: '☁️', color: '#87ceeb' }
}

// 季节系统
export const SEASONS = {
  spring: {
    type: 'spring',
    name: '春天',
    icon: '🌸',
    duration: 10,  // 每季节持续10回合
    terrainEffects: {
      forest: { moveCost: 1, rentModifier: 1.0 },
      swamp: { moveCost: 2, rentModifier: 0.8 }
    },
    specialEffect: '所有玩家每回合+20金币'
  },
  summer: {
    type: 'summer',
    name: '夏天',
    icon: '☀️',
    duration: 10,
    terrainEffects: {
      volcano: { moveCost: 3, rentModifier: 1.5 },
      water: { moveCost: 1, rentModifier: 0.7 }
    },
    specialEffect: '火山地形骰子-1, 水域租金7折'
  },
  autumn: {
    type: 'autumn',
    name: '秋天',
    icon: '🍂',
    duration: 10,
    terrainEffects: {
      forest: { moveCost: 2, rentModifier: 1.3 },
      wasteland: { moveCost: 1, rentModifier: 1.0 }
    },
    specialEffect: '森林租金上浮30%'
  },
  winter: {
    type: 'winter',
    name: '冬天',
    icon: '❄️',
    duration: 10,
    terrainEffects: {
      water: { moveCost: 3, rentModifier: 1.0 },
      swamp: { moveCost: 4, rentModifier: 1.5 },
      mountain: { moveCost: 2, rentModifier: 1.2 }
    },
    specialEffect: '水域/沼泽移动消耗翻倍, 山地租金上浮'
  }
}

// 昼夜系统
export const TIMES_OF_DAY = {
  dawn: { type: 'dawn', name: '黎明', icon: '🌅', diceModifier: 0, rentModifier: 1.0, incomeBonus: 0 },
  day: { type: 'day', name: '白天', icon: '☀️', diceModifier: 0, rentModifier: 1.0, incomeBonus: 50 },
  dusk: { type: 'dusk', name: '黄昏', icon: '🌇', diceModifier: 0, rentModifier: 1.1, incomeBonus: 20 },
  night: { type: 'night', name: '夜晚', icon: '🌙', diceModifier: -1, rentModifier: 1.2, incomeBonus: 30 }
}

// 势力配置
export const FACTIONS = {
  wei: { type: 'wei', name: '魏国', color: '#7b68ee', icon: '🟣', incomePerTurn: 80, rentBonus: 0.1, specialAbility: '每回合额外获得80金币' },
  shu: { type: 'shu', name: '蜀国', color: '#228b22', icon: '🟢', incomePerTurn: 60, rentBonus: 0.15, specialAbility: '区域内租金减免15%' },
  wu: { type: 'wu', name: '吴国', color: '#4169e1', icon: '🔵', incomePerTurn: 70, rentBonus: 0.12, specialAbility: '水域通行免费' },
  neutral: { type: 'neutral', name: '中立', color: '#808080', icon: '⚪', incomePerTurn: 0, rentBonus: 0, specialAbility: '无' },
  boss: { type: 'boss', name: 'BOSS', color: '#dc143c', icon: '👹', incomePerTurn: 0, rentBonus: 0, specialAbility: '击败后获得大量奖励' }
}

// ============== 道具商店配置 ==============

export const ITEMS = [
  {
    id: 'dice_6',
    name: '骰子遥控器',
    description: '指定骰子为6点',
    type: 'dice',
    value: 6,
    cost: 150,
    usable: true,
    icon: '🎲'
  },
  {
    id: 'dice_1',
    name: '最小骰子',
    description: '指定骰子为1点（适合触发技能）',
    type: 'dice',
    value: 1,
    cost: 100,
    usable: true,
    icon: '🎯'
  },
  {
    id: 'shield',
    name: '免罪符',
    description: '免疫一次负面事件或税收',
    type: 'shield',
    value: 1,
    cost: 200,
    usable: true,
    icon: '🛡️'
  },
  {
    id: 'steal',
    name: '掠夺卡',
    description: '随机抢夺对手100金币',
    type: 'steal',
    value: 100,
    cost: 180,
    usable: true,
    icon: '💰'
  },
  {
    id: 'teleport',
    name: '传送符',
    description: '传送至任意己方地产',
    type: 'teleport',
    value: 0,
    cost: 120,
    usable: true,
    icon: '⚡'
  },
  {
    id: 'luck',
    name: '幸运符',
    description: '本回合骰子+2',
    type: 'luck',
    value: 2,
    cost: 80,
    usable: true,
    icon: '🍀'
  }
]

// ============== 地产升级配置 ==============

export const PROPERTY_LEVELS = [
  { level: 0, name: '空地', rentMultiplier: 1.0 },
  { level: 1, name: '茅屋', rentMultiplier: 1.5 },
  { level: 2, name: '砖房', rentMultiplier: 2.0 },
  { level: 3, name: '宫殿', rentMultiplier: 3.0 }
]

// ============== 天气配置 ==============

export const WEATHER_EFFECTS = {
  sunny: {
    type: 'sunny',
    description: '晴朗 - 无影响',
    diceModifier: 0,
    rentModifier: 1.0
  },
  rainy: {
    type: 'rainy',
    description: '下雨 - 骰子-1, 租金打八折',
    diceModifier: -1,
    rentModifier: 0.8
  },
  foggy: {
    type: 'foggy',
    description: '大雾 - 租金上浮20%',
    diceModifier: 0,
    rentModifier: 1.2
  },
  stormy: {
    type: 'stormy',
    description: '暴风雨 - 骰子-2, 租金打五折',
    diceModifier: -2,
    rentModifier: 0.5
  }
}

// ============== 地形效果配置 ==============

export const TERRAIN_EFFECTS = {
  normal: { type: 'normal', name: '普通', icon: '⬜', moveCost: 1, rentModifier: 1.0, diceModifier: 0, color: '#f5f5dc' },
  mountain: { type: 'mountain', name: '山脉', icon: '⛰️', moveCost: 2, rentModifier: 1.3, diceModifier: 0, color: '#8b4513' },
  water: { type: 'water', name: '水域', icon: '🌊', moveCost: 2, rentModifier: 0.8, diceModifier: 0, color: '#4169e1' },
  castle: { type: 'castle', name: '城堡', icon: '🏰', moveCost: 1, rentModifier: 1.5, diceModifier: 0, color: '#daa520' },
  wasteland: { type: 'wasteland', name: '荒地', icon: '🏜️', moveCost: 1, rentModifier: 0.6, diceModifier: -1, color: '#d2b48c' },
  forest: { type: 'forest', name: '森林', icon: '🌲', moveCost: 2, rentModifier: 1.1, diceModifier: 0, color: '#228b22' },
  volcano: { type: 'volcano', name: '火山', icon: '🌋', moveCost: 3, rentModifier: 2.0, diceModifier: 0, color: '#ff4500' },
  swamp: { type: 'swamp', name: '沼泽', icon: '🌿', moveCost: 3, rentModifier: 0.5, diceModifier: -1, color: '#556b2f' }
}

// ============== 传送门配对配置 ==============

export const TELEPORT_PAIRS = [
  { id: 'tp1', name: '阴阳传送门', entryCells: [5, 10], exitCells: [21, 26], layerFrom: 'ground', layerTo: 'ground', bidirectional: true },
  { id: 'tp2', name: '天地传送门', entryCells: [0], exitCells: [0], layerFrom: 'ground', layerTo: 'sky', bidirectional: true, activationCost: 100 },
  { id: 'tp3', name: '地底传送门', entryCells: [35], exitCells: [0], layerFrom: 'ground', layerTo: 'underground', bidirectional: true, activationCost: 80 },
  { id: 'tp4', name: 'BOSS传送门', entryCells: [50], exitCells: [99], layerFrom: 'ground', layerTo: 'ground', bidirectional: false, activationCost: 200 }
]

// ============== 驿站配置 ==============

export const STATIONS = [
  { id: 'station1', name: '官道驿站', cellIndex: 3, layer: 'ground', extraMoves: 2, maxUsesPerGame: 3 },
  { id: 'station2', name: '山间客栈', cellIndex: 12, layer: 'ground', extraMoves: 3, maxUsesPerGame: 2 },
  { id: 'station3', name: '水上渡口', cellIndex: 25, layer: 'ground', extraMoves: 2, maxUsesPerGame: 3, factionRequired: 'wu' },
  { id: 'station4', name: '天空哨站', cellIndex: 5, layer: 'sky', extraMoves: 3, maxUsesPerGame: 2 },
  { id: 'station5', name: '地下车站', cellIndex: 8, layer: 'underground', extraMoves: 2, maxUsesPerGame: 3 }
]

// ============== 港口配置 ==============

export const PORTS = [
  { id: 'port1', name: '长江渡口', fromCell: 8, fromLayer: 'ground', toCell: 15, toLayer: 'ground', travelCost: 50 },
  { id: 'port2', name: '东海渔港', fromCell: 20, fromLayer: 'ground', toCell: 3, toLayer: 'sky', travelCost: 80 },
  { id: 'port3', name: '地下暗河', fromCell: 10, fromLayer: 'underground', toCell: 25, toLayer: 'underground', travelCost: 30 }
]

// ============== 障碍物配置 ==============

export const OBSTACLES = [
  { id: 'obs1', name: '巨石拦路', cellIndex: 7, layer: 'ground', hp: 3, maxHp: 3, defeatReward: 150, respawnTurns: 0, icon: '🪨' },
  { id: 'obs2', name: '剧毒沼泽', cellIndex: 14, layer: 'ground', hp: 2, maxHp: 2, defeatReward: 100, respawnTurns: 5, icon: '☠️' },
  { id: 'obs3', name: '火焰陷阱', cellIndex: 22, layer: 'ground', hp: 2, maxHp: 2, defeatReward: 200, respawnTurns: 3, icon: '🔥' },
  { id: 'obs4', name: '荆棘丛', cellIndex: 33, layer: 'ground', hp: 1, maxHp: 1, defeatReward: 80, respawnTurns: 8, icon: '🌿' },
  { id: 'obs5', name: '地下岩浆', cellIndex: 12, layer: 'underground', hp: 3, maxHp: 3, defeatReward: 250, respawnTurns: 0, icon: '🌋' }
]

// ============== 资源采集点配置 ==============

export const RESOURCE_NODES = [
  { id: 'res1', name: '金矿', cellIndex: 15, layer: 'ground', resourceType: 'gold', yield: 100, yieldInterval: 3, maxCapacity: 500, icon: '💰' },
  { id: 'res2', name: '宝箱库', cellIndex: 28, layer: 'ground', resourceType: 'item', yield: 1, yieldInterval: 5, maxCapacity: 5, icon: '📦' },
  { id: 'res3', name: ' buffs圣地', cellIndex: 40, layer: 'ground', resourceType: 'buff', yield: 1, yieldInterval: 4, maxCapacity: 0, icon: '✨' },
  { id: 'res4', name: '宝石矿', cellIndex: 6, layer: 'underground', resourceType: 'gold', yield: 150, yieldInterval: 4, maxCapacity: 0, icon: '💎' },
  { id: 'res5', name: '仙丹泉', cellIndex: 10, layer: 'sky', resourceType: 'buff', yield: 1, yieldInterval: 6, maxCapacity: 3, icon: '🌟' }
]

// ============== 秘密通道配置 ==============

export const SECRET_PASSAGES = [
  { id: 'sp1', fromCell: 11, fromLayer: 'ground', toCell: 4, toLayer: 'underground', discoveryChance: 0.3, revealed: false },
  { id: 'sp2', fromCell: 30, fromLayer: 'ground', toCell: 2, toLayer: 'sky', discoveryChance: 0.2, revealed: false },
  { id: 'sp3', fromCell: 45, fromLayer: 'ground', toCell: 20, toLayer: 'underground', discoveryChance: 0.25, revealed: false }
]

// ============== BOSS据点配置 ==============

export const BOSS_LAIRS = [
  {
    id: 'boss1',
    name: '黄巾贼巢',
    icon: '⚔️',
    cells: [{ index: 18, layer: 'ground' }, { index: 19, layer: 'ground' }],
    faction: 'neutral',
    bossName: '张角',
    bossHp: 50,
    bossMaxHp: 50,
    defeatReward: 500,
    controlBonus: 20,
    isDefeated: false,
    respawnTurns: 20
  },
  {
    id: 'boss2',
    name: '董卓大营',
    icon: '🔥',
    cells: [{ index: 42, layer: 'ground' }, { index: 43, layer: 'ground' }],
    faction: 'neutral',
    bossName: '董卓',
    bossHp: 80,
    bossMaxHp: 80,
    defeatReward: 800,
    controlBonus: 30,
    isDefeated: false,
    respawnTurns: 25
  },
  {
    id: 'boss3',
    name: '吕布武殿',
    icon: '💫',
    cells: [{ index: 55, layer: 'sky' }, { index: 56, layer: 'sky' }],
    faction: 'neutral',
    bossName: '吕布',
    bossHp: 100,
    bossMaxHp: 100,
    defeatReward: 1000,
    controlBonus: 50,
    isDefeated: false,
    respawnTurns: 30
  }
]

// ============== 地图事件配置 ==============

export const MAP_EVENTS = [
  {
    id: 'me1',
    cellIndex: 9,
    layer: 'ground',
    name: '随机事件',
    icon: '❓',
    triggerChance: 0.4,
    effects: [
      { type: 'gold', value: 100, description: '发现路人丢失的钱袋，获得100金币' },
      { type: 'gold', value: -80, description: '遭遇小偷，损失80金币' },
      { type: 'buff', value: 1, duration: 3, description: '获得幸运buff，持续3回合' },
      { type: 'debuff', value: 1, duration: 2, description: '被诅咒，骰子-1，持续2回合' }
    ]
  },
  {
    id: 'me2',
    cellIndex: 32,
    layer: 'ground',
    name: '商人营地',
    icon: '🏕️',
    triggerChance: 0.6,
    effects: [
      { type: 'item', itemId: 'shield', description: '商人赠送免罪符' },
      { type: 'gold', value: 50, description: '商人收购情报，获得50金币' }
    ]
  }
]

// ============== 超大地图棋盘 (12x12 = 144格) ==============

export const boardCells = [
  // 第0行 (起点区域 - 中原)
  { id: 'cell_0', name: '洛阳皇城', type: 'start', layer: 'ground', terrain: 'castle', faction: 'wei' },
  { id: 'cell_1', name: '河南尹', type: 'property', cost: 300, rent: 70, layer: 'ground', terrain: 'normal', faction: 'wei', maxLevel: 3, upgradeCosts: [150, 250], rentByLevel: [70, 105, 160, 240] },
  { id: 'cell_2', name: '虎牢关', type: 'obstacle', obstacleId: 'obs1', layer: 'ground', terrain: 'mountain', faction: 'neutral' },
  { id: 'cell_3', name: '汜水关', type: 'property', cost: 280, rent: 65, layer: 'ground', terrain: 'mountain', faction: 'wei', maxLevel: 3, upgradeCosts: [140, 230], rentByLevel: [65, 98, 145, 220] },
  { id: 'cell_4', name: '驿站', type: 'station', stationId: 'station1', layer: 'ground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_5', name: '传送门', type: 'teleport_entry', teleportPairId: 'tp1', layer: 'ground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_6', name: '荥阳', type: 'property', cost: 260, rent: 60, layer: 'ground', terrain: 'normal', faction: 'wei', maxLevel: 3, upgradeCosts: [130, 210], rentByLevel: [60, 90, 135, 200] },
  { id: 'cell_7', name: '矿区入口', type: 'resource', resourceNodeId: 'res4', layer: 'underground', terrain: 'mountain', faction: 'neutral' },
  { id: 'cell_8', name: '秘密通道', type: 'secret', secretPassageId: 'sp1', layer: 'ground', terrain: 'wasteland', faction: 'neutral' },
  { id: 'cell_9', name: '随机事件', type: 'fate', mapEventId: 'me1', layer: 'ground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_10', name: '武陟', type: 'property', cost: 240, rent: 55, layer: 'ground', terrain: 'normal', faction: 'wei', maxLevel: 3, upgradeCosts: [120, 200], rentByLevel: [55, 82, 125, 185] },
  { id: 'cell_11', name: '地下层入口', type: 'layer_stairs_down', layer: 'ground', terrain: 'mountain', layerTransition: { targetLayer: 'underground', targetCell: 0 } },

  // 第1行
  { id: 'cell_12', name: '陈留', type: 'property', cost: 270, rent: 62, layer: 'ground', terrain: 'normal', faction: 'wei', maxLevel: 3, upgradeCosts: [135, 220], rentByLevel: [62, 93, 140, 210] },
  { id: 'cell_13', name: '东郡', type: 'property', cost: 250, rent: 58, layer: 'ground', terrain: 'water', faction: 'wei', maxLevel: 3, upgradeCosts: [125, 200], rentByLevel: [58, 87, 130, 195] },
  { id: 'cell_14', name: '濮阳', type: 'property', cost: 260, rent: 60, layer: 'ground', terrain: 'water', faction: 'wu', maxLevel: 3, upgradeCosts: [130, 210], rentByLevel: [60, 90, 135, 200] },
  { id: 'cell_15', name: '港口', type: 'port', portId: 'port1', layer: 'ground', terrain: 'water', faction: 'wu' },
  { id: 'cell_16', name: '白马', type: 'property', cost: 240, rent: 55, layer: 'ground', terrain: 'normal', faction: 'wei', maxLevel: 3, upgradeCosts: [120, 195], rentByLevel: [55, 82, 125, 185] },
  { id: 'cell_17', name: '延津', type: 'property', cost: 230, rent: 52, layer: 'ground', terrain: 'forest', faction: 'wei', maxLevel: 3, upgradeCosts: [115, 185], rentByLevel: [52, 78, 118, 175] },
  { id: 'cell_18', name: '黄巾贼巢', type: 'boss', bossLairId: 'boss1', layer: 'ground', terrain: 'wasteland', faction: 'neutral' },
  { id: 'cell_19', name: '长垣', type: 'property', cost: 220, rent: 50, layer: 'ground', terrain: 'wasteland', faction: 'neutral', maxLevel: 3, upgradeCosts: [110, 175], rentByLevel: [50, 75, 112, 168] },
  { id: 'cell_20', name: '曹操领地', type: 'property', cost: 320, rent: 80, layer: 'ground', terrain: 'castle', faction: 'wei', maxLevel: 3, upgradeCosts: [160, 260], rentByLevel: [80, 120, 180, 270] },
  { id: 'cell_21', name: '许都', type: 'property', cost: 350, rent: 90, layer: 'ground', terrain: 'castle', faction: 'wei', maxLevel: 3, upgradeCosts: [175, 280], rentByLevel: [90, 135, 200, 300] },

  // 第2行
  { id: 'cell_22', name: '酸枣', type: 'property', cost: 200, rent: 45, layer: 'ground', terrain: 'forest', faction: 'neutral', maxLevel: 3, upgradeCosts: [100, 160], rentByLevel: [45, 67, 100, 150] },
  { id: 'cell_23', name: '火焰陷阱', type: 'obstacle', obstacleId: 'obs3', layer: 'ground', terrain: 'volcano', faction: 'neutral' },
  { id: 'cell_24', name: '鲁阳', type: 'property', cost: 210, rent: 48, layer: 'ground', terrain: 'mountain', faction: 'shu', maxLevel: 3, upgradeCosts: [105, 170], rentByLevel: [48, 72, 108, 162] },
  { id: 'cell_25', name: '南阳', type: 'property', cost: 280, rent: 65, layer: 'ground', terrain: 'normal', faction: 'neutral', maxLevel: 3, upgradeCosts: [140, 225], rentByLevel: [65, 98, 146, 220] },
  { id: 'cell_26', name: '驿站', type: 'station', stationId: 'station2', layer: 'ground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_27', name: '汝南', type: 'property', cost: 230, rent: 52, layer: 'ground', terrain: 'normal', faction: 'neutral', maxLevel: 3, upgradeCosts: [115, 185], rentByLevel: [52, 78, 117, 175] },
  { id: 'cell_28', name: '宝箱库', type: 'resource', resourceNodeId: 'res2', layer: 'ground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_29', name: '新野', type: 'property', cost: 240, rent: 55, layer: 'ground', terrain: 'normal', faction: 'shu', maxLevel: 3, upgradeCosts: [120, 195], rentByLevel: [55, 82, 124, 185] },
  { id: 'cell_30', name: '樊城', type: 'property', cost: 250, rent: 58, layer: 'ground', terrain: 'water', faction: 'shu', maxLevel: 3, upgradeCosts: [125, 200], rentByLevel: [58, 87, 130, 195] },
  { id: 'cell_31', name: '江陵', type: 'property', cost: 270, rent: 62, layer: 'ground', terrain: 'water', faction: 'wu', maxLevel: 3, upgradeCosts: [135, 215], rentByLevel: [62, 93, 140, 210] },

  // 第3行
  { id: 'cell_32', name: '江夏', type: 'property', cost: 260, rent: 60, layer: 'ground', terrain: 'water', faction: 'wu', maxLevel: 3, upgradeCosts: [130, 210], rentByLevel: [60, 90, 135, 200] },
  { id: 'cell_33', name: '荆棘丛', type: 'obstacle', obstacleId: 'obs4', layer: 'ground', terrain: 'forest', faction: 'neutral' },
  { id: 'cell_34', name: '长沙', type: 'property', cost: 250, rent: 58, layer: 'ground', terrain: 'normal', faction: 'wu', maxLevel: 3, upgradeCosts: [125, 200], rentByLevel: [58, 87, 130, 195] },
  { id: 'cell_35', name: '零陵', type: 'property', cost: 200, rent: 45, layer: 'ground', terrain: 'forest', faction: 'shu', maxLevel: 3, upgradeCosts: [100, 160], rentByLevel: [45, 67, 100, 150] },
  { id: 'cell_36', name: '桂阳', type: 'property', cost: 190, rent: 42, layer: 'ground', terrain: 'wasteland', faction: 'neutral', maxLevel: 3, upgradeCosts: [95, 150], rentByLevel: [42, 63, 94, 140] },
  { id: 'cell_37', name: '武陵', type: 'property', cost: 195, rent: 43, layer: 'ground', terrain: 'forest', faction: 'shu', maxLevel: 3, upgradeCosts: [97, 155], rentByLevel: [43, 64, 96, 145] },
  { id: 'cell_38', name: '江州', type: 'property', cost: 210, rent: 48, layer: 'ground', terrain: 'normal', faction: 'shu', maxLevel: 3, upgradeCosts: [105, 170], rentByLevel: [48, 72, 108, 162] },
  { id: 'cell_39', name: '成都', type: 'property', cost: 350, rent: 95, layer: 'ground', terrain: 'castle', faction: 'shu', maxLevel: 3, upgradeCosts: [175, 285], rentByLevel: [95, 142, 215, 320] },
  { id: 'cell_40', name: ' buffs圣地', type: 'resource', resourceNodeId: 'res3', layer: 'ground', terrain: 'forest', faction: 'neutral' },
  { id: 'cell_41', name: '汉中', type: 'property', cost: 280, rent: 70, layer: 'ground', terrain: 'mountain', faction: 'shu', maxLevel: 3, upgradeCosts: [140, 230], rentByLevel: [70, 105, 158, 235] },

  // 第4行
  { id: 'cell_42', name: '董卓大营', type: 'boss', bossLairId: 'boss2', layer: 'ground', terrain: 'castle', faction: 'neutral' },
  { id: 'cell_43', name: '长安', type: 'property', cost: 320, rent: 85, layer: 'ground', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [160, 260], rentByLevel: [85, 127, 190, 285] },
  { id: 'cell_44', name: '岐山', type: 'property', cost: 220, rent: 50, layer: 'ground', terrain: 'mountain', faction: 'neutral', maxLevel: 3, upgradeCosts: [110, 175], rentByLevel: [50, 75, 112, 168] },
  { id: 'cell_45', name: '五丈原', type: 'property', cost: 230, rent: 52, layer: 'ground', terrain: 'wasteland', faction: 'neutral', maxLevel: 3, upgradeCosts: [115, 185], rentByLevel: [52, 78, 117, 175] },
  { id: 'cell_46', name: '街亭', type: 'property', cost: 200, rent: 45, layer: 'ground', terrain: 'mountain', faction: 'shu', maxLevel: 3, upgradeCosts: [100, 160], rentByLevel: [45, 67, 100, 150] },
  { id: 'cell_47', name: '斜谷', type: 'property', cost: 180, rent: 40, layer: 'ground', terrain: 'mountain', faction: 'shu', maxLevel: 3, upgradeCosts: [90, 145], rentByLevel: [40, 60, 90, 135] },
  { id: 'cell_48', name: '子午谷', type: 'secret', secretPassageId: 'sp2', layer: 'ground', terrain: 'forest', faction: 'neutral' },
  { id: 'cell_49', name: '蓝田', type: 'property', cost: 210, rent: 48, layer: 'ground', terrain: 'normal', faction: 'neutral', maxLevel: 3, upgradeCosts: [105, 170], rentByLevel: [48, 72, 108, 162] },
  { id: 'cell_50', name: '武关', type: 'property', cost: 260, rent: 60, layer: 'ground', terrain: 'mountain', faction: 'neutral', maxLevel: 3, upgradeCosts: [130, 210], rentByLevel: [60, 90, 135, 200] },
  { id: 'cell_51', name: '天空层入口', type: 'layer_stairs_up', layer: 'ground', terrain: 'mountain', layerTransition: { targetLayer: 'sky', targetCell: 0, cost: 100 } },

  // 第5行 (天空层)
  { id: 'cell_52', name: '天空城', type: 'property', cost: 400, rent: 100, layer: 'sky', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [200, 320], rentByLevel: [100, 150, 225, 340] },
  { id: 'cell_53', name: '云端驿站', type: 'station', stationId: 'station4', layer: 'sky', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_54', name: '天宫', type: 'property', cost: 450, rent: 120, layer: 'sky', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [225, 360], rentByLevel: [120, 180, 270, 400] },
  { id: 'cell_55', name: '吕布武殿', type: 'boss', bossLairId: 'boss3', layer: 'sky', terrain: 'castle', faction: 'neutral' },
  { id: 'cell_56', name: '传送门', type: 'teleport_entry', teleportPairId: 'tp2', layer: 'sky', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_57', name: '凌霄殿', type: 'property', cost: 500, rent: 140, layer: 'sky', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [250, 400], rentByLevel: [140, 210, 315, 470] },
  { id: 'cell_58', name: '仙丹泉', type: 'resource', resourceNodeId: 'res5', layer: 'sky', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_59', name: '天池', type: 'property', cost: 380, rent: 95, layer: 'sky', terrain: 'water', faction: 'neutral', maxLevel: 3, upgradeCosts: [190, 305], rentByLevel: [95, 142, 213, 320] },
  { id: 'cell_60', name: '蟠桃园', type: 'property', cost: 350, rent: 85, layer: 'sky', terrain: 'forest', faction: 'neutral', maxLevel: 3, upgradeCosts: [175, 280], rentByLevel: [85, 127, 190, 285] },
  { id: 'cell_61', name: '返回地面', type: 'layer_stairs_down', layer: 'sky', terrain: 'mountain', layerTransition: { targetLayer: 'ground', targetCell: 51 } },

  // 第6行 (地下层)
  { id: 'cell_62', name: '地下入口', type: 'layer_stairs_up', layer: 'underground', terrain: 'mountain', layerTransition: { targetLayer: 'ground', targetCell: 7 } },
  { id: 'cell_63', name: '矿洞', type: 'property', cost: 200, rent: 45, layer: 'underground', terrain: 'mountain', faction: 'neutral', maxLevel: 3, upgradeCosts: [100, 160], rentByLevel: [45, 67, 100, 150] },
  { id: 'cell_64', name: '宝石洞', type: 'resource', resourceNodeId: 'res1', layer: 'underground', terrain: 'mountain', faction: 'neutral' },
  { id: 'cell_65', name: '地下暗河', type: 'port', portId: 'port3', layer: 'underground', terrain: 'water', faction: 'neutral' },
  { id: 'cell_66', name: '矿工营地', type: 'property', cost: 180, rent: 40, layer: 'underground', terrain: 'normal', faction: 'neutral', maxLevel: 3, upgradeCosts: [90, 145], rentByLevel: [40, 60, 90, 135] },
  { id: 'cell_67', name: '地下岩浆', type: 'obstacle', obstacleId: 'obs5', layer: 'underground', terrain: 'volcano', faction: 'neutral' },
  { id: 'cell_68', name: '地下城', type: 'property', cost: 220, rent: 50, layer: 'underground', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [110, 175], rentByLevel: [50, 75, 112, 168] },
  { id: 'cell_69', name: '地下驿站', type: 'station', stationId: 'station5', layer: 'underground', terrain: 'normal', faction: 'neutral' },
  { id: 'cell_70', name: '秘密矿道', type: 'secret', secretPassageId: 'sp3', layer: 'underground', terrain: 'wasteland', faction: 'neutral' },
  { id: 'cell_71', name: '地下要塞', type: 'property', cost: 280, rent: 65, layer: 'underground', terrain: 'castle', faction: 'neutral', maxLevel: 3, upgradeCosts: [140, 225], rentByLevel: [65, 98, 146, 220] },
  { id: 'cell_72', name: '返回地面', type: 'layer_stairs_up', layer: 'underground', terrain: 'mountain', layerTransition: { targetLayer: 'ground', targetCell: 0 } },

  // 第7-11行 (扩展区域 - 简化版填充)
  ...Array.from({ length: 72 }, (_, i) => {
    const row = Math.floor(i / 12) + 7
    const col = i % 12
    const idx = 72 + i
    const terrains = ['normal', 'forest', 'mountain', 'water', 'wasteland']
    const terrain = terrains[i % terrains.length]
    const factions = ['wei', 'shu', 'wu', 'neutral', 'neutral']
    const faction = factions[i % factions.length]
    const costs = [180, 200, 220, 240, 260, 280, 300, 250, 230, 210, 190, 220]
    const cost = costs[col]
    return {
      id: `cell_${idx}`,
      name: `区域${row}-${col}`,
      type: 'property',
      cost,
      rent: Math.floor(cost * 0.2),
      layer: 'ground',
      terrain,
      faction,
      maxLevel: 3,
      upgradeCosts: [Math.floor(cost * 0.5), Math.floor(cost * 0.8)],
      rentByLevel: [Math.floor(cost * 0.2), Math.floor(cost * 0.3), Math.floor(cost * 0.45), Math.floor(cost * 0.65)]
    }
  })
]

// ============== 角色定义（带技能升级） ==============

export const characters = [
  {
    id: 'liu',
    name: '刘备',
    image: 'images/liu.webp',
    skill: '购买地产时获得金币',
    skillType: 'buyProperty',
    skillLevel: 1,
    skillUpgrades: [
      { level: 1, description: '购买地产时获得50金币', bonusValue: 50 },
      { level: 2, description: '购买地产时获得80金币', bonusValue: 80 },
      { level: 3, description: '购买地产时获得120金币', bonusValue: 120 }
    ],
    skillMoneyBonus: 50
  },
  {
    id: 'guan',
    name: '关羽',
    image: 'images/guan.webp',
    skill: '缴纳租金时减少金币',
    skillType: 'payRent',
    skillLevel: 1,
    skillUpgrades: [
      { level: 1, description: '缴纳租金时减少10金币', bonusValue: 10 },
      { level: 2, description: '缴纳租金时减少20金币', bonusValue: 20 },
      { level: 3, description: '缴纳租金时减少30金币', bonusValue: 30 }
    ],
    skillReduction: 10
  },
  {
    id: 'zhang',
    name: '张飞',
    image: 'images/zhang.webp',
    skill: '点数较小时自动+1',
    skillType: 'rollDice',
    skillLevel: 1,
    skillUpgrades: [
      { level: 1, description: '点数小于3时自动+1', bonusValue: 3 },
      { level: 2, description: '点数小于4时自动+1', bonusValue: 4 },
      { level: 3, description: '点数小于5时自动+1', bonusValue: 5 }
    ],
    skillMinRoll: 3,
    skillBonus: 1
  },
  {
    id: 'zhuge',
    name: '诸葛亮',
    image: 'images/zhuge.webp',
    skill: '免疫负面事件',
    skillType: 'event',
    skillLevel: 1,
    skillUpgrades: [
      { level: 1, description: '免疫负面事件', bonusValue: 0 },
      { level: 2, description: '免疫+反弹50%', bonusValue: 0.5 },
      { level: 3, description: '免疫+反弹100%', bonusValue: 1 }
    ],
    skillImmune: true,
    skillBounce: false
  }
]

// ============== 事件配置（扩展） ==============

export const events = {
  // 基础事件
  yellowTurban: { amount: -100, description: '遭遇黄巾起义，损失100金币！' },
  peachOath: { amount: 150, description: '桃园三结义，兄弟相助，获得150金币！' },
  redCliffs: { amount: 200, description: '赤壁之战大获全胜，奖励200金币！' },
  emperor: { amount: 100, description: '朝见皇帝，领取赏赐100金币！' },
  ambush: { amount: -50, description: '遭遇埋伏，损失50金币！' },
  strategist: { amount: 80, description: '获得谋士策略，奖励80金币！' },

  // 扩展事件
  treasure: {
    description: '发现宝箱！',
    effects: [
      { type: 'money', weight: 50, amount: 80 },
      { type: 'money', weight: 30, amount: 150 },
      { type: 'money', weight: 15, amount: 250 },
      { type: 'item', weight: 5, itemId: 'shield' }
    ]
  },
  huarong: {
    choice: true,
    options: [
      { text: '放行', effect: { amount: -50 }, result: '放走曹操，损失50金币' },
      { text: '拦截', effect: { amount: 100 }, result: '成功拦截，获得100金币' }
    ]
  },
  recruit: {
    description: '招募士兵，战斗力提升！',
    effect: 'soldiers',
    amount: 30  // 每次招募获得30金币（象征士兵战力）
  }
}

// ============== 成就定义 ==============

export const ACHIEVEMENTS = [
  {
    id: 'first_buy',
    name: '初出茅庐',
    description: '购买第一处房产',
    icon: '🏠',
    condition: (ctx) => ctx.players.some(p => p.properties.length >= 1),
    reward: 50
  },
  {
    id: 'rich',
    name: '富甲一方',
    description: '拥有1500金币',
    icon: '💎',
    condition: (ctx) => ctx.players.some(p => p.money >= 1500),
    reward: 100
  },
  {
    id: 'landlord',
    name: '大地主',
    description: '拥有5处房产',
    icon: '🏰',
    condition: (ctx) => ctx.players.some(p => p.properties.length >= 5),
    reward: 200
  },
  {
    id: 'red_cliffs',
    name: '赤壁战神',
    description: '单次事件获得200+金币',
    icon: '🔥',
    condition: (ctx) => (ctx.lastEventAmount ?? 0) >= 200,
    reward: 150
  },
  {
    id: 'skill_master',
    name: '技能大师',
    description: '技能升到满级',
    icon: '⚔️',
    condition: (ctx) => ctx.players.some(p => p.skillLevel >= 3),
    reward: 300
  },
  {
    id: 'conqueror',
    name: '三分天下',
    description: '击败2个对手',
    icon: '👑',
    condition: (ctx) => ctx.players.filter(p => !p.inGame).length >= 2,
    reward: 500
  },
  {
    id: 'first_item',
    name: '商人头脑',
    description: '购买第一个道具',
    icon: '🛒',
    condition: (ctx) => ctx.players.some(p => p.items.length >= 1),
    reward: 30
  },
  {
    id: 'upgraded',
    name: '安居乐业',
    description: '将一处地产升到最高级',
    icon: '🏗️',
    condition: (ctx) => ctx.players.some(p => p.properties.some(cell => cell.level === 3)),
    reward: 250
  },
  {
    id: 'treasure_hunter',
    name: '寻宝专家',
    description: '开启3次宝箱',
    icon: '📦',
    secret: true,
    condition: (ctx) => ctx.treasureCount >= 3,
    reward: 100
  },
  {
    id: 'survivor',
    name: '绝境逢生',
    description: '剩余100金币时逆转获胜',
    icon: '🌟',
    secret: true,
    condition: (ctx) => {
      const winner = ctx.players.find(p => ctx.winner?.id === p.id)
      return winner && winner.money <= 100 && winner.inGame
    },
    reward: 400
  }
]
