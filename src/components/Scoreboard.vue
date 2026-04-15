<template>
  <div class="scoreboard">
    <div
      v-for="(player, index) in players"
      :key="player.id"
      class="player-info"
      :class="{ active: index === currentPlayerIndex && player.inGame }"
    >
      <img :src="player.character.image" class="avatar" :alt="player.character.name" />
      <div class="player-details">
        <div class="player-header">
          <span class="name">{{ player.character.name }}</span>
          <span v-if="player.skillLevel > 1" class="skill-level">Lv.{{ player.skillLevel }}</span>
          <span v-if="player.shieldActive" class="shield-active" title="免罪符激活">🛡️</span>
        </div>
        <div class="money-row">
          <span class="money">💰 {{ player.money }}</span>
        </div>
        <div class="player-stats">
          <span class="property-count" title="地产数量">🏠 {{ player.properties.length }}</span>
          <span v-if="player.items.length > 0" class="item-count" title="道具数量">🎒 {{ player.items.length }}</span>
        </div>
        <div class="skill-desc">{{ getSkillDescription(player) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '../types/game'
import { PROPERTY_LEVELS } from '../config'

defineProps({
  players: {
    type: Array as () => Player[],
    required: true
  },
  currentPlayerIndex: {
    type: Number,
    required: true
  }
})

function getSkillDescription(player: Player): string {
  const upgrade = player.character.skillUpgrades?.[player.skillLevel - 1]
  return upgrade?.description ?? player.character.skill
}
</script>

<style scoped>
.scoreboard {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.player-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(30, 25, 20, 0.95);
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid #5a4a3a;
  transition: all 0.3s ease;
  min-width: 180px;
}

.player-info.active {
  border-color: #ffcc00;
  box-shadow: 0 0 15px rgba(255, 204, 0, 0.4);
  background: rgba(40, 35, 25, 0.98);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #d4a574;
  object-fit: cover;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name {
  color: #d4a574;
  font-weight: bold;
  font-size: 1rem;
}

.skill-level {
  background: linear-gradient(135deg, #d4a574, #8b5a2b);
  color: #fff;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: bold;
}

.shield-active {
  font-size: 0.9rem;
}

.money-row {
  display: flex;
  align-items: center;
}

.money {
  color: #ffd700;
  font-weight: bold;
  font-size: 0.95rem;
}

.player-stats {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: #aaa;
}

.property-count {
  cursor: help;
}

.item-count {
  cursor: help;
}

.skill-desc {
  color: #888;
  font-size: 0.7rem;
  max-width: 130px;
  line-height: 1.2;
}
</style>
