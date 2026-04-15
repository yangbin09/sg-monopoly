<template>
  <div id="app">
    <div class="settings-btn">
      <button @click="showSettings = true" title="设置">⚙️</button>
    </div>

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
      :is-ai-turn="isAITurn"
      :weather="gameState.state.weather"
      @roll="handleRollDice"
    />

    <Controls
      :dice-result="diceResult"
      :enabled="rollButtonEnabled && !gameEnded && !isAITurn"
      :is-ai-turn="isAITurn"
      :weather="gameState.state.weather"
      :player-items="currentPlayerItems"
      :show-store="showStore"
      @roll="handleRollDice"
      @open-store="showStore = true"
      @use-item="handleUseItem"
    />

    <MessageLog :messages="messages" />

    <StoreModal
      :show="showStore"
      :player="currentPlayer"
      :weather="gameState.state.weather"
      @close="showStore = false"
      @buy="handleBuyItem"
      @use="handleUseItem"
      @upgrade="handleUpgradeProperty"
    />

    <AchievementPanel
      :show="showAchievement"
      :achievement="currentAchievement"
      @dismiss="showAchievement = false"
    />

    <SettingsModal
      :show="showSettings"
      :game-state="gameState"
      :audio-options="audio.getOptions()"
      @close="showSettings = false"
      @apply="handleApplySettings"
      @save="handleSave"
      @load="handleLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { createGameState } from './stores/gameState'
import { useGameLogic, EventTypes } from './composables/useGameLogic'
import { useAI } from './composables/useAI'
import { useGameStorage } from './composables/useGameStorage'
import { useAchievements } from './composables/useAchievements'
import { useAudio } from './composables/useAudio'
import { characters, boardCells } from './config'
import StartScreen from './components/StartScreen.vue'
import GameBoard from './components/GameBoard.vue'
import Controls from './components/Controls.vue'
import MessageLog from './components/MessageLog.vue'
import SettingsModal from './components/SettingsModal.vue'
import StoreModal from './components/StoreModal.vue'
import AchievementPanel from './components/AchievementPanel.vue'
import type { SavedGame, Achievement } from './types/game'

const gameState = createGameState()
const { selectCharacter, rollDice, nextTurnLogic, buyItem, useItem, upgradeProperty, handleHuarongChoice } = useGameLogic(gameState)
const ai = useAI()
const storage = useGameStorage()
const achievements = useAchievements()
const audio = useAudio()

const selectionInfo = ref('点击一个角色为玩家 1 选择英雄')
const diceResult = ref(0)
const messages = ref<string[]>([])
const rollButtonEnabled = ref(false)
const gameEnded = ref(false)
const showSettings = ref(false)
const isAITurn = ref(false)
const showStore = ref(false)
const showAchievement = ref(false)
const currentAchievement = ref<Achievement | null>(null)

// Provide audio to child components
provide('audio', audio)

// Computed
const currentPlayer = computed(() => gameState.getCurrentPlayer())

const currentPlayerItems = computed(() => currentPlayer.value?.items ?? [])

// Process game events
function processEvents(events: any[]) {
  if (!events || !Array.isArray(events)) return
  for (const event of events) {
    switch (event.type) {
      case EventTypes.APPEND_MESSAGE:
        messages.value.push(event.payload)
        if (event.payload.includes('购买')) audio.play('buy')
        else if (event.payload.includes('破产')) audio.play('lose')
        else if (event.payload.includes('胜利')) audio.play('win')
        else if (event.payload.includes('触发')) audio.play('event')
        break
      case EventTypes.UPDATE_TOKENS:
        break
      case EventTypes.UPDATE_SCOREBOARD:
        break
      case EventTypes.SHOW_GAME:
        break
      case EventTypes.ROLL_BUTTON_ENABLED:
        rollButtonEnabled.value = event.payload
        break
      case EventTypes.UPDATE_DICE:
        diceResult.value = event.payload
        audio.play('dice')
        break
      case EventTypes.CLEAR_MESSAGE:
        messages.value = []
        break
      case EventTypes.GAME_END:
        gameEnded.value = true
        rollButtonEnabled.value = false
        break
      case EventTypes.SHOW_STORE:
        showStore.value = true
        break
      case EventTypes.HIDE_STORE:
        showStore.value = false
        break
      case EventTypes.BUY_ITEM:
        audio.play('buy')
        break
      case EventTypes.USE_ITEM:
        audio.play('event')
        break
      case EventTypes.SHOW_ACHIEVEMENT:
        showAchievement.value = true
        currentAchievement.value = event.payload.achievement
        setTimeout(() => {
          showAchievement.value = false
        }, 4000)
        audio.play('event')
        break
      case EventTypes.SHOW_CHOICE:
        // Handle choice events (华容道)
        // Simplified: auto-select first option
        setTimeout(() => {
          handleHuarongChoice(event.payload.playerId, event.payload.cellIndex, 0, [])
        }, 100)
        break
      case EventTypes.UPDATE_WEATHER:
        // Weather update notification could be shown here
        break
      case 'UPDATE_SELECTION_INFO':
        selectionInfo.value = event.payload
        break
    }
  }
}

function handleCharacterSelect(character: any) {
  audio.play('click')
  const events = selectCharacter(character, characters)
  processEvents(events)
}

function handleRollDice() {
  if (isAITurn.value || gameEnded.value) return

  audio.play('click')
  const events = rollDice()
  processEvents(events)

  setTimeout(() => {
    const nextEvents = nextTurnLogic()
    processEvents(nextEvents)
    checkAITurn()
  }, 500)
}

function checkAITurn() {
  const currentPlayerData = gameState.getCurrentPlayer()
  if (currentPlayerData && currentPlayerData.isAI) {
    isAITurn.value = true
    rollButtonEnabled.value = false
    executeAITurn()
  }
}

async function executeAITurn() {
  await ai.executeAITurn()
  const events = rollDice()
  processEvents(events)

  setTimeout(() => {
    const nextEvents = nextTurnLogic()
    processEvents(nextEvents)
    isAITurn.value = false
    checkAITurn()
  }, 500)
}

function handleBuyItem(itemId: string) {
  const player = currentPlayer.value
  if (!player) return

  const itemEvents = buyItem(player, itemId, [])
  processEvents(itemEvents)
}

function handleUseItem(itemId: string) {
  const player = currentPlayer.value
  if (!player) return

  const itemEvents = useItem(player, itemId, [])
  processEvents(itemEvents)
}

function handleUpgradeProperty(cellIndex: number) {
  const player = currentPlayer.value
  if (!player) return

  const upgradeEvents: any[] = []
  upgradeProperty(player, cellIndex, upgradeEvents)
  processEvents(upgradeEvents)
}

function handleApplySettings(newSettings: any) {
  audio.setVolume(newSettings.volume)
  audio.setMuted(newSettings.muted)
}

function handleSave() {
  storage.saveGame(
    gameState.state.players,
    gameState.state.currentPlayerIndex,
    gameState.state.propertyOwners,
    gameState.state.weather,
    gameState.state.turnCount,
    messages.value
  )
}

function handleLoad(saved: SavedGame) {
  gameState.state.players = saved.players
  gameState.state.currentPlayerIndex = saved.currentPlayerIndex
  gameState.state.propertyOwners = saved.propertyOwners
  gameState.state.weather = saved.weather
  gameState.state.turnCount = saved.turnCount
  gameState.state.messages = saved.messages ?? []
  gameState.state.gameInProgress = true
  rollButtonEnabled.value = true
}
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.settings-btn {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 100;
}

.settings-btn button {
  background: rgba(30, 25, 20, 0.9);
  border: 2px solid #d4a574;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-btn button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(212, 165, 116, 0.5);
}

@media (max-width: 768px) {
  #app {
    padding: 10px;
  }

  .settings-btn button {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .settings-btn {
    top: 10px;
    right: 10px;
  }

  .settings-btn button {
    width: 35px;
    height: 35px;
  }
}
</style>
