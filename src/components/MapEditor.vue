<template>
  <div class="map-editor">
    <div class="editor-header">
      <h2>🗺️ 地图编辑器</h2>
      <div class="editor-actions">
        <button @click="saveMap" class="btn-save">💾 保存</button>
        <button @click="loadMap" class="btn-load">📂 加载</button>
        <button @click="resetMap" class="btn-reset">🔄 重置</button>
        <button @click="testMap" class="btn-test">▶️ 测试</button>
      </div>
    </div>

    <div class="editor-main">
      <div class="cell-palette">
        <h3>格子类型</h3>
        <div class="palette-grid">
          <button
            v-for="cellType in cellTypes"
            :key="cellType.type"
            class="palette-item"
            :class="{ selected: selectedType === cellType.type }"
            @click="selectedType = cellType.type"
          >
            <span class="palette-icon">{{ cellType.icon }}</span>
            <span class="palette-name">{{ cellType.name }}</span>
          </button>
        </div>

        <h3>地形类型</h3>
        <div class="palette-grid">
          <button
            v-for="terrain in terrainTypes"
            :key="terrain.type"
            class="palette-item terrain"
            :class="{ selected: selectedTerrain === terrain.type }"
            @click="selectedTerrain = terrain.type"
          >
            <span class="palette-icon">{{ terrain.icon }}</span>
            <span class="palette-name">{{ terrain.name }}</span>
          </button>
        </div>

        <h3>区域归属</h3>
        <div class="palette-grid">
          <button
            v-for="area in areaTypes"
            :key="area.type"
            class="palette-item area"
            :class="{ selected: selectedArea === area.type }"
            @click="selectedArea = area.type"
          >
            <span class="palette-icon">{{ area.icon }}</span>
            <span class="palette-name">{{ area.name }}</span>
          </button>
        </div>

        <h3>地图预设</h3>
        <div class="preset-list">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="preset-item"
            @click="loadPreset(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <div class="map-preview">
        <div class="map-size-selector">
          <label>地图尺寸:</label>
          <select v-model="mapSize" @change="onSizeChange">
            <option value="small">小型 (4x4 - 12格)</option>
            <option value="standard">标准 (5x5 - 16格)</option>
            <option value="large">大型 (6x6 - 20格)</option>
            <option value="giant">巨型 (7x7 - 24格)</option>
          </select>
        </div>

        <div class="board" :class="'board-' + mapSize">
          <div
            v-for="(cell, index) in editedCells"
            :key="index"
            class="cell"
            :class="[getCellClass(cell), { editable: true }]"
            @click="editCell(index)"
            @dblclick="openCellEditor(index)"
          >
            <span class="cell-index">{{ index }}</span>
            <span class="cell-name">{{ cell.name || '未设置' }}</span>
            <span v-if="cell.cost" class="cell-cost">¥{{ cell.cost }}</span>
            <span v-if="cell.terrain !== 'normal'" class="cell-terrain">
              {{ getTerrainIcon(cell.terrain) }}
            </span>
          </div>
        </div>
      </div>

      <div class="cell-properties">
        <h3>属性编辑</h3>
        <div v-if="editingCell !== null" class="property-form">
          <div class="form-group">
            <label>名称:</label>
            <input v-model="editedCells[editingCell].name" type="text" />
          </div>

          <div class="form-group">
            <label>类型:</label>
            <select v-model="editedCells[editingCell].type">
              <option v-for="ct in cellTypes" :key="ct.type" :value="ct.type">
                {{ ct.icon }} {{ ct.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>地形:</label>
            <select v-model="editedCells[editingCell].terrain">
              <option v-for="t in terrainTypes" :key="t.type" :value="t.type">
                {{ t.icon }} {{ t.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>区域:</label>
            <select v-model="editedCells[editingCell].area">
              <option v-for="a in areaTypes" :key="a.type" :value="a.type">
                {{ a.icon }} {{ a.name }}
              </option>
            </select>
          </div>

          <div v-if="isPropertyType" class="form-group">
            <label>购买价格:</label>
            <input v-model.number="editedCells[editingCell].cost" type="number" />
          </div>

          <div v-if="isPropertyType" class="form-group">
            <label>基础租金:</label>
            <input v-model.number="editedCells[editingCell].rent" type="number" />
          </div>

          <div class="form-group">
            <label>事件ID:</label>
            <input v-model="editedCells[editingCell].eventId" type="text" />
          </div>

          <div class="form-actions">
            <button @click="deleteCell" class="btn-delete">🗑️ 删除</button>
            <button @click="copyCell" class="btn-copy">📋 复制</button>
            <button @click="pasteCell" class="btn-paste">📨 粘贴</button>
          </div>
        </div>
        <div v-else class="no-selection">
          <p>点击格子或双击编辑</p>
        </div>
      </div>
    </div>

    <!-- 地图导出/导入对话框 -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
      <div class="modal-content">
        <h3>导出地图配置</h3>
        <textarea v-model="exportJson" readonly class="export-textarea"></textarea>
        <div class="modal-actions">
          <button @click="copyToClipboard">📋 复制</button>
          <button @click="showExportModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Cell, MapSize, MapTheme, TerrainType, AreaType } from '../types/game'
import { MAP_SIZES, MAP_THEMES, MAP_PRESETS, boardCells as defaultCells } from '../config'

const emit = defineEmits<{
  save: [cells: Cell[], config: { size: MapSize; theme: MapTheme }]
  test: [cells: Cell[]]
}>()

// 状态
const mapSize = ref<MapSize>('standard')
const mapTheme = ref<MapTheme>('threekingdoms')
const editedCells = ref<Cell[]>([...defaultCells])
const selectedType = ref<string>('property')
const selectedTerrain = ref<TerrainType>('normal')
const selectedArea = ref<AreaType>('neutral')
const editingCell = ref<number | null>(null)
const copiedCell = ref<Cell | null>(null)
const showExportModal = ref(false)
const exportJson = ref('')

// 格子类型定义
const cellTypes = [
  { type: 'start', name: '起点', icon: '🏁' },
  { type: 'property', name: '地产', icon: '🏠' },
  { type: 'store', name: '商店', icon: '🏪' },
  { type: 'event', name: '事件', icon: '📜' },
  { type: 'tax', name: '税收', icon: '💸' },
  { type: 'treasure', name: '宝箱', icon: '📦' },
  { type: 'fate', name: '命运', icon: '🎴' },
  { type: 'station', name: '驿站', icon: '🏨' },
  { type: 'port', name: '港口', icon: '⚓' },
  { type: 'teleport_entry', name: '传送阵入口', icon: '🌀' },
  { type: 'teleport_exit', name: '传送阵出口', icon: '🔄' },
  { type: 'obstacle', name: '障碍物', icon: '🪨' },
  { type: 'prison', name: '监狱', icon: '⛓️' }
]

// 地形类型
const terrainTypes = [
  { type: 'normal', name: '普通', icon: '🌿' },
  { type: 'mountain', name: '山地', icon: '⛰️' },
  { type: 'water', name: '水域', icon: '🌊' },
  { type: 'castle', name: '城池', icon: '🏯' },
  { type: 'wasteland', name: '荒野', icon: '🏜️' }
]

// 区域类型
const areaTypes = [
  { type: 'neutral', name: '中立', icon: '⚪' },
  { type: 'wei', name: '魏国', icon: '🔴' },
  { type: 'shu', name: '蜀国', icon: '🟢' },
  { type: 'wu', name: '吴国', icon: '🔵' }
]

// 预设地图
const presets = MAP_PRESETS

// 计算属性
const isPropertyType = computed(() => {
  return editingCell.value !== null && editedCells.value[editingCell.value!]?.type === 'property'
})

// 方法
function getCellClass(cell: Cell): string {
  const classes = [cell.type]
  if (cell.terrain && cell.terrain !== 'normal') {
    classes.push(`terrain-${cell.terrain}`)
  }
  if (cell.area && cell.area !== 'neutral') {
    classes.push(`area-${cell.area}`)
  }
  return classes.join(' ')
}

function getTerrainIcon(terrain?: string): string {
  if (!terrain) return ''
  const t = terrainTypes.find(tt => tt.type === terrain)
  return t?.icon ?? ''
}

function onSizeChange() {
  const targetSize = MAP_SIZES[mapSize.value].boardSize
  while (editedCells.value.length < targetSize) {
    editedCells.value.push({
      id: `cell_${editedCells.value.length}`,
      name: `格子${editedCells.value.length}`,
      type: 'event',
      terrain: 'normal',
      area: 'neutral'
    })
  }
  while (editedCells.value.length > targetSize) {
    editedCells.value.pop()
  }
}

function editCell(index: number) {
  editingCell.value = index
  selectedType.value = editedCells.value[index].type
  selectedTerrain.value = editedCells.value[index].terrain ?? 'normal'
  selectedArea.value = editedCells.value[index].area ?? 'neutral'
}

function openCellEditor(index: number) {
  editCell(index)
}

function deleteCell() {
  if (editingCell.value !== null && editedCells.value.length > 1) {
    editedCells.value.splice(editingCell.value, 1)
    editingCell.value = null
    onSizeChange()
  }
}

function copyCell() {
  if (editingCell.value !== null) {
    copiedCell.value = { ...editedCells.value[editingCell.value] }
  }
}

function pasteCell() {
  if (editingCell.value !== null && copiedCell.value) {
    editedCells.value[editingCell.value] = { ...copiedCell.value, id: `cell_${editingCell.value}` }
  }
}

function loadPreset(preset: any) {
  mapSize.value = preset.size
  mapTheme.value = preset.theme
  editedCells.value = preset.cells.map((c: any, i: number) => ({
    id: c.id || `cell_${i}`,
    name: c.name,
    type: c.type,
    cost: c.cost,
    rent: c.rent,
    eventId: c.eventId,
    terrain: c.terrain || 'normal',
    area: c.area || 'neutral',
    portTargetIndex: c.portTargetIndex,
    stationConfig: c.stationConfig,
    maxLevel: c.maxLevel,
    upgradeCosts: c.upgradeCosts,
    rentByLevel: c.rentByLevel
  }))
  onSizeChange()
}

function resetMap() {
  editedCells.value = [...defaultCells]
  mapSize.value = 'standard'
  editingCell.value = null
}

function saveMap() {
  exportJson.value = JSON.stringify({
    size: mapSize.value,
    theme: mapTheme.value,
    cells: editedCells.value
  }, null, 2)
  showExportModal.value = true
}

function loadMap() {
  const json = prompt('粘贴地图 JSON 配置:')
  if (json) {
    try {
      const data = JSON.parse(json)
      mapSize.value = data.size || 'standard'
      mapTheme.value = data.theme || 'threekingdoms'
      editedCells.value = data.cells
      onSizeChange()
    } catch (e) {
      alert('无效的地图配置')
    }
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(exportJson.value)
  alert('已复制到剪贴板')
}

function testMap() {
  emit('test', editedCells.value)
}
</script>

<style scoped>
.map-editor {
  padding: 20px;
  background: rgba(20, 15, 10, 0.95);
  border-radius: 12px;
  border: 2px solid #d4a574;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.editor-header h2 {
  color: #d4a574;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.editor-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-save { background: #4caf50; color: #fff; }
.btn-load { background: #2196f3; color: #fff; }
.btn-reset { background: #ff9800; color: #fff; }
.btn-test { background: #9c27b0; color: #fff; }

.editor-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.editor-main {
  display: grid;
  grid-template-columns: 200px 1fr 280px;
  gap: 20px;
}

/* 调色板 */
.cell-palette h3,
.cell-properties h3 {
  color: #d4a574;
  font-size: 0.9rem;
  margin: 16px 0 8px 0;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.palette-item:hover,
.palette-item.selected {
  border-color: #d4a574;
  background: rgba(212, 165, 116, 0.2);
}

.palette-icon {
  font-size: 1.2rem;
}

.palette-name {
  font-size: 0.65rem;
  color: #aaa;
  margin-top: 2px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-item {
  padding: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 0.85rem;
}

.preset-item:hover {
  background: rgba(212, 165, 116, 0.2);
}

/* 地图预览 */
.map-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.map-size-selector {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-size-selector label {
  color: #aaa;
}

.map-size-selector select {
  padding: 6px 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid #d4a574;
  border-radius: 4px;
  color: #fff;
}

.board {
  display: grid;
  gap: 4px;
  padding: 16px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
}

.board-small { grid-template-columns: repeat(4, 1fr); }
.board-standard { grid-template-columns: repeat(5, 1fr); }
.board-large { grid-template-columns: repeat(6, 1fr); }
.board-giant { grid-template-columns: repeat(7, 1fr); }

.cell {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(100, 100, 100, 0.2);
  border: 1px solid #5a4a3a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.cell:hover {
  border-color: #d4a574;
  transform: scale(1.05);
}

.cell-index {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 0.6rem;
  color: #666;
}

.cell-name {
  color: #d4a574;
  font-size: 0.7rem;
  text-align: center;
}

.cell-cost {
  color: #ffd700;
  font-size: 0.6rem;
}

.cell-terrain {
  position: absolute;
  bottom: 2px;
  font-size: 0.8rem;
}

.cell.start { background: rgba(212, 165, 116, 0.3); }
.cell.property { background: rgba(100, 150, 100, 0.2); }
.cell.event { background: rgba(150, 100, 100, 0.2); }
.cell.store { background: rgba(100, 100, 200, 0.2); }
.cell.tax { background: rgba(200, 100, 100, 0.2); }
.cell.treasure { background: rgba(255, 215, 0, 0.15); }
.cell.fate { background: rgba(147, 112, 219, 0.2); }
.cell.station { background: rgba(139, 69, 19, 0.3); }
.cell.port { background: rgba(30, 144, 255, 0.2); }
.cell.teleport_entry,
.cell.teleport_exit { background: rgba(138, 43, 226, 0.2); }
.cell.obstacle { background: rgba(105, 105, 105, 0.3); }
.cell.prison { background: rgba(128, 128, 128, 0.3); }

.terrain-mountain { border-color: #8b4513; }
.terrain-water { border-color: #1e90ff; }
.terrain-castle { border-color: #ffd700; }
.terrain-wasteland { border-color: #d2691e; }

.area-wei { box-shadow: inset 0 0 10px rgba(255, 0, 0, 0.3); }
.area-shu { box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.3); }
.area-wu { box-shadow: inset 0 0 10px rgba(0, 0, 255, 0.3); }

/* 属性面板 */
.cell-properties {
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  padding: 16px;
}

.property-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  color: #aaa;
  font-size: 0.8rem;
}

.form-group input,
.form-group select {
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border: 1px solid #5a4a3a;
  border-radius: 4px;
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.form-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete { background: #f44336; color: #fff; }
.btn-copy { background: #2196f3; color: #fff; }
.btn-paste { background: #ff9800; color: #fff; }

.no-selection {
  color: #666;
  text-align: center;
  padding: 40px 0;
}

/* 导出模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border: 2px solid #d4a574;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  color: #d4a574;
  margin-top: 0;
}

.export-textarea {
  width: 100%;
  height: 200px;
  background: rgba(0,0,0,0.3);
  border: 1px solid #5a4a3a;
  border-radius: 4px;
  color: #fff;
  padding: 12px;
  font-family: monospace;
  resize: none;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #d4a574;
  color: #1a1a2e;
  font-weight: bold;
}
</style>
