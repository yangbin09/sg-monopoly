<template>
  <div id="game" class="game">
    <Scoreboard
      :players="players"
      :current-player-index="currentPlayerIndex"
    />

    <div class="board-wrapper">
      <div id="board" class="board" :class="{ 'game-ended': gameEnded }">
        <div
          v-for="(row, rowIndex) in boardRows"
          :key="rowIndex"
          class="board-row"
        >
          <div
            v-for="cell in row"
            :key="cell ? cell.index : `empty-${rowIndex}-${$index}`"
            class="cell"
            :class="[cell ? cell.type : 'interior', { 'cell-animate': cell && shouldAnimate(cell.index) }]"
          >
            <template v-if="cell">
              <div class="cell-name">{{ cell.name }}</div>

              <div v-if="cell.type === 'property'" class="property-info">
                <div class="cell-cost">¥{{ cell.cost }}</div>
                <div v-if="cell.level && cell.level > 0" class="property-level">
                  {{ getLevelName(cell.level) }}
                </div>
              </div>

              <div v-else-if="cell.type === 'tax'" class="cell-cost">-¥{{ cell.amount }}</div>
              <div v-else-if="cell.type === 'store'" class="cell-cost store-label">商店</div>
              <div v-else-if="cell.type === 'treasure'" class="cell-icon">📦</div>
              <div v-else-if="cell.type === 'huarong'" class="cell-icon">⚔️</div>
              <div v-else-if="cell.type === 'recruit'" class="cell-icon">👥</div>
              <div v-else-if="cell.type === 'teleport_entry'" class="cell-icon">🌀</div>
              <div v-else-if="cell.type === 'teleport_exit'" class="cell-icon">🔄</div>
              <div v-else-if="cell.type === 'station'" class="cell-icon">🏨</div>
              <div v-else-if="cell.type === 'port'" class="cell-icon">⚓</div>
              <div v-else-if="cell.type === 'fate'" class="cell-icon">🎴</div>
              <div v-else-if="cell.type === 'obstacle'" class="cell-icon">🪨</div>
              <div v-else-if="cell.type === 'prison'" class="cell-icon">⛓️</div>

              <!-- 地形指示器 -->
              <div v-if="cell.terrain && cell.terrain !== 'normal'" class="terrain-indicator">
                {{ getTerrainIcon(cell.terrain) }}
              </div>

              <!-- 区域指示器 -->
              <div v-if="cell.area && cell.area !== 'neutral'" class="area-indicator" :class="'area-' + cell.area">
                {{ getAreaName(cell.area) }}
              </div>

              <div class="owner-indicator" v-if="getOwnerName(cell.index)">
                <span :class="'owner-' + getOwnerId(cell.index)">
                  {{ getOwnerName(cell.index) }}
                </span>
              </div>

              <div class="tokens">
                <img
                  v-for="player in getCellPlayers(cell.index)"
                  :key="player.id"
                  :src="player.character.image"
                  class="token"
                  :class="[`token-${player.id}`, { 'token-animate': lastMovedPlayer === player.id }]"
                  :style="getTokenStyle(player.id)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Dice Display -->
      <Transition name="dice-fade">
        <div v-if="diceResult > 0" class="dice-display">
          <div class="dice">{{ diceResult }}</div>
        </div>
      </Transition>
    </div>

    <!-- AI Turn Indicator -->
    <Transition name="fade">
      <div v-if="isAiTurn" class="ai-indicator">
        AI 正在思考...
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Scoreboard from './Scoreboard.vue'
import { boardCells, PROPERTY_LEVELS } from '../config'
import type { Player, PropertyLevel } from '../types/game'

const props = defineProps({
  players: {
    type: Array as () => Player[],
    required: true
  },
  currentPlayerIndex: {
    type: Number,
    required: true
  },
  cells: {
    type: Array,
    required: true
  },
  diceResult: {
    type: Number,
    default: 0
  },
  messages: {
    type: Array,
    default: () => []
  },
  rollButtonEnabled: {
    type: Boolean,
    default: false
  },
  gameEnded: {
    type: Boolean,
    default: false
  },
  isAiTurn: {
    type: Boolean,
    default: false
  },
  weather: {
    type: String,
    default: 'sunny'
  }
})

defineEmits(['roll'])

const lastMovedPlayer = ref<number | null>(null)
const animatedCells = ref<Set<number>>(new Set())

watch(() => props.players, (newPlayers, oldPlayers) => {
  if (oldPlayers) {
    newPlayers.forEach((player: any, index: number) => {
      const oldPlayer = oldPlayers[index]
      if (oldPlayer && oldPlayer.position !== player.position) {
        lastMovedPlayer.value = player.id
        animatedCells.value.add(player.position)
        setTimeout(() => {
          lastMovedPlayer.value = null
          animatedCells.value.delete(player.position)
        }, 500)
      }
    })
  }
}, { deep: true })

const boardRows = computed(() => {
  const rows = []
  for (let row = 0; row < 5; row++) {
    const rowCells = []
    for (let col = 0; col < 5; col++) {
      const cellIndex = computeCellIndex(row, col)
      if (cellIndex !== null) {
        rowCells.push({ ...boardCells[cellIndex], index: cellIndex })
      } else {
        rowCells.push(null)
      }
    }
    rows.push(rowCells)
  }
  return rows
})

function computeCellIndex(row: number, col: number): number | null {
  if (row === 4) {
    return col
  } else if (col === 4) {
    if (row >= 1 && row <= 3) {
      return 4 + (4 - row)
    }
  } else if (row === 0) {
    return 8 + (4 - col)
  } else if (col === 0) {
    if (row >= 1 && row <= 3) {
      return 12 + row
    }
  }
  return null
}

function getCellPlayers(cellIndex: number) {
  return props.players.filter((p: any) => p.inGame && p.position === cellIndex)
}

function shouldAnimate(cellIndex: number) {
  return animatedCells.value.has(cellIndex)
}

function getTokenStyle(playerId: number) {
  const player = props.players.find((p: any) => p.id === playerId)
  if (player && lastMovedPlayer.value === playerId) {
    return {
      animation: 'tokenBounce 0.5s ease-out'
    }
  }
  return {}
}

function getLevelName(level: PropertyLevel): string {
  return PROPERTY_LEVELS[level]?.name ?? ''
}

function getTerrainIcon(terrain?: string): string {
  if (!terrain) return ''
  const icons: Record<string, string> = {
    mountain: '⛰️',
    water: '🌊',
    castle: '🏯',
    wasteland: '🏜️'
  }
  return icons[terrain] ?? ''
}

function getAreaName(area?: string): string {
  if (!area) return ''
  const names: Record<string, string> = {
    wei: '魏',
    shu: '蜀',
    wu: '吴',
    neutral: ''
  }
  return names[area] ?? ''
}

function getOwnerName(cellIndex: number): string | null {
  const cell = boardCells[cellIndex]
  if (cell?.type !== 'property') return null

  for (const player of props.players) {
    const owned = player.properties.some((p: any) => p.index === cellIndex)
    if (owned) {
      return player.character.name[0]
    }
  }
  return null
}

function getOwnerId(cellIndex: number): number | null {
  for (const player of props.players) {
    const owned = player.properties.some((p: any) => p.index === cellIndex)
    if (owned) {
      return player.id
    }
  }
  return null
}
</script>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  width: 100%;
  max-width: 700px;
}

.board-wrapper {
  position: relative;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 0;
  background-image: url('images/board_background.webp');
  background-size: cover;
  background-position: center;
  border: 4px solid #d4a574;
  border-radius: 8px;
  padding: 10px;
  transition: opacity 0.3s ease;
}

.board.game-ended {
  opacity: 0.7;
  pointer-events: none;
}

.board-row {
  display: flex;
}

.cell {
  width: var(--cell-size, 80px);
  height: var(--cell-size, 80px);
  border: 1px solid #5a4a3a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  position: relative;
  background: rgba(20, 15, 10, 0.85);
  transition: all 0.3s ease;
}

.cell.cell-animate {
  animation: cellHighlight 0.5s ease-out;
}

.cell.interior {
  background: transparent;
  border: none;
}

.cell.start {
  background: rgba(212, 165, 116, 0.3);
}

.cell.property {
  background: rgba(100, 150, 100, 0.2);
}

.cell.event {
  background: rgba(150, 100, 100, 0.2);
}

.cell.tax {
  background: rgba(200, 100, 100, 0.2);
}

.cell.store {
  background: rgba(100, 100, 200, 0.2);
}

.cell.treasure {
  background: rgba(255, 215, 0, 0.15);
}

.cell.huarong {
  background: rgba(139, 69, 19, 0.3);
}

.cell.recruit {
  background: rgba(60, 179, 113, 0.2);
}

.cell.teleport_entry,
.cell.teleport_exit {
  background: rgba(138, 43, 226, 0.2);
}

.cell.station {
  background: rgba(139, 69, 19, 0.3);
}

.cell.port {
  background: rgba(30, 144, 255, 0.2);
}

.cell.fate {
  background: rgba(147, 112, 219, 0.2);
}

.cell.obstacle {
  background: rgba(105, 105, 105, 0.3);
}

.cell.prison {
  background: rgba(128, 128, 128, 0.3);
}

/* 地形样式 */
.cell.terrain-mountain {
  border-color: #8b4513 !important;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.3) 0%, rgba(20, 15, 10, 0.85) 100%);
}

.cell.terrain-water {
  border-color: #1e90ff !important;
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.3) 0%, rgba(20, 15, 10, 0.85) 100%);
}

.cell.terrain-castle {
  border-color: #ffd700 !important;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(20, 15, 10, 0.85) 100%);
}

.cell.terrain-wasteland {
  border-color: #d2691e !important;
  background: linear-gradient(135deg, rgba(210, 105, 30, 0.3) 0%, rgba(20, 15, 10, 0.85) 100%);
}

.cell-name {
  color: #d4a574;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  padding: 2px;
}

.property-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.cell-cost {
  color: #ffcc00;
  font-size: 0.6rem;
}

.store-label {
  color: #6a8aaf;
}

.property-level {
  font-size: 0.55rem;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
  padding: 1px 4px;
  border-radius: 3px;
}

.cell-icon {
  font-size: 1rem;
}

.terrain-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.7rem;
}

.area-indicator {
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 0.5rem;
  padding: 1px 3px;
  border-radius: 2px;
}

.area-indicator.area-wei { background: rgba(255, 0, 0, 0.3); color: #ff6b6b; }
.area-indicator.area-shu { background: rgba(0, 255, 0, 0.3); color: #6bff6b; }
.area-indicator.area-wu { background: rgba(0, 0, 255, 0.3); color: #6b6bff; }

.owner-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.5rem;
  padding: 1px 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.5);
}

.owner-0 { color: #ff6b6b; }
.owner-1 { color: #4ecdc4; }
.owner-2 { color: #ffe66d; }
.owner-3 { color: #a8e6cf; }

.tokens {
  position: absolute;
  bottom: 2px;
  display: flex;
  gap: 2px;
}

.token {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #fff;
  transition: all 0.3s ease;
}

.token.token-animate {
  animation: tokenBounce 0.5s ease-out;
}

/* Dice Display */
.dice-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.dice {
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: diceRoll 0.5s ease-out;
}

/* AI Indicator */
.ai-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(30, 25, 20, 0.95);
  border: 2px solid #d4a574;
  border-radius: 12px;
  padding: 20px 40px;
  color: #d4a574;
  font-size: 1.2rem;
  z-index: 100;
  animation: pulse 1.5s infinite;
}

/* Transitions */
.dice-fade-enter-active,
.dice-fade-leave-active {
  transition: all 0.3s ease;
}

.dice-fade-enter-from,
.dice-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Animations */
@keyframes tokenBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes cellHighlight {
  0% { box-shadow: inset 0 0 0 0 rgba(255, 204, 0, 0); }
  50% { box-shadow: inset 0 0 20px 5px rgba(255, 204, 0, 0.5); }
  100% { box-shadow: inset 0 0 0 0 rgba(255, 204, 0, 0); }
}

@keyframes diceRoll {
  0% { transform: rotate(-10deg) scale(0.8); }
  50% { transform: rotate(10deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Responsive Design */
@media (max-width: 600px) {
  .game {
    padding: 10px;
    gap: 15px;
  }

  .cell {
    --cell-size: 60px;
    font-size: 0.55rem;
  }

  .token {
    width: 16px;
    height: 16px;
  }

  .cell-name {
    font-size: 0.5rem;
  }

  .cell-cost {
    font-size: 0.5rem;
  }

  .dice {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

@media (max-width: 400px) {
  .cell {
    --cell-size: 50px;
    border-width: 0.5px;
  }

  .token {
    width: 14px;
    height: 14px;
  }
}
</style>
