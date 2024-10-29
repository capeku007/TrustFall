<!-- pages/game/[id].vue -->
<template>
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center min-h-screen">
        <div class="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
          <div class="text-red-500 mb-4">
            <svg class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ error }}</h3>
          <button @click="navigateTo('/')" 
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            Return Home
          </button>
        </div>
      </div>
  
      <!-- Game Content -->
      <template v-else>
        <!-- Show GamePlay component when game is active -->
        <GamePlay 
          v-if="currentGame?.status === 'active'"
          @game-completed="showGameSummary" 
        />
  
        <!-- Show GameSummary component when game is completed -->
        <GameSummary 
          v-else-if="currentGame?.status === 'completed'"
          @play-again="startNewGame"
          @go-home="goHome"
        />
      </template>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import GamePlay from '~/components/GamePlay.vue'
  import GameSummary from '~/components/GameSummary.vue'
  
  const route = useRoute()
  const router = useRouter()
  const { currentGame, error: gameError, loading: gameLoading, fetchGame } = useGame()
  const { showModal } = useModal()
  
  // Local state
  const loading = ref(true)
  const error = ref(null)
  
  // Methods
  const showGameSummary = () => {
    // Update game status if needed
    router.push(`/game/${route.params.id}/summary`)
  }
  
  const startNewGame = () => {
    showModal('startModal')
  }
  
  const goHome = () => {
    router.push('/')
  }
  
  // Initialize game
  onMounted(async () => {
    try {
      if (!route.params.id) {
        throw new Error('No game ID provided')
      }
  
      await fetchGame(route.params.id)
      
      if (!currentGame.value) {
        throw new Error('Game not found')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading game:', err)
    } finally {
      loading.value = false
    }
  })
  </script>