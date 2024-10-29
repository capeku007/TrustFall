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
            <!-- Only show scores at game end -->
            <div v-if="isGameOver" class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">Final Scores</p>
                <p class="text-2xl font-bold text-purple-600">
                  You: {{ playerScore }} | AI: {{ aiScore }}
                </p>
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
                <span :class="playerChoice === 'cooperate' ? 'text-purple-600' : 'text-red-600'">
                  {{ playerChoice === 'cooperate' ? '✓' : '✗' }}
                </span>
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
                <span :class="aiChoice === 'cooperate' ? 'text-purple-600' : 'text-red-600'">
                  {{ aiChoice === 'cooperate' ? '✓' : '✗' }}
                </span>
              </div>
              <p class="font-medium text-gray-900">
                {{ currentRound?.choices[aiChoice]?.text }}
              </p>
            </div>
          </div>

          <!-- Continue/Summary Button -->
          <button
            @click="isGameOver ? showGameSummary() : proceedToNextRound()"
            class="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
            :class="isGameOver ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'"
          >
            {{ isGameOver ? 'View Game Summary' : 'Continue to Next Round' }}
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
const { currentGame, error: gameError, loading: gameLoading, fetchGame, makeChoice, cleanupGameListener } = useGame()

// State
const playerChoice = ref(null)
const aiChoice = ref(null)
const showingResults = ref(false)
const roundScore = ref({ playerScore: 0, aiScore: 0 })
const isLoading = ref(true)
const error = ref(null)

// Computed
const hasPlayerMadeChoice = computed(() => playerChoice.value !== null)

const currentRound = computed(() => {
  if (!currentGame.value?.scenario?.rounds) return null
  return currentGame.value.scenario.rounds.find(
    round => round.id === currentGame.value.currentRound
  )
})

const isGameOver = computed(() => {
  return currentGame.value?.currentRound === 5 && showingResults.value
})

const playerScore = computed(() => {
  if (!currentGame.value?.players || !authStore.user?.uid) return 0
  return currentGame.value.players[authStore.user.uid]?.score || 0
})

const aiScore = computed(() => {
  if (!currentGame.value?.players?.ai) return 0
  return currentGame.value.players.ai.score || 0
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
    
    if (result?.players?.ai?.choices) {
      aiChoice.value = result.players.ai.choices[currentGame.value.currentRound]
      roundScore.value = {
        playerScore: (result.players[authStore.user.uid]?.score || 0) - (playerScore.value || 0),
        aiScore: (result.players.ai?.score || 0) - (aiScore.value || 0)
      }
      showingResults.value = true
    }
  } catch (err) {
    console.error('Error making choice:', err)
    error.value = err.message
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