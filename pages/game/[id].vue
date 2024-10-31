<template>
  <GamePlay 
    v-if="!showingSummary" 
    :gameId="route.params.id" 
    @game-complete="showingSummary = true"
  />
  <GameSummary 
    v-if="showingSummary" 
    :gameId="route.params.id" 
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: ['auth'],
  layout: "ingame",
})
const route = useRoute()
const showingSummary = ref(false)
</script>