<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div ref="bottomSheet" id="startModal" tabindex="-1" data-modal-target="startModal" data-modal-placement="bottom" aria-hidden="true" class="fixed bottom-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
      <StartGame/>
    </div>

    <div class="max-w-3xl mx-auto">
      <!-- Summary Card -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Criminal Empire Report</h1>
        <p class="text-gray-600 mb-6">{{ getGameOutcomeSummary }}</p>
        
        <!-- Reputation Stats -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Your Score</h2>
            <p class="text-3xl font-bold text-purple-600">{{ playerScore }}</p>
            <p class="mt-2 text-sm text-gray-500">{{ getReputationStatus }}</p>
          </div>
          
          <div class="text-center p-4 bg-indigo-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">DM's Take</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ currentGame?.dmPoints || 0 }}</p>
            <p class="mt-2 text-sm text-gray-500">{{ getDungeonMasterImpact }}</p>
          </div>

          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Rival's Score</h2>
            <p class="text-3xl font-bold text-blue-600">{{ aiScore }}</p>
            <p class="mt-2 text-sm text-gray-500">{{ getRivalStatus }}</p>
          </div>
        </div>

        <!-- Strategic Analysis -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Criminal Profile</h2>
          <div class="bg-gray-50 rounded-lg p-4">
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">Trust Rating</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">
                  {{ calculateCooperationRate }}%
                </dd>
                <p class="text-sm text-gray-600 mt-1">{{ getTrustAnalysis }}</p>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Most Profitable Move</dt>
                <dd class="mt-1 text-2xl font-semibold text-gray-900">
                  Round {{ bestRound }}
                </dd>
                <p class="text-sm text-gray-600 mt-1">{{ getBestRoundAnalysis }}</p>
              </div>
            </dl>
          </div>
        </div>

        <!-- Round by Round Analysis -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Operation Timeline</h2>
          <div class="space-y-4">
            <div v-for="round in rounds" :key="round.id" class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-900">Phase {{ round.id }}: {{ round.title }}</h3>
                <div class="flex items-center space-x-4">
                  <!-- Choice Indicators -->
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="getChoiceClass(getPlayerChoice(round.id))">
                      <span v-if="getPlayerChoice(round.id) === 'cooperate'" class="text-purple-600 text-lg">✓</span>
                      <span v-else-if="getPlayerChoice(round.id) === 'betray'" class="text-red-600 text-lg">✗</span>
                    </div>
                    <span class="mx-2 text-sm font-medium text-gray-600">vs</span>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                      :class="getChoiceClass(getAIChoice(round.id))">
                      <span v-if="getAIChoice(round.id) === 'cooperate'" class="text-purple-600 text-lg">✓</span>
                      <span v-else-if="getAIChoice(round.id) === 'betray'" class="text-red-600 text-lg">✗</span>
                    </div>
                  </div>
                  <!-- Score Display -->
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-purple-600">+{{ getRoundScore(round.id).playerScore }}</span>
                    <span class="text-sm text-gray-400">/</span>
                    <span class="text-sm font-medium text-blue-600">+{{ getRoundScore(round.id).aiScore }}</span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-2">{{ getRoundAnalysis(round.id) }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button @click="showModal('startModal')" 
                  class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            Start New Operation
          </button>
          <button @click="goHome" 
                  class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Return to Safehouse
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

// Update the analysis methods in your game summary component:

const getRoundScore = (roundId) => {
  const playerChoice = getPlayerChoice(roundId)?.choice // Updated to handle choice object structure
  const aiChoice = getAIChoice(roundId)?.choice // Updated to handle choice object structure
  
  if (!playerChoice || !aiChoice) {
    return { playerScore: 0, aiScore: 0 }
  }
  
  // Get the actual scores from the stored round data
  const roundData = currentGame.value?.players[authStore.user.uid]?.choices?.[roundId]
  const aiRoundData = currentGame.value?.players?.ai?.choices?.[roundId]
  
  return {
    playerScore: roundData?.outcome?.points || 0,
    aiScore: aiRoundData?.outcome?.points || 0,
    diceRoll: roundData?.diceRoll,
    finalResult: roundData?.finalResult
  }
}

const getRoundAnalysis = (roundId) => {
  const roundData = currentGame.value?.players[authStore.user.uid]?.choices?.[roundId]
  const playerChoice = getPlayerChoice(roundId)?.choice
  const aiChoice = getAIChoice(roundId)?.choice
  
  // If we don't have round data, return empty analysis
  if (!roundData) return "Round data not available"

  // Get dice roll information if available
  const diceInfo = {
    roll: roundData.diceRoll,
    finalResult: roundData.finalResult,
    success: roundData.finalResult >= (currentGame.value?.scenario?.rounds[roundId - 1]?.dcCheck || 10)
  }

  // Build comprehensive round analysis
  let analysis = ''

  // Analyze the choice combination
  if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
    analysis = "A moment of mutual trust and cooperation."
  } else if (playerChoice === 'cooperate' && aiChoice === 'betray') {
    analysis = "Your trust was met with betrayal."
  } else if (playerChoice === 'betray' && aiChoice === 'cooperate') {
    analysis = "You successfully exploited their trust."
  } else if (playerChoice === 'betray' && aiChoice === 'betray') {
    analysis = "Both parties chose betrayal."
  }

  // Add dice roll context if available
  if (diceInfo.roll) {
    if (diceInfo.roll === 20) {
      analysis += " A critical success enhanced the outcome!"
    } else if (diceInfo.roll === 1) {
      analysis += " A critical failure complicated matters."
    } else if (diceInfo.success) {
      analysis += " Your skill improved the situation."
    } else {
      analysis += " The circumstances worked against you."
    }
  }

  return analysis
}

// Update the best round analysis to be more detailed
const getBestRoundAnalysis = computed(() => {
  const bestRoundData = currentGame.value?.players[authStore.user.uid]?.choices?.[bestRound.value]
  if (!bestRoundData) return ""
  
  const round = rounds.value.find(r => r.id === bestRound.value)
  if (!round) return ""

  let analysis = `Peak performance during ${round.title}`
  if (bestRoundData.diceRoll === 20) {
    analysis += " - A perfect execution!"
  } else if (bestRoundData.finalResult >= (round.dcCheck || 10)) {
    analysis += " - Skillfully handled."
  }
  
  return analysis
})

// Update the trust analysis to be more accurate
const getTrustAnalysis = computed(() => {
  const rate = calculateCooperationRate.value
  if (rate >= 80) return "A paragon of loyalty in a treacherous world"
  if (rate >= 60) return "Known for honoring agreements more often than not"
  if (rate >= 40) return "Balances trust and cunning equally"
  if (rate >= 20) return "Prefers deception over cooperation"
  return "Consistently chooses the path of betrayal"
})

// Update the calculation of cooperation rate to handle the new data structure
const calculateCooperationRate = computed(() => {
  if (!currentGame.value?.players || !authStore.user?.uid) return 0
  const choices = currentGame.value.players[authStore.user.uid]?.choices || {}
  const playerChoices = Object.values(choices).map(round => round.choice)
  if (playerChoices.length === 0) return 0
  
  const cooperateCount = playerChoices.filter(choice => choice === 'cooperate').length
  return Math.round((cooperateCount / playerChoices.length) * 100)
})

// Add a method to get the actual choice from the round data
const getPlayerChoice = (roundId) => {
  if (!currentGame.value?.players || !authStore.user?.uid) return null
  return currentGame.value.players[authStore.user.uid]?.choices?.[roundId]
}

const getAIChoice = (roundId) => {
  if (!currentGame.value?.players?.ai?.choices) return null
  return currentGame.value.players.ai.choices[roundId]
}


////////////////////////
const getGameOutcomeSummary = computed(() => {
  const playerWon = playerScore.value > aiScore.value
  const dmDominant = (currentGame.value?.dmPoints || 0) > Math.max(playerScore.value, aiScore.value)
  
  if (dmDominant) {
    return "The Dungeon Master's machinations proved masterful, playing all sides against each other."
  } else if (playerWon) {
    return `You've emerged victorious from this web of intrigue, proving yourself a master of the game.`
  } else {
    return "Your rival outmaneuvered you this time, but the criminal underworld is full of opportunities."
  }
})

const getReputationStatus = computed(() => {
  const score = playerScore.value
  if (score >= 20) return "Criminal Mastermind"
  if (score >= 15) return "Rising Power"
  if (score >= 10) return "Street Smart"
  return "Small Time Player"
})

const getDungeonMasterImpact = computed(() => {
  const dmPoints = currentGame.value?.dmPoints || 0
  if (dmPoints >= 15) return "Puppet Master"
  if (dmPoints >= 10) return "Major Player"
  return "Background Force"
})

const getRivalStatus = computed(() => {
  const score = aiScore.value
  if (score >= 20) return "Kingpin"
  if (score >= 15) return "Major Threat"
  if (score >= 10) return "Competent Rival"
  return "Minor Opposition"
})


const getChoiceClass = (choice) => {
  return {
    'bg-purple-100': choice === 'cooperate',
    'bg-red-100': choice === 'betray',
    'bg-gray-100': !choice
  }
}
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

const goHome = () => {
  router.push('/gamemenu')
}
</script>