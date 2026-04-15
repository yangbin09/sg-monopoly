<template>
  <div id="app">
    <div class="settings-btn">
      <button @click="showSettings = true" title="设置">⚙️</button>
      <button @click="showHelp = true" title="帮助">❓</button>
    </div>

    <!-- Help Overlay -->
    <Transition name="fade">
      <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
        <div class="help-panel">
          <div class="help-header">
            <h2>🎮 游戏帮助</h2>
            <button class="close-btn" @click="showHelp = false">×</button>
          </div>
          <div class="help-content">
            <div class="help-section">
              <h3>快捷键</h3>
              <ul>
                <li><kbd>空格</kbd> - 掷骰子</li>
                <li><kbd>E</kbd> - 结束回合</li>
                <li><kbd>S</kbd> - 打开商店</li>
                <li><kbd>Esc</kbd> - 关闭弹窗</li>
                <li><kbd>?</kbd> - 显示/隐藏帮助</li>
              </ul>
            </div>
            <div class="help-section">
              <h3>游戏目标</h3>
              <p>通过购买地产、收取租金、击败对手，最终成为最富有的玩家！</p>
            </div>
            <div class="help-section">
              <h3>操作提示</h3>
              <ul>
                <li>点击无主地产可购买</li>
                <li>点击己方地产可升级</li>
                <li>点击己方棋子所在格子打开操作面板</li>
                <li>使用传送符可传送到任意己方地产</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Start Screen -->
    <StartScreen
      v-show="!gameState.state.gameInProgress"
      :class="{ hidden: gameState.state.gameInProgress }"
      :characters="characters"
      :selection-info="selectionInfo"
      @select="handleCharacterSelect"
    />

    <!-- Main Game Board -->
    <GameBoard
      v-show="gameState.state.gameInProgress"
      :players="gameState.state.players"
      :current-player-index="gameState.state.currentPlayerIndex"
      :cells="boardCells"
      :dice-result="diceResult"
      :is-rolling="isRolling"
      :messages="messages"
      :roll-button-enabled="rollButtonEnabled"
      :game-ended="gameEnded"
      :is-ai-turn="isAITurn"
      :weather="gameState.state.weather"
      @roll="handleRollDice"
      @cell-click="handleCellClick"
    />

    <!-- Bottom Controls -->
    <Controls
      :dice-result="diceResult"
      :enabled="rollButtonEnabled && !gameEnded && !isAITurn"
      :is-ai-turn="isAITurn"
      :weather="gameState.state.weather"
      :player-items="currentPlayerItems"
      :player-buff="currentPlayerBuff"
      :player-debuff="currentPlayerDebuff"
      :frozen-turns="currentPlayerFrozen"
      :show-store="showStore"
      :dice-history="diceHistory"
      @roll="handleRollDice"
      @open-store="showStore = true"
      @use-item="handleUseItem"
      @end-turn="handleEndTurn"
    />

    <MessageLog :messages="messages" />

    <!-- Modals -->
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

    <!-- Choice Modal (华容道/事件决策) -->
    <ChoiceModal
      :show="showChoice"
      :title="choiceTitle"
      :subtitle="choiceSubtitle"
      :options="choiceOptions"
      :show-cancel="choiceShowCancel"
      @select="handleChoiceSelect"
      @cancel="handleChoiceCancel"
    />

    <!-- Property Action Panel (点击己方地产) -->
    <PropertyActionPanel
      :show="showPropertyAction"
      :property="selectedProperty"
      :player-money="currentPlayer?.money ?? 0"
      @close="showPropertyAction = false"
      @upgrade="handleUpgradeFromPanel"
    />

    <!-- Teleport Picker (传送目标选择) -->
    <TeleportPicker
      :show="showTeleportPicker"
      :properties="currentPlayerProperties"
      @select="handleTeleportSelect"
      @cancel="showTeleportPicker = false"
    />

    <!-- Buy Confirm Modal (购买确认) -->
    <BuyConfirmModal
      :show="showBuyConfirm"
      :cell="pendingBuyCell"
      :player-money="currentPlayer?.money ?? 0"
      :skill-bonus="skillBonusForBuy"
      @confirm="confirmBuyProperty"
      @cancel="cancelBuyProperty"
    />

    <!-- Boss Battle Modal -->
    <div v-if="showBossModal" class="modal-overlay" @click.self="showBossModal = false">
      <div class="boss-modal">
        <div class="boss-header">
          <h2>👹 挑战 BOSS: {{ currentBoss?.bossName }}</h2>
        </div>
        <div class="boss-content">
          <div class="boss-icon">{{ currentBoss?.icon }}</div>
          <p>区域: {{ currentBoss?.name }}</p>
          <div class="hp-bar-container">
            <div class="hp-bar" :style="{ width: `${(currentBoss?.bossHp / currentBoss?.bossMaxHp) * 100}%` }"></div>
            <span class="hp-text">{{ currentBoss?.bossHp }} / {{ currentBoss?.bossMaxHp }}</span>
          </div>
          <p>击败奖励: 💰 {{ currentBoss?.defeatReward }} 金币</p>
        </div>
        <div class="boss-actions">
          <button class="action-btn attack-btn" @click="handleAttackBoss">发起攻击</button>
          <button class="action-btn cancel-btn" @click="showBossModal = false">撤退</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch, toRef } from 'vue'
import { createGameState } from './stores/gameState'
import { useGameLogic, EventTypes } from './composables/useGameLogic'
import { useAI } from './composables/useAI'
import { useGameStorage } from './composables/useGameStorage'
import { useAchievements } from './composables/useAchievements'
import { useAudio } from './composables/useAudio'
import { characters, boardCells, BOSS_LAIRS } from './config'
import StartScreen from './components/StartScreen.vue'
import GameBoard from './components/GameBoard.vue'
import Controls from './components/Controls.vue'
import MessageLog from './components/MessageLog.vue'
import SettingsModal from './components/SettingsModal.vue'
import StoreModal from './components/StoreModal.vue'
import AchievementPanel from './components/AchievementPanel.vue'
import ChoiceModal from './components/ChoiceModal.vue'
import PropertyActionPanel from './components/PropertyActionPanel.vue'
import TeleportPicker from './components/TeleportPicker.vue'
import BuyConfirmModal from './components/BuyConfirmModal.vue'
import type { SavedGame, Achievement, GameEvent, Character, Cell, BossLair, MapLayer } from './types/game'
import type { ChoiceOption } from './components/ChoiceModal.vue'
import { useGameStore } from './stores/gameStore'

const gameStore = useGameStore()
const gameState = createGameState()

// 同步 gameStore 的玩家数据源到 gameState
gameStore.setPlayersSource(toRef(gameState.state as any, 'players') as any)

const { selectCharacter, rollDice, nextTurnLogic, buyItem, useItem, upgradeProperty, confirmPropertyBuy, handleHuarongChoice, applySkill } = useGameLogic(gameState)
const ai = useAI()
const storage = useGameStorage()
const achievements = useAchievements()
const audio = useAudio()

const selectionInfo = ref('点击一个角色为玩家 1 选择英雄')
const diceResult = ref(0)
const isRolling = ref(false)
const messages = ref<string[]>([])
const rollButtonEnabled = ref(false)
const gameEnded = ref(false)
const showSettings = ref(false)
const isAITurn = ref(false)
const showStore = ref(false)
const showAchievement = ref(false)
const currentAchievement = ref<Achievement | null>(null)

const showBossModal = ref(false)
const currentBoss = ref<BossLair | null>(null)
const currentBossPlayerId = ref<number | null>(null)

// Choice Modal state
const showChoice = ref(false)
const choiceTitle = ref('')
const choiceSubtitle = ref('')
const choiceOptions = ref<ChoiceOption[]>([])
const choiceShowCancel = ref(false)
const pendingChoiceCallback = ref<((index: number) => void) | null>(null)

// Property Action Panel state
const showPropertyAction = ref(false)
const selectedProperty = ref<Cell | null>(null)

// Teleport Picker state
const showTeleportPicker = ref(false)
const pendingTeleportCallback = ref<((cellIndex: number) => void) | null>(null)

// Buy Confirm Modal state
const showBuyConfirm = ref(false)
const pendingBuyCell = ref<Cell | null>(null)
const pendingBuyCallback = ref<(() => void) | null>(null)
const pendingBuyData = ref<{ playerId: number; cellIndex: number } | null>(null)
const skillBonusForBuy = ref(0)

// Dice History
const diceHistory = ref<number[]>([])

// Help overlay
const showHelp = ref(false)

// Computed
const currentPlayer = computed(() => gameState.getCurrentPlayer())
const currentPlayerItems = computed(() => currentPlayer.value?.items ?? [])
const currentPlayerProperties = computed(() => currentPlayer.value?.properties ?? [])

const currentPlayerBuff = computed(() => {
  const player = currentPlayer.value
  if (!player) return []
  return player.activeBuffs.filter(b => b.type === 'luck' || b.type === 'speed' || b.type === 'shield')
})

const currentPlayerDebuff = computed(() => {
  const player = currentPlayer.value
  if (!player) return []
  return player.activeBuffs.filter(b => b.type === 'curse' || b.type === 'freeze')
})

const currentPlayerFrozen = computed(() => currentPlayer.value?.frozenTurns ?? 0)

// Provide audio to child components
provide('audio', audio)

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  // 如果有模态框打开，忽略快捷键
  if (showStore.value || showChoice.value || showBuyConfirm.value || showPropertyAction.value || showTeleportPicker.value) {
    if (e.key === 'Escape') {
      showStore.value = false
      showChoice.value = false
      showBuyConfirm.value = false
      showPropertyAction.value = false
      showTeleportPicker.value = false
    }
    return
  }

  // 游戏未开始时不处理游戏快捷键
  if (!gameState.state.gameInProgress) return

  switch (e.key) {
    case ' ': // 空格键 - 掷骰子
      e.preventDefault()
      if (rollButtonEnabled.value && !isAITurn.value && !gameEnded.value) {
        handleRollDice()
      }
      break
    case 'e':
    case 'E':
      if (!isAITurn.value && !gameEnded.value) {
        handleEndTurn()
      }
      break
    case 's':
    case 'S':
      if (!isAITurn.value && !gameEnded.value) {
        showStore.value = true
      }
      break
    case '?':
      showHelp.value = !showHelp.value
      break
  }
}

// 挂载键盘监听
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}

// Process game events
function processEvents(events: GameEvent[]) {
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
        diceHistory.value.unshift(event.payload)
        if (diceHistory.value.length > 5) diceHistory.value.pop()
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
        handleShowChoice(event.payload)
        break
      case EventTypes.SHOW_BUY_CONFIRM:
        handleShowBuyConfirm(event.payload)
        break
      case EventTypes.SHOW_BOSS:
        currentBoss.value = event.payload.boss
        currentBossPlayerId.value = event.payload.playerId
        showBossModal.value = true
        audio.play('event')
        break
      case EventTypes.LAYER_TRANSITION:
        break
      case 'UPDATE_SELECTION_INFO':
        selectionInfo.value = event.payload
        break
    }
  }
}

// 处理 SHOW_CHOICE 事件 - 弹出选择框
function handleShowChoice(payload: { options: { text: string; result: string }[]; cellIndex?: number; playerId?: number }) {
  choiceTitle.value = '⚔️ 做出选择'
  choiceSubtitle.value = '请选择一项行动'
  choiceOptions.value = payload.options.map(opt => ({
    text: opt.text,
    description: opt.result,
    effect: opt.effect || {}
  }))
  choiceShowCancel.value = false
  showChoice.value = true

  // 保存选择上下文
  pendingChoiceCallback.value = (index: number) => {
    // 华容道选择后处理
    const playerId = payload.playerId ?? currentPlayer.value?.id
    if (playerId !== undefined && payload.cellIndex !== undefined) {
      // 调用华容道选择处理
      const ctx = { players: gameState.state.players, currentPlayerIndex: gameState.state.currentPlayerIndex, weather: gameState.state.weather, turnCount: gameState.state.turnCount }
      const events: GameEvent[] = []
      // 处理选择效果
      const option = payload.options[index]
      if (option?.effect?.amount !== undefined) {
        const player = gameState.getPlayerById(playerId)
        if (player) {
          if (option.effect.amount >= 0) {
            player.money += option.effect.amount
            messages.value.push(`${player.character.name}选择获得${option.effect.amount}金币`)
          } else {
            player.money += option.effect.amount // 负数就是减少
            messages.value.push(`${player.character.name}选择损失${-option.effect.amount}金币`)
          }
        }
      }
      processEvents(events)
    }
    showChoice.value = false
  }
}

function handleChoiceSelect(index: number) {
  showChoice.value = false
  if (pendingChoiceCallback.value) {
    pendingChoiceCallback.value(index)
    pendingChoiceCallback.value = null
  }
}

function handleChoiceCancel() {
  showChoice.value = false
  pendingChoiceCallback.value = null
}

function handleShowBuyConfirm(payload: { playerId: number; cell: Cell; cellIndex: number }) {
  const player = gameState.getPlayerById(payload.playerId)
  if (!player) return

  // 计算技能加成
  const skillResult = applySkill(player, 'buyProperty', {})
  skillBonusForBuy.value = skillResult?.moneyChange ?? 0

  pendingBuyCell.value = payload.cell
  pendingBuyData.value = { playerId: payload.playerId, cellIndex: payload.cellIndex }
  pendingBuyCallback.value = () => {
    const events: GameEvent[] = []
    confirmPropertyBuy(payload.playerId, payload.cellIndex, payload.cell, events)
    processEvents(events)
    showBuyConfirm.value = false
    pendingBuyCallback.value = null
    pendingBuyData.value = null
  }
  showBuyConfirm.value = true
}

function handleCharacterSelect(character: Character) {
  audio.play('click')
  const events = selectCharacter(character, characters)
  processEvents(events)
}

function handleRollDice() {
  if (isAITurn.value || gameEnded.value) return

  audio.play('click')
  isRolling.value = true

  const events = rollDice()
  processEvents(events)

  setTimeout(() => {
    isRolling.value = false
    const nextEvents = nextTurnLogic()
    processEvents(nextEvents)
    checkAITurn()
  }, 500)
}

function handleEndTurn() {
  if (isAITurn.value || gameEnded.value) return
  const nextEvents = nextTurnLogic()
  processEvents(nextEvents)
  checkAITurn()
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
  const player = currentPlayer.value
  if (!player) {
    isAITurn.value = false
    return
  }

  isRolling.value = true

  // AI掷骰子
  const events = rollDice()
  processEvents(events)

  // 延迟后获取AI决策并执行
  setTimeout(() => {
    const currentCell = boardCells[player.position]
    const ctx = {
      players: gameState.state.players,
      currentPlayerIndex: gameState.state.currentPlayerIndex,
      weather: gameState.state.weather,
      turnCount: gameState.state.turnCount
    }

    // 获取AI决策
    const decision = ai.executeAITurn(player, ctx, currentCell)

    // 根据AI决策执行相应动作
    switch (decision.action) {
      case 'buy':
        if (decision.targetCell !== undefined) {
          const cell = boardCells[decision.targetCell]
          if (cell && cell.type === 'property') {
            // AI购买地产
            const buyEvents: GameEvent[] = []
            buyItem(player, cell.name, buyEvents)
          }
        }
        break
      case 'upgrade':
        if (decision.targetCell !== undefined) {
          const upgradeEvents: GameEvent[] = []
          upgradeProperty(player, decision.targetCell, upgradeEvents)
          processEvents(upgradeEvents)
        }
        break
      case 'use_item':
        if (decision.itemId) {
          const itemEvents: GameEvent[] = []
          useItem(player, decision.itemId, itemEvents)
          processEvents(itemEvents)
        }
        break
    }

    // 结束AI回合
    const nextEvents = nextTurnLogic()
    processEvents(nextEvents)
    isRolling.value = false
    isAITurn.value = false
    checkAITurn()
  }, 800)
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

  // 检查是否是传送符
  const item = player.items.find(i => i.id === itemId)
  if (item?.type === 'teleport') {
    showTeleportPicker.value = true
    pendingTeleportCallback.value = (targetCellIndex: number) => {
      showTeleportPicker.value = false
      // 执行传送
      player.position = targetCellIndex
      const cell = boardCells[targetCellIndex]
      messages.value.push(`${player.character.name}使用传送符，传送到${cell.name}！`)
      // 移除道具
      const idx = player.items.findIndex(i => i.id === itemId)
      if (idx !== -1) player.items.splice(idx, 1)
    }
    return
  }

  const itemEvents = useItem(player, itemId, [])
  processEvents(itemEvents)
}

function handleUpgradeProperty(cellIndex: number) {
  const player = currentPlayer.value
  if (!player) return
  const upgradeEvents: GameEvent[] = []
  upgradeProperty(player, cellIndex, upgradeEvents)
  processEvents(upgradeEvents)
  showStore.value = false
}

function handleUpgradeFromPanel(cellIndex: number) {
  handleUpgradeProperty(cellIndex)
  showPropertyAction.value = false
}

function handleTeleportSelect(cellIndex: number) {
  if (pendingTeleportCallback.value) {
    pendingTeleportCallback.value(cellIndex)
    pendingTeleportCallback.value = null
  }
  showTeleportPicker.value = false
}

function handleCellClick(cell: Cell) {
  const player = currentPlayer.value
  if (!player) return

  // 层级切换
  if (cell.type === 'layer_stairs_up' || cell.type === 'layer_stairs_down') {
    if (cell.layerTransition) {
      const success = gameStore.changeLayer(player.id, cell.layerTransition.targetLayer, cell.layerTransition.targetCell, cell.layerTransition.cost)
      if (success) {
        processEvents([{ type: EventTypes.APPEND_MESSAGE, payload: `${player.character.name} 支付了 ${cell.layerTransition.cost || 0} 金币，移动到了 ${cell.layerTransition.targetLayer}!` }])
      } else {
        processEvents([{ type: EventTypes.APPEND_MESSAGE, payload: `金币不足，无法前往 ${cell.layerTransition.targetLayer}!` }])
      }
    }
    return
  }

  // 如果点击的是自己所在格子且是自己的地产，显示操作面板
  if (player.position === cell.index) {
    const ownedProperty = player.properties.find(p => p.index === cell.index)
    if (ownedProperty) {
      selectedProperty.value = ownedProperty
      showPropertyAction.value = true
      return
    }
  }

  // 如果是无主地产且玩家可以购买，显示购买确认
  if (cell.type === 'property') {
    const ownerId = gameState.getPropertyOwner(cell.index ?? 0)
    if (!ownerId && cell.cost && player.money >= cell.cost * 0.5) {
      // 计算技能加成
      const skillResult = applySkill(player, 'buyProperty', {})
      skillBonusForBuy.value = skillResult?.moneyChange ?? 0

      pendingBuyCell.value = cell
      pendingBuyCallback.value = () => {
        if (cell.cost && player.money >= cell.cost) {
          player.money -= cell.cost
          const newCell = { ...cell, level: 0 }
          player.properties.push(newCell)
          gameState.setPropertyOwner(cell.index ?? 0, player.id, 0)
          messages.value.push(`${player.character.name}购买了${cell.name}！`)
          if (skillBonusForBuy.value > 0) {
            player.money += skillBonusForBuy.value
            messages.value.push(`技能加成: +¥${skillBonusForBuy.value}`)
          }
        }
        showBuyConfirm.value = false
        pendingBuyCallback.value = null
      }
      showBuyConfirm.value = true
      return
    }
  }
}

function confirmBuyProperty() {
  if (pendingBuyCallback.value) {
    pendingBuyCallback.value()
  }
}

function cancelBuyProperty() {
  showBuyConfirm.value = false
  pendingBuyCallback.value = null
  pendingBuyCell.value = null
  pendingBuyData.value = null
}

function handleAttackBoss() {
  if (!currentBoss.value || currentBossPlayerId.value === null) return

  const bossId = currentBoss.value.id
  const result = gameStore.defeatBoss(currentBossPlayerId.value, bossId)

  showBossModal.value = false
  processEvents([{ type: EventTypes.APPEND_MESSAGE, payload: result.message }])
}

function handleApplySettings(newSettings: { volume: number; muted: boolean }) {
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
  background-color: #1a1a2e;
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

.settings-btn button + button {
  margin-left: 8px;
}

.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.help-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.help-header h2 {
  color: #d4a574;
  margin: 0;
}

.help-content {
  color: #ccc;
}

.help-section {
  margin-bottom: 20px;
}

.help-section h3 {
  color: #d4a574;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.help-section ul {
  margin: 0;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 6px;
}

.help-section p {
  margin: 0;
  line-height: 1.5;
}

kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 8px;
  font-family: monospace;
  color: #fff;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.boss-modal {
  background: linear-gradient(135deg, #2a0800 0%, #1a0500 100%);
  border: 2px solid #ff4444;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
}

.boss-header h2 {
  color: #ff4444;
  margin-top: 0;
}

.boss-icon {
  font-size: 4rem;
  margin: 10px 0;
  animation: float 2s infinite;
}

.hp-bar-container {
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 10px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
}

.hp-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff0000, #ff4444);
  transition: width 0.3s ease;
}

.hp-text {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 0.8rem;
  font-weight: bold;
}

.boss-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.action-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-btn:hover { transform: scale(1.05); }
.attack-btn { background: #ff4444; color: white; }
.cancel-btn { background: #555; color: white; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 768px) {
  #app { padding: 10px; }
  .settings-btn button { width: 38px; height: 38px; font-size: 1rem; }
}

@media (max-width: 480px) {
  .settings-btn { top: 10px; right: 10px; }
  .settings-btn button { width: 35px; height: 35px; }
}
</style>
