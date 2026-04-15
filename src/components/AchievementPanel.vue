<template>
  <Transition name="achievement">
    <div v-if="show" class="achievement-notification">
      <div class="achievement-icon">{{ achievement?.icon }}</div>
      <div class="achievement-content">
        <div class="achievement-title">🏆 成就解锁</div>
        <div class="achievement-name">{{ achievement?.name }}</div>
        <div class="achievement-desc">{{ achievement?.description }}</div>
        <div v-if="achievement?.reward" class="achievement-reward">
          🎁 +{{ achievement.reward }} 金币
        </div>
      </div>
      <button class="dismiss-btn" @click="$emit('dismiss')">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Achievement } from '../types/game'

defineProps<{
  show: boolean
  achievement: Achievement | null
}>()

defineEmits<{
  dismiss: []
}>()
</script>

<style scoped>
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  max-width: 320px;
}

.achievement-icon {
  font-size: 3rem;
}

.achievement-content {
  flex: 1;
}

.achievement-title {
  color: #ffd700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.achievement-name {
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
  margin: 4px 0;
}

.achievement-desc {
  color: #aaa;
  font-size: 0.85rem;
}

.achievement-reward {
  color: #4caf50;
  font-weight: bold;
  margin-top: 8px;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.dismiss-btn:hover {
  color: #fff;
}

.achievement-enter-active,
.achievement-leave-active {
  transition: all 0.5s ease;
}

.achievement-enter-from,
.achievement-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
