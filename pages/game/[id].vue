<template>
  <div>
    <GamePlay 
      v-if="!showingSummary" 
      :gameId="gameId" 
      @game-complete="onGameComplete"
    />
    <GameSummary 
      v-if="showingSummary"
      :gameId="gameId" 
      key="summary"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.params.id
const showingSummary = ref(false)

const onGameComplete = () => {
  showingSummary.value = true
}
</script>