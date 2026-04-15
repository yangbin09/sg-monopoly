<template>
  <div id="app">
    <StartScreen
      v-show="!gameState.state.gameInProgress"
      :class="{ hidden: gameState.state.gameInProgress }"
      :characters="characters"
      :selection-info="selectionInfo"
      @select="handleCharacterSelect"
    />
    <GameBoard
      v-show="gameState.state.gameInProgress"
      :players="gameState.state.players"
      :current-player-index="gameState.state.currentPlayerIndex"
      :cells="boardCells"
      :dice-result="diceResult"
      :messages="messages"
      :roll-button-enabled="rollButtonEnabled"
      :game-ended="gameEnded"
      @roll="handleRollDice"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { createGameState } from './stores/gameState.js'
import { useGameLogic, EventTypes } from './composables/useGameLogic.js'
import { characters, boardCells } from './config.js'
import StartScreen from './components/StartScreen.vue'
import GameBoard from './components/GameBoard.vue'

const gameState = createGameState()
const { selectCharacter, rollDice, nextTurnLogic } = useGameLogic(gameState)

const selectionInfo = ref('点击一个角色为玩家 1 选择英雄')
const diceResult = ref(0)
const messages = ref([])
const rollButtonEnabled = ref(false)
const gameEnded = ref(false)

function processEvents(events) {
  if (!events || !Array.isArray(events)) return
  for (const event of events) {
    switch (event.type) {
      case EventTypes.APPEND_MESSAGE:
        messages.value.push(event.payload)
        break
      case EventTypes.UPDATE_TOKENS:
        // Vue会自动响应
        break
      case EventTypes.UPDATE_SCOREBOARD:
        // Vue会自动响应
        break
      case EventTypes.SHOW_GAME:
        // 由 v-if 处理
        break
      case EventTypes.ROLL_BUTTON_ENABLED:
        rollButtonEnabled.value = event.payload
        break
      case EventTypes.UPDATE_DICE:
        diceResult.value = event.payload
        break
      case EventTypes.CLEAR_MESSAGE:
        messages.value = []
        break
      case EventTypes.GAME_END:
        gameEnded.value = true
        rollButtonEnabled.value = false
        break
      case 'UPDATE_SELECTION_INFO':
        selectionInfo.value = event.payload
        break
    }
  }
}

function handleCharacterSelect(character) {
  const events = selectCharacter(character, characters)
  processEvents(events)
}

function handleRollDice() {
  const events = rollDice()
  processEvents(events)
  // 延迟处理下一回合
  setTimeout(() => {
    const nextEvents = nextTurnLogic()
    processEvents(nextEvents)
  }, 500)
}
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
