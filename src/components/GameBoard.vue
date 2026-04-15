<template>
  <div id="game" class="game">
    <Scoreboard
      :players="players"
      :current-player-index="currentPlayerIndex"
    />

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
          :class="cell ? cell.type : 'interior'"
        >
          <template v-if="cell">
            <div class="cell-name">{{ cell.name }}</div>
            <div v-if="cell.type === 'property'" class="cell-cost">¥{{ cell.cost }}</div>
            <div v-else-if="cell.type === 'tax'" class="cell-cost">-¥{{ cell.amount }}</div>
            <div v-else-if="cell.type === 'store'" class="cell-cost">商店</div>
            <div class="tokens">
              <img
                v-for="player in getCellPlayers(cell.index)"
                :key="player.id"
                :src="player.character.image"
                class="token"
                :class="`token-${player.id}`"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <Controls
      :dice-result="diceResult"
      :enabled="rollButtonEnabled && !gameEnded"
      @roll="$emit('roll')"
    />

    <MessageLog :messages="messages" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Scoreboard from './Scoreboard.vue'
import Controls from './Controls.vue'
import MessageLog from './MessageLog.vue'
import { boardCells } from '../config.js'

const props = defineProps({
  players: {
    type: Array,
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
  }
})

defineEmits(['roll'])

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

function computeCellIndex(row, col) {
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

function getCellPlayers(cellIndex) {
  return props.players.filter(p => p.inGame && p.position === cellIndex)
}
</script>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 0;
  background-image: url('images/board_background.png');
  background-size: cover;
  background-position: center;
  border: 4px solid #d4a574;
  border-radius: 8px;
  padding: 10px;
}

.board.game-ended {
  opacity: 0.7;
  pointer-events: none;
}

.board-row {
  display: flex;
}

.cell {
  width: 100px;
  height: 100px;
  border: 1px solid #5a4a3a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  position: relative;
  background: rgba(20, 15, 10, 0.85);
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

.cell-name {
  color: #d4a574;
  font-weight: bold;
  text-align: center;
}

.cell-cost {
  color: #ffcc00;
  font-size: 0.7rem;
}

.tokens {
  position: absolute;
  bottom: 2px;
  display: flex;
  gap: 2px;
}

.token {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #fff;
}
</style>
