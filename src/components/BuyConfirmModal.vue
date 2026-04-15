<template>
  <Transition name="modal">
    <div v-if="show" class="buy-overlay" @click.self="$emit('cancel')">
      <div class="buy-modal">
        <div class="buy-header">
          <h2>🏠 购买确认</h2>
        </div>

        <div class="property-preview">
          <div class="property-icon">{{ propertyIcon }}</div>
          <div class="property-details">
            <h3>{{ cell?.name }}</h3>
            <p class="property-type">{{ cell?.terrain ? getTerrainName(cell.terrain) : '普通' }} - {{ cell?.faction ? getFactionName(cell.faction) : '中立' }}</p>
          </div>
        </div>

        <div class="cost-section">
          <div class="cost-row">
            <span class="cost-label">购买价格:</span>
            <span class="cost-value price">¥{{ cell?.cost }}</span>
          </div>
          <div class="cost-row">
            <span class="cost-label">当前租金:</span>
            <span class="cost-value">¥{{ cell?.rent }}</span>
          </div>
          <div class="cost-row highlight">
            <span class="cost-label">购买后余额:</span>
            <span class="cost-value" :class="{ warning: remainingMoney < 200 }">
              ¥{{ remainingMoney }}
            </span>
          </div>
        </div>

        <div class="skill-bonus" v-if="skillBonus > 0">
          <span class="bonus-icon">✨</span>
          <span>技能加成: +¥{{ skillBonus }}</span>
        </div>

        <div class="warning-hint" v-if="remainingMoney < 200">
          ⚠️ 购买后金币较低，建议谨慎购买
        </div>

        <div class="buy-actions">
          <button class="buy-btn confirm" @click="$emit('confirm')">
            确认购买
          </button>
          <button class="buy-btn cancel" @click="$emit('cancel')">
            取消
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Cell } from '../types/game'
import { FACTIONS, TERRAIN_EFFECTS } from '../config'

const props = defineProps<{
  show: boolean
  cell: Cell | null
  playerMoney: number
  skillBonus?: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const remainingMoney = computed(() => {
  return props.playerMoney - (props.cell?.cost ?? 0) + (props.skillBonus ?? 0)
})

const propertyIcon = computed(() => {
  if (!props.cell) return '🏠'
  const terrain = props.cell.terrain ?? 'normal'
  const icons: Record<string, string> = {
    castle: '🏰',
    normal: '🏠',
    forest: '🌲',
    mountain: '⛰️',
    water: '🌊',
    wasteland: '🏜️',
    volcano: '🌋',
    swamp: '🌿'
  }
  return icons[terrain] ?? '🏠'
})

function getTerrainName(terrain: string): string {
  return (TERRAIN_EFFECTS as any)[terrain]?.name ?? '普通'
}

function getFactionName(faction: string): string {
  return (FACTIONS as any)[faction]?.name ?? '中立'
}
</script>

<style scoped>
.buy-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.buy-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 30px rgba(212, 165, 116, 0.3);
}

.buy-header {
  text-align: center;
  margin-bottom: 20px;
}

.buy-header h2 {
  color: #d4a574;
  margin: 0;
  font-size: 1.4rem;
}

.property-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.property-icon {
  font-size: 3rem;
}

.property-details h3 {
  color: #fff;
  margin: 0 0 4px 0;
  font-size: 1.2rem;
}

.property-type {
  color: #888;
  margin: 0;
  font-size: 0.85rem;
}

.cost-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cost-row:last-child {
  border-bottom: none;
}

.cost-row.highlight {
  background: rgba(212, 165, 116, 0.1);
  margin: 8px -12px -12px;
  padding: 12px;
  border-radius: 0 0 10px 10px;
  border-bottom: none;
}

.cost-label {
  color: #888;
}

.cost-value {
  color: #fff;
  font-weight: bold;
}

.cost-value.price {
  color: #ffd700;
  font-size: 1.1rem;
}

.cost-value.warning {
  color: #ff6464;
}

.skill-bonus {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #4caf50;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.warning-hint {
  text-align: center;
  color: #ff6464;
  font-size: 0.85rem;
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(255, 100, 100, 0.1);
  border-radius: 6px;
}

.buy-actions {
  display: flex;
  gap: 12px;
}

.buy-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-btn.confirm {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: #fff;
}

.buy-btn.confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.buy-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #888;
  border: 1px solid #444;
}

.buy-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .buy-modal {
  transform: scale(0.9);
}
</style>
