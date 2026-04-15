<template>
  <div
    class="token"
    :class="[`token-${player.id}`, { 'is-current': isCurrent }]"
    :style="tokenStyle"
    :title="player.character.name"
  >
    <img
      v-if="player.character.image"
      :src="player.character.image"
      :alt="player.character.name"
      class="token-image"
    />
    <span v-else class="token-emoji">{{ player.character.icon || '👤' }}</span>
    <div v-if="isCurrent" class="token-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '../types/game'

const props = defineProps<{
  player: Player
  cellIndex: number
  isCurrent?: boolean
  offset?: number // 同一格多个玩家的偏移
}>()

const tokenStyle = computed(() => {
  const baseOffset = props.cellIndex * 10 // 每个玩家基础位置
  const offsetPx = (props.offset ?? 0) * 8
  return {
    transform: `translate(${baseOffset + offsetPx}%, ${(props.offset ?? 0) * -5}px)`
  }
})
</script>

<style scoped>
.token {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  z-index: 10;
  cursor: pointer;
}

.token-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.token-emoji {
  font-size: 18px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
}

.is-current {
  z-index: 20;
  animation: pulse 1.5s infinite;
}

.token-glow {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
  animation: glow 1.5s infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes glow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 不同玩家的颜色 */
.token-0 { background: #ff6b6b; }
.token-1 { background: #4ecdc4; }
.token-2 { background: #ffe66d; }
.token-3 { background: #a29bfe; }

.token-image {
  border-color: #fff;
}
</style>
