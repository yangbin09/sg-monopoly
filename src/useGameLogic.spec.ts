import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from './stores/gameStore'
import { useGameLogic, EventTypes } from './composables/useGameLogic'

describe('useGameLogic', () => {
  let gameStore: ReturnType<typeof useGameStore>
  let gameLogic: ReturnType<typeof useGameLogic>

  const liuChar = {
    id: 'liu',
    name: '刘备',
    image: 'images/liu.webp',
    skill: '购买地产时获得50金币',
    skillType: 'buyProperty',
    skillBonus: 50,
    skillUpgrades: []
  }

  const guanChar = {
    id: 'guan',
    name: '关羽',
    image: 'images/guan.webp',
    skill: '缴纳租金时减少10金币',
    skillType: 'payRent',
    skillReduction: 10,
    skillUpgrades: []
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    gameStore = useGameStore()
    gameLogic = useGameLogic(gameStore)
  })

  describe('selectCharacter', () => {
    it('should add player on character selection', () => {
      const events = gameLogic.selectCharacter(liuChar as any)
      expect(gameStore.players.length).toBe(1)
      expect(gameStore.players[0].character.id).toBe('liu')
    })

    it('should prevent duplicate character selection', () => {
      gameLogic.selectCharacter(liuChar as any)
      const msgCount = gameStore.messages.length
      gameLogic.selectCharacter(liuChar as any)

      // Should have error message about duplicate
      expect(gameStore.messages.length).toBeGreaterThan(msgCount)
      expect(gameStore.messages[msgCount]).toContain('已被选择')
    })

    it('should start game after selecting 2 players', () => {
      gameLogic.selectCharacter(liuChar as any)
      gameLogic.selectCharacter(guanChar as any)

      expect(gameStore.gameInProgress).toBe(true)
    })
  })

  describe('rollDice', () => {
    it('should return events when game is in progress', () => {
      gameLogic.selectCharacter(liuChar as any)
      gameLogic.selectCharacter(guanChar as any)

      const events = gameLogic.rollDice()
      expect(events.length).toBeGreaterThan(0)
    })

    it('should disable roll button initially', () => {
      gameLogic.selectCharacter(liuChar as any)
      gameLogic.selectCharacter(guanChar as any)

      const events = gameLogic.rollDice()
      const disableBtn = events.find((e: any) => e.type === EventTypes.ROLL_BUTTON_ENABLED)

      expect(disableBtn?.payload).toBe(false)
    })

    it('should update dice result', () => {
      gameLogic.selectCharacter(liuChar as any)
      gameLogic.selectCharacter(guanChar as any)

      const events = gameLogic.rollDice()
      const diceEvent = events.find((e: any) => e.type === EventTypes.UPDATE_DICE)

      expect(diceEvent?.payload).toBeGreaterThanOrEqual(1)
      expect(diceEvent?.payload).toBeLessThanOrEqual(6)
    })
  })

  describe('applySkill', () => {
    it('should apply rollDice skill for Zhang Fei', () => {
      const zhangChar = {
        id: 'zhang',
        name: '张飞',
        image: 'images/zhang.webp',
        skill: '点数小于3时自动 +1',
        skillType: 'rollDice',
        skillMinRoll: 3,
        skillBonus: 1,
        skillUpgrades: []
      }

      gameStore.addPlayer(zhangChar as any)
      const player = gameStore.players[0]

      const result = gameLogic.applySkill(player, 'rollDice', { roll: 2 })
      expect(result?.roll).toBe(3)
      expect(result?.message).toContain('发动技能')
    })

    it('should apply payRent skill for Guan Yu', () => {
      gameStore.addPlayer(guanChar as any)
      const player = gameStore.players[0]

      const result = gameLogic.applySkill(player, 'payRent', { amount: 50 })
      expect(result?.amount).toBe(40)
    })

    it('should not apply skill for Liu Bei on rent', () => {
      gameStore.addPlayer(liuChar as any)
      const player = gameStore.players[0]

      const result = gameLogic.applySkill(player, 'payRent', { amount: 50 })
      expect(result).toBeNull()
    })
  })

  describe('checkGameEnd', () => {
    it('should end game when one player remains', () => {
      gameStore.addPlayer(liuChar as any)
      gameStore.addPlayer(guanChar as any)

      gameStore.players[0].inGame = false
      gameStore.gameInProgress = true

      gameLogic.checkGameEnd()

      expect(gameStore.gameEnded).toBe(true)
    })
  })
})
