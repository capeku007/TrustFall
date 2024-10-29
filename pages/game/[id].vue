// pages/game/[id].vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Debug Info -->
    <div v-if="debug" class="p-4 bg-gray-100 text-xs">
      <pre>Loading: {{ isLoading }}</pre>
      <pre>Error: {{ error }}</pre>
      <pre>Game ID: {{ route.params.id }}</pre>
      <!-- <pre>Game Data: {{ currentGame }}</pre> -->
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading game...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-2">{{ error }}</h3>
        <button 
          @click="returnToMenu" 
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Return to Menu
        </button>
      </div>
    </div>

    <!-- Game Content -->
    <GamePlay 
      v-else-if="currentGame && !isLoading"
      :game="currentGame"
      @game-completed="handleGameComplete" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import { useAuthStore } from '~/stores/authStore'
import GamePlay from '~/components/GamePlay.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { currentGame, fetchGame, cleanupGameListener } = useGame()

// State
const isLoading = ref(true)
const error = ref(null)
const debug = ref(true) // Set to false in production
let isUnmounting = false

// Methods
const handleGameComplete = () => {
  router.push('/gamemenu')
}

const returnToMenu = () => {
  cleanupGameListener()
  router.push('/gamemenu')
}

const initializeGame = async () => {
  if (isUnmounting) return
  
  isLoading.value = true
  error.value = null

  try {
    console.log('Initializing game with ID:', route.params.id)

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    if (!route.params.id) {
      throw new Error('No game ID provided')
    }

    console.log('Fetching game data...')
    const game = await fetchGame(route.params.id)
    
    console.log('Game data received:', game)
    
    if (!game) {
      throw new Error('Game not found')
    }

    if (!game.players?.[authStore.user?.uid]) {
      throw new Error('Unauthorized access to game')
    }

    // Validate game data
    if (!game.scenario || !game.currentRound) {
      throw new Error('Invalid game data')
    }

  } catch (err) {
    console.error('Error initializing game:', err)
    error.value = err.message
  } finally {
    if (!isUnmounting) {
      isLoading.value = false
    }
  }
}

// Watch for route changes
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    initializeGame()
  }
})

// Watch for game state changes
watch(currentGame, (newGame, oldGame) => {
  console.log('Game state updated:', newGame)
  if (!newGame && oldGame && !isUnmounting) {
    error.value = 'Game data lost. Please try again.'
    isLoading.value = false
  }
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  console.log('Game page mounted')
  isUnmounting = false
  initializeGame()
})

onUnmounted(() => {
  console.log('Game page unmounting')
  isUnmounting = true
  if (cleanupGameListener) {
    cleanupGameListener()
  }
})
</script>