/**
 * gameState.js - 游戏状态管理 (Vue 3 reactive store)
 */
import { reactive, computed } from 'vue'
import { INITIAL_MONEY } from '../config.js'

export function createGameState() {
  const state = reactive({
    players: [],
    currentPlayerIndex: 0,
    gameInProgress: false,
    selectingPlayerIndex: 0,
    propertyOwners: {}
  })

  function reset() {
    state.players = []
    state.currentPlayerIndex = 0
    state.gameInProgress = false
    state.selectingPlayerIndex = 0
    state.propertyOwners = {}
  }

  function addPlayer(character) {
    const player = {
      id: state.selectingPlayerIndex,
      name: `玩家${state.selectingPlayerIndex + 1}`,
      character: character,
      money: INITIAL_MONEY,
      position: 0,
      properties: [],
      inGame: true
    }
    state.players.push(player)
    state.selectingPlayerIndex++
    return player
  }

  function getCurrentPlayer() {
    return state.players[state.currentPlayerIndex]
  }

  function nextTurn() {
    if (state.players.length === 0) return null
    let nextIndex = state.currentPlayerIndex
    for (let i = 1; i <= state.players.length; i++) {
      const idx = (state.currentPlayerIndex + i) % state.players.length
      if (state.players[idx].inGame) {
        nextIndex = idx
        break
      }
    }
    state.currentPlayerIndex = nextIndex
    return getCurrentPlayer()
  }

  function getAlivePlayers() {
    return state.players.filter(p => p.inGame)
  }

  function setPropertyOwner(cellIndex, playerId) {
    state.propertyOwners[cellIndex] = playerId
  }

  function getPropertyOwner(cellIndex) {
    return state.propertyOwners[cellIndex] ?? null
  }

  function removePropertyOwners(playerId) {
    for (const cellIndex in state.propertyOwners) {
      if (state.propertyOwners[cellIndex] === playerId) {
        delete state.propertyOwners[cellIndex]
      }
    }
  }

  function getPlayerById(playerId) {
    return state.players.find(p => p.id === playerId)
  }

  return {
    state,
    reset,
    addPlayer,
    getCurrentPlayer,
    nextTurn,
    getAlivePlayers,
    setPropertyOwner,
    getPropertyOwner,
    removePropertyOwners,
    getPlayerById
  }
}
