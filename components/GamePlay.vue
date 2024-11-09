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
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">
                Round {{ currentGame.currentRound }} of 5
              </p>
              <h1 class="text-base font-bold text-white line-clamp-1">
                {{ currentGame.currentScene?.title || "Loading..." }}
              </h1>
            </div>
            <div class="text-right space-y-0.5">
              <p class="text-sm font-medium text-purple-400">DM Score: {{ currentGame.dmPoints || 0 }}</p>
              <p class="text-sm font-medium text-gray-400">Your Score: {{ playerScore }}</p>
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

      <!-- Active Effects Bar -->
      <div v-if="currentGame.consequences && Object.keys(currentGame.consequences).length > 0"
           class="bg-gray-800/50 backdrop-blur-sm">
        <div class="max-w-3xl mx-auto px-4 py-2 overflow-x-auto">
          <div class="flex space-x-4">
            <div v-for="(consequence, index) in currentGame.consequences" 
                 :key="index"
                 class="flex items-center space-x-2 flex-shrink-0">
              <span class="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
              <span class="text-xs text-gray-300">{{ consequence.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Scene Area -->
      <div v-if="currentGame.currentScene && !showingResults" 
           class="relative min-h-[60vh]">
        <!-- Scene Image with Parallax -->
        <div class="absolute inset-0 overflow-hidden">
          <img 
            :src="currentGame.currentScene.imageUrl || '/api/placeholder/800/600'" 
            :alt="currentGame.currentScene.title"
            class="w-full h-full object-cover transform scale-105 animate-ken-burns"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/60 to-gray-900"></div>
        </div>

        <!-- Animated Description -->
        <div class="relative px-4 py-12">
          <div 
            class="max-w-2xl mx-auto text-white text-lg font-medium text-center leading-relaxed opacity-0 animate-fadeIn"
            style="animation-delay: 0.5s; animation-fill-mode: forwards;"
          >
            {{ currentGame.currentScene.description }}
          </div>
        </div>

        <!-- DM Avatar and Chat -->
        <div class="relative px-4 mt-4 max-w-3xl mx-auto">
          <div class="flex items-end space-x-3">
            <!-- DM Avatar with Lottie -->
            <div 
              ref="dmAvatar"
              class="w-14 h-14 rounded-full bg-purple-900/50 backdrop-blur-sm overflow-hidden flex-shrink-0 border-2 border-purple-500/30"
            >
              <!-- Lottie animation will be mounted here -->
            </div>

            <!-- Chat Bubble -->
            <div 
              class="flex-1 mb-2 transform transition-all duration-300"
              :class="isChatMinimized ? 'scale-95 opacity-80' : 'scale-100 opacity-100'"
            >
              <div 
                @click="toggleChat"
                class="bg-purple-900/50 backdrop-blur-sm rounded-t-2xl rounded-br-2xl p-4 text-white cursor-pointer relative chat-bubble"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-purple-300">Dungeon Master</span>
                  <button 
                    class="text-purple-400 hover:text-purple-300 transition-colors"
                    @click.stop="toggleChat"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="h-5 w-5 transition-transform duration-300" 
                      :class="isChatMinimized ? 'rotate-180' : ''"
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fill-rule="evenodd" 
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                        clip-rule="evenodd" 
                      />
                    </svg>
                  </button>
                </div>
                <div 
                  class="space-y-2 overflow-hidden transition-all duration-300"
                  :class="isChatMinimized ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'"
                >
                  <p 
                    v-for="(line, index) in currentNarration" 
                    :key="index"
                    class="text-sm italic leading-relaxed text-gray-100"
                    :style="{animation: `fadeIn 0.5s ease-in ${index * 0.5 + 1}s forwards`}"
                  >
                    "{{ line }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Interaction Area -->
      <div class="relative z-10 mt-6">
        <!-- Dice Roll Section -->
        <div v-if="!hasPlayerMadeChoice && !hasRoundBeenPlayed">
          <div class="max-w-3xl mx-auto px-4">
            <!-- Skill Check Info -->
            <div v-if="!diceResult && !isRolling"
                 class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-white font-medium">Skill Check Required</h3>
                  <p class="text-sm text-gray-300">
                    DC {{ currentGame.currentScene.skillCheck?.dcCheck }} 
                    {{ currentGame.currentScene.skillCheck?.name }}
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
            <div v-if="isRolling || diceResult" 
                 class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center mb-4">
              <div v-if="isRolling" class="text-2xl font-bold text-purple-400 animate-bounce">
                Rolling...
              </div>
              <div v-else class="space-y-2">
                <p class="text-4xl font-bold" :class="getRollClass(currentGame.currentScene.skillCheck?.dcCheck)">
                  {{ finalDiceResult }}
                </p>
                <div class="text-gray-400 space-x-2">
                  <span>{{ diceResults[0] }} + {{ diceResults[1] }}</span>
                  <span v-if="diceModifiers !== 0">
                    ({{ diceModifiers >= 0 ? '+' : ''}}{{ diceModifiers }})
                  </span>
                </div>
                <p class="text-sm" :class="getRollClass(currentGame.currentScene.skillCheck?.dcCheck)">
                  {{ getRollDescription(currentGame.currentScene.skillCheck?.dcCheck) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Roll Button or Choices -->
          <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 pt-12">
            <div class="max-w-3xl mx-auto px-4 pb-4">
              <div v-if="!diceResult && !isRolling">
                <button 
                  @click="performDiceRoll"
                  class="w-full py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span class="text-2xl">🎲</span>
                  <span>Roll for {{ currentGame.currentScene.skillCheck?.name }}</span>
                </button>
              </div>

              <!-- Choice Buttons -->
              <div v-else-if="diceResult && currentGame.currentScene.choices" 
                   class="space-y-3">
                <button v-for="(choice, key) in currentGame.currentScene.choices"
                        :key="key"
                        @click="makePlayerChoice(key)"
                        :disabled="playerChoice !== null"
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
                        <p class="text-sm text-gray-300">
                          {{ choice.description }}
                        </p>
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

        <!-- Round Outcome -->
        <div v-if="roundOutcome?.narrative" 
             class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 pt-12">
          <div class="max-w-3xl mx-auto px-4 pb-4">
            <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 space-y-3 animate-slideUp">
              <p class="text-gray-100 italic">{{ roundOutcome.narrative }}</p>
              <div class="flex justify-between text-sm">
                <span class="text-purple-400 font-medium">
                  +{{ roundOutcome.playerPoints || 0 }} points
                </span>
                <span class="text-gray-400">
                  DM: +{{ roundOutcome.dmPoints || 0 }}
                </span>
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

// Import Lottie animations
import dmIdleAnimation from '@/assets/animations/dm-idle.json';
import dmTalkingAnimation from '@/assets/animations/dm-talking.json';
import dmThinkingAnimation from '@/assets/animations/dm-thinking.json';
import lottie from 'lottie-web';

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


// UI State
const dmAvatar = ref(null);
const dmLottieAnimation = ref(null);
const isChatMinimized = ref(false);
const isLoading = ref(true);
const error = ref(null);
const playerChoice = ref(null);
const showingResults = ref(false);
const currentAnimationState = ref('idle');
const aiChoice = ref(null);

// Round outcome state
const roundOutcome = ref({
  pointMultiplier: 1,
  playerPoints: 0,
  dmPoints: 0,
  narrative: "",
});

const dmAnimations = {
  idle: () => import('@/assets/animations/dm-idle.json'),
  talking: () => import('@/assets/animations/dm-talking.json'),
  thinking: () => import('@/assets/animations/dm-thinking.json')
};

const loadDMLottieAnimation = async () => {
  if (!dmAvatar.value) return;

  try {
    // Destroy existing animation if any
    if (dmLottieAnimation.value) {
      dmLottieAnimation.value.destroy();
    }

    // Get the correct animation data based on state
    let animationData;
    switch (currentAnimationState.value) {
      case 'talking':
        animationData = await dmAnimations.talking();
        break;
      case 'thinking':
        animationData = await dmAnimations.thinking();
        break;
      default:
        animationData = await dmAnimations.idle();
    }

    // Create new animation
    dmLottieAnimation.value = lottie.loadAnimation({
      container: dmAvatar.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData.default // Note the .default when using dynamic import
    });
  } catch (err) {
    console.error('Error loading animation:', err);
  }
};

const updateDMAnimation = async (state) => {
  currentAnimationState.value = state;
  await loadDMLottieAnimation();
};


// computed
// Computed properties
const currentScene = computed(() => currentGame.value?.currentScene || null);

const hasRoundBeenPlayed = computed(() => {
  if (!currentGame.value || !authStore.user) return false;
  const currentRoundChoices = currentGame.value.players[authStore.user.uid]?.choices || {};
  return !!currentRoundChoices[currentGame.value.currentRound];
});

const isGameOver = computed(() => {
  if (!currentGame.value) return false;
  return currentGame.value.status === 'completed';
});

const currentNarration = computed(() => {
  if (!currentGame.value?.currentScene?.narration) return [
    "The story continues...",
    "What will you choose?"
  ];
  return currentGame.value.currentScene.narration;
});

const playerScore = computed(() => {
  if (!currentGame.value?.players?.[authStore.user?.uid]?.score) return 0;
  return currentGame.value.players[authStore.user.uid].score;
});


// Choice Methods
const getChoiceClasses = (key) => {
  const baseClasses = 'transition-all duration-300';
  switch (key) {
    case 'cooperate':
      return `${baseClasses} hover:bg-green-900/20`;
    case 'negotiate':
      return `${baseClasses} hover:bg-purple-900/20`;
    case 'betray':
      return `${baseClasses} hover:bg-red-900/20`;
    default:
      return baseClasses;
  }
};

const getChoiceIconClasses = (key) => {
  switch (key) {
    case 'cooperate':
      return 'bg-green-900/50';
    case 'negotiate':
      return 'bg-purple-900/50';
    case 'betray':
      return 'bg-red-900/50';
    default:
      return '';
  }
};

const getChoiceTextClass = (key) => {
  switch (key) {
    case 'cooperate':
      return 'text-green-400';
    case 'negotiate':
      return 'text-purple-400';
    case 'betray':
      return 'text-red-400';
    default:
      return '';
  }
};

const getChoiceIcon = (key) => {
  switch (key) {
    case 'cooperate':
      return '✓';
    case 'negotiate':
      return '⟳';
    case 'betray':
      return '✗';
    default:
      return '';
  }
};


// Computed
const hasPlayerMadeChoice = computed(() => playerChoice.value !== null);

const currentRound = computed(() => {
  if (!currentGame.value?.scenario?.rounds) return null;
  return currentGame.value.scenario.rounds.find(
    (round) => round.id === currentGame.value.currentRound
  );
});


const toggleChat = async () => {
  isChatMinimized.value = !isChatMinimized.value;
  await updateDMAnimation(isChatMinimized.value ? 'idle' : 'talking');
};

const performDiceRoll = async () => {
  await updateDMAnimation('thinking');
  try {
    await rollDice();
    currentModifier.value = diceModifiers.value;
  } catch (err) {
    console.error('Error rolling dice:', err);
  } finally {
    await updateDMAnimation('talking');
  }
};


const makePlayerChoice = async (choice) => {
  if (!currentGame.value?.currentScene || playerChoice.value || hasRoundBeenPlayed.value) return;
  if (!diceResult.value && !isRolling.value) return;
  
  updateDMAnimation('thinking');
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
    const result = await makeChoice(props.gameId, choice, diceInfo);

    if (result?.outcome) {
      roundOutcome.value = {
        ...result.outcome,
        pointMultiplier: result.outcome.pointMultiplier || 1,
        playerPoints: result.outcome.playerPoints || 0,
        dmPoints: result.outcome.dmPoints || 0,
        narrative: result.outcome.narrative || "The round concludes..."
      };
      updateDMAnimation('talking');
    }

    // Show outcome for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if game is complete
    if (currentGame.value?.status === 'completed') {
      showingResults.value = true;
      if (isComponentMounted.value) {
        emit('game-complete');
      }
    } else {
      // Reset state for next round
      playerChoice.value = null;
      roundOutcome.value = null;
      resetRoll();
      diceResult.value = null;
      updateDMAnimation('idle');
    }
  } catch (err) {
    console.error('Error making choice:', err);
    error.value = err.message;
    playerChoice.value = null;
    roundOutcome.value = null;
    updateDMAnimation('idle');
  }
};

// Add a watch for game status changes
watch(
  () => currentGame.value?.status,
  (newStatus) => {
    if (newStatus === 'completed' && isComponentMounted.value) {
      showingResults.value = true;
      emit('game-complete');
    }
  }
);

// Modify the scene change watcher
watch(
  () => currentGame.value?.currentScene,
  (newScene, oldScene) => {
    if (newScene && newScene !== oldScene) {
      // Reset all state for new scene
      playerChoice.value = null;
      roundOutcome.value = null;
      diceResult.value = null;
      resetRoll();
      showingResults.value = false;
      updateDMAnimation('talking');
    }
  },
  { deep: true }
);

// Methods
// Game Methods


const getWinnerMessage = () => {
  const playerScore = currentGame.value?.players[authStore.user.uid]?.score || 0;
  const dmScore = currentGame.value?.dmPoints || 0;

  if (playerScore > dmScore) {
    return "You've outsmarted the Dungeon Master! 🎉";
  } else if (dmScore > playerScore) {
    return "The Dungeon Master prevails! Better luck next time! 😈";
  } else {
    return "A perfect balance - it's a tie! 🤝";
  }
};


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

    // Initialize DM animation
    await loadDMLottieAnimation();
    await updateDMAnimation('idle');

  } catch (err) {
    console.error('Error loading game:', err);
    error.value = err.message;
    setTimeout(() => {
      router.push('/gamemenu');
    }, 2000);
  } finally {
    isLoading.value = false;
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


onMounted(async () => {
  isLoading.value = true;
  error.value = null;

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

    // Initialize DM animation
    loadDMLottieAnimation();
    updateDMAnimation('idle');

  } catch (err) {
    console.error('Error loading game:', err);
    error.value = err.message;
    setTimeout(() => {
      router.push('/gamemenu');
    }, 2000);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (dmLottieAnimation.value) {
    dmLottieAnimation.value.destroy();
  }
  cleanupGameListener();
});

// Watch for scene changes
watch(
  () => currentGame.value?.currentScene,
  async (newScene, oldScene) => {
    if (newScene && newScene !== oldScene) {
      playerChoice.value = null;
      roundOutcome.value = null;
      resetRoll();
      showingResults.value = false;
      await updateDMAnimation('talking');
    }
  },
  { deep: true }
);

</script>

<style scoped>
@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ken-burns {
  0% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1.15);
  }
}

.animate-fadeIn {
  animation: fadeIn 1s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out forwards;
}

.animate-ken-burns {
  animation: ken-burns 20s ease-out infinite alternate;
}

.chat-bubble::after {
  content: '';
  position: absolute;
  left: -8px;
  bottom: 12px;
  width: 0;
  height: 0;
  border-right: 8px solid rgba(126, 34, 206, 0.5);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Glass effect */
.backdrop-blur-sm {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Touch interactions */
@media (hover: none) {
  .active\:bg-purple-800:active {
    background-color: rgb(107, 33, 168);
  }
  
  .hover\:scale-\[0\.98\]:active {
    transform: scale(0.98);
  }
}
</style>