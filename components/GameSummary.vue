<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div
    ref="bottomSheet"
    id="startModal"
    tabindex="-1"
    data-modal-target="startModal"
    data-modal-placement="bottom"
    aria-hidden="true"
    class="fixed bottom-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
  >
    <StartGame/>
  </div>

    <div class="max-w-3xl mx-auto">
      <!-- Summary Card -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Game Summary</h1>
        
        <!-- Final Scores -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div class="text-center p-6 bg-purple-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Your Final Score</h2>
            <p class="text-4xl font-bold text-purple-600">{{ playerScore }}</p>
            <p class="mt-2 text-sm text-gray-500">
              {{ getScoreDescription(playerScore) }}
            </p>
          </div>
          
          <div class="text-center p-6 bg-indigo-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">AI Final Score</h2>
            <p class="text-4xl font-bold text-indigo-600">{{ aiScore }}</p>
            <p class="mt-2 text-sm text-gray-500">
              {{ getScoreDescription(aiScore) }}
            </p>
          </div>
        </div>

        <!-- Round by Round Breakdown -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Round Breakdown</h2>
          <div class="space-y-4">
            <div v-for="round in rounds" :key="round.id" 
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-900">Round {{ round.id }}: {{ round.title }}</h3>
                <div class="flex items-center space-x-4">
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="{
                        'bg-purple-100': getPlayerChoice(round.id) === 'cooperate',
                        'bg-red-100': getPlayerChoice(round.id) === 'betray'
                      }"
                    >
                      <span v-if="getPlayerChoice(round.id) === 'cooperate'" 
                        class="text-purple-600 text-lg">✓</span>
                      <span v-else-if="getPlayerChoice(round.id) === 'betray'"
                        class="text-red-600 text-lg">✗</span>
                    </div>
                    <span class="mx-2 text-sm font-medium text-gray-600">vs</span>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="{
                        'bg-purple-100': getAIChoice(round.id) === 'cooperate',
                        'bg-red-100': getAIChoice(round.id) === 'betray'
                      }"
                    >
                      <span v-if="getAIChoice(round.id) === 'cooperate'" 
                        class="text-purple-600 text-lg">✓</span>
                      <span v-else-if="getAIChoice(round.id) === 'betray'"
                        class="text-red-600 text-lg">✗</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-purple-600">
                      +{{ getRoundScore(round.id).playerScore }}
                    </span>
                    <span class="text-sm text-gray-400">/</span>
                    <span class="text-sm font-medium text-indigo-600">
                      +{{ getRoundScore(round.id).aiScore }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Analysis -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Game Analysis</h2>
          <div class="p-4 bg-gray-50 rounded-lg">
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Cooperation Rate</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">
                  {{ calculateCooperationRate }}%
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Best Round</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">
                  Round {{ bestRound }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
  @click="showModal('startModal')"
            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Play Again
          </button>
          <button
            @click="goHome"
            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import { useAuthStore } from '~/stores/authStore'

const props = defineProps({
  gameId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const { currentGame, fetchGame } = useGame()
const authStore = useAuthStore()

// Fetch game data on mount
onMounted(async () => {
  await fetchGame(props.gameId)
})
const { showModal, hideModal } = useModal();
definePageMeta({
  middleware: ['auth']
})
// Computed properties
const playerScore = computed(() => {
  if (!currentGame.value?.players || !authStore.user?.uid) return 0
  return currentGame.value.players[authStore.user.uid]?.score || 0
})

const aiScore = computed(() => {
  if (!currentGame.value?.players?.ai) return 0
  return currentGame.value.players.ai?.score || 0
})

const rounds = computed(() => {
  return currentGame.value?.scenario?.rounds || []
})

const calculateCooperationRate = computed(() => {
  if (!currentGame.value?.players || !authStore.user?.uid) return 0
  const choices = currentGame.value.players[authStore.user.uid]?.choices || {}
  const playerChoices = Object.values(choices)
  if (playerChoices.length === 0) return 0
  
  const cooperateCount = playerChoices.filter(choice => choice === 'cooperate').length
  return Math.round((cooperateCount / playerChoices.length) * 100)
})

const bestRound = computed(() => {
  let bestScore = 0
  let bestRoundNum = 1
  
  for (let i = 1; i <= 5; i++) {
    const roundScore = getRoundScore(i).playerScore
    if (roundScore > bestScore) {
      bestScore = roundScore
      bestRoundNum = i
    }
  }
  
  return bestRoundNum
})

// Methods
const getPlayerChoice = (roundId) => {
  if (!currentGame.value?.players || !authStore.user?.uid) return null
  return currentGame.value.players[authStore.user.uid]?.choices?.[roundId]
}

const getAIChoice = (roundId) => {
  if (!currentGame.value?.players?.ai?.choices) return null
  return currentGame.value.players.ai.choices[roundId]
}

const getRoundScore = (roundId) => {
  const playerChoice = getPlayerChoice(roundId)
  const aiChoice = getAIChoice(roundId)
  
  if (!playerChoice || !aiChoice) {
    return { playerScore: 0, aiScore: 0 }
  }
  
  if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
    return { playerScore: 3, aiScore: 3 }
  } else if (playerChoice === 'betray' && aiChoice === 'cooperate') {
    return { playerScore: 5, aiScore: 0 }
  } else if (playerChoice === 'cooperate' && aiChoice === 'betray') {
    return { playerScore: 0, aiScore: 5 }
  } else {
    return { playerScore: 1, aiScore: 1 }
  }
}

const getScoreDescription = (score) => {
  if (score >= 20) return 'Masterful Performance!'
  if (score >= 15) return 'Well Played!'
  if (score >= 10) return 'Good Game!'
  return 'Better Luck Next Time'
}

const playAgain = () => {
  router.push('/new-game')
}

const goHome = () => {
  router.push('/gamemenu')
}
</script>