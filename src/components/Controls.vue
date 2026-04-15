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
      v-if="showStore"
      class="store-button"
      @click="$emit('open-store')"
    >
      🏪 商店
    </button>

    <Transition name="dice-fade">
      <div v-if="diceResult > 0" id="dice-result" class="dice-result">
        <span class="dice-label">点数:</span>
        <span class="dice-value">{{ diceResult }}</span>
      </div>
    </Transition>

    <div class="weather-indicator" :class="'weather-' + weather">
      {{ weatherIcon }} {{ weatherText }}
    </div>

    <div v-if="playerItems.length > 0" class="quick-items">
      <div
        v-for="item in playerItems"
        :key="item.id + item.ownedAt"
        class="quick-item"
        :title="item.name"
        @click="$emit('use-item', item.id)"
      >
        {{ item.icon }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherType, PlayerItem } from '../types/game'

interface Props {
  diceResult?: number
  enabled?: boolean
  isAiTurn?: boolean
  weather?: WeatherType
  playerItems?: PlayerItem[]
  showStore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  diceResult: 0,
  enabled: false,
  isAiTurn: false,
  weather: 'sunny',
  playerItems: () => [],
  showStore: true
})

defineEmits<{
  roll: []
  'open-store': []
  'use-item': [itemId: string]
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
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(20, 15, 10, 0.9);
  border-radius: 12px;
  border: 2px solid #5a4a3a;
}

.roll-button {
  background: linear-gradient(145deg, #d4a574, #b8956a);
  color: #1a1a2e;
  border: none;
  padding: 12px 32px;
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

  .store-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .dice-result {
    padding: 6px 12px;
  }

  .dice-value {
    font-size: 1.2rem;
  }

  .weather-indicator {
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  .quick-item {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>
