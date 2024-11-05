<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-900 to-purple-700 py-8 px-4">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>

    <div v-else-if="localError" class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
        <p class="text-red-600">{{ localError }}</p>
        <button @click="router.push('/gamemenu')" 
                class="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
          Return to Menu
        </button>
      </div>
    </div>

    <div v-else-if="currentGame" class="max-w-lg mx-auto animate-fadeIn">
      <!-- Game Result Banner -->
      <div class="text-center mb-8 animate-slideDown">
        <h1 class="text-4xl font-bold text-white mb-2 text-shadow">Game Complete!</h1>
        <p class="text-xl text-purple-200">{{ getResultMessage() }}</p>
      </div>

      <!-- Score Cards -->
      <div class="grid grid-cols-3 gap-4 mb-8 animate-slideUp">
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transform hover:scale-105 transition-all">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-purple-500 mx-auto mb-2 flex items-center justify-center">
              <span class="text-2xl">👤</span>
            </div>
            <p class="text-sm text-purple-200">Your Score</p>
            <p class="text-2xl font-bold text-white mt-1">{{ playerScore }}</p>
          </div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transform hover:scale-105 transition-all">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-blue-500 mx-auto mb-2 flex items-center justify-center">
              <span class="text-2xl">🤖</span>
            </div>
            <p class="text-sm text-purple-200">AI Score</p>
            <p class="text-2xl font-bold text-white mt-1">{{ aiScore }}</p>
          </div>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transform hover:scale-105 transition-all">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-green-500 mx-auto mb-2 flex items-center justify-center">
              <span class="text-2xl">👑</span>
            </div>
            <p class="text-sm text-purple-200">DM Points</p>
            <p class="text-2xl font-bold text-white mt-1">{{ currentGame.dmPoints || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Simplified Round Summary -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg mb-8 animate-fadeIn">
        <h3 class="text-xl font-semibold text-white mb-4 text-shadow">Game Summary</h3>
        
        <!-- Strategy Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center">
            <span class="text-red-400 text-xl">🗡️</span>
            <p class="text-purple-200 text-sm">Betrays</p>
            <p class="text-white font-bold">{{ summaryStats.betrayCount }}</p>
          </div>
          <div class="text-center">
            <span class="text-green-400 text-xl">🤝</span>
            <p class="text-purple-200 text-sm">Cooperations</p>
            <p class="text-white font-bold">{{ summaryStats.cooperateCount }}</p>
          </div>
          <div class="text-center">
            <span class="text-purple-400 text-xl">💬</span>
            <p class="text-purple-200 text-sm">Negotiations</p>
            <p class="text-white font-bold">{{ summaryStats.negotiateCount }}</p>
          </div>
        </div>

        <!-- Trust Rating -->
        <div class="text-center mb-6">
          <p class="text-purple-200 mb-2">Trust Rating</p>
          <div class="flex justify-center space-x-1">
            <span v-for="i in summaryStats.trustRating" :key="i" 
                  class="text-yellow-400 animate-pulse-star">
              ⭐
            </span>
          </div>
        </div>

        <!-- Game Advice -->
        <div class="text-center mt-4 p-4 bg-white/5 rounded-lg">
          <p class="text-purple-200 italic">{{ summaryStats.advice }}</p>
        </div>
      </div>


      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-4 animate-slideUp">
        <button @click="router.push('/gamemenu')" 
                class="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-center">
          Main Menu
        </button>
        <button @click="router.push('/game/new')" 
                class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-center">
          Play Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const playerScore = computed(() => {
  if (!currentGame.value?.players?.[authStore.user?.uid]) return 0
  return currentGame.value.players[authStore.user.uid].score || 0
})

const aiScore = computed(() => {
  if (!currentGame.value?.players?.ai) return 0
  return currentGame.value.players.ai.score || 0
})

const summaryStats = computed(() => {
  if (!currentGame.value?.choiceHistory) return {}
  
  const rounds = currentGame.value.choiceHistory
  const playerChoices = rounds.map(r => r.playerChoice)
  const friendChoices = rounds.map(r => r.aiChoice)

  // Count each strategy
  const betrayCount = playerChoices.filter(c => c === 'betray').length
  const cooperateCount = playerChoices.filter(c => c === 'cooperate').length
  const negotiateCount = playerChoices.filter(c => c === 'negotiate').length

  // Calculate trust rating
  const totalMoves = playerChoices.length
  const trustRatio = 1 - (betrayCount / totalMoves)
  const trustRating = Math.max(1, Math.round(trustRatio * 5))

  // Analyze opponent patterns with timing focus
  const getAdvice = () => {
    const midPoint = Math.floor(totalMoves / 2)
    const earlyMoves = friendChoices.slice(0, midPoint)
    const lateMoves = friendChoices.slice(midPoint)
    
    const earlyBetrays = earlyMoves.filter(c => c === 'betray').length
    const lateBetrays = lateMoves.filter(c => c === 'betray').length
    const earlyCoops = earlyMoves.filter(c => c === 'cooperate').length
    const lateCoops = lateMoves.filter(c => c === 'cooperate').length

    // Analyze timing patterns
    if (lateBetrays > earlyBetrays) {
      return "Your friend tends to betray more in the later rounds. Keep your guard up during the endgame!"
    }
    if (earlyBetrays > lateBetrays) {
      return "Your friend starts aggressively but becomes more cooperative later. Try to survive the early game!"
    }
    if (lateCoops > earlyCoops) {
      return "Your friend becomes more cooperative as the game progresses. Patient cooperation might pay off!"
    }
    if (friendChoices.slice(-2).every(c => c === 'betray')) {
      return "Watch out for those final rounds - your friend likes to finish with a betrayal!"
    }
    if (friendChoices.slice(-2).every(c => c === 'cooperate')) {
      return "Your friend seems to value a cooperative finish. Could be a good opportunity!"
    }
    if (friendChoices.every((choice, i, arr) => i === 0 || choice !== arr[i-1])) {
      return "Your friend never uses the same move twice in a row. Try to use this pattern!"
    }
    if (friendChoices.filter(c => c === 'negotiate').length >= totalMoves * 0.4) {
      return "Your friend really likes to negotiate! Could be playing it safe or setting up for something big."
    }
    
    // Default to most recent pattern
    const lastThreeMoves = friendChoices.slice(-3)
    const recentBetrays = lastThreeMoves.filter(c => c === 'betray').length
    if (recentBetrays >= 2) {
      return "Your friend's getting a bit betrayal-happy lately. Might want to play it safe!"
    }
    
    return "Your friend keeps mixing things up - stay alert and adapt to their moves!"
  }

  return {
    betrayCount,
    cooperateCount,
    negotiateCount,
    trustRating,
    advice: getAdvice()
  }
})



onMounted(async () => {
  try {
    await fetchGame(props.gameId)
  } catch (err) {
    console.error('Error loading game summary:', err)
    localError.value = err.message || 'Failed to load game summary'
  }
})

const getResultMessage = () => {
  if (playerScore.value > aiScore.value) {
    return "🎉 Victory! 🎉"
  } else if (aiScore.value > playerScore.value) {
    return "Better luck next time!"
  }
  return "It's a tie!"
}
</script>

<style scoped>
.text-shadow {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slideDown {
  animation: slideDown 0.5s ease-out forwards;
}

.animate-slideUp {
  animation: slideUp 0.5s ease-out forwards;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@keyframes pulseStars {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.animate-pulse-star {
  display: inline-block;
  animation: pulseStars 1.5s ease-in-out infinite;
}

/* Add slight delay for each subsequent star */
.animate-pulse-star:nth-child(2) { animation-delay: 0.2s; }
.animate-pulse-star:nth-child(3) { animation-delay: 0.4s; }
.animate-pulse-star:nth-child(4) { animation-delay: 0.6s; }
.animate-pulse-star:nth-child(5) { animation-delay: 0.8s; }

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slideDown {
  animation: slideDown 0.5s ease-out forwards;
}

.animate-slideUp {
  animation: slideUp 0.5s ease-out forwards;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>