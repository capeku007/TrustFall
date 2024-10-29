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
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">Your Score</p>
                <p class="text-2xl font-bold text-purple-600">{{ playerScore }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">AI Score</p>
                <p class="text-2xl font-bold text-indigo-600">{{ aiScore }}</p>
              </div>
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
              @click="makePlayerChoice('cooperate')"
              class="flex flex-col items-center p-6 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              :class="{'border-purple-500 bg-purple-50': playerChoice === 'cooperate', 'border-gray-200': playerChoice !== 'cooperate'}"
            >
              <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900">{{ currentRound.choices?.cooperate?.text }}</h3>
              <p class="mt-1 text-sm text-gray-500 text-center">{{ currentRound.choices?.cooperate?.description }}</p>
            </button>

            <button
              @click="makePlayerChoice('betray')"
              class="flex flex-col items-center p-6 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
              :class="{'border-red-500 bg-red-50': playerChoice === 'betray', 'border-gray-200': playerChoice !== 'betray'}"
            >
              <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900">{{ currentRound.choices?.betray?.text }}</h3>
              <p class="mt-1 text-sm text-gray-500 text-center">{{ currentRound.choices?.betray?.description }}</p>
            </button>
          </div>

          <!-- Waiting for AI -->
          <div v-if="hasPlayerMadeChoice && !showingResults" class="mt-8">
            <div class="flex items-center justify-center space-x-2">
              <svg class="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-600">Waiting for AI's decision...</span>
            </div>
          </div>
        </div>

        <!-- Round Results -->
        <div v-if="showingResults" class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Round Results</h2>
          
          <div class="grid grid-cols-2 gap-8">
            <!-- Player Choice -->
            <div class="text-center">
              <p class="text-sm font-medium text-gray-500 mb-2">Your Choice</p>
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                :class="{
                  'bg-purple-100': playerChoice === 'cooperate',
                  'bg-red-100': playerChoice === 'betray'
                }"
              >
                <svg v-if="playerChoice === 'cooperate'" class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <svg v-else class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="font-medium text-gray-900">
                {{ currentRound?.choices[playerChoice]?.text }}
              </p>
            </div>

            <!-- AI Choice -->
            <div class="text-center">
              <p class="text-sm font-medium text-gray-500 mb-2">AI's Choice</p>
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                :class="{
                  'bg-purple-100': aiChoice === 'cooperate',
                  'bg-red-100': aiChoice === 'betray'
                }"
              >
                <svg v-if="aiChoice === 'cooperate'" class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <svg v-else class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="font-medium text-gray-900">
                {{ currentRound?.choices[aiChoice]?.text }}
              </p>
            </div>
          </div>

          <!-- Round Score -->
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-around">
              <div class="text-center">
                <p class="text-sm font-medium text-gray-500">You Earned</p>
                <p class="text-2xl font-bold text-purple-600">+{{ roundScore.playerScore }}</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-gray-500">AI Earned</p>
                <p class="text-2xl font-bold text-indigo-600">+{{ roundScore.aiScore }}</p>
              </div>
            </div>
          </div>

          <!-- Next Round Button -->
          <button
            v-if="!isGameOver"
            @click="proceedToNextRound"
            class="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Continue to Next Round
          </button>

          <!-- Game Over Button -->
          <button
            v-else
            @click="showGameSummary"
            class="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            View Game Summary
          </button>
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { currentGame, error: gameError, loading: gameLoading, fetchGame, cleanupGameListener } = useGame()

// State
const playerChoice = ref(null)
const aiChoice = ref(null)
const showingResults = ref(false)
const roundScore = ref({ playerScore: 0, aiScore: 0 })
const isLoading = ref(true)
const error = ref(null)

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
})

// Use the game prop instead of currentGame from useGame
const playerScore = computed(() => {
  if (!props.game?.players || !authStore.user?.uid) return 0
  return props.game.players[authStore.user.uid]?.score || 0
})

const aiScore = computed(() => {
  if (!props.game?.players?.ai) return 0
  return props.game.players.ai.score || 0
})

const currentRound = computed(() => {
  if (!props.game?.scenario?.rounds) return null
  return props.game.scenario.rounds.find(
    round => round.id === props.game.currentRound
  )
})
//
const hasPlayerMadeChoice = computed(() => playerChoice.value !== null)

const isGameOver = computed(() => {
  return currentGame.value?.currentRound === 5 && showingResults.value
})

// Methods
const makePlayerChoice = async (choice) => {
  if (playerChoice.value || !currentGame.value) return
  
  playerChoice.value = choice
  try {
    const result = await makeChoice(
      route.params.id,
      currentGame.value.currentRound,
      choice
    )
    
    // Short delay to simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (result?.players?.ai?.choices) {
      aiChoice.value = result.players.ai.choices[currentGame.value.currentRound]
      roundScore.value = {
        playerScore: (result.players[authStore.user.uid]?.score || 0) - (playerScore.value || 0),
        aiScore: (result.players.ai?.score || 0) - (aiScore.value || 0)
      }
      showingResults.value = true
    }
  } catch (error) {
    console.error('Error making choice:', error)
    error.value = error.message
  }
}

const proceedToNextRound = () => {
  playerChoice.value = null
  aiChoice.value = null
  showingResults.value = false
}

const showGameSummary = () => {
  router.push(`/game/${route.params.id}/summary`)
}

// Lifecycle hooks
onMounted(async () => {
  isLoading.value = true
  error.value = null

  try {
    if (!route.params.id) {
      throw new Error('No game ID provided')
    }

    const game = await fetchGame(route.params.id)
    if (!game) {
      throw new Error('Game not found')
    }

    if (!game.players?.[authStore.user?.uid]) {
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

onUnmounted(() => {
  cleanupGameListener()
})
</script>

