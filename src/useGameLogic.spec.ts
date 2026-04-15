import { describe, it, expect, beforeEach } from 'vitest'
import { createGameState } from './stores/gameState'
import { useGameLogic, EventTypes } from './composables/useGameLogic'

describe('useGameLogic', () => {
  let gameState: ReturnType<typeof createGameState>
  let gameLogic: ReturnType<typeof useGameLogic>

  const liuChar = {
    id: 'liu',
    name: '刘备',
    image: 'images/liu.webp',
    skill: '购买地产时获得50金币',
    skillType: 'buyProperty',
    skillBonus: 50
  }

  const guanChar = {
    id: 'guan',
    name: '关羽',
    image: 'images/guan.webp',
    skill: '缴纳租金时减少10金币',
    skillType: 'payRent',
    skillReduction: 10
  }

  beforeEach(() => {
    gameState = createGameState()
    gameLogic = useGameLogic(gameState)
  })

  describe('selectCharacter', () => {
    it('should add player on character selection', () => {
      const events = gameLogic.selectCharacter(liuChar, [])
      expect(gameState.state.players.length).toBe(1)
      expect(gameState.state.players[0].character.id).toBe('liu')
    })

    it('should prevent duplicate character selection', () => {
      gameLogic.selectCharacter(liuChar, [])
      const events = gameLogic.selectCharacter(liuChar, [])

      const appendMsg = events.find((e: any) => e.type === EventTypes.APPEND_MESSAGE)
      expect(appendMsg?.payload).toContain('已被选择')
    })

    it('should start game after selecting 2 players', () => {
      gameLogic.selectCharacter(liuChar, [])
      const events = gameLogic.selectCharacter(guanChar, [])

      const showGame = events.find((e: any) => e.type === EventTypes.SHOW_GAME)
      expect(showGame).toBeDefined()
      expect(gameState.state.gameInProgress).toBe(true)
    })
  })

  describe('rollDice', () => {
    it('should return events when game is in progress', () => {
      gameLogic.selectCharacter(liuChar, [])
      gameLogic.selectCharacter(guanChar, [])

      const events = gameLogic.rollDice()
      expect(events.length).toBeGreaterThan(0)
    })

    it('should disable roll button initially', () => {
      gameLogic.selectCharacter(liuChar, [])
      gameLogic.selectCharacter(guanChar, [])

      const events = gameLogic.rollDice()
      const disableBtn = events.find((e: any) => e.type === EventTypes.ROLL_BUTTON_ENABLED)

      expect(disableBtn?.payload).toBe(false)
    })

    it('should update dice result', () => {
      gameLogic.selectCharacter(liuChar, [])
      gameLogic.selectCharacter(guanChar, [])

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
        skillBonus: 1
      }

      gameState.addPlayer(zhangChar)
      const player = gameState.state.players[0]

      const result = gameLogic.applySkill(player, 'rollDice', { roll: 2 })
      expect(result?.roll).toBe(3)
      expect(result?.message).toContain('发动技能')
    })

    it('should apply payRent skill for Guan Yu', () => {
      gameState.addPlayer(guanChar)
      const player = gameState.state.players[0]

      const result = gameLogic.applySkill(player, 'payRent', { amount: 50 })
      expect(result?.amount).toBe(40) // 50 - 10 reduction
    })

    it('should not apply skill for Liu Bei on rent', () => {
      gameState.addPlayer(liuChar)
      const player = gameState.state.players[0]

      const result = gameLogic.applySkill(player, 'payRent', { amount: 50 })
      expect(result).toBeNull()
    })
  })

  describe('checkGameEnd', () => {
    it('should end game when one player remains', () => {
      gameState.addPlayer(liuChar)
      gameState.addPlayer(guanChar)

      gameState.state.players[0].inGame = false
      gameState.state.gameInProgress = true

      const events: any[] = []
      gameLogic.checkGameEnd(events)

      const gameEnd = events.find((e: any) => e.type === EventTypes.GAME_END)
      expect(gameEnd).toBeDefined()
    })
  })
})
