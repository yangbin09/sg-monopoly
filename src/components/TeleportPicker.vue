<template>
  <Transition name="fade">
    <div v-if="show" class="teleport-overlay" @click.self="$emit('cancel')">
      <div class="teleport-panel">
        <div class="teleport-header">
          <h3>⚡ 选择传送目标</h3>
          <button class="close-btn" @click="$emit('cancel')">×</button>
        </div>

        <p class="teleport-hint">选择要传送到的己方地产:</p>

        <div v-if="properties.length > 0" class="property-list">
          <button
            v-for="prop in properties"
            :key="prop.index"
            class="property-item"
            @click="selectTarget(prop)"
          >
            <div class="prop-icon">{{ getPropertyIcon(prop) }}</div>
            <div class="prop-info">
              <span class="prop-name">{{ prop.name }}</span>
              <span class="prop-level">{{ getLevelName(prop.level ?? 0) }}</span>
            </div>
            <div class="prop-rent">
              租金: ¥{{ prop.rentByLevel?.[prop.level ?? 0] ?? prop.rent }}
            </div>
          </button>
        </div>

        <div v-else class="no-properties">
          <p>没有可传送的地产</p>
        </div>

        <div class="teleport-footer">
          <button class="cancel-btn" @click="$emit('cancel')">取消</button>
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
  properties: Cell[]
  currentPosition?: number
}>()

const emit = defineEmits<{
  select: [cellIndex: number]
  cancel: []
}>()

function getLevelName(level: PropertyLevel): string {
  return PROPERTY_LEVELS[level]?.name ?? '空地'
}

function getPropertyIcon(prop: Cell): string {
  const icons: Record<string, string> = {
    castle: '🏰',
    normal: '🏠',
    forest: '🌲',
    mountain: '⛰️',
    water: '🌊',
    wasteland: '🏜️'
  }
  return icons[prop.terrain ?? 'normal'] ?? '🏠'
}

function selectTarget(prop: Cell) {
  if (prop.index !== undefined) {
    emit('select', prop.index)
  }
}
</script>

<style scoped>
.teleport-overlay {
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

.teleport-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(212, 165, 116, 0.3);
}

.teleport-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.teleport-header h3 {
  color: #d4a574;
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
}

.teleport-hint {
  color: #aaa;
  margin: 0 0 16px 0;
  font-size: 0.9rem;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.property-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.property-item:hover {
  border-color: #d4a574;
  background: rgba(212, 165, 116, 0.15);
  transform: translateX(4px);
}

.prop-icon {
  font-size: 2rem;
}

.prop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.prop-name {
  color: #fff;
  font-weight: bold;
  font-size: 1rem;
}

.prop-level {
  color: #4caf50;
  font-size: 0.8rem;
}

.prop-rent {
  color: #ffd700;
  font-size: 0.85rem;
}

.no-properties {
  text-align: center;
  padding: 30px;
  color: #666;
}

.teleport-footer {
  margin-top: 16px;
  text-align: center;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #666;
  color: #999;
  padding: 10px 30px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  border-color: #999;
  color: #fff;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
