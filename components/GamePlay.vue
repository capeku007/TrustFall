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
        <button @click="router.push('/gamemenu')" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
          Return to Menu
        </button>
      </div>
    </div>

    
    <!-- Game Content -->
    <template v-else-if="currentGame">
      <!-- Game Header with DM Score -->
      <div class="max-w-3xl mx-auto mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ currentGame.currentScene?.title || "Loading..." }}
              </h1>
              <p class="mt-1 text-sm text-gray-500">
                Round {{ currentGame.currentRound }} of 5
              </p>
            </div>
            <div class="text-right">
              <p class="text-purple-600 font-semibold">DM Points: {{ currentGame.dmPoints || 0 }}</p>
              <p class="text-gray-600">Your Score: {{ playerScore }}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="h-2 bg-gray-200 rounded-full">
              <div class="h-2 bg-purple-600 rounded-full transition-all duration-500"
                :style="{ width: `${(currentGame.currentRound / 5) * 100}%` }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Game Area -->
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Scene Description and DM Narration -->
        <div v-if="currentGame.currentScene && !showingResults" 
             class="bg-purple-50 rounded-lg shadow-sm p-6 border-2 border-purple-200">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ currentGame.currentScene.title }}
          </h2>
          <p class="m-2 text-gray-600">{{ currentGame.currentScene.description }}</p>

          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">🎭</span>
            </div>
            <h2 class="ml-4 text-xl font-semibold text-purple-900">Dungeon Master</h2>
          </div>
          
          <div class="space-y-3">
            <p v-for="(line, index) in currentNarration" 
               :key="index"
               class="text-purple-800 italic"
               :style="{animation: `fadeIn 0.5s ease-in ${index * 0.5}s`}">
              "{{ line }}"
            </p>
          </div>
        </div>

        <!-- Game Interaction Area -->
        <div v-if="currentGame.currentScene && !showingResults" class="bg-white rounded-lg shadow-sm p-6">
          <!-- Active Consequences -->
          <div v-if="currentGame.consequences && Object.keys(currentGame.consequences).length > 0"
               class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-700 mb-2">Active Effects:</h3>
            <ul class="space-y-2">
              <li v-for="(consequence, index) in currentGame.consequences" 
                  :key="index"
                  class="text-sm text-gray-600 flex items-center">
                <span class="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                {{ consequence.description }}
              </li>
            </ul>
          </div>

          <!-- Skill Check Section -->
          <div v-if="!hasPlayerMadeChoice && !hasRoundBeenPlayed" 
               class="mb-6 bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-gray-900">Skill Check Required</h3>
                <p class="text-sm text-gray-600">
                  DC {{ currentGame.currentScene.skillCheck?.dcCheck }} 
                  {{ currentGame.currentScene.skillCheck?.name }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  (2d6 + modifier, success on meet or exceed)
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">
                  Modifier: {{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }}
                </p>
              </div>
            </div>

            <!-- Dice Rolling Interface -->
            <div v-if="!diceResult && !isRolling" class="text-center">
              <button @click="performDiceRoll"
                      class="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                <span class="mr-2">🎲</span>
                Roll for {{ currentGame.currentScene.skillCheck?.name }}
              </button>
            </div>

            <!-- Dice Result Display -->
            <div v-else class="text-center p-4">
              <div v-if="isRolling" class="text-2xl font-bold text-purple-600 animate-bounce">
                Rolling...
              </div>
              <div v-else class="space-y-2">
                <p class="text-2xl font-bold" :class="getRollClass(currentGame.currentScene.skillCheck?.dcCheck)">
                  {{ diceResults[0] }} + {{ diceResults[1] }}
                  <span class="text-sm font-normal" v-if="diceModifiers !== 0">
                    ({{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }})
                  </span>
                  = {{ finalDiceResult }}
                </p>
                <p class="text-sm" :class="getRollClass(currentGame.currentScene.skillCheck?.dcCheck)">
                  {{ getRollDescription(currentGame.currentScene.skillCheck?.dcCheck) }}
                </p>
              </div>
            </div>
          </div>

<!-- Choice Buttons -->
<!-- Choice Buttons -->
<div v-if="!hasPlayerMadeChoice && !hasRoundBeenPlayed && diceResult && currentGame?.currentScene?.choices" 
     class="mt-8 grid grid-cols-3 gap-4">
  <button v-for="(choice, key) in currentGame.currentScene.choices"
          :key="key"
          @click="makePlayerChoice(key)"
          :disabled="playerChoice !== null"
          :class="getChoiceButtonClasses(key)">
    <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3"
         :class="getChoiceIconClasses(key)">
      <span :class="getChoiceTextClass(key)">
        {{ getChoiceIcon(key) }}
      </span>
    </div>
    <h3 class="font-semibold text-gray-900">{{ choice.text }}</h3>
    <p class="mt-1 text-sm text-gray-500 text-center">
      {{ choice.description }}
    </p>
    <div v-if="choice.bonuses?.length" 
         class="mt-2 text-xs text-gray-600">
      <div v-for="bonus in choice.bonuses" 
           :key="bonus.type" 
           class="flex items-center">
        <span class="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
        {{ bonus.description }}
      </div>
    </div>
  </button>
</div>
          <!-- Round Outcome -->
          <div v-if="roundOutcome?.narrative" 
               class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-900 mb-2">Outcome:</h3>
            <p class="text-gray-700 italic mb-2">{{ roundOutcome.narrative }}</p>
            <div class="flex justify-between text-sm">
              <span class="text-purple-600">
                Points Earned: {{ roundOutcome.playerPoints || 0 }}
              </span>
              <span class="text-gray-600">
                DM Points: +{{ roundOutcome.dmPoints || 0 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Game End Screen -->
        <div v-if="isGameOver" class="mt-8 text-center bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Game Over!</h2>
          <div class="mb-6">
            <p class="text-xl">{{ getWinnerMessage() }}</p>
            <p class="mt-2 text-gray-600">DM's Final Score: {{ currentGame.dmPoints }}</p>
          </div>
          <button @click="$emit('game-complete')"
                  class="w-full inline-flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            View Game Summary
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGame } from "~/composables/useGame";
import { useAuthStore } from "~/stores/authStore";
import { useDiceRoll } from '~/composables/useDiceRoll'

const props = defineProps({
  gameId: {
    type: String,
    required: true,
  },
});
const {
  diceResult,
  diceResults,
  finalResult: finalDiceResult,
  isRolling,
  currentModifier,
  rollDice,
  resetRoll,
  getRollClass,
  getRollDescription
} = useDiceRoll()
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const {
  currentGame,
  error: gameError,
  loading: gameLoading,
  fetchGame,
  makeChoice,
  cleanupGameListener,
} = useGame();

// State
const playerChoice = ref(null);
const aiChoice = ref(null);
const showingResults = ref(false);
const isLoading = ref(true);
const error = ref(null);
// State
const roundOutcome = ref({
  pointMultiplier: 1,
  playerPoints: 0,
  dmPoints: 0,
  narrative: "",
});

const currentScene = computed(() => currentGame.value?.currentScene || null)


const hasRoundBeenPlayed = computed(() => {
  if (!currentGame.value || !authStore.user) return false
  
  const currentRoundChoices = currentGame.value.players[authStore.user.uid]?.choices || {}
  return !!currentRoundChoices[currentGame.value.currentRound]
})

const isGameOver = computed(() => {
  if (!currentGame.value) return false
  return currentGame.value.status === 'completed'
})

const currentNarration = computed(() => {
  if (!currentGame.value?.currentScene?.narration) return [
    "The story continues...",
    "What will you choose?"
  ]
  return currentGame.value.currentScene.narration
})
const performDiceRoll = async () => {
  try {
    await rollDice()
    currentModifier.value = diceModifiers.value
  } catch (err) {
    console.error('Error rolling dice:', err)
  }
}

// Computed
const hasPlayerMadeChoice = computed(() => playerChoice.value !== null);

const playerScore = computed(() => {
  if (!currentGame.value?.players?.[authStore.user?.uid]?.score) return 0;
  return currentGame.value.players[authStore.user.uid].score;
});



const currentRound = computed(() => {
  if (!currentGame.value?.scenario?.rounds) return null;
  return currentGame.value.scenario.rounds.find(
    (round) => round.id === currentGame.value.currentRound
  );
});


// Methods



// Icon classes for each choice type
const getChoiceIconClasses = (key) => {
  switch (key) {
    case 'cooperate':
      return 'bg-green-100'
    case 'negotiate':
      return 'bg-purple-100'
    case 'betray':
      return 'bg-red-100'
    default:
      return ''
  }
}

// Text color classes for each choice type
const getChoiceTextClass = (key) => {
  switch (key) {
    case 'cooperate':
      return 'text-green-600'
    case 'negotiate':
      return 'text-purple-600'
    case 'betray':
      return 'text-red-600'
    default:
      return ''
  }
}

// Icons for each choice type
const getChoiceIcon = (key) => {
  switch (key) {
    case 'cooperate':
      return '✓'
    case 'negotiate':
      return '⟳'
    case 'betray':
      return '✗'
    default:
      return ''
  }
}

// Button classes including hover and active states
const getChoiceButtonClasses = (key) => {
  const baseClasses = 'flex flex-col items-center p-6 border-2 rounded-lg transition-colors'
  const activeClasses = {
    cooperate: 'border-green-500 bg-green-50',
    negotiate: 'border-purple-500 bg-purple-50',
    betray: 'border-red-500 bg-red-50'
  }
  const inactiveClasses = {
    cooperate: 'hover:border-green-500 hover:bg-green-50',
    negotiate: 'hover:border-purple-500 hover:bg-purple-50',
    betray: 'hover:border-red-500 hover:bg-red-50'
  }

  if (playerChoice.value === key) {
    return `${baseClasses} ${activeClasses[key]}`
  }
  
  return `${baseClasses} border-gray-200 ${inactiveClasses[key]}`
}


// Modify your existing makePlayerChoice method

const getWinnerMessage = () => {
  const playerScore = currentGame.value?.players[authStore.user.uid]?.score || 0;
  const aiScore = currentGame.value?.players?.ai?.score || 0;
  const dmScore = currentGame.value?.dmPoints || 0;

  let message = '';
  
  if (playerScore > aiScore) {
    message = "Congratulations! You Won! 🎉";
  } else if (aiScore > playerScore) {
    message = "AI Wins! Better luck next time!";
  } else {
    message = "It's a tie!";
  }

  // Add DM context
  if (dmScore > Math.max(playerScore, aiScore)) {
    message += "\nBut the real winner is the Dungeon Master! 😈";
  }

  return message;
};

const emit = defineEmits(["game-complete"]);
const isComponentMounted = ref(true);

onUnmounted(() => {
  isComponentMounted.value = false;
  cleanupGameListener();
});

watch(
  () => currentGame.value?.currentRound,
  (newRound) => {
    if (newRound === 6 && isComponentMounted.value) {
      emit('game-complete');
    }
  }
);

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  isComponentMounted.value = true;

  try {
    if (!props.gameId) {
      throw new Error('No game ID provided');
    }

    const game = await fetchGame(props.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (!game.players?.[authStore.user?.uid]) {
      throw new Error('Unauthorized access to game');
    }

  } catch (err) {
    console.error('Error loading game:', err);
    error.value = err.message;
    if (isComponentMounted.value) {
      setTimeout(() => {
        router.push('/gamemenu');
      }, 2000);
    }
  } finally {
    if (isComponentMounted.value) {
      isLoading.value = false;
    }
  }
});

const getDiceResultClass = computed(() => {
  if (!finalDiceResult.value) return ''
  return getRollClass(currentGame.value?.currentScene?.skillCheck?.dcCheck || 7)
})

const getDiceResultMessage = computed(() => {
  if (!finalDiceResult.value) return ''
  return getRollDescription(currentGame.value?.currentScene?.skillCheck?.dcCheck || 7)
})

// Update dice modifiers computation
const diceModifiers = computed(() => {
  if (!currentGame.value?.consequences) return 0
  
  let modifier = 0
  // Add modifiers based on past consequences
  Object.entries(currentGame.value.consequences).forEach(([_, consequence]) => {
    if (consequence.type === 'LOYALTY') modifier += 2
    if (consequence.type === 'BETRAYAL') modifier -= 1
    if (consequence.type === 'CRITICAL_SUCCESS') modifier += 1
    if (consequence.type === 'CRITICAL_FAILURE') modifier -= 2
  })
  
  return modifier
})

// Update the choice button class handling
const makePlayerChoice = async (choice) => {
  if (!currentGame.value?.currentScene || playerChoice.value || hasRoundBeenPlayed.value) return;
  if (!diceResult.value && !isRolling.value) return;
  
  playerChoice.value = choice;
  
  try {
    const diceInfo = {
      diceRoll: diceResult.value,
      finalResult: finalDiceResult.value,
      modifier: diceModifiers.value,
      isCritical: diceResult.value === 12,
      isCriticalFail: diceResult.value === 2,
      dcCheck: currentGame.value.currentScene.skillCheck?.dcCheck || 10
    };

    roundOutcome.value = null;

    const result = await makeChoice(
      props.gameId,
      choice,
      diceInfo
    );

    if (result?.outcome) {
      roundOutcome.value = {
        ...result.outcome,
        pointMultiplier: result.outcome.pointMultiplier || 1,
        playerPoints: result.outcome.playerPoints || 0,
        dmPoints: result.outcome.dmPoints || 0,
        narrative: result.outcome.narrative || "The round concludes..."
      };
    }

    // Show outcome briefly
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Progress to next round or end game
    if (result.nextScene) {
      playerChoice.value = null;
      aiChoice.value = null;
      roundOutcome.value = null;
      resetRoll();
    } else {
      showingResults.value = true;
      if (isComponentMounted.value) {
        emit('game-complete');
      }
    }
  } catch (err) {
    console.error('Error making choice:', err);
    error.value = err.message;
    playerChoice.value = null;
    roundOutcome.value = null;
  }
};



// Update watching for round changes
watch(
  () => currentGame.value?.currentScene,
  (newScene, oldScene) => {
    if (newScene && newScene !== oldScene) {
      // Reset state for new scene
      playerChoice.value = null;
      aiChoice.value = null;
      roundOutcome.value = null;
      resetRoll();
      // Reset any other relevant state
      showingResults.value = false;
    }
  },
  { deep: true }
);
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>