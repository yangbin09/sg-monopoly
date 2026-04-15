<template>
  <div class="controls">
    <button
      id="roll-button"
      class="roll-button"
      :class="{ 'ai-turn': isAiTurn }"
      :disabled="!enabled"
      @click="$emit('roll')"
    >
      {{ isAiTurn ? 'AI 行动中...' : '掷骰子' }}
    </button>

    <button
      v-if="showStore && !isAiTurn && enabled"
      class="store-button"
      @click="$emit('open-store')"
    >
      🏪 商店
    </button>

    <button
      v-if="!isAiTurn && enabled"
      class="end-turn-button"
      @click="$emit('end-turn')"
    >
      结束回合
    </button>

    <Transition name="dice-fade">
      <div v-if="diceResult > 0" id="dice-result" class="dice-result">
        <span class="dice-label">点数:</span>
        <span class="dice-value">{{ diceResult }}</span>
      </div>
    </Transition>

    <div v-if="diceHistory.length > 0" class="dice-history">
      <span class="history-label">历史:</span>
      <span
        v-for="(val, idx) in diceHistory.slice(0, 3)"
        :key="idx"
        class="history-value"
      >
        {{ val }}
      </span>
    </div>

    <div class="weather-indicator" :class="'weather-' + weather">
      {{ weatherIcon }} {{ weatherText }}
    </div>

    <div v-if="playerBuff.length > 0" class="status-indicator buff">
      <span v-for="buff in playerBuff" :key="buff.type" class="buff-item" :title="`剩余 ${buff.remainingTurns} 回合`">
        {{ getBuffIcon(buff.type) }}
      </span>
    </div>

    <div v-if="playerDebuff.length > 0" class="status-indicator debuff">
      <span v-for="debuff in playerDebuff" :key="debuff.type" class="debuff-item" :title="`剩余 ${debuff.remainingTurns} 回合`">
        {{ getDebuffIcon(debuff.type) }}
      </span>
    </div>

    <div v-if="frozenTurns > 0" class="frozen-indicator">
      🧊 冻结 {{ frozenTurns }} 回合
    </div>

    <div v-if="playerItems.length > 0" class="quick-items">
      <div
        v-for="item in playerItems"
        :key="item.id + item.ownedAt"
        class="quick-item"
        :title="`${item.name} (点击使用)`"
        @click="$emit('use-item', item.id)"
      >
        {{ item.icon }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherType, PlayerItem, Buff } from '../types/game'

interface Props {
  diceResult?: number
  enabled?: boolean
  isAiTurn?: boolean
  weather?: WeatherType
  playerItems?: PlayerItem[]
  playerBuff?: Buff[]
  playerDebuff?: Buff[]
  frozenTurns?: number
  showStore?: boolean
  diceHistory?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  diceResult: 0,
  enabled: false,
  isAiTurn: false,
  weather: 'sunny',
  playerItems: () => [],
  playerBuff: () => [],
  playerDebuff: () => [],
  frozenTurns: 0,
  showStore: true,
  diceHistory: () => []
})

const emit = defineEmits<{
  roll: []
  'open-store': []
  'use-item': [itemId: string]
  'end-turn': []
}>()

const weatherIcon = computed(() => {
  const icons: Record<WeatherType, string> = {
    sunny: '☀️',
    rainy: '🌧️',
    foggy: '🌫️',
    stormy: '⛈️'
  }
  return icons[props.weather] ?? '☀️'
})

const weatherText = computed(() => {
  const texts: Record<WeatherType, string> = {
    sunny: '晴',
    rainy: '雨',
    foggy: '雾',
    stormy: '风暴'
  }
  return texts[props.weather] ?? '晴'
})

function getBuffIcon(type: string): string {
  const icons: Record<string, string> = {
    luck: '🍀',
    speed: '⚡',
    shield: '🛡️'
  }
  return icons[type] ?? '✨'
}

function getDebuffIcon(type: string): string {
  const icons: Record<string, string> = {
    curse: '💀',
    freeze: '❄️'
  }
  return icons[type] ?? '⚠️'
}
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(20, 15, 10, 0.9);
  border-radius: 12px;
  border: 2px solid #5a4a3a;
  margin-top: 10px;
}

.roll-button {
  background: linear-gradient(145deg, #d4a574, #b8956a);
  color: #1a1a2e;
  border: none;
  padding: 12px 28px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 130px;
}

.roll-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 165, 116, 0.4);
}

.roll-button:disabled {
  background: #5a5a5a;
  color: #888;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.roll-button.ai-turn {
  background: linear-gradient(145deg, #6a8a6a, #4a6a4a);
  animation: aiPulse 1.5s infinite;
}

@keyframes aiPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(100, 150, 100, 0.5); }
  50% { box-shadow: 0 0 20px rgba(100, 150, 100, 0.8); }
}

.store-button {
  background: linear-gradient(145deg, #4a90a4, #3a7a8a);
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.store-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(74, 144, 164, 0.4);
}

.end-turn-button {
  background: linear-gradient(145deg, #8a7a4a, #6a5a3a);
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.end-turn-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(138, 122, 74, 0.4);
}

.dice-result {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 25, 20, 0.9);
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid #d4a574;
}

.dice-label {
  color: #a0a0a0;
}

.dice-value {
  color: #ffcc00;
  font-size: 1.4rem;
  font-weight: bold;
}

.dice-history {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(30, 25, 20, 0.7);
  border-radius: 6px;
  border: 1px solid #444;
}

.history-label {
  color: #666;
  font-size: 0.8rem;
}

.history-value {
  color: #888;
  font-size: 0.9rem;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.weather-indicator {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
}

.weather-sunny { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
.weather-rainy { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
.weather-foggy { background: rgba(158, 158, 158, 0.3); color: #9e9e9e; }
.weather-stormy { background: rgba(103, 58, 183, 0.3); color: #7c4dff; }

.status-indicator {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
}

.status-indicator.buff {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.status-indicator.debuff {
  background: rgba(255, 87, 87, 0.2);
  border: 1px solid rgba(255, 87, 87, 0.4);
}

.buff-item, .debuff-item {
  font-size: 1rem;
}

.frozen-indicator {
  padding: 6px 12px;
  background: rgba(135, 206, 235, 0.2);
  border: 1px solid rgba(135, 206, 235, 0.4);
  border-radius: 6px;
  color: #87ceeb;
  font-size: 0.85rem;
  font-weight: bold;
}

.quick-items {
  display: flex;
  gap: 6px;
}

.quick-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-item:hover {
  background: rgba(212, 165, 116, 0.2);
  transform: scale(1.1);
}

/* Transitions */
.dice-fade-enter-active,
.dice-fade-leave-active {
  transition: all 0.3s ease;
}

.dice-fade-enter-from,
.dice-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Responsive */
@media (max-width: 480px) {
  .roll-button {
    padding: 10px 24px;
    font-size: 1rem;
    min-width: 110px;
  }

  .store-button, .end-turn-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .dice-result {
    padding: 6px 12px;
  }

  .dice-value {
    font-size: 1.2rem;
  }

  .layer-controls {
    width: 100%;
    justify-content: center;
  }

  .quick-item {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>
