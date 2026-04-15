<template>
  <div id="app">
    <div class="settings-btn">
      <button @click="showSettings = true" title="设置">⚙️</button>
    </div>

    <StartScreen
      v-show="!gameStore.gameInProgress"
      :class="{ hidden: gameStore.gameInProgress }"
      :characters="characters"
      :selection-info="selectionInfo"
      @select="handleCharacterSelect"
    />

    <GameBoard
      v-show="gameStore.gameInProgress"
      id="board"
      :players="gameStore.players"
      :current-player-index="gameStore.currentPlayerIndex"
      :cells="boardCells"
      :dice-result="gameStore.diceResult"
      :messages="gameStore.messages"
      :roll-button-enabled="gameStore.rollButtonEnabled"
      :game-ended="gameStore.gameEnded"
      :is-ai-turn="gameStore.isAITurn"
      :weather="gameStore.weather"
      @roll="handleRollDice"
    />

    <Controls
      :dice-result="gameStore.diceResult"
      :enabled="gameStore.rollButtonEnabled && !gameStore.gameEnded && !gameStore.isAITurn"
      :is-ai-turn="gameStore.isAITurn"
      :weather="gameStore.weather"
      :player-items="currentPlayerItems"
      :show-store="showStore"
      @roll="handleRollDice"
      @open-store="showStore = true"
      @use-item="handleUseItem"
    />

    <MessageLog :messages="gameStore.messages" />

    <StoreModal
      :show="showStore"
      :player="currentPlayer"
      :weather="gameStore.weather"
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
      @close="showSettings = false"
      @save="handleSave"
      @load="handleLoad"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from './stores/gameStore'
import { useGameLogic, EventTypes } from './composables/useGameLogic'
import { useAI, DEFAULT_AI_CONFIG } from './composables/useAI'
import { useGameStorage } from './composables/useGameStorage'
import { characters, boardCells } from './config'
import StartScreen from './components/StartScreen.vue'
import GameBoard from './components/GameBoard.vue'
import Controls from './components/Controls.vue'
import MessageLog from './components/MessageLog.vue'
import SettingsModal from './components/SettingsModal.vue'
import StoreModal from './components/StoreModal.vue'
import AchievementPanel from './components/AchievementPanel.vue'
import type { Character, SavedGame, Achievement, Player, Cell } from './types/game'

const gameStore = useGameStore()
const gameLogic = useGameLogic(gameStore)
const ai = useAI(DEFAULT_AI_CONFIG)
const storage = useGameStorage()

const selectionInfo = ref('点击一个角色为玩家 1 选择英雄')
const showSettings = ref(false)
const showStore = ref(false)
const showAchievement = ref(false)
const currentAchievement = ref<Achievement | null>(null)

// Computed
const currentPlayer = computed(() => gameStore.currentPlayer)
const currentPlayerItems = computed(() => currentPlayer.value?.items ?? [])

// Process game events
function processEvents(events: GameEvent[]) {
  if (!events || !Array.isArray(events)) return
  for (const event of events) {
    switch (event.type) {
      case EventTypes.APPEND_MESSAGE:
        if (typeof event.payload === 'string') {
          gameStore.addMessage(event.payload)
        }
        break
      case EventTypes.UPDATE_TOKENS:
        break
      case EventTypes.UPDATE_SCOREBOARD:
        break
      case EventTypes.SHOW_GAME:
        break
      case EventTypes.ROLL_BUTTON_ENABLED:
        gameStore.rollButtonEnabled = event.payload as boolean
        break
      case EventTypes.UPDATE_DICE:
        gameStore.diceResult = event.payload as number
        break
      case EventTypes.CLEAR_MESSAGE:
        gameStore.clearMessages()
        break
      case EventTypes.GAME_END:
        gameStore.gameEnded = true
        gameStore.rollButtonEnabled = false
        break
      case EventTypes.SHOW_STORE:
        showStore.value = true
        break
      case EventTypes.HIDE_STORE:
        showStore.value = false
        break
      case EventTypes.BUY_ITEM:
        break
      case EventTypes.USE_ITEM:
        break
      case EventTypes.SHOW_ACHIEVEMENT:
        showAchievement.value = true
        currentAchievement.value = (event.payload as { achievement: Achievement }).achievement
        setTimeout(() => {
          showAchievement.value = false
        }, 4000)
        break
      case EventTypes.SHOW_CHOICE:
        setTimeout(() => {
          gameLogic.handleHuarongChoice(
            (event.payload as { playerId: number; cellIndex: number }).playerId,
            (event.payload as { playerId: number; cellIndex: number }).cellIndex,
            0,
            []
          )
        }, 100)
        break
      case EventTypes.UPDATE_WEATHER:
        break
      case 'UPDATE_SELECTION_INFO':
        selectionInfo.value = event.payload as string
        break
    }
  }
}

function handleCharacterSelect(character: Character) {
  const events = gameLogic.selectCharacter(character, characters)
  processEvents(events)
}

function handleRollDice() {
  if (gameStore.isAITurn || gameStore.gameEnded || !gameStore.rollButtonEnabled) return

  const events = gameLogic.rollDice()
  processEvents(events)

  setTimeout(() => {
    const nextEvents = gameLogic.nextTurnLogic()
    processEvents(nextEvents)
    checkAITurn()
  }, 500)
}

function checkAITurn() {
  const player = gameStore.currentPlayer
  if (player?.isAI) {
    gameStore.isAITurn = true
    gameStore.rollButtonEnabled = false
    executeAITurn()
  }
}

async function executeAITurn() {
  const player = gameStore.currentPlayer
  if (!player) return

  // AI decision making
  const ctx = gameLogic.getGameContext()
  const cell = boardCells[player.position]
  const decision = ai.executeAITurn(player, ctx, cell)

  // Apply AI decision
  switch (decision.action) {
    case 'buy':
      if (cell.type === 'property' && cell.cost && player.money >= cell.cost) {
        player.money -= cell.cost
        player.properties.push({ ...cell, level: 0 })
        gameStore.setPropertyOwner(cell.index ?? 0, player.id, 0)
        gameStore.addMessage(`${player.character.name}购买了${cell.name}！`)
      }
      break
    case 'upgrade':
      if (decision.targetCell !== undefined) {
        gameLogic.upgradeProperty(player, decision.targetCell, [])
      }
      break
  }

  // Roll dice
  const events = gameLogic.rollDice()
  processEvents(events)

  setTimeout(() => {
    const nextEvents = gameLogic.nextTurnLogic()
    processEvents(nextEvents)
    gameStore.isAITurn = false
    checkAITurn()
  }, 500)
}

function handleBuyItem(itemId: string) {
  const player = currentPlayer.value
  if (!player) return
  const events = gameLogic.buyItem(player, itemId, [])
  processEvents(events)
}

function handleUseItem(itemId: string) {
  const player = currentPlayer.value
  if (!player) return
  const events = gameLogic.useItem(player, itemId, [])
  processEvents(events)
}

function handleUpgradeProperty(cellIndex: number) {
  const player = currentPlayer.value
  if (!player) return
  const events: GameEvent[] = []
  gameLogic.upgradeProperty(player, cellIndex, events)
  processEvents(events)
}

function handleSave() {
  storage.saveGame(
    gameStore.players,
    gameStore.currentPlayerIndex,
    Object.fromEntries(
      Object.entries(gameStore.propertyOwners).map(([k, v]) => [k, v.playerId])
    ) as Record<number, number>,
    gameStore.weather,
    gameStore.turnCount,
    gameStore.messages
  )
}

function handleLoad(saved: SavedGame) {
  gameStore.players = saved.players
  gameStore.currentPlayerIndex = saved.currentPlayerIndex
  for (const [cellIndex, playerId] of Object.entries(saved.propertyOwners)) {
    gameStore.setPropertyOwner(parseInt(cellIndex), playerId as number, 0)
  }
  gameStore.weather = saved.weather
  gameStore.turnCount = saved.turnCount
  gameStore.messages = saved.messages ?? []
  gameStore.gameInProgress = true
  gameStore.rollButtonEnabled = true
}

// Types
interface GameEvent {
  type: string
  payload?: unknown
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
