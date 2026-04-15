<template>
  <div id="game" class="game" :class="[seasonClass, timeOfDayClass]">
    <!-- Top Bar: Status & Scoreboard -->
    <div class="game-header">
      <div class="environment-status">
        <div class="status-pill season" :title="currentSeasonEffect?.specialEffect">
          <span class="icon">{{ currentSeasonEffect?.icon }}</span>
          <span class="text">{{ currentSeasonEffect?.name }}</span>
        </div>
        <div class="status-pill time" :title="'额外收入: ' + currentTimeEffect?.incomeBonus">
          <span class="icon">{{ currentTimeEffect?.icon }}</span>
          <span class="text">{{ currentTimeEffect?.name }}</span>
        </div>
        <div class="status-pill weather" :title="weatherDesc">
          <span class="icon">{{ weatherIcon }}</span>
          <span class="text">{{ weatherText }}</span>
        </div>
      </div>
      <Scoreboard
        :players="players"
        :current-player-index="currentPlayerIndex"
      />
    </div>

    <!-- Main Board Area -->
    <div class="board-wrapper">
      <div id="board" class="board" :class="{ 'game-ended': gameEnded }">
        <div
          v-for="(row, rowIndex) in boardRows"
          :key="rowIndex"
          class="board-row"
        >
          <div
            v-for="cell in row"
            :key="cell.index"
            class="cell"
            :class="[
              cell.type,
              'layer-' + cell.layer,
              'terrain-' + cell.terrain,
              'faction-' + cell.faction,
              {
                'cell-animate': shouldAnimate(cell.index),
                'fog-of-war': !isCellRevealed(cell)
              }
            ]"
            @click="handleCellClick(cell)"
          >
            <!-- Fog of War Cover -->
            <div v-if="!isCellRevealed(cell)" class="fog-cover">
              ☁️
            </div>
            
            <template v-else>
              <!-- Cell Background/Terrain Icon -->
              <div class="terrain-bg" :title="getTerrainDesc(cell)">
                {{ getTerrainIcon(cell.terrain) }}
              </div>

              <!-- Faction Indicator -->
              <div v-if="cell.faction !== 'neutral'" class="faction-border" :style="{ borderColor: getFactionColor(cell.faction) }"></div>

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
              <div v-else-if="cell.type === 'boss'" class="cell-icon boss-icon">👹</div>
              <div v-else-if="cell.type === 'obstacle'" class="cell-icon obstacle-icon">
                {{ getObstacleIcon(cell) }}
                <div v-if="getObstacleHp(cell) > 0" class="hp-bar">{{ getObstacleHp(cell) }} HP</div>
              </div>
              <div v-else-if="cell.type === 'teleport_entry'" class="cell-icon">🌀</div>
              <div v-else-if="cell.type === 'station'" class="cell-icon">🐎</div>
              <div v-else-if="cell.type === 'port'" class="cell-icon">⛵</div>
              <div v-else-if="cell.type === 'resource'" class="cell-icon">💎</div>
              <div v-else-if="cell.type === 'layer_stairs_up'" class="cell-icon">🪜</div>
              <div v-else-if="cell.type === 'layer_stairs_down'" class="cell-icon">🕳️</div>

              <!-- Owner Indicator -->
              <div class="owner-indicator" v-if="getOwnerName(cell.index)">
                <span :class="'owner-' + getOwnerId(cell.index)">
                  {{ getOwnerName(cell.index) }}
                </span>
              </div>

              <!-- Players on this cell -->
              <div class="tokens">
                <img
                  v-for="player in getCellPlayers(cell.index)"
                  :key="player.id"
                  :src="player.character.image"
                  class="token"
                  :class="[
                    `token-${player.id}`,
                    { 
                      'token-animate': lastMovedPlayer === player.id,
                      'frozen': player.frozenTurns > 0 
                    }
                  ]"
                  :style="getTokenStyle(player.id)"
                  :title="player.character.name + (player.frozenTurns > 0 ? ' (冻结)' : '')"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Dice Display -->
      <Transition name="dice-fade">
        <div v-if="diceResult > 0 || isRolling" class="dice-display">
          <div class="dice" :class="{ rolling: isRolling }">
            {{ isRolling ? '?' : diceResult }}
          </div>
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
import { boardCells, PROPERTY_LEVELS, TERRAIN_EFFECTS, FACTIONS, WEATHER_EFFECTS, OBSTACLES } from '../config'
import type { Player, PropertyLevel, Cell, WeatherType } from '../types/game'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

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
    type: Array as () => Cell[],
    required: true
  },
  diceResult: {
    type: Number,
    default: 0
  },
  isRolling: {
    type: Boolean,
    default: false
  },
  messages: {
    type: Array as () => string[],
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
    type: String as () => WeatherType,
    default: 'sunny'
  }
})

const emit = defineEmits(['roll', 'cell-click'])

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

// 12x12 Snake Grid
const boardRows = computed(() => {
  const rows = []
  const cols = 12
  for (let row = 0; row < 12; row++) {
    const rowCells = []
    for (let col = 0; col < 12; col++) {
      // Snake path calculation
      const isEvenRow = row % 2 === 0
      const actualCol = isEvenRow ? col : (cols - 1 - col)
      const cellIndex = row * cols + actualCol
      
      const cell = boardCells[cellIndex]
      if (cell) {
        rowCells.push({ ...cell, index: cellIndex })
      }
    }
    rows.push(rowCells)
  }
  return rows
})

// Environment Computeds
const currentSeasonEffect = computed(() => gameStore.currentSeasonEffect)
const currentTimeEffect = computed(() => gameStore.currentTimeEffect)
const seasonClass = computed(() => `theme-${gameStore.currentSeason}`)
const timeOfDayClass = computed(() => `time-${gameStore.currentTimeOfDay}`)

const weatherIcon = computed(() => {
  const icons: Record<WeatherType, string> = { sunny: '☀️', rainy: '🌧️', foggy: '🌫️', stormy: '⛈️' }
  return icons[props.weather] ?? '☀️'
})
const weatherText = computed(() => {
  const texts: Record<WeatherType, string> = { sunny: '晴', rainy: '雨', foggy: '雾', stormy: '风暴' }
  return texts[props.weather] ?? '晴'
})
const weatherDesc = computed(() => WEATHER_EFFECTS[props.weather]?.description)

function getTerrainIcon(terrainType: string = 'normal') {
  return (TERRAIN_EFFECTS as any)[terrainType]?.icon ?? '⬜'
}

function getTerrainDesc(cell: Cell) {
  const terrain = (TERRAIN_EFFECTS as any)[cell.terrain ?? 'normal']
  return `${terrain?.name} (消耗: ${terrain?.moveCost}, 租金: x${terrain?.rentModifier})`
}

function getFactionColor(factionType: string) {
  return (FACTIONS as any)[factionType]?.color ?? 'transparent'
}

function getObstacleIcon(cell: Cell) {
  if (!cell.obstacleId) return '🪨'
  return OBSTACLES.find(o => o.id === cell.obstacleId)?.icon ?? '🪨'
}

function getObstacleHp(cell: Cell) {
  if (!cell.obstacleId) return 0
  const key = `${cell.layer}-${cell.index}`
  return gameStore.cellStates[key]?.obstacleHp ?? 0
}

function isCellRevealed(cell: Cell) {
  const currentPlayer = props.players[props.currentPlayerIndex]
  if (!currentPlayer) return false
  const key = `${cell.layer}-${cell.index}`
  return currentPlayer.revealedCells.has(key)
}

function handleCellClick(cell: Cell) {
  emit('cell-click', cell)
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

function getOwnerName(cellIndex: number): string | null {
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
  padding: 10px;
  gap: 15px;
  width: 100%;
  max-width: 1200px; /* Expanded for 12x12 */
  transition: background-color 1s ease;
  border-radius: 12px;
}

/* Season Themes */
.theme-spring { background: linear-gradient(to bottom right, rgba(168, 230, 207, 0.1), rgba(220, 237, 193, 0.1)); }
.theme-summer { background: linear-gradient(to bottom right, rgba(255, 211, 182, 0.1), rgba(255, 170, 165, 0.1)); }
.theme-autumn { background: linear-gradient(to bottom right, rgba(255, 140, 148, 0.1), rgba(250, 190, 88, 0.1)); }
.theme-winter { background: linear-gradient(to bottom right, rgba(162, 213, 242, 0.1), rgba(250, 250, 250, 0.1)); }

/* Time of Day Themes */
.time-dawn { box-shadow: inset 0 0 100px rgba(255, 200, 150, 0.1); }
.time-day { box-shadow: inset 0 0 100px rgba(255, 255, 255, 0.1); }
.time-dusk { box-shadow: inset 0 0 100px rgba(200, 100, 50, 0.1); }
.time-night { box-shadow: inset 0 0 150px rgba(10, 10, 40, 0.6); }

.game-header {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

.environment-status {
  display: flex;
  justify-content: center;
  gap: 12px;
  background: rgba(20, 15, 10, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #d4a574;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: #fff;
}

.status-pill.season { color: #a8e6cf; }
.status-pill.time { color: #ffd3b6; }
.status-pill.weather { color: #a2d5f2; }

.board-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto; /* Allow scrolling on small screens */
  padding: 10px;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #2a2a2a; /* Grid lines color */
  border: 4px solid #d4a574;
  border-radius: 8px;
  padding: 4px;
  transition: opacity 0.3s ease;
  min-width: 800px; /* Ensure minimum size for 12 cells */
}

.board.game-ended {
  opacity: 0.7;
  pointer-events: none;
}

.board-row {
  display: flex;
  gap: 2px;
}

.cell {
  flex: 1;
  aspect-ratio: 1; /* Keep cells square */
  min-width: 60px;
  max-width: 90px;
  background: rgba(40, 35, 30, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  position: relative;
  transition: all 0.3s ease;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.cell:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}

.cell.cell-animate {
  animation: cellHighlight 0.5s ease-out;
}

/* Layer Backgrounds */
.layer-ground { background: rgba(45, 90, 39, 0.2); }
.layer-sky { background: rgba(135, 206, 235, 0.2); }
.layer-underground { background: rgba(74, 55, 40, 0.3); }

/* Faction Borders */
.faction-border {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border: 2px solid;
  border-radius: 4px;
  opacity: 0.6;
  pointer-events: none;
}

/* Terrain Background Icon */
.terrain-bg {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.fog-cover {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(20, 20, 30, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  z-index: 5;
}

.cell-name {
  color: #d4a574;
  font-weight: bold;
  text-align: center;
  line-height: 1.1;
  padding: 2px;
  z-index: 1;
  text-shadow: 1px 1px 2px #000;
}

.property-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.cell-cost {
  color: #ffcc00;
  font-size: 0.6rem;
  text-shadow: 1px 1px 1px #000;
}

.store-label {
  color: #6a8aaf;
}

.property-level {
  font-size: 0.55rem;
  color: #4caf50;
  background: rgba(0, 0, 0, 0.6);
  padding: 1px 4px;
  border-radius: 3px;
}

.cell-icon {
  font-size: 1.2rem;
  z-index: 1;
  position: relative;
}

.boss-icon { font-size: 1.5rem; animation: float 2s infinite; }
.obstacle-icon { display: flex; flex-direction: column; align-items: center; }
.hp-bar { font-size: 0.5rem; color: #ff4444; background: rgba(0,0,0,0.7); padding: 1px 3px; border-radius: 2px; margin-top: 2px; }

.owner-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.5rem;
  padding: 1px 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2;
}

.owner-0 { color: #ff6b6b; }
.owner-1 { color: #4ecdc4; }
.owner-2 { color: #ffe66d; }
.owner-3 { color: #a8e6cf; }

.tokens {
  position: absolute;
  bottom: 2px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  z-index: 3;
}

.token {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #fff;
  transition: all 0.3s ease;
  background: #000;
}

.token.frozen {
  border-color: #87ceeb;
  box-shadow: 0 0 5px #87ceeb;
  opacity: 0.7;
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
  z-index: 20;
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  animation: diceRoll 0.5s ease-out;
}

.dice.rolling {
  animation: diceRolling 0.3s ease-in-out infinite;
  background: linear-gradient(145deg, #ffd700, #ffaa00);
}

@keyframes diceRolling {
  0%, 100% { transform: rotate(-5deg) scale(1.05); }
  50% { transform: rotate(5deg) scale(0.95); }
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

/* Transitions & Animations */
.dice-fade-enter-active,
.dice-fade-leave-active { transition: all 0.3s ease; }
.dice-fade-enter-from,
.dice-fade-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@keyframes tokenBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.4) translateY(-5px); }
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

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Responsive Design */
@media (max-width: 800px) {
  .cell {
    min-width: 45px;
    font-size: 0.55rem;
  }
  .cell-name { font-size: 0.55rem; }
  .token { width: 14px; height: 14px; }
  .terrain-bg { font-size: 1.5rem; }
}
</style>

