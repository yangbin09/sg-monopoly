<template>
  <div class="controls">
    <button
      id="roll-button"
      class="roll-button"
      :disabled="!enabled"
      @click="$emit('roll')"
    >
      掷骰子
    </button>
    <div v-if="diceResult > 0" id="dice-result" class="dice-result">
      <span class="dice-label">点数:</span>
      <span class="dice-value">{{ diceResult }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  diceResult: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['roll'])
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.roll-button {
  background: linear-gradient(145deg, #d4a574, #b8956a);
  color: #1a1a2e;
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.roll-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 165, 116, 0.4);
}

.roll-button:disabled {
  background: #5a5a5a;
  color: #888;
  cursor: not-allowed;
}

.dice-result {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 25, 20, 0.9);
  padding: 10px 20px;
  border-radius: 8px;
  border: 2px solid #d4a574;
}

.dice-label {
  color: #a0a0a0;
}

.dice-value {
  color: #ffcc00;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
