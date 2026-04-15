<template>
  <div v-if="show" class="store-overlay" @click.self="$emit('close')">
    <div class="store-modal">
      <div class="store-header">
        <h2>🏪 商店</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="weather-info">
        <span :class="'weather-' + weather">{{ getWeatherIcon() }} {{ getWeatherText() }}</span>
      </div>

      <div class="player-money">
        💰 {{ player?.money ?? 0 }} 金币
      </div>

      <div class="store-section">
        <h3>可购买道具</h3>
        <div class="items-grid">
          <div
            v-for="item in availableItems"
            :key="item.id"
            class="item-card"
            :class="{ disabled: !canAfford(item.cost) || hasItem(item.id) }"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.description }}</div>
            <div class="item-cost">💰 {{ item.cost }}</div>
            <button
              class="buy-btn"
              :disabled="!canAfford(item.cost) || hasItem(item.id)"
              @click="buyItem(item)"
            >
              {{ hasItem(item.id) ? '已拥有' : '购买' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="playerItems.length > 0" class="store-section">
        <h3>我的道具</h3>
        <div class="items-grid owned">
          <div v-for="item in playerItems" :key="item.id + item.ownedAt" class="item-card owned">
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.description }}</div>
            <button class="use-btn" @click="useItem(item)">使用</button>
          </div>
        </div>
      </div>

      <div v-if="upgradableProperties.length > 0" class="store-section">
        <h3>升级地产</h3>
        <div class="property-list">
          <div v-for="prop in upgradableProperties" :key="prop.index" class="property-item">
            <div class="prop-info">
              <span class="prop-name">{{ prop.name }}</span>
              <span class="prop-level">{{ getLevelName(prop.level ?? 0) }}</span>
            </div>
            <div class="prop-rent">
              租金: ¥{{ prop.rentByLevel?.[(prop.level ?? 0) + 1] ?? prop.rent }}
            </div>
            <button
              class="upgrade-btn"
              :disabled="!canAfford(prop.upgradeCosts?.[prop.level ?? 0] ?? 0)"
              @click="upgradeProperty(prop)"
            >
              升级 ¥{{ prop.upgradeCosts?.[prop.level ?? 0] }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player, Item, PlayerItem, Cell, PropertyLevel, WeatherType } from '../types/game'
import { ITEMS, PROPERTY_LEVELS } from '../config'

const props = defineProps<{
  show: boolean
  player: Player | null
  weather: WeatherType
}>()

const emit = defineEmits<{
  close: []
  buy: [itemId: string]
  use: [itemId: string]
  upgrade: [cellIndex: number]
}>()

const availableItems = computed(() => ITEMS)

const playerItems = computed(() => props.player?.items ?? [])

const upgradableProperties = computed(() => {
  if (!props.player) return []
  return props.player.properties.filter(p => {
    const level = p.level ?? 0
    return level < (p.maxLevel ?? 3)
  })
})

function canAfford(cost: number): boolean {
  return (props.player?.money ?? 0) >= cost
}

function hasItem(itemId: string): boolean {
  return props.player?.items.some(i => i.id === itemId) ?? false
}

function getLevelName(level: PropertyLevel): string {
  return PROPERTY_LEVELS[level]?.name ?? '空地'
}

function getWeatherIcon(): string {
  const icons: Record<WeatherType, string> = {
    sunny: '☀️',
    rainy: '🌧️',
    foggy: '🌫️',
    stormy: '⛈️'
  }
  return icons[props.weather] ?? '☀️'
}

function getWeatherText(): string {
  const texts: Record<WeatherType, string> = {
    sunny: '晴朗',
    rainy: '下雨',
    foggy: '大雾',
    stormy: '暴风雨'
  }
  return texts[props.weather] ?? '晴朗'
}

function buyItem(item: typeof ITEMS[0]) {
  emit('buy', item.id)
}

function useItem(item: PlayerItem) {
  emit('use', item.id)
}

function upgradeProperty(cell: Cell) {
  if (cell.index !== undefined) {
    emit('upgrade', cell.index)
  }
}
</script>

<style scoped>
.store-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.store-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.store-header h2 {
  color: #d4a574;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #d4a574;
  font-size: 28px;
  cursor: pointer;
  padding: 0 8px;
}

.weather-info {
  text-align: center;
  margin-bottom: 8px;
}

.weather-info span {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.weather-sunny { background: rgba(255, 193, 7, 0.2); }
.weather-rainy { background: rgba(33, 150, 243, 0.2); }
.weather-foggy { background: rgba(158, 158, 158, 0.3); }
.weather-stormy { background: rgba(103, 58, 183, 0.3); }

.player-money {
  text-align: center;
  color: #ffd700;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.store-section {
  margin-bottom: 20px;
}

.store-section h3 {
  color: #d4a574;
  margin-bottom: 12px;
  font-size: 1rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.item-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.2s;
}

.item-card:hover:not(.disabled) {
  border-color: #d4a574;
  transform: translateY(-2px);
}

.item-card.disabled {
  opacity: 0.5;
}

.item-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.item-name {
  color: #fff;
  font-weight: bold;
  margin-bottom: 4px;
}

.item-desc {
  color: #aaa;
  font-size: 0.75rem;
  margin-bottom: 8px;
}

.item-cost {
  color: #ffd700;
  margin-bottom: 8px;
}

.buy-btn, .use-btn, .upgrade-btn {
  background: linear-gradient(135deg, #d4a574 0%, #8b5a2b 100%);
  border: none;
  color: #fff;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.buy-btn:disabled, .use-btn:disabled, .upgrade-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.prop-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prop-name {
  color: #fff;
}

.prop-level {
  color: #ffd700;
  font-size: 0.8rem;
}

.prop-rent {
  color: #aaa;
  font-size: 0.85rem;
}
</style>
