<template>
  <div class="dice-display" :class="{ rolling: isRolling }">
    <div class="dice-face">
      <span class="dice-value">{{ displayValue || '?' }}</span>
    </div>
    <div v-if="isRolling" class="dice-shake"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  value: number
  rolling?: boolean
}>()

const isRolling = ref(false)
const displayValue = ref<number | null>(null)

watch(() => props.value, (newVal) => {
  if (newVal) {
    displayValue.value = newVal
  }
})

watch(() => props.rolling, (rolling) => {
  if (rolling) {
    isRolling.value = true
    // 模拟掷骰子动画
    const interval = setInterval(() => {
      displayValue.value = Math.floor(Math.random() * 6) + 1
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      displayValue.value = props.value
      isRolling.value = false
    }, 800)
  }
})
</script>

<style scoped>
.dice-display {
  position: relative;
  width: 60px;
  height: 60px;
  perspective: 200px;
}

.dice-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #fff 0%, #e6e6e6 100%);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.8);
  border: 2px solid #333;
}

.dice-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  font-family: 'Arial Black', sans-serif;
}

.rolling .dice-face {
  animation: shake 0.1s infinite;
}

.dice-shake {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%);
  animation: shimmer 0.8s infinite;
  border-radius: 10px;
}

@keyframes shake {
  0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(10deg) rotateY(10deg); }
  50% { transform: rotateX(0deg) rotateY(20deg); }
  75% { transform: rotateX(-10deg) rotateY(10deg); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
