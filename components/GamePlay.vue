// components/GamePlay.vue
<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <!-- Error State -->
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

    <!-- Game Content -->
    <template v-else-if="currentGame">
      <!-- Game Header -->
      <div class="max-w-3xl mx-auto mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ currentGame.scenario?.title || 'Loading...' }}
              </h1>
              <p class="mt-1 text-sm text-gray-500">
                Round {{ currentGame.currentRound }} of 5
              </p>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="h-2 bg-gray-200 rounded-full">
              <div 
                class="h-2 bg-purple-600 rounded-full transition-all duration-500" 
                :style="{ width: `${(currentGame.currentRound / 5) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Game Area -->
      <div class="max-w-3xl mx-auto">
        <!-- Round Information -->
        <div v-if="currentRound && !showingResults" class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900">{{ currentRound.title }}</h2>
          <p class="mt-2 text-gray-600">{{ currentRound.description }}</p>

          <!-- Choice Buttons -->
          <div v-if="!hasPlayerMadeChoice" class="mt-8 grid grid-cols-2 gap-4">
            <button
              v-for="(choice, key) in currentRound.choices"
              :key="key"
              @click="makePlayerChoice(key)"
              :disabled="playerChoice !== null"
              class="flex flex-col items-center p-6 border-2 rounded-lg transition-colors"
              :class="{
                'border-purple-500 bg-purple-50': playerChoice === key && key === 'cooperate',
                'border-red-500 bg-red-50': playerChoice === key && key === 'betray',
                'border-gray-200 hover:border-purple-500 hover:bg-purple-50': playerChoice !== key
              }"
            >
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                :class="key === 'cooperate' ? 'bg-purple-100' : 'bg-red-100'"
              >
                <span :class="key === 'cooperate' ? 'text-purple-600' : 'text-red-600'">
                  {{ key === 'cooperate' ? '✓' : '✗' }}
                </span>
              </div>
              <h3 class="font-semibold text-gray-900">{{ choice.text }}</h3>
              <p class="mt-1 text-sm text-gray-500 text-center">{{ choice.description }}</p>
            </button>
          </div>

          <!-- Game End Screen -->
          <div v-if="isGameOver" class="mt-8 text-center">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Game Over!</h2>
    <div class="mb-6">
      <p class="text-xl">
        {{ getWinnerMessage() }}
      </p>
    </div>
    <button
      @click="$emit('game-complete')"
      class="w-full inline-flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
    >
      View Game Summary
    </button>
  </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import { useAuthStore } from '~/stores/authStore'

const props = defineProps({
  gameId: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { currentGame, error: gameError, loading: gameLoading, fetchGame, makeChoice, cleanupGameListener } = useGame()

// State
const playerChoice = ref(null)
const aiChoice = ref(null)
const showingResults = ref(false)
const isLoading = ref(true)
const error = ref(null)

// Computed
const hasPlayerMadeChoice = computed(() => playerChoice.value !== null)

defineEmits(['game-complete'])
const currentRound = computed(() => {
  if (!currentGame.value?.scenario?.rounds) return null
  return currentGame.value.scenario.rounds.find(
    round => round.id === currentGame.value.currentRound
  )
})

const isGameOver = computed(() => {
  return currentGame.value?.currentRound === 5
})

// Methods
const makePlayerChoice = async (choice) => {
  if (playerChoice.value || !currentGame.value) return
  
  playerChoice.value = choice
  try {
    await makeChoice(
      props.gameId,
      currentGame.value.currentRound,
      choice
    )
    
    if (!isGameOver.value) {
      playerChoice.value = null
      aiChoice.value = null
    }
  } catch (err) {
    console.error('Error making choice:', err)
    error.value = err.message
  }
}

const getWinnerMessage = () => {
  const playerScore = currentGame.value?.players[authStore.user.uid]?.score || 0
  const aiScore = currentGame.value?.players?.ai?.score || 0
  
  if (playerScore > aiScore) return "Congratulations! You Won! 🎉"
  if (aiScore > playerScore) return "AI Wins! Better luck next time!"
  return "It's a tie!"
}

const navigateToSummary = () => {
  // Option 1: Using navigateTo (preferred in Nuxt 3)
  navigateTo(`/game/${props.gameId}/summary`)
  
  // If that doesn't work, try this alternative:
  // await router.push(`/game/${props.gameId}/summary`)
}
// Lifecycle hooks
onMounted(async () => {
  isLoading.value = true
  error.value = null

  try {
    if (!props.gameId) {
      throw new Error('No game ID provided')
    }

    const game = await fetchGame(props.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (!game.players?.[authStore.user?.uid]) {
      throw new Error('Unauthorized access to game')
    }

  } catch (err) {
    console.error('Error loading game:', err)
    error.value = err.message
    setTimeout(() => {
      router.push('/gamemenu')
    }, 2000)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  cleanupGameListener()
})
</script>