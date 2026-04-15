<template>
  <div class="scoreboard">
    <div
      v-for="(player, index) in players"
      :key="player.id"
      class="player-info"
      :class="{ active: index === currentPlayerIndex && player.inGame }"
    >
      <img :src="player.character.image" class="avatar" :alt="player.character.name" />
      <span class="name">{{ player.character.name }}</span>
      <span class="money">金币: {{ player.money }}</span>
      <span class="skill">{{ player.character.skill }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  players: {
    type: Array,
    required: true
  },
  currentPlayerIndex: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.scoreboard {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 25, 20, 0.9);
  padding: 10px 15px;
  border-radius: 8px;
  border: 2px solid #5a4a3a;
  transition: all 0.3s ease;
}

.player-info.active {
  border-color: #ffcc00;
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #d4a574;
}

.name {
  color: #d4a574;
  font-weight: bold;
}

.money {
  color: #ffcc00;
}

.skill {
  color: #a0a0a0;
  font-size: 0.75rem;
}
</style>
