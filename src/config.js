/**
 * config.js
 *
 * 游戏配置数据：棋盘格子定义、角色定义、常量
 */

export const BOARD_SIZE = 5
export const GRID_SIZE = 16
export const INITIAL_MONEY = 1000
export const START_BONUS = 200

export const boardCells = [
  { name: '起点', type: 'start' },
  { name: '蜀', type: 'property', cost: 200, rent: 40 },
  { name: '黄巾起义', type: 'event', eventId: 'yellowTurban' },
  { name: '吴', type: 'property', cost: 220, rent: 50 },
  { name: '商店', type: 'store' },
  { name: '桃园三结义', type: 'event', eventId: 'peachOath' },
  { name: '魏', type: 'property', cost: 250, rent: 60 },
  { name: '赤壁之战', type: 'event', eventId: 'redCliffs' },
  { name: '荆州', type: 'property', cost: 240, rent: 55 },
  { name: '朝见皇帝', type: 'event', eventId: 'emperor' },
  { name: '关中', type: 'property', cost: 230, rent: 50 },
  { name: '埋伏', type: 'event', eventId: 'ambush' },
  { name: '屯田', type: 'property', cost: 210, rent: 45 },
  { name: '谋士策略', type: 'event', eventId: 'strategist' },
  { name: '群英会', type: 'property', cost: 260, rent: 70 },
  { name: '赋税', type: 'tax', amount: 50 }
]

export const characters = [
  {
    id: 'liu',
    name: '刘备',
    image: 'images/liu.png',
    skill: '购买地产时获得50金币',
    skillType: 'buyProperty',
    skillBonus: 50
  },
  {
    id: 'guan',
    name: '关羽',
    image: 'images/guan.png',
    skill: '缴纳租金时减少10金币',
    skillType: 'payRent',
    skillReduction: 10
  },
  {
    id: 'zhang',
    name: '张飞',
    image: 'images/zhang.png',
    skill: '点数小于3时自动 +1',
    skillType: 'rollDice',
    skillMinRoll: 3,
    skillBonus: 1
  },
  {
    id: 'zhuge',
    name: '诸葛亮',
    image: 'images/zhuge.png',
    skill: '免疫负面事件',
    skillType: 'event',
    skillImmune: true
  }
]

export const events = {
  yellowTurban: { amount: -100, description: '遭遇黄巾起义，损失100金币！' },
  peachOath: { amount: 150, description: '桃园三结义，兄弟相助，获得150金币！' },
  redCliffs: { amount: 200, description: '赤壁之战大获全胜，奖励200金币！' },
  emperor: { amount: 100, description: '朝见皇帝，领取赏赐100金币！' },
  ambush: { amount: -50, description: '遭遇埋伏，损失50金币！' },
  strategist: { amount: 80, description: '获得谋士策略，奖励80金币！' }
}
