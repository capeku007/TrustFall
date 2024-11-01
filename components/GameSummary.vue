<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div ref="bottomSheet" id="startModal" tabindex="-1" data-modal-target="startModal" data-modal-placement="bottom" aria-hidden="true" class="fixed bottom-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
      <StartGame/>
    </div>

    <div class="max-w-3xl mx-auto">
      <!-- Main Summary Card -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Operation Debrief</h1>
        
        <!-- Enhanced Narrative Summary -->
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-8">
          <p class="text-gray-800 text-lg leading-relaxed">{{ detailedOutcome }}</p>
        </div>

        <!-- Play Style Analysis -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Operative Profile</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900">{{ playStyle }}</dd>
            <p class="text-sm text-gray-600 mt-1">{{ getPlayStyleDescription }}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <dt class="text-sm font-medium text-gray-500">Operation Success Rate</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900">{{ successRate }}%</dd>
            <p class="text-sm text-gray-600 mt-1">{{ getSuccessRateDescription }}</p>
          </div>
        </div>
        
        <!-- Reputation Stats -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div class="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Your Standing</h2>
            <p class="text-3xl font-bold text-purple-600">{{ playerScore }}</p>
            <p class="mt-2 text-sm font-medium" 
               :class="getScoreClass(playerScore, aiScore)">
              {{ getReputationStatus }}
            </p>
          </div>
          
          <div class="text-center p-4 bg-gradient-to-b from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">DM's Influence</h2>
            <p class="text-3xl font-bold text-indigo-600">{{ currentGame?.dmPoints || 0 }}</p>
            <p class="mt-2 text-sm font-medium text-indigo-600">{{ dungeonMasterImpact }}</p>
          </div>

          <div class="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Rival's Power</h2>
            <p class="text-3xl font-bold text-blue-600">{{ aiScore }}</p>
            <p class="mt-2 text-sm font-medium" 
               :class="getScoreClass(aiScore, playerScore)">
              {{ getRivalStatus }}
            </p>
          </div>
        </div>

        <!-- Round Analysis -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Operation Timeline</h2>
          <div class="space-y-4">
            <div v-for="round in processedRounds" 
                 :key="round.id" 
                 class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-900">
                  Phase {{ round.id }}: {{ round.title }}
                </h3>
                <div class="flex items-center space-x-4">
                  <!-- Choice Display -->
                  <div class="flex items-center space-x-2">
                    <div class="px-3 py-1 rounded-full text-sm font-medium"
                         :class="getChoiceDisplayClass(round.playerChoice)">
                      {{ getChoiceDisplayText(round.playerChoice) }}
                    </div>
                    <span class="text-gray-400">vs</span>
                    <div class="px-3 py-1 rounded-full text-sm font-medium"
                         :class="getChoiceDisplayClass(round.aiChoice)">
                      {{ getChoiceDisplayText(round.aiChoice) }}
                    </div>
                  </div>
                  
                  <!-- Score & Dice -->
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-purple-600">
                      +{{ round.playerPoints }}
                    </span>
                    <span v-if="round.diceRoll" 
                          class="text-xs text-gray-400">
                      (🎲{{ round.diceRoll }})
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600">{{ getRoundAnalysis(round) }}</p>
              
              <!-- Critical Moments Badge -->
              <div v-if="round.isCritical" 
                   :class="getCriticalBadgeClass(round)"
                   class="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                {{ getCriticalBadgeText(round) }}
              </div>
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
import { useModal } from '~/composables/useModal'

const props = defineProps({
  gameId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const { currentGame, fetchGame } = useGame()
const authStore = useAuthStore()
const { showModal } = useModal()

definePageMeta({
  middleware: ['auth']
})

// Fetch game data on mount
onMounted(async () => {
  await fetchGame(props.gameId)
})

// Base computed properties
const playerScore = computed(() => {
  if (!currentGame.value?.players || !authStore.user?.uid) return 0
  return currentGame.value.players[authStore.user.uid]?.score || 0
})

const aiScore = computed(() => {
  if (!currentGame.value?.players?.ai) return 0
  return currentGame.value.players.ai?.score || 0
})

// Enhanced computed properties
const processedRounds = computed(() => {
  if (!currentGame.value?.scenario?.rounds) return []
  
  return currentGame.value.scenario.rounds.map(round => {
    const playerChoice = getPlayerChoice(round.id)
    const aiChoice = getAIChoice(round.id)
    const scores = getRoundScore(round.id)
    
    return {
      ...round,
      playerChoice: playerChoice?.choice,
      aiChoice: aiChoice?.choice,
      diceRoll: playerChoice?.diceRoll,
      finalResult: playerChoice?.finalResult,
      playerPoints: scores.playerScore,
      aiPoints: scores.aiScore,
      isCritical: playerChoice?.diceRoll === 20 || playerChoice?.diceRoll === 1
    }
  })
})

const playStyle = computed(() => {
  const choices = processedRounds.value
    .map(r => r.playerChoice)
    .filter(Boolean)
  
  const cooperateCount = choices.filter(c => c === 'cooperate').length
  const betrayCount = choices.filter(c => c === 'betray').length
  const negotiateCount = choices.filter(c => c === 'negotiate').length
  
  if (cooperateCount >= Math.max(betrayCount, negotiateCount)) {
    return 'Honorable Operative'
  } else if (betrayCount >= Math.max(cooperateCount, negotiateCount)) {
    return 'Ruthless Mastermind'
  } else {
    return 'Cunning Diplomat'
  }
})

const successRate = computed(() => {
  const rounds = processedRounds.value
  if (rounds.length === 0) return 0
  
  const successfulRounds = rounds.filter(r => 
    r.finalResult >= (r.skillCheck?.dcCheck || 10)
  ).length
  
  return Math.round((successfulRounds / rounds.length) * 100)
})

const detailedOutcome = computed(() => {
  const playerWon = playerScore.value > aiScore.value
  const dmDominant = (currentGame.value?.dmPoints || 0) > Math.max(playerScore.value, aiScore.value)
  const margin = Math.abs(playerScore.value - aiScore.value)
  
  let narrative = `As a ${playStyle.value}, you demonstrated ${
    successRate.value >= 70 ? 'exceptional' : 
    successRate.value >= 50 ? 'solid' : 'limited'
  } operational competence`
  
  // Add critical moments
  const criticalSuccesses = processedRounds.value.filter(r => r.diceRoll === 20).length
  const criticalFailures = processedRounds.value.filter(r => r.diceRoll === 1).length
  
  if (criticalSuccesses > 0 || criticalFailures > 0) {
    narrative += `, experiencing ${criticalSuccesses} brilliant triumph${
      criticalSuccesses !== 1 ? 's' : ''
    } and ${criticalFailures} critical setback${
      criticalFailures !== 1 ? 's' : ''
    }`
  }
  
  if (dmDominant) {
    narrative += `. However, the Dungeon Master's intricate machinations ultimately shaped the outcome.`
  } else if (playerWon) {
    narrative += margin > 10 
      ? `. Your masterful strategy secured a decisive victory.`
      : `. Through cunning and skill, you emerged victorious in a close contest.`
  } else {
    narrative += margin > 10
      ? `. Despite your efforts, your rival's superior strategy prevailed.`
      : `. In a closely fought operation, your rival narrowly prevailed.`
  }
  
  return narrative
})

const getPlayStyleDescription = computed(() => {
  switch (playStyle.value) {
    case 'Honorable Operative':
      return 'Prefers building trust and maintaining alliances'
    case 'Ruthless Mastermind':
      return 'Exploits opportunities for maximum personal gain'
    case 'Cunning Diplomat':
      return 'Balances cooperation and calculated risk'
    default:
      return 'Adapts strategy based on circumstances'
  }
})

const getSuccessRateDescription = computed(() => {
  if (successRate.value >= 80) return 'Exceptional operational execution'
  if (successRate.value >= 60) return 'Demonstrated consistent competence'
  if (successRate.value >= 40) return 'Showed mixed operational results'
  return 'Faced significant operational challenges'
})

const dungeonMasterImpact = computed(() => {
  const dmPoints = currentGame.value?.dmPoints || 0
  if (dmPoints >= 15) return "Mastermind"
  if (dmPoints >= 10) return "Puppet Master"
  if (dmPoints >= 5) return "Game Changer"
  return "Background Player"
})

// Helper methods
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
  
  return {
    playerScore: playerChoice.outcome?.points || 0,
    aiScore: aiChoice.outcome?.points || 0
  }
}

const getChoiceDisplayClass = (choice) => {
  const baseClasses = 'text-sm font-medium px-3 py-1 rounded-full'
  switch (choice) {
    case 'cooperate':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'negotiate':
      return `${baseClasses} bg-purple-100 text-purple-800`
    case 'betray':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

const getChoiceDisplayText = (choice) => {
  switch (choice) {
    case 'cooperate':
      return 'Cooperate'
    case 'negotiate':
      return 'Negotiate'
    case 'betray':
      return 'Betray'
    default:
      return '---'
  }
}

const getScoreClass = (score1, score2) => {
  return {
    'text-green-600': score1 > score2,
    'text-red-600': score1 < score2,
    'text-gray-600': score1 === score2
  }}

const getCriticalBadgeClass = (round) => {
  if (round.diceRoll === 20) {
    return 'bg-green-100 text-green-800'
  }
  if (round.diceRoll === 1) {
    return 'bg-red-100 text-red-800'
  }
  if (round.finalResult >= (round.skillCheck?.dcCheck || 10)) {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-gray-100 text-gray-800'
}

const getCriticalBadgeText = (round) => {
  if (round.diceRoll === 20) return 'Critical Success!'
  if (round.diceRoll === 1) return 'Critical Failure!'
  if (round.finalResult >= (round.skillCheck?.dcCheck || 10)) return 'Success'
  return 'Failure'
}

const getRoundAnalysis = (round) => {
  let analysis = ''

  // Base outcome analysis
  if (round.playerChoice === 'cooperate' && round.aiChoice === 'cooperate') {
    analysis = 'Mutual cooperation led to a stable outcome.'
  } else if (round.playerChoice === 'cooperate' && round.aiChoice === 'betray') {
    analysis = 'Your trust was exploited by your rival.'
  } else if (round.playerChoice === 'betray' && round.aiChoice === 'cooperate') {
    analysis = 'You successfully capitalized on their trust.'
  } else if (round.playerChoice === 'betray' && round.aiChoice === 'betray') {
    analysis = 'Mutual betrayal resulted in minimal gains.'
  } else if (round.playerChoice === 'negotiate') {
    if (round.aiChoice === 'cooperate') {
      analysis = 'Your cautious approach was met with cooperation.'
    } else if (round.aiChoice === 'negotiate') {
      analysis = 'Both parties found common ground through negotiation.'
    } else {
      analysis = 'Your attempt at diplomacy was met with betrayal, but your caution limited the damage.'
    }
  }

  // Add dice context
  if (round.diceRoll === 20) {
    analysis += ' Your exceptional skill turned the situation to your advantage.'
  } else if (round.diceRoll === 1) {
    analysis += ' A critical mistake complicated your plans.'
  } else if (round.finalResult >= (round.skillCheck?.dcCheck || 10)) {
    analysis += ' Your competence enhanced the outcome.'
  } else {
    analysis += ' Circumstances worked against your plans.'
  }

  return analysis
}

const getReputationStatus = computed(() => {
  const score = playerScore.value
  if (score >= 20) return "Criminal Mastermind"
  if (score >= 15) return "Rising Power"
  if (score >= 10) return "Street Smart"
  if (score >= 5) return "Promising Talent"
  return "Rookie Operative"
})

const getRivalStatus = computed(() => {
  const score = aiScore.value
  if (score >= 20) return "Underworld Kingpin"
  if (score >= 15) return "Major Threat"
  if (score >= 10) return "Skilled Rival"
  if (score >= 5) return "Notable Opposition"
  return "Minor Player"
})

// Navigation
const goHome = () => {
  router.push('/gamemenu')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Enhance badges and status indicators */
.rounded-full {
  transition: all 0.2s ease;
}

.rounded-full:hover {
  transform: scale(1.05);
}

/* Gradient animations */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradientFlow 10s ease infinite;
}

/* Enhanced hover effects for round cards */
.rounded-lg {
  transition: all 0.2s ease-in-out;
}

.rounded-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>