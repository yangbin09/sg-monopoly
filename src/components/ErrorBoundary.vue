<template>
  <slot v-if="!hasError"></slot>
  <div v-else class="error-boundary">
    <div class="error-content">
      <h2>⚠️ 出错了</h2>
      <p>应用程序遇到了一个错误</p>
      <button @click="handleReload" class="reload-btn">重新加载</button>
      <button @click="handleReset" class="reset-btn">重置游戏</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const emit = defineEmits<{
  reload: []
  reset: []
}>()

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('Error captured by ErrorBoundary:', err, info)
  hasError.value = true
  errorMessage.value = err.message || 'Unknown error'
  return false // 阻止错误继续传播
})

function handleReload() {
  emit('reload')
  hasError.value = false
}

function handleReset() {
  emit('reset')
  hasError.value = false
}
</script>

<style scoped>
.error-boundary {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.error-content {
  background: linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
}

.error-content h2 {
  color: #ff6b6b;
  margin: 0 0 16px 0;
  font-size: 1.8rem;
}

.error-content p {
  color: #ccc;
  margin: 0 0 24px 0;
}

.reload-btn,
.reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin: 0 8px;
  transition: all 0.2s ease;
}

.reload-btn {
  background: #4a9eff;
  color: white;
}

.reload-btn:hover {
  background: #3a8eef;
  transform: translateY(-2px);
}

.reset-btn {
  background: #d4a574;
  color: #1a0f0a;
}

.reset-btn:hover {
  background: #c49564;
  transform: translateY(-2px);
}
</style>
