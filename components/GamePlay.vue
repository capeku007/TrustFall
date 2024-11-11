<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Loading State -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 px-4">
      <div class="text-center p-6 bg-gray-800 rounded-xl shadow-lg w-full max-w-md">
        <p class="text-red-400">{{ error }}</p>
        <button @click="router.push('/gamemenu')" 
                class="mt-4 w-full py-3 bg-purple-600 text-white rounded-lg font-medium">
          Return to Menu
        </button>
      </div>
    </div>

    <!-- Game Content -->
    <template v-else-if="currentGame">
      <!-- Sticky Game Header -->
      <div class="sticky top-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 z-40">
        <div class="max-w-3xl mx-auto px-4 py-3">
          <div class="flex items-center">
            <div>
              <p class="text-sm font-medium text-gray-400">
                Round {{ currentGame.currentRound }} of 5
              </p>
              <h1 class="text-base font-bold text-white line-clamp-1">
                {{ currentGame.currentScene?.title || "Loading..." }}
              </h1>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-2">
            <div class="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div class="h-1 bg-purple-600 rounded-full transition-all duration-500"
                :style="{ width: `${(currentGame.currentRound / 5) * 100}%` }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Scene Area -->
      <div v-if="currentGame.currentScene && !showingResults" 
           class="relative min-h-[calc(100vh-4rem)]">
        <!-- Scene Image -->
        <div class="absolute inset-0 overflow-hidden">
          <img 
            :src="currentGame.currentScene.imageUrl || '/api/placeholder/800/600'" 
            :alt="currentGame.currentScene.title"
            class="w-full h-full object-cover transform scale-105 animate-ken-burns"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/60 to-gray-900"></div>
        </div>

<!-- Narration with Paper Effect -->
<div class="relative px-4 py-8 md:py-12">
        <div class="max-w-2xl mx-auto">
          <div class="bg-[#f4e4bc] p-4 md:p-8 rounded-lg shadow-xl transform rotate-[0.5deg] relative overflow-hidden">
            <div class="absolute inset-0 bg-[url('/paper-texture.png')] opacity-50 pointer-events-none"></div>
            
            <!-- Previous round outcome (if exists) -->
            <div v-if="previousRoundOutcome" 
                 class="mb-6 text-gray-800 text-base md:text-lg relative z-10 font-serif leading-relaxed italic border-b border-gray-400 pb-4">
              {{ previousRoundOutcome }}
            </div>
            
            <!-- Current scene description -->
            <p class="text-gray-800 text-base md:text-lg relative z-10 font-serif leading-relaxed">
              {{ displayedText }}
            </p>
          </div>
        </div>
      </div>

        <!-- Persistent DM Avatar -->
        <div class="fixed md:right-8 right-0 md:top-1/2 bottom-[20vh] transform md:-translate-y-1/2 z-50">
    <div @click="toggleDMSpeech"
         class="relative cursor-pointer group">
      <!-- DM Avatar -->
      <div ref="dmAvatar"
           class="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
      </div>

      <!-- Speech Bubble - Updated positioning -->
      <Transition name="fade">
        <div v-if="showDMSpeech" 
             class="absolute right-full top-1/2 -translate-y-1/2 mr-4 w-[calc(100dvw-10rem)] md:w-80">
          <div class="bg-purple-900/95 backdrop-blur-md rounded-2xl p-4 text-white relative speech-bubble shadow-xl">
            <!-- Decorative elements -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent pointer-events-none"></div>
            <div class="absolute inset-0 rounded-2xl bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>
            
            <!-- Content -->
            <div class="relative z-10 space-y-1">
              <p v-for="(line, index) in currentGame.currentScene?.narration" 
                 :key="index"
                 class="text-xs md:text-base italic leading-relaxed"
                 :style="{
                   animation: `fadeIn 0.5s ease-out forwards`,
                   animationDelay: `${index * 0.5}s`
                 }">
                "{{ line }}"
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
      </div>

      <!-- Game Interaction Area -->
      <div class="relative z-10 mt-6">
        <!-- Dice Roll Section -->
        <div v-if="!hasPlayerMadeChoice && !hasRoundBeenPlayed">
          <div class="max-w-3xl mx-auto px-4">
            <!-- Skill Check Info -->
            <div v-if="currentGame.currentScene?.skillCheck && !isRolling && !diceResult"
     class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-white font-medium">Skill Check Required</h3>
      <p class="text-sm text-gray-300">
        DC {{ currentGame.currentScene.skillCheck.dcCheck }} 
        {{ currentGame.currentScene.skillCheck.name }}
      </p>
    </div>
    <div class="text-right">
      <p class="text-sm text-gray-300">
        Modifier: {{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }}
      </p>
    </div>
  </div>
</div>


            <!-- Roll Animation or Result -->
            <div v-if="isRolling || (diceResult > 0)" 
     class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center mb-4">
  <div v-if="isRolling" class="text-2xl font-bold text-purple-400 animate-bounce">
    Rolling...
  </div>
  <div v-else class="space-y-2">
    <p class="text-4xl font-bold" :class="getRollClass(currentGame.currentScene?.skillCheck?.dcCheck)">
      {{ finalResult }}
    </p>
    <div class="text-gray-400 space-x-2">
      <span>{{ diceResults[0] }} + {{ diceResults[1] }}</span>
      <span v-if="diceModifiers !== 0">
        {{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }}
      </span>
    </div>
    <p class="text-sm" :class="getRollClass(currentGame.currentScene?.skillCheck?.dcCheck)">
      {{ getRollDescription(currentGame.currentScene?.skillCheck?.dcCheck) }}
    </p>
  </div>
</div>

          </div>

<!-- Roll Button or Choices -->
<div class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 pt-12 pb-safe">
  <div class="max-w-3xl mx-auto px-4 pb-4">
    <!-- Roll Button -->
    <div v-if="!diceResult && currentGame.currentScene?.skillCheck && !isRolling">
      <button 
        @click="performDiceRoll"
        class="w-full py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <span class="text-2xl">🎲</span>
        <span>Roll for {{ currentGame.currentScene.skillCheck.name }}</span>
      </button>
    </div>

    <!-- Roll Result Display with 3D Dice -->
    <div v-if="isRolling || (diceResult > 0 && !showChoices)" 
     class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center mb-4">
  <ClientOnly>
    <DiceRoller 
      :is-rolling="isRolling" 
      :dice-results="diceResults" 
    />
  </ClientOnly>
  
  <!-- Additional Roll Information -->
  <div v-if="!isRolling" class="space-y-2 mt-4">
    <p class="text-4xl font-bold" :class="getRollClass(currentGame.currentScene?.skillCheck?.dcCheck)">
      {{ finalResult }}
    </p>
    <div class="text-gray-400 space-x-2">
      <span>{{ diceResults[0] }} + {{ diceResults[1] }}</span>
      <span v-if="diceModifiers !== 0">
        {{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }}
      </span>
    </div>
    <p class="text-sm" :class="getRollClass(currentGame.currentScene?.skillCheck?.dcCheck)">
      {{ getRollDescription(currentGame.currentScene?.skillCheck?.dcCheck) }}
    </p>
  </div>
</div>

    <!-- Choice Buttons -->
    <div v-if="diceResult && showChoices && !playerChoice && currentGame.currentScene?.choices" 
     class="space-y-3">
  <button v-for="(choice, key) in currentGame.currentScene.choices"
          :key="key"
          @click="makePlayerChoice(key)"
          class="w-full group relative overflow-hidden"
  >
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 transform transition-all duration-300"
         :class="[
           playerChoice === key ? 'ring-2 ring-purple-500 scale-[0.98]' : 'hover:scale-[0.98]',
           getChoiceClasses(key)
         ]"
    >
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
             :class="getChoiceIconClasses(key)">
          <span :class="getChoiceTextClass(key)" class="text-xl">
            {{ getChoiceIcon(key) }}
          </span>
        </div>
        <div class="flex-1">
          <h3 class="font-medium text-white">{{ choice.text }}</h3>
          <p class="text-sm text-gray-300">{{ choice.description }}</p>
        </div>
      </div>
      
      <div v-if="choice.bonuses?.length" 
           class="mt-3 space-y-1">
        <div v-for="bonus in choice.bonuses" 
             :key="bonus.type" 
             class="flex items-center text-xs text-gray-400">
          <span class="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></span>
          {{ bonus.description }}
        </div>
      </div>
    </div>
  </button>
</div>
  </div>
</div>
        </div>

<!-- Round Outcome - Updated -->
<div v-if="roundOutcome" 
           class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 pt-12 pb-safe">
        <div class="max-w-3xl mx-auto px-4 pb-4">
          <div class="bg-[#f4e4bc] p-6 rounded-lg shadow-xl transform rotate-[0.3deg] relative overflow-hidden animate-slideUp">
            <div class="absolute inset-0 bg-[url('/paper-texture.png')] opacity-50 pointer-events-none"></div>
            <p class="text-gray-800 text-base md:text-lg relative z-10 font-serif leading-relaxed italic">
              {{ roundOutcome }}
            </p>
          </div>
        </div>
      </div>
      </div>

      <!-- Game End Screen -->
      <div v-if="isGameOver" 
           class="fixed inset-0 bg-gray-900/98 backdrop-blur-lg z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md text-center space-y-6 animate-fadeIn">
          <div class="space-y-4">
            <h2 class="text-3xl font-bold text-white">Game Over!</h2>
            <p class="text-xl text-gray-300">{{ getWinnerMessage() }}</p>
            <div class="flex justify-center space-x-8 text-center">
              <div>
                <p class="text-sm text-gray-400">Your Score</p>
                <p class="text-2xl font-bold text-white">{{ playerScore }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-400">DM's Score</p>
                <p class="text-2xl font-bold text-purple-400">{{ currentGame.dmPoints }}</p>
              </div>
            </div>
          </div>
          <button @click="$emit('game-complete')"
                  class="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium">
            View Game Summary
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGame } from '~/composables/useGame'
import { useAuthStore } from '~/stores/authStore'
import { useDiceRoll } from '~/composables/useDiceRoll'
import dmIdleAnimation from '@/assets/animations/dm-idle.json'
import dmTalkingAnimation from '@/assets/animations/dm-talking.json'
import dmThinkingAnimation from '@/assets/animations/dm-thinking.json'
import lottie from 'lottie-web'

const props = defineProps({
  gameId: { type: String, required: true }
})

const emit = defineEmits(['game-complete'])

const {
  diceResult,
  diceResults,
  finalResult,
  isRolling,
  rollDice,
  resetRoll,
  getRollClass,
  getRollDescription
} = useDiceRoll()

const router = useRouter()
const authStore = useAuthStore()
const {
  currentGame,
  error: gameError,
  loading: gameLoading,
  fetchGame,
  makeChoice,
  cleanupGameListener
} = useGame()

// UI State
const isLoading = ref(true)
const error = ref(null)
const playerChoice = ref(null)
const showingResults = ref(false)
const dmAvatar = ref(null)
const dmLottieAnimation = ref(null)
const showDMSpeech = ref(false)
const displayedText = ref('')
const isComponentMounted = ref(true)
const currentDMState = ref('idle')

//  round outcome state management
const roundOutcome = ref(null)
const previousRoundOutcome = ref(null)
const roundOutcomeTimer = ref(null)

// Computed Properties
const hasRoundBeenPlayed = computed(() => {
  if (!currentGame.value || !authStore.user) return false
  const currentRoundChoices = currentGame.value.players[authStore.user.uid]?.choices || {}
  return !!currentRoundChoices[currentGame.value.currentRound]
})

const hasPlayerMadeChoice = computed(() => playerChoice.value !== null)

const isGameOver = computed(() => {
  if (!currentGame.value) return false
  return currentGame.value.status === 'completed'
})

const playerScore = computed(() => {
  if (!currentGame.value?.players?.[authStore.user?.uid]?.score) return 0
  return currentGame.value.players[authStore.user.uid].score
})

const diceModifiers = computed(() => {
  if (!currentGame.value?.consequences) return 0
  
  let modifier = 0
  Object.entries(currentGame.value.consequences).forEach(([_, consequence]) => {
    if (consequence.type === 'LOYALTY') modifier += 2
    if (consequence.type === 'BETRAYAL') modifier -= 1
    if (consequence.type === 'CRITICAL_SUCCESS') modifier += 1
    if (consequence.type === 'CRITICAL_FAILURE') modifier -= 2
  })
  
  return modifier
})

// Methods
const initDMLottie = (state = 'idle') => {
  if (!dmAvatar.value) return

  try {
    if (dmLottieAnimation.value) {
      dmLottieAnimation.value.destroy()
    }

    const animationData = {
      idle: dmIdleAnimation,
      talking: dmTalkingAnimation,
      thinking: dmThinkingAnimation
    }[state]

    dmLottieAnimation.value = lottie.loadAnimation({
      container: dmAvatar.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    })
  } catch (err) {
    console.error('Error loading DM animation:', err)
  }
}

// Update DM state
const updateDMState = (state) => {
  currentDMState.value = state
  initDMLottie(state)
}

const typewriterEffect = (text, prevOutcome) => {
  if (!text) return
  
  displayedText.value = ''
  updateDMState('talking')
  
  // Immediately set previous round outcome
  previousRoundOutcome.value = prevOutcome
  
  let currentIndex = 0
  const interval = setInterval(() => {
    if (currentIndex < text.length) {
      displayedText.value = text.substring(0, currentIndex + 1)
      currentIndex++
    } else {
      clearInterval(interval)
      updateDMState('idle')
      setTimeout(() => {
        showDMSpeech.value = true
        updateDMState('talking')
      }, 5000)
    }
  }, 50)

  return interval
}

// Modified toggleDMSpeech
const toggleDMSpeech = () => {
  showDMSpeech.value = !showDMSpeech.value
  updateDMState(showDMSpeech.value ? 'talking' : 'idle')
}

const showChoices = ref(false)

// Update the performDiceRoll function
const performDiceRoll = async () => {
  if (!currentGame.value?.currentScene?.skillCheck) return
  
  showChoices.value = false // Hide choices during roll
  updateDMState('thinking')
  
  try {
    await rollDice()
    // Wait a moment to show the roll result before allowing choices
    await new Promise(resolve => setTimeout(resolve, 2000))
    showChoices.value = true
  } catch (err) {
    console.error('Error rolling dice:', err)
  } finally {
    updateDMState('idle')
  }
}

const getWinnerMessage = () => {
  const playerScore = currentGame.value?.players[authStore.user.uid]?.score || 0
  const dmScore = currentGame.value?.dmPoints || 0

  if (playerScore > dmScore) {
    return "You've outsmarted the Dungeon Master! 🎉"
  } else if (dmScore > playerScore) {
    return "The Dungeon Master prevails! Better luck next time! 😈"
  } else {
    return "A perfect balance - it's a tie! 🤝"
  }
}

const getChoiceClasses = (key) => {
  const baseClasses = 'transition-all duration-300'
  switch (key) {
    case 'cooperate': return `${baseClasses} hover:bg-green-900/20`
    case 'negotiate': return `${baseClasses} hover:bg-purple-900/20`
    case 'betray': return `${baseClasses} hover:bg-red-900/20`
    default: return baseClasses
  }
}

const getChoiceIconClasses = (key) => {
  switch (key) {
    case 'cooperate': return 'bg-green-900/50'
    case 'negotiate': return 'bg-purple-900/50'
    case 'betray': return 'bg-red-900/50'
    default: return ''
  }
}

const getChoiceTextClass = (key) => {
  switch (key) {
    case 'cooperate': return 'text-green-400'
    case 'negotiate': return 'text-purple-400'
    case 'betray': return 'text-red-400'
    default: return ''
  }
}

const getChoiceIcon = (key) => {
  switch (key) {
    case 'cooperate': return '✓'
    case 'negotiate': return '⟳'
    case 'betray': return '✗'
    default: return ''
  }
}

const isProcessingChoice = ref(false)

// Modified makePlayerChoice function
const makePlayerChoice = async (choice) => {
  if (!currentGame.value?.currentScene || playerChoice.value || hasRoundBeenPlayed.value) return
  if (!diceResult.value && !isRolling.value) return
  
  playerChoice.value = choice
  showChoices.value = false
  isProcessingChoice.value = true
  
  try {
    const diceInfo = {
      diceRoll: diceResult.value,
      finalResult: finalResult.value,
      modifier: diceModifiers.value,
      isCritical: diceResult.value === 12,
      isCriticalFail: diceResult.value === 2,
      dcCheck: currentGame.value.currentScene.skillCheck?.dcCheck || 10
    }

    const result = await makeChoice(props.gameId, choice, diceInfo)
    
    if (result?.outcome) {
      // Store the outcome for the next round
      localStorage.setItem(`game_${props.gameId}_previous_outcome`, result.outcome.narrative)
      // Update the previous round outcome immediately for the next scene
      previousRoundOutcome.value = result.outcome.narrative
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (currentGame.value?.status === 'completed') {
      showingResults.value = true
      if (isComponentMounted.value) {
        emit('game-complete')
      }
    } else {
      playerChoice.value = null
      resetRoll()
      diceResult.value = null
    }
  } catch (err) {
    console.error('Error making choice:', err)
    error.value = err.message
    playerChoice.value = null
  } finally {
    isProcessingChoice.value = false
  }
}



// Watchers
watch(
  () => currentGame.value?.currentScene,
  (newScene, oldScene) => {
    if (newScene) {
      showDMSpeech.value = false
      displayedText.value = ''
      showChoices.value = false
      
      // Only get from localStorage if we don't already have a previous outcome
      // and we're not currently processing a choice
      if (!previousRoundOutcome.value && !isProcessingChoice.value) {
        const prevOutcome = localStorage.getItem(`game_${props.gameId}_previous_outcome`)
        if (prevOutcome) {
          previousRoundOutcome.value = prevOutcome
        }
      }
      
      if (newScene.description) {
        const typingInterval = typewriterEffect(newScene.description, previousRoundOutcome.value)
        return () => {
          if (typingInterval) clearInterval(typingInterval)
        }
      }
    }
  },
  { immediate: true }
)
watch(
  () => currentGame.value?.currentRound,
  (newRound, oldRound) => {
    if (newRound && oldRound && newRound > oldRound) {
      // Get the stored outcome when advancing to a new round
      const prevOutcome = localStorage.getItem(`game_${props.gameId}_previous_outcome`)
      if (prevOutcome) {
        previousRoundOutcome.value = prevOutcome
      }
    }
  }
)
watch(
  () => currentGame.value?.status,
  (newStatus) => {
    if (newStatus === 'completed' && isComponentMounted.value) {
      showingResults.value = true
      emit('game-complete')
    }
  }
)

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

    // Get initial previous round outcome
    const prevOutcome = localStorage.getItem(`game_${props.gameId}_previous_outcome`)
    if (prevOutcome) {
      previousRoundOutcome.value = prevOutcome
    }

    await initDMLottie()
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
  isComponentMounted.value = false
  if (dmLottieAnimation.value) {
    dmLottieAnimation.value.destroy()
  }
  if (roundOutcomeTimer.value) {
    clearTimeout(roundOutcomeTimer.value)
  }
  localStorage.removeItem(`game_${props.gameId}_previous_outcome`)
  cleanupGameListener()
})
</script>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) rotate(0.3deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0.3deg);
  }
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out forwards;
}
/* DM Avatar styles */
:deep(svg) {
  width: 100%;
  height: 100%;
  transform: scale(1.2);
}

/* Speech Bubble styles */
.speech-bubble {
  border: 1px solid rgba(139, 92, 246, 0.3);
}

/* Speech bubble arrow - same for both mobile and desktop */
.speech-bubble::after {
  content: '';
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 12px;
  border-style: solid;
  border-color: transparent transparent transparent theme('colors.purple.900/0.95');
  filter: drop-shadow(2px 0 2px rgba(0, 0, 0, 0.1));
}

.speech-bubble::before {
  content: '';
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 12px;
  border-style: solid;
  border-color: transparent transparent transparent rgba(139, 92, 246, 0.3);
  z-index: -1;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(5px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
</style>