<!-- pages/game/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
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
        <button @click="router.push('/gamemenu')" 
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
          Return to Menu
        </button>
      </div>
    </div>

    <!-- Game Content -->
    <div v-else-if="currentGame">
      <GamePlay 
        v-if="currentGame.status === 'active'"
        :game="currentGame"
        @game-completed="showGameSummary" 
      />

      <GameSummary 
        v-else-if="currentGame.status === 'completed'"
        :game="currentGame"
        @play-again="startNewGame"
        @go-home="goHome"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import { useAuthStore } from '~/stores/authStore'
import GamePlay from '~/components/GamePlay.vue'
import GameSummary from '~/components/GameSummary.vue'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { currentGame, error: gameError, loading: gameLoading, fetchGame } = useGame()
const { showModal } = useModal()

// Local state
const isLoading = ref(true)
const error = ref(null)

// Methods
const showGameSummary = () => {
  if (currentGame.value) {
    currentGame.value.status = 'completed'
  }
}

const startNewGame = () => {
  showModal('startModal')
}

const goHome = () => {
  router.push('/gamemenu')
}

// Initialize game
onMounted(async () => {
  try {
    // Check authentication first
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    const gameId = route.params.id
    if (!gameId) {
      throw new Error('No game ID provided')
    }

    // Fetch game data
    await fetchGame(gameId)
    
    // Validate game exists and belongs to user
    if (!currentGame.value) {
      throw new Error('Game not found')
    }

    if (!currentGame.value.players[authStore.user.uid]) {
      throw new Error('Unauthorized access to game')
    }

  } catch (err) {
    console.error('Error loading game:', err)
    error.value = err.message
    // Redirect to menu after a short delay if there's an error
    setTimeout(() => {
      router.push('/gamemenu')
    }, 2000)
  } finally {
    isLoading.value = false
  }
})
</script>