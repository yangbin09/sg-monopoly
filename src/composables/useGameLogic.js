/**
 * useGameLogic.js - 游戏规则引擎 (Vue 3 composable)
 * 基于原有的 game-logic.js，保持相同的逻辑
 */
import { boardCells, events as eventConfig, START_BONUS } from '../config.js'

export const EventTypes = {
  APPEND_MESSAGE: 'APPEND_MESSAGE',
  UPDATE_TOKENS: 'UPDATE_TOKENS',
  UPDATE_SCOREBOARD: 'UPDATE_SCOREBOARD',
  SHOW_GAME: 'SHOW_GAME',
  ROLL_BUTTON_ENABLED: 'ROLL_BUTTON_ENABLED',
  GAME_END: 'GAME_END'
}

export function useGameLogic(gameState) {
  const { state, getCurrentPlayer, nextTurn, setPropertyOwner, getPropertyOwner, getPlayerById, getAlivePlayers, removePropertyOwners } = gameState

  function applySkill(player, action, context) {
    const char = player.character
    switch (char.skillType) {
      case 'rollDice':
        if (action === 'rollDice' && context.roll < char.skillMinRoll) {
          return {
            roll: context.roll + char.skillBonus,
            message: `${char.name}发动技能：点数 +1！`
          }
        }
        break
      case 'buyProperty':
        if (action === 'buyProperty') {
          return {
            moneyChange: char.skillBonus,
            message: `${char.name}发动技能：额外获得${char.skillBonus}金币！`
          }
        }
        break
      case 'payRent':
        if (action === 'payRent') {
          const reduction = Math.min(char.skillReduction, context.amount)
          return {
            amount: context.amount - reduction,
            message: `${char.name}发动技能：租金减少${reduction}金币！`
          }
        }
        break
      case 'event':
        if (action === 'event' && context.amount < 0) {
          return { cancel: true }
        }
        break
    }
    return null
  }

  function payMoney(from, to, amount, events) {
    if (!from.inGame) return
    from.money -= amount
    if (to) {
      to.money += amount
    }
    if (from.money < 0) {
      from.inGame = false
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${from.character.name}破产，退出游戏！` })
      removePropertyOwners(from.id)
      checkGameEnd(events)
    }
  }

  function checkGameEnd(events) {
    const alivePlayers = getAlivePlayers()
    if (alivePlayers.length <= 1) {
      state.gameInProgress = false
      if (alivePlayers.length === 1) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `游戏结束！${alivePlayers[0].character.name}获得胜利！` })
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: '游戏结束！所有玩家都破产。' })
      }
      events.push({ type: EventTypes.GAME_END })
    }
  }

  function handleCellAction(player, cellData, events) {
    switch (cellData.type) {
      case 'start':
        events.push({ type: EventTypes.UPDATE_SCOREBOARD })
        break
      case 'property':
        handleProperty(player, cellData, events)
        break
      case 'event':
        handleEvent(player, cellData, events)
        break
      case 'store':
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}抵达商店，但商店尚未营业。` })
        events.push({ type: EventTypes.UPDATE_SCOREBOARD })
        break
      case 'tax':
        handleTax(player, cellData, events)
        break
    }
  }

  function handleProperty(player, cellData, events) {
    const cellIndex = cellData.index ?? boardCells.indexOf(cellData)
    const ownerId = getPropertyOwner(cellIndex)
    if (!ownerId) {
      // 购买房产逻辑
      if (player.money >= cellData.cost) {
        player.money -= cellData.cost
        player.properties.push(cellData)
        setPropertyOwner(cellIndex, player.id)
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}购买了${cellData.name}！` })
        const skillResult = applySkill(player, 'buyProperty', {})
        if (skillResult && skillResult.message) {
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
        }
      } else {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}的资金不足，无法购买！` })
      }
    } else if (ownerId === player.id) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}抵达自己拥有的${cellData.name}。` })
    } else {
      const owner = getPlayerById(ownerId)
      let rent = cellData.rent
      const skillResult = applySkill(player, 'payRent', { amount: rent })
      if (skillResult) {
        rent = skillResult.amount
        if (skillResult.message) {
          events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
        }
      }
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}抵达${cellData.name}，需向${owner.character.name}支付租金¥${rent}。` })
      payMoney(player, owner, rent, events)
    }
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  function handleEvent(player, cellData, events) {
    const eventData = eventConfig[cellData.eventId]
    if (!eventData) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}，未知事件。` })
      events.push({ type: EventTypes.UPDATE_SCOREBOARD })
      return
    }
    let { amount, description } = eventData
    const skillResult = applySkill(player, 'event', { amount })
    if (skillResult && skillResult.cancel) {
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}，但技能免疫负面影响。` })
    } else {
      if (amount >= 0) {
        player.money += amount
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}：${description}` })
      } else {
        const loss = -amount
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}触发${cellData.name}：${description}` })
        payMoney(player, null, loss, events)
      }
    }
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  function handleTax(player, cellData, events) {
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}需要缴纳税收¥${cellData.amount}。` })
    payMoney(player, null, cellData.amount, events)
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
  }

  function movePlayer(player, steps, events) {
    const oldPos = player.position
    const newPos = (oldPos + steps) % boardCells.length
    if (newPos <= oldPos) {
      player.money += START_BONUS
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}经过起点，获得200金币！` })
    }
    player.position = newPos
    events.push({ type: EventTypes.UPDATE_TOKENS })
    handleCellAction(player, boardCells[newPos], events)
  }

  function selectCharacter(character, existingCharacters) {
    const events = []
    if (state.gameInProgress) {
      return events
    }
    const existingPlayer = state.players.find(p => p.character.id === character.id)
    if (existingPlayer) {
      events.push({
        type: EventTypes.APPEND_MESSAGE,
        payload: '该角色已被选择，请选其他英雄！'
      })
      return events
    }

    gameState.addPlayer(character)
    if (state.selectingPlayerIndex < 2) {
      const msg = `已选择 ${state.players.length} 名玩家，继续选择玩家 ${state.selectingPlayerIndex + 1} 的角色`
      events.push({ type: 'UPDATE_SELECTION_INFO', payload: msg })
    } else {
      events.push({ type: EventTypes.SHOW_GAME })
      startGame(events)
    }
    return events
  }

  function startGame(events) {
    state.gameInProgress = true
    events.push({ type: EventTypes.UPDATE_TOKENS })
    events.push({ type: EventTypes.UPDATE_SCOREBOARD })
    events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: true })
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: '游戏开始！玩家1先行动。' })
  }

  function rollDice() {
    const events = []
    if (!state.gameInProgress) return events

    events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: false })
    events.push({ type: EventTypes.CLEAR_MESSAGE })

    const player = getCurrentPlayer()
    if (!player || !player.inGame) {
      const nextEvents = nextTurnLogic()
      return nextEvents
    }

    let roll = Math.floor(Math.random() * 6) + 1
    const skillResult = applySkill(player, 'rollDice', { roll })
    if (skillResult) {
      roll = skillResult.roll
      if (skillResult.message) {
        events.push({ type: EventTypes.APPEND_MESSAGE, payload: skillResult.message })
      }
    }

    events.push({ type: EventTypes.UPDATE_DICE, payload: roll })
    events.push({ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name}掷出了${roll}点` })

    movePlayer(player, roll, events)

    return events
  }

  function nextTurnLogic() {
    const events = []
    if (!state.gameInProgress) return events
    events.push({ type: EventTypes.UPDATE_SCOREBOARD, payload: state.currentPlayerIndex })
    const nextPlayer = nextTurn()
    if (nextPlayer) {
      events.push({ type: EventTypes.ROLL_BUTTON_ENABLED, payload: true })
      events.push({ type: EventTypes.APPEND_MESSAGE, payload: `轮到${nextPlayer.character.name}行动。` })
    }
    return events
  }

  return {
    selectCharacter,
    startGame,
    rollDice,
    nextTurnLogic,
    applySkill,
    checkGameEnd,
    EventTypes
  }
}
