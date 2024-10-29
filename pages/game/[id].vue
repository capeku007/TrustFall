// pages/game/[id].vue
<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
        <p class="text-red-600">{{ error }}</p>
        <button 
          @click="router.push('/gamemenu')"
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Return to Menu
        </button>
      </div>
    </div>

    <GamePlay 
      v-else-if="currentGame"
      :game="currentGame"
      @game-completed="handleGameComplete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import GamePlay from '~/components/GamePlay.vue'

const route = useRoute()
const router = useRouter()
const { currentGame, loading: gameLoading, error: gameError, fetchGame, cleanupGameListener } = useGame()

const isLoading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const gameId = route.params.id
    if (!gameId) {
      throw new Error('No game ID provided')
    }

    const game = await fetchGame(gameId)
    if (!game) {
      throw new Error('Game not found')
    }

  } catch (err) {
    console.error('Error loading game:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  cleanupGameListener()
})

const handleGameComplete = () => {
  router.push('/gamemenu')
}
</script>