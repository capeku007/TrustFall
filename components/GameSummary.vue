<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <div v-else-if="localError" class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
        <p class="text-red-600">{{ localError }}</p>
        <button @click="router.push('/gamemenu')" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
          Return to Menu
        </button>
      </div>
    </div>

    <div v-else-if="currentGame" class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <!-- Game Summary -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Game Summary</h2>
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">Your Score</p>
              <p class="text-2xl font-bold text-purple-600">{{ playerScore }}</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">AI Score</p>
              <p class="text-2xl font-bold text-blue-600">{{ aiScore }}</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-500">DM Points</p>
              <p class="text-2xl font-bold text-green-600">{{ currentGame.dmPoints || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Round Analysis -->
        <div v-if="roundAnalysis.length > 0">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Round by Round Analysis</h3>
          <div class="space-y-4">
            <div v-for="(round, index) in roundAnalysis" :key="index" 
                 class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-semibold text-gray-900">Round {{ index + 1 }}</h4>
              <div class="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p class="text-sm text-gray-600">Your Choice: 
                    <span :class="getChoiceColor(round.playerChoice)">
                      {{ formatChoice(round.playerChoice) }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-600">Your Roll: {{ formatDiceRoll(round.playerRoll) }}</p>
                  <p class="text-sm text-gray-600">Points: {{ round.playerPoints }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">AI Choice: 
                    <span :class="getChoiceColor(round.aiChoice)">
                      {{ formatChoice(round.aiChoice) }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-600">AI Roll: {{ formatDiceRoll(round.aiRoll) }}</p>
                  <p class="text-sm text-gray-600">Points: {{ round.aiPoints }}</p>
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-2 italic">{{ round.narrative }}</p>
            </div>
          </div>
        </div>

        <!-- Return to Menu Button -->
        <div class="mt-8">
          <button @click="router.push('/gamemenu')"
                  class="w-full inline-flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const authStore = useAuthStore()
const { currentGame, loading, error: gameError, fetchGame } = useGame()

const localError = ref(null)

onMounted(async () => {
  try {
    await fetchGame(props.gameId)
  } catch (err) {
    console.error('Error loading game summary:', err)
    localError.value = err.message || 'Failed to load game summary'
  }
})

const playerScore = computed(() => {
  if (!currentGame.value?.players?.[authStore.user?.uid]) return 0
  return currentGame.value.players[authStore.user.uid].score || 0
})

const aiScore = computed(() => {
  if (!currentGame.value?.players?.ai) return 0
  return currentGame.value.players.ai.score || 0
})

const roundAnalysis = computed(() => {
  if (!currentGame.value?.choiceHistory) return []
  
  return currentGame.value.choiceHistory.map((round, index) => {
    const playerRound = currentGame.value?.players?.[authStore.user?.uid]?.choices?.[index + 1] || {}
    const aiRound = currentGame.value?.players?.ai?.choices?.[index + 1] || {}
    
    return {
      playerChoice: round.playerChoice,
      aiChoice: round.aiChoice,
      playerRoll: playerRound.diceRoll,
      aiRoll: aiRound.diceRoll,
      playerPoints: playerRound.outcome?.total || 0,
      aiPoints: aiRound.outcome?.total || 0,
      narrative: round.narrative || 'Round completed'
    }
  })
})

const getChoiceColor = (choice) => {
  switch (choice?.toLowerCase()) {
    case 'cooperate': return 'text-green-600'
    case 'negotiate': return 'text-purple-600'
    case 'betray': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const formatChoice = (choice) => {
  if (!choice) return 'Unknown'
  return choice.charAt(0).toUpperCase() + choice.slice(1)
}

const formatDiceRoll = (roll) => {
  if (!roll) return 'No roll'
  return `${roll.diceRoll} (${roll.finalResult})`
}
</script>