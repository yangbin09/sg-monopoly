import { describe, it, expect, beforeEach } from 'vitest'
import { createGameState } from './stores/gameState'

describe('GameState', () => {
  let gameState: ReturnType<typeof createGameState>

  const mockCharacter = {
    id: 'liu',
    name: '刘备',
    image: 'images/liu.webp',
    skill: '购买地产时获得50金币',
    skillType: 'buyProperty',
    skillBonus: 50
  }

  beforeEach(() => {
    gameState = createGameState()
  })

  describe('addPlayer', () => {
    it('should add a player correctly', () => {
      const player = gameState.addPlayer(mockCharacter)

      expect(player.id).toBe(0)
      expect(player.name).toBe('玩家1')
      expect(player.character.id).toBe('liu')
      expect(player.money).toBe(1000)
      expect(player.position).toBe(0)
      expect(player.properties).toEqual([])
      expect(player.inGame).toBe(true)
    })

    it('should increment player ID for multiple players', () => {
      gameState.addPlayer(mockCharacter)
      const player2 = gameState.addPlayer({ ...mockCharacter, id: 'guan', name: '关羽' })

      expect(player2.id).toBe(1)
      expect(player2.name).toBe('玩家2')
    })
  })

  describe('getCurrentPlayer', () => {
    it('should return current player', () => {
      gameState.addPlayer(mockCharacter)
      const current = gameState.getCurrentPlayer()

      expect(current?.id).toBe(0)
    })

    it('should return undefined when no players', () => {
      const current = gameState.getCurrentPlayer()
      expect(current).toBeUndefined()
    })
  })

  describe('nextTurn', () => {
    it('should advance to next player', () => {
      gameState.addPlayer(mockCharacter)
      gameState.addPlayer({ ...mockCharacter, id: 'guan', name: '关羽' })

      const first = gameState.getCurrentPlayer()
      expect(first?.id).toBe(0)

      gameState.nextTurn()
      const second = gameState.getCurrentPlayer()
      expect(second?.id).toBe(1)
    })

    it('should skip eliminated players', () => {
      gameState.addPlayer(mockCharacter)
      gameState.addPlayer({ ...mockCharacter, id: 'guan', name: '关羽' })

      gameState.state.players[0].inGame = false
      const next = gameState.nextTurn()

      expect(next?.id).toBe(1)
    })
  })

  describe('property ownership', () => {
    it('should set and get property owner', () => {
      gameState.addPlayer(mockCharacter)

      gameState.setPropertyOwner(1, 0)
      expect(gameState.getPropertyOwner(1)).toBe(0)
    })

    it('should return null for unowned property', () => {
      expect(gameState.getPropertyOwner(99)).toBeNull()
    })

    it('should remove property owners for eliminated player', () => {
      gameState.addPlayer(mockCharacter)
      gameState.setPropertyOwner(1, 0)
      gameState.setPropertyOwner(2, 0)

      gameState.removePropertyOwners(0)

      expect(gameState.getPropertyOwner(1)).toBeNull()
      expect(gameState.getPropertyOwner(2)).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset game state', () => {
      gameState.addPlayer(mockCharacter)
      gameState.state.gameInProgress = true
      gameState.setPropertyOwner(1, 0)

      gameState.reset()

      expect(gameState.state.players).toEqual([])
      expect(gameState.state.gameInProgress).toBe(false)
      expect(gameState.state.propertyOwners).toEqual({})
    })
  })
})
