<template>
  <Transition name="slide">
    <div v-if="show && property" class="property-action-overlay" @click.self="$emit('close')">
      <div class="property-action-panel">
        <div class="panel-header">
          <h3>{{ property.name }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="property-status">
          <div class="status-row">
            <span class="label">等级:</span>
            <span class="value level">{{ getLevelName(property.level ?? 0) }}</span>
          </div>
          <div class="status-row">
            <span class="label">当前租金:</span>
            <span class="value">¥{{ currentRent }}</span>
          </div>
          <div class="status-row">
            <span class="label">地产价值:</span>
            <span class="value">¥{{ property.cost }}</span>
          </div>
        </div>

        <div v-if="canUpgrade" class="upgrade-section">
          <div class="upgrade-info">
            <span>升级到 {{ getLevelName(nextLevel) }}</span>
            <span class="upgrade-cost">¥{{ upgradeCost }}</span>
          </div>
          <div class="upgrade-benefit">
            升级后租金: ¥{{ nextRent }}
          </div>
          <button
            class="upgrade-btn"
            :disabled="!canAffordUpgrade"
            @click="handleUpgrade"
          >
            {{ canAffordUpgrade ? '升级' : '金币不足' }}
          </button>
        </div>

        <div v-else-if="isMaxLevel" class="max-level">
          <span class="max-badge">已达最高等级</span>
        </div>

        <div class="owner-actions">
          <div class="action-hint">
            {{ property.type === 'property' ? '点击空白处关闭' : '' }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Cell, PropertyLevel } from '../types/game'
import { PROPERTY_LEVELS } from '../config'

const props = defineProps<{
  show: boolean
  property: Cell | null
  playerMoney: number
}>()

const emit = defineEmits<{
  close: []
  upgrade: [cellIndex: number]
}>()

const currentRent = computed(() => {
  if (!props.property) return 0
  const level = props.property.level ?? 0
  return props.property.rentByLevel?.[level] ?? props.property.rent ?? 0
})

const nextLevel = computed((): PropertyLevel => {
  return ((props.property?.level ?? 0) + 1) as PropertyLevel
})

const upgradeCost = computed(() => {
  if (!props.property) return 0
  const level = props.property.level ?? 0
  return props.property.upgradeCosts?.[level] ?? 0
})

const nextRent = computed(() => {
  if (!props.property) return 0
  return props.property.rentByLevel?.[nextLevel.value] ?? props.property.rent ?? 0
})

const canUpgrade = computed(() => {
  if (!props.property) return false
  const level = props.property.level ?? 0
  const maxLevel = props.property.maxLevel ?? 3
  return level < maxLevel && upgradeCost.value > 0
})

const isMaxLevel = computed(() => {
  if (!props.property) return false
  const level = props.property.level ?? 0
  const maxLevel = props.property.maxLevel ?? 3
  return level >= maxLevel
})

const canAffordUpgrade = computed(() => {
  return props.playerMoney >= upgradeCost.value
})

function getLevelName(level: PropertyLevel): string {
  return PROPERTY_LEVELS[level]?.name ?? '空地'
}

function handleUpgrade() {
  if (props.property?.index !== undefined && canAffordUpgrade.value) {
    emit('upgrade', props.property.index)
  }
}
</script>

<style scoped>
.property-action-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}

.property-action-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 0 25px rgba(212, 165, 116, 0.25);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  color: #d4a574;
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.close-btn:hover {
  color: #fff;
}

.property-status {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.status-row:last-child {
  border-bottom: none;
}

.label {
  color: #888;
  font-size: 0.9rem;
}

.value {
  color: #fff;
  font-weight: bold;
}

.value.level {
  color: #4caf50;
}

.upgrade-section {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.upgrade-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  color: #fff;
  font-weight: bold;
}

.upgrade-cost {
  color: #ffd700;
  font-size: 1.1rem;
}

.upgrade-benefit {
  color: #4caf50;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.upgrade-btn {
  width: 100%;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.upgrade-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.upgrade-btn:disabled {
  background: #555;
  color: #888;
  cursor: not-allowed;
}

.max-level {
  text-align: center;
  padding: 20px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 10px;
  margin-bottom: 16px;
}

.max-badge {
  color: #ffd700;
  font-weight: bold;
  font-size: 1.1rem;
}

.owner-actions {
  text-align: center;
}

.action-hint {
  color: #666;
  font-size: 0.8rem;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .property-action-panel {
  transform: translateY(20px);
}

.slide-leave-to .property-action-panel {
  transform: translateY(-20px);
}
</style>
