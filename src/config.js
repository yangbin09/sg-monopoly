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

// ============== 棋盘格子定义 ==============

export const boardCells = [
  { name: '起点', type: 'start' },
  { name: '蜀', type: 'property', cost: 200, rent: 40, maxLevel: 3, upgradeCosts: [100, 150], rentByLevel: [40, 60, 90, 140] },
  { name: '黄巾起义', type: 'event', eventId: 'yellowTurban' },
  { name: '吴', type: 'property', cost: 220, rent: 50, maxLevel: 3, upgradeCosts: [110, 165], rentByLevel: [50, 75, 110, 170] },
  { name: '商店', type: 'store' },
  { name: '桃园三结义', type: 'event', eventId: 'peachOath' },
  { name: '魏', type: 'property', cost: 250, rent: 60, maxLevel: 3, upgradeCosts: [125, 190], rentByLevel: [60, 90, 135, 200] },
  { name: '宝箱', type: 'treasure', eventId: 'treasure' },
  { name: '荆州', type: 'property', cost: 240, rent: 55, maxLevel: 3, upgradeCosts: [120, 180], rentByLevel: [55, 82, 125, 185] },
  { name: '华容道', type: 'huarong', eventId: 'huarong' },
  { name: '关中', type: 'property', cost: 230, rent: 50, maxLevel: 3, upgradeCosts: [115, 175], rentByLevel: [50, 75, 110, 170] },
  { name: '招募士兵', type: 'recruit', eventId: 'recruit' },
  { name: '屯田', type: 'property', cost: 210, rent: 45, maxLevel: 3, upgradeCosts: [105, 160], rentByLevel: [45, 67, 100, 150] },
  { name: '谋士策略', type: 'event', eventId: 'strategist' },
  { name: '群英会', type: 'property', cost: 260, rent: 70, maxLevel: 3, upgradeCosts: [130, 200], rentByLevel: [70, 105, 155, 230] },
  { name: '赋税', type: 'tax', amount: 50 }
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
