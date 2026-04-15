<template>
  <div id="message" class="message">
    <p v-for="(msg, index) in messages" :key="index">{{ msg }}</p>
  </div>
</template>

<script setup>
defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.message {
  max-height: 150px;
  overflow-y: auto;
  background: rgba(20, 15, 10, 0.9);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #5a4a3a;
  width: 100%;
  max-width: 500px;
}

.message p {
  margin: 5px 0;
  color: #d4a574;
  font-size: 0.9rem;
}

.message p:last-child {
  color: #ffcc00;
}
</style>
