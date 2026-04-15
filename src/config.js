/**
 * config.js
 *
 * 游戏配置数据：棋盘格子定义、角色定义、常量、道具、天气、成就、地图系统
 */

// ============== 基础常量 ==============

export const BOARD_SIZE = 5
export const GRID_SIZE = 16
export const INITIAL_MONEY = 1000
export const START_BONUS = 200
export const SKILL_UPGRADE_THRESHOLD = 3

// ============== 地图尺寸配置 ==============

export const MAP_SIZES = {
  small: { grid: 4, boardSize: 12, name: '小型 (4x4)' },
  standard: { grid: 5, boardSize: 16, name: '标准 (5x5)' },
  large: { grid: 6, boardSize: 20, name: '大型 (6x6)' },
  giant: { grid: 7, boardSize: 24, name: '巨型 (7x7)' }
}

// ============== 地形效果配置 ==============

export const TERRAIN_EFFECTS = {
  normal: {
    terrain: 'normal',
    description: '普通地形',
    diceModifier: 0,
    rentModifier: 1.0,
    costModifier: 1.0
  },
  mountain: {
    terrain: 'mountain',
    description: '山地 - 骰子-1，购买价格8折，租金+50%',
    diceModifier: -1,
    rentModifier: 1.5,
    costModifier: 0.8
  },
  water: {
    terrain: 'water',
    description: '水域 - 需要船费10金币',
    diceModifier: 0,
    rentModifier: 1.2,
    costModifier: 1.0,
    passageCost: 10
  },
  castle: {
    terrain: 'castle',
    description: '城池 - 租金翻倍，购买价格翻倍',
    diceModifier: 0,
    rentModifier: 2.0,
    costModifier: 2.0
  },
  wasteland: {
    terrain: 'wasteland',
    description: '荒野 - 随机事件高发',
    diceModifier: 0,
    rentModifier: 0.8,
    costModifier: 0.5
  }
}

// ============== 区域增益配置 ==============

export const AREA_BONUSES = [
  {
    area: 'wei',
    name: '魏国',
    bonusType: 'rent',
    bonusValue: 1.1,
    threshold: 3
  },
  {
    area: 'shu',
    name: '蜀国',
    bonusType: 'skill',
    bonusValue: 1,
    threshold: 3
  },
  {
    area: 'wu',
    name: '吴国',
    bonusType: 'money',
    bonusValue: 50,
    threshold: 3
  },
  {
    area: 'neutral',
    name: '中立区',
    bonusType: 'dice',
    bonusValue: 1,
    threshold: 2
  }
]

// ============== 传送阵配置 ==============

export const TELEPORT_PAIRS = [
  { id: 'tp1', entryIndex: 2, exitIndex: 10, name: '传送阵 A' },
  { id: 'tp2', entryIndex: 5, exitIndex: 13, name: '传送阵 B' }
]

// ============== 驿站配置 ==============

export const STATION_CONFIG = {
  cost: 30,
  extraMoves: 2,
  maxUsesPerTurn: 1
}

// ============== 港口配置 ==============

export const PORT_PAIRS = [
  { from: 3, to: 11, name: '港口 A' },
  { from: 7, to: 15, name: '港口 B' }
]

// ============== 障碍物配置 ==============

export const OBSTACLE_CONFIG = {
  bandit: {
    type: 'bandit',
    reward: 50,
    defeatCost: 0
  },
  construction: {
    type: 'construction',
    reward: 0,
    rebuildCost: 100
  },
  ruins: {
    type: 'ruins',
    reward: 30,
    rebuildCost: 50
  }
}

// ============== 命运牌配置 ==============

export const FATE_CARDS = [
  {
    id: 'fate_1',
    name: '得天之幸',
    description: '获得150金币',
    type: 'personal',
    icon: '🎁',
    effect: { type: 'money', value: 150 }
  },
  {
    id: 'fate_2',
    name: '风云突变',
    description: '天气变为暴风雨',
    type: 'global',
    icon: '⛈️',
    effect: { type: 'weather', value: 4 } // stormy
  },
  {
    id: 'fate_3',
    name: '卧龙相助',
    description: '技能升级+1',
    type: 'personal',
    icon: '🐉',
    effect: { type: 'skill', value: 1 }
  },
  {
    id: 'fate_4',
    name: '兵临城下',
    description: '所有玩家损失50金币',
    type: 'global',
    icon: '⚔️',
    effect: { type: 'money', value: -50, affectAll: true }
  },
  {
    id: 'fate_5',
    name: '传送之阵',
    description: '传送至任意己方地产',
    type: 'personal',
    icon: '✨',
    effect: { type: 'teleport' }
  },
  {
    id: 'fate_6',
    name: '山贼出没',
    description: '前进路上遇到山贼',
    type: 'obstacle',
    icon: '🏴',
    effect: { type: 'obstacle', value: 0 }
  }
]

// ============== 地图主题配置 ==============

export const MAP_THEMES = {
  threekingdoms: {
    id: 'threekingdoms',
    name: '三国志',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    boardBorder: '#d4a574',
    cellColors: {
      property: 'rgba(100, 150, 100, 0.2)',
      event: 'rgba(150, 100, 100, 0.2)',
      special: 'rgba(212, 165, 116, 0.3)'
    }
  },
  'water_margin': {
    id: 'water_margin',
    name: '水浒传',
    background: 'linear-gradient(135deg, #2d4a22 0%, #1a3315 100%)',
    boardBorder: '#8b4513',
    cellColors: {
      property: 'rgba(139, 69, 19, 0.2)',
      event: 'rgba(255, 140, 0, 0.2)',
      special: 'rgba(210, 105, 30, 0.3)'
    }
  },
  investiture: {
    id: 'investiture',
    name: '封神演义',
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2e1a4e 100%)',
    boardBorder: '#9370db',
    cellColors: {
      property: 'rgba(147, 112, 219, 0.2)',
      event: 'rgba(255, 215, 0, 0.2)',
      special: 'rgba(186, 85, 211, 0.3)'
    }
  },
  journey: {
    id: 'journey',
    name: '西游记',
    background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 100%)',
    boardBorder: '#daa520',
    cellColors: {
      property: 'rgba(218, 165, 32, 0.2)',
      event: 'rgba(255, 69, 0, 0.2)',
      special: 'rgba(255, 215, 0, 0.3)'
    }
  }
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
  },
  {
    id: 'freeze',
    name: '冻结卡',
    description: '对手跳过1回合',
    type: 'freeze',
    value: 1,
    cost: 160,
    usable: true,
    icon: '❄️'
  },
  {
    id: 'reverse',
    name: '反转卡',
    description: '与对手交换位置',
    type: 'reverse',
    value: 0,
    cost: 140,
    usable: true,
    icon: '🔄'
  },
  {
    id: 'mortgage',
    name: '抵押卡',
    description: '抵押地产换取金币（价值的50%）',
    type: 'mortgage',
    value: 0.5,
    cost: 50,
    usable: true,
    icon: '📜'
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

// ============== 棋盘格子定义（增强版） ==============

export const boardCells = [
  // 0: 起点
  { id: 'cell_0', name: '起点', type: 'start', terrain: 'normal', area: 'neutral' },

  // 1-3: 魏国区域
  { id: 'cell_1', name: '许昌', type: 'property', cost: 200, rent: 40, terrain: 'castle', area: 'wei', maxLevel: 3, upgradeCosts: [100, 150], rentByLevel: [40, 60, 90, 140] },
  { id: 'cell_2', name: '传送阵', type: 'teleport_entry', terrain: 'normal', area: 'neutral', teleportPairId: 'tp1' },
  { id: 'cell_3', name: '洛阳', type: 'property', cost: 220, rent: 50, terrain: 'normal', area: 'wei', maxLevel: 3, upgradeCosts: [110, 165], rentByLevel: [50, 75, 110, 170] },

  // 4: 商店
  { id: 'cell_4', name: '商店', type: 'store', terrain: 'normal', area: 'neutral' },

  // 5-7: 吴国区域
  { id: 'cell_5', name: '传送阵', type: 'teleport_entry', terrain: 'normal', area: 'neutral', teleportPairId: 'tp2' },
  { id: 'cell_6', name: '建业', type: 'property', cost: 230, rent: 55, terrain: 'water', area: 'wu', maxLevel: 3, upgradeCosts: [115, 175], rentByLevel: [55, 82, 125, 185] },
  { id: 'cell_7', name: '港口', type: 'port', terrain: 'water', area: 'wu', portTargetIndex: 15 },

  // 8: 事件
  { id: 'cell_8', name: '命运', type: 'fate', terrain: 'normal', area: 'neutral' },

  // 9-11: 蜀国区域
  { id: 'cell_9', name: '成都', type: 'property', cost: 250, rent: 60, terrain: 'mountain', area: 'shu', maxLevel: 3, upgradeCosts: [125, 190], rentByLevel: [60, 90, 135, 200] },
  { id: 'cell_10', name: '传送阵', type: 'teleport_exit', terrain: 'normal', area: 'neutral', teleportPairId: 'tp1' },
  { id: 'cell_11', name: '驿站', type: 'station', terrain: 'normal', area: 'neutral', stationConfig: { cost: 30, extraMoves: 2, maxUsesPerTurn: 1 } },

  // 12: 宝箱
  { id: 'cell_12', name: '宝箱', type: 'treasure', terrain: 'wasteland', area: 'neutral' },

  // 13-15: 中立区域
  { id: 'cell_13', name: '传送阵', type: 'teleport_exit', terrain: 'normal', area: 'neutral', teleportPairId: 'tp2' },
  { id: 'cell_14', name: '荆襄', type: 'property', cost: 240, rent: 55, terrain: 'normal', area: 'neutral', maxLevel: 3, upgradeCosts: [120, 180], rentByLevel: [55, 82, 125, 185] },
  { id: 'cell_15', name: '港口', type: 'port', terrain: 'water', area: 'neutral', portTargetIndex: 7 }
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

// ============== 事件配置 ==============

export const events = {
  yellowTurban: { amount: -100, description: '遭遇黄巾起义，损失100金币！' },
  peachOath: { amount: 150, description: '桃园三结义，兄弟相助，获得150金币！' },
  redCliffs: { amount: 200, description: '赤壁之战大获全胜，奖励200金币！' },
  emperor: { amount: 100, description: '朝见皇帝，领取赏赐100金币！' },
  ambush: { amount: -50, description: '遭遇埋伏，损失50金币！' },
  strategist: { amount: 80, description: '获得谋士策略，奖励80金币！' },

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
    amount: 30
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
    id: 'area_conqueror',
    name: '区域霸主',
    description: '占领任一区域3处以上',
    icon: '🗺️',
    condition: (ctx) => ctx.players.some(p => Object.values(p.areaControl || {}).some(v => v >= 3)),
    reward: 150
  },
  {
    id: 'treasure_hunter',
    name: '寻宝专家',
    description: '开启5次宝箱',
    icon: '📦',
    secret: true,
    condition: (ctx) => (ctx.treasureCount ?? 0) >= 5,
    reward: 100
  },
  {
    id: 'mountain_master',
    name: '山地之王',
    description: '拥有3处山地地产',
    icon: '⛰️',
    secret: true,
    condition: (ctx) => ctx.players.some(p => p.properties.filter(c => c.terrain === 'mountain').length >= 3),
    reward: 120
  },
  {
    id: 'castle_owner',
    name: '城主',
    description: '拥有2处城池',
    icon: '🏯',
    secret: true,
    condition: (ctx) => ctx.players.some(p => p.properties.filter(c => c.terrain === 'castle').length >= 2),
    reward: 180
  },
  {
    id: 'explorer',
    name: '探险家',
    description: '使用过所有传送阵',
    icon: '✨',
    secret: true,
    condition: (ctx) => ctx.players.some(p => p.usedStations > 0),
    reward: 80
  }
]

// ============== 地图预设 ==============

export const MAP_PRESETS = [
  {
    id: 'standard_three_kingdoms',
    name: '三国志·标准版',
    theme: 'threekingdoms',
    size: 'standard',
    description: '经典三国地图，16格子',
    cells: boardCells
  },
  {
    id: 'small_battle',
    name: '速战速决',
    theme: 'threekingdoms',
    size: 'small',
    description: '12格快速对局',
    cells: [
      { name: '起点', type: 'start' },
      { name: '魏都', type: 'property', cost: 200, rent: 40 },
      { name: '事件', type: 'event', eventId: 'yellowTurban' },
      { name: '吴郡', type: 'property', cost: 220, rent: 50 },
      { name: '商店', type: 'store' },
      { name: '蜀地', type: 'property', cost: 250, rent: 60 },
      { name: '命运', type: 'fate' },
      { name: '荆襄', type: 'property', cost: 240, rent: 55 },
      { name: '宝箱', type: 'treasure' },
      { name: '税收', type: 'tax', amount: 50 },
      { name: '驿站', type: 'station' },
      { name: '赋税', type: 'tax', amount: 50 }
    ]
  },
  {
    id: 'large_war',
    name: '三国大战',
    theme: 'threekingdoms',
    size: 'large',
    description: '20格深度策略',
    cells: [
      { name: '起点', type: 'start' },
      { name: '许昌', type: 'property', cost: 200, rent: 40, terrain: 'castle', area: 'wei' },
      { name: '事件', type: 'event', eventId: 'strategist' },
      { name: '洛阳', type: 'property', cost: 220, rent: 50, terrain: 'mountain', area: 'wei' },
      { name: '商店', type: 'store' },
      { name: '宛城', type: 'property', cost: 180, rent: 35, area: 'wei' },
      { name: '传送', type: 'teleport_entry' },
      { name: '赤壁', type: 'event', eventId: 'redCliffs', terrain: 'water' },
      { name: '建业', type: 'property', cost: 230, rent: 55, terrain: 'water', area: 'wu' },
      { name: '命运', type: 'fate' },
      { name: '吴郡', type: 'property', cost: 210, rent: 45, area: 'wu' },
      { name: '港口', type: 'port' },
      { name: '成都', type: 'property', cost: 250, rent: 60, terrain: 'mountain', area: 'shu' },
      { name: '事件', type: 'event', eventId: 'peachOath' },
      { name: '汉中', type: 'property', cost: 240, rent: 55, terrain: 'mountain', area: 'shu' },
      { name: '传送', type: 'teleport_exit' },
      { name: '荆襄', type: 'property', cost: 200, rent: 40 },
      { name: '宝箱', type: 'treasure' },
      { name: '赋税', type: 'tax', amount: 50 },
      { name: '赋税', type: 'tax', amount: 50 }
    ]
  }
]
