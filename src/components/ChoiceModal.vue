<template>
  <Transition name="modal">
    <div v-if="show" class="choice-overlay" @click.self="$emit('cancel')">
      <div class="choice-modal">
        <div class="choice-header">
          <h2>{{ title }}</h2>
          <p class="choice-subtitle">{{ subtitle }}</p>
        </div>

        <div class="choice-options">
          <button
            v-for="(option, index) in options"
            :key="index"
            class="choice-btn"
            :class="{ 'risk-high': isHighRisk(option) }"
            @click="selectOption(index)"
          >
            <span class="option-text">{{ option.text }}</span>
            <span v-if="option.description" class="option-desc">{{ option.description }}</span>
            <span v-if="option.effect?.amount !== undefined" class="option-effect">
              <span v-if="option.effect.amount >= 0" class="gain">+{{ option.effect.amount }}</span>
              <span v-else class="loss">{{ option.effect.amount }}</span>
            </span>
          </button>
        </div>

        <div v-if="showCancel" class="choice-footer">
          <button class="cancel-btn" @click="$emit('cancel')">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
export interface ChoiceOption {
  text: string
  description?: string
  effect?: {
    amount?: number
    type?: string
  }
}

const props = defineProps<{
  show: boolean
  title: string
  subtitle?: string
  options: ChoiceOption[]
  showCancel?: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
  cancel: []
}>()

function selectOption(index: number) {
  emit('select', index)
}

function isHighRisk(option: ChoiceOption): boolean {
  return (option.effect?.amount ?? 0) < 0
}
</script>

<style scoped>
.choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.choice-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #d4a574;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 0 30px rgba(212, 165, 116, 0.3);
}

.choice-header {
  text-align: center;
  margin-bottom: 20px;
}

.choice-header h2 {
  color: #d4a574;
  margin: 0 0 8px 0;
  font-size: 1.4rem;
}

.choice-subtitle {
  color: #aaa;
  margin: 0;
  font-size: 0.9rem;
}

.choice-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(212, 165, 116, 0.4);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.choice-btn:hover {
  border-color: #d4a574;
  background: rgba(212, 165, 116, 0.15);
  transform: translateX(4px);
}

.choice-btn.risk-high {
  border-color: rgba(255, 100, 100, 0.5);
}

.choice-btn.risk-high:hover {
  border-color: #ff6464;
  background: rgba(255, 100, 100, 0.15);
}

.option-text {
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
}

.option-desc {
  color: #999;
  font-size: 0.85rem;
}

.option-effect {
  font-size: 1rem;
  font-weight: bold;
  margin-top: 4px;
}

.gain {
  color: #4caf50;
}

.loss {
  color: #ff6464;
}

.choice-footer {
  margin-top: 16px;
  text-align: center;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #666;
  color: #999;
  padding: 8px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  border-color: #999;
  color: #fff;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .choice-modal,
.modal-leave-to .choice-modal {
  transform: scale(0.9);
}
</style>
