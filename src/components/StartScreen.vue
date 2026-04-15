<template>
  <div id="start-screen" class="start-screen">
    <h1>选择你的英雄</h1>
    <div class="character-selection">
      <div
        v-for="char in characters"
        :key="char.id"
        class="character-card"
        @click="$emit('select', char)"
      >
        <img :src="char.image" :alt="char.name" />
        <h3>{{ char.name }}</h3>
        <p>{{ char.skill }}</p>
      </div>
    </div>
    <p id="selection-info" class="selection-info">{{ selectionInfo }}</p>
  </div>
</template>

<script setup>
defineProps({
  characters: {
    type: Array,
    required: true
  },
  selectionInfo: {
    type: String,
    default: '点击一个角色为玩家 1 选择英雄'
  }
})

defineEmits(['select'])
</script>

<style scoped>
.start-screen {
  text-align: center;
  padding: 20px;
}

.start-screen h1 {
  color: #d4a574;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.character-selection {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.character-card {
  background: linear-gradient(145deg, #2a2a3d, #1a1a2e);
  border: 2px solid #d4a574;
  border-radius: 12px;
  padding: 20px;
  width: 160px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.character-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(212, 165, 116, 0.3);
}

.character-card img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 50%;
  background: #0a0a15;
  padding: 10px;
}

.character-card h3 {
  color: #d4a574;
  margin: 10px 0;
  font-size: 1.2rem;
}

.character-card p {
  color: #a0a0a0;
  font-size: 0.85rem;
  margin: 0;
}

.selection-info {
  margin-top: 30px;
  color: #d4a574;
  font-size: 1.1rem;
}
</style>
