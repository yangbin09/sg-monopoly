<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>游戏设置</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="setting-group">
          <h3>基本设置</h3>

          <div class="setting-item">
            <label>初始金币</label>
            <input
              type="number"
              v-model.number="settings.INITIAL_MONEY"
              min="100"
              max="10000"
              step="100"
            />
          </div>

          <div class="setting-item">
            <label>经过起点奖励</label>
            <input
              type="number"
              v-model.number="settings.START_BONUS"
              min="0"
              max="1000"
              step="50"
            />
          </div>

          <div class="setting-item">
            <label>AI 对手数量</label>
            <select v-model.number="settings.aiCount">
              <option :value="0">无 AI</option>
              <option :value="1">1 个 AI</option>
              <option :value="2">2 个 AI</option>
              <option :value="3">3 个 AI</option>
            </select>
          </div>

          <div class="setting-item">
            <label>AI 难度</label>
            <select v-model="settings.aiDifficulty">
              <option value="easy">简单</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <h3>音效设置</h3>

          <div class="setting-item">
            <label>音量</label>
            <input
              type="range"
              v-model.number="settings.volume"
              min="0"
              max="100"
            />
            <span>{{ settings.volume }}%</span>
          </div>

          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="settings.muted" />
              静音
            </label>
          </div>
        </div>

        <div class="setting-group">
          <h3>游戏存档</h3>

          <div class="setting-item">
            <button class="btn" @click="saveCurrentGame" :disabled="!canSave">
              保存当前游戏
            </button>
          </div>

          <div class="setting-item" v-if="saveInfo">
            <p class="save-info">
              已保存: {{ saveInfo.players }} 名玩家 · {{ saveInfo.timestamp }}
            </p>
            <button class="btn btn-secondary" @click="loadSavedGame">继续游戏</button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="applySettings">应用设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useGameStorage } from '../composables/useGameStorage'

const props = defineProps<{
  show: boolean
  gameState?: any
  audioOptions?: { volume: number; muted: boolean }
}>()

const emit = defineEmits(['close', 'apply', 'save', 'load'])

const storage = useGameStorage()

const settings = reactive({
  INITIAL_MONEY: 1000,
  START_BONUS: 200,
  aiCount: 0,
  aiDifficulty: 'normal' as 'easy' | 'normal' | 'hard',
  volume: 50,
  muted: false
})

const saveInfo = computed(() => storage.getSaveInfo())
const canSave = computed(() => props.gameState?.state?.gameInProgress)

watch(() => props.show, (newVal) => {
  if (newVal && props.audioOptions) {
    settings.volume = props.audioOptions.volume * 100
    settings.muted = props.audioOptions.muted
  }
})

function applySettings() {
  emit('apply', {
    INITIAL_MONEY: settings.INITIAL_MONEY,
    START_BONUS: settings.START_BONUS,
    aiCount: settings.aiCount,
    aiDifficulty: settings.aiDifficulty,
    volume: settings.volume / 100,
    muted: settings.muted
  })
  emit('close')
}

function saveCurrentGame() {
  if (props.gameState) {
    storage.saveGame(
      props.gameState.state.players,
      props.gameState.state.currentPlayerIndex,
      props.gameState.state.propertyOwners
    )
    emit('save')
  }
}

function loadSavedGame() {
  const saved = storage.loadGame()
  if (saved) {
    emit('load', saved)
    emit('close')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #1a1a2e;
  border: 2px solid #d4a574;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #5a4a3a;
}

.modal-header h2 {
  color: #d4a574;
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #d4a574;
}

.modal-body {
  padding: 20px;
}

.setting-group {
  margin-bottom: 25px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group h3 {
  color: #d4a574;
  font-size: 1rem;
  margin-bottom: 15px;
  border-bottom: 1px solid #5a4a3a;
  padding-bottom: 5px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-item label {
  color: #a0a0a0;
  font-size: 0.9rem;
}

.setting-item input[type="number"],
.setting-item select {
  background: #0a0a15;
  border: 1px solid #5a4a3a;
  color: #d4a574;
  padding: 8px 12px;
  border-radius: 6px;
  width: 150px;
}

.setting-item input[type="range"] {
  width: 100px;
}

.setting-item input[type="checkbox"] {
  margin-right: 8px;
}

.setting-item span {
  color: #d4a574;
  font-size: 0.85rem;
  min-width: 40px;
}

.save-info {
  color: #a0a0a0;
  font-size: 0.85rem;
  margin: 5px 0;
}

.btn {
  background: linear-gradient(145deg, #d4a574, #b8956a);
  color: #1a1a2e;
  border: none;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 165, 116, 0.4);
}

.btn:disabled {
  background: #5a5a5a;
  color: #888;
  cursor: not-allowed;
}

.btn-secondary {
  background: #2a2a3d;
  color: #d4a574;
  border: 1px solid #d4a574;
}

.btn-primary {
  background: linear-gradient(145deg, #d4a574, #b8956a);
  color: #1a1a2e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #5a4a3a;
}
</style>
