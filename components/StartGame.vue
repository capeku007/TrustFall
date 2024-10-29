<template>
  <div class="bottom-sheet" ref="bottomSheet">
    <div
      ref="sheetContent"
      class="content"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="relative">
        <!-- Close button -->
        <button 
          @click="hideModal('startModal')"
          class="absolute right-0 top-0 -mt-4 -mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4 text-gray-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        <div
          ref="dragIcon"
          class="header max-h-5 cursor-grab select-none dragIcon"
          @mousedown="dragStart"
          @touchstart="dragStart"
        >
          <span class="block h-1 w-10 bg-gray-300 rounded-full"></span>
        </div>

        <div @mousedown="dragStart" @touchstart="dragStart" class="grid grid-rows-[7.5%_1fr_15%] min-h-full max-h-full">
          <div class="p-4 h-full">
            <!-- Header with Tabs -->
            <div class="mb-6">
              <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    @click="currentTab = tab.key"
                    :class="[
                      currentTab === tab.key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                    ]"
                  >
                    {{ tab.name }}
                  </button>
                </nav>
              </div>
            </div>

            <!-- Active Games List -->
            <div v-if="currentTab === 'active'" class="space-y-4">
              <div v-if="loadingGames" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>

              <div v-else-if="playerGames.length === 0" class="text-center py-8">
                <p class="text-gray-500">No active games found</p>
              </div>

              <template v-else>
  <div 
    v-for="game in playerGames" 
    :key="game.id"
    class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
  >
    <button 
      @click="resumeGame(game.id)"
      class="w-full p-4 text-left"
    >
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium text-gray-900">
            {{ game.scenario.title }}
          </h3>
          <div class="flex items-center mt-1 space-x-2">
            <span class="text-sm text-gray-500">
              Round {{ game.currentRound }} of 5
            </span>
            <span class="text-sm text-gray-300">•</span>
            <span class="text-sm text-gray-500">
              {{ formatDate(game.createdAt) }}
            </span>
          </div>
        </div>
        <div class="text-right flex items-center space-x-2">
          <div class="text-center">
            <p class="text-xs text-gray-500">Your Score</p>
            <p class="text-lg font-medium text-purple-600">
              {{ game.players[authStore.user.uid].score }}
            </p>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </div>
      </div>
    </button>
  </div>
</template>
            </div>

            <!-- New Game Form -->
            <div v-else-if="currentTab === 'new'" class="space-y-6">
              <!-- Your existing scenario and opponent selection -->
                  <!-- Scenario Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Scenario
      </label>
      <div class="grid grid-cols-1 gap-4">
        <div v-for="scenario in scenarios" :key="scenario.id"
          class="relative flex items-center space-x-3 rounded-lg border p-3 hover:border-gray-400 cursor-pointer"
          :class="selectedScenario === scenario.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'"
          @click="selectScenario(scenario.id)">
          <div class="flex-shrink-0">
            <img :src="scenario.image" :alt="scenario.title" class="h-10 w-10 rounded-full">
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-900">{{ scenario.title }}</div>
            <p class="text-sm text-gray-500">{{ scenario.description }}</p>
          </div>
          <div v-if="selectedScenario === scenario.id" class="text-purple-500">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Opponent Type Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Opponent
      </label>
      <div class="grid grid-cols-2 gap-4">
        <button
          @click="selectOpponent('ai')"
          class="flex flex-col items-center p-4 rounded-lg border"
          :class="selectedOpponent === 'ai' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" :class="selectedOpponent === 'ai' ? 'text-purple-500' : 'text-gray-400'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span class="text-sm font-medium" :class="selectedOpponent === 'ai' ? 'text-purple-500' : 'text-gray-900'">AI Opponent</span>
        </button>
        <button
          @click="selectOpponent('player')"
          class="flex flex-col items-center p-4 rounded-lg border"
          :class="selectedOpponent === 'player' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2" :class="selectedOpponent === 'player' ? 'text-purple-500' : 'text-gray-400'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="text-sm font-medium" :class="selectedOpponent === 'player' ? 'text-purple-500' : 'text-gray-900'">Real Player</span>
        </button>
      </div>
    </div>

    <!-- Start Button -->
    <div class="mt-auto space-y-4">
  <!-- Error message -->
  <div v-if="error" class="px-4 py-3 rounded-md bg-red-50 text-red-600 text-sm">
    {{ error }}
  </div>

  <button
    @click="startGame"
    :disabled="!canStart"
    class="w-full rounded-lg py-3 px-4 text-sm font-semibold text-white shadow-sm transition-colors relative"
    :class="canStart ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-300 cursor-not-allowed'"
  >
    <span :class="{ 'opacity-0': loading }">
      Start Game
    </span>
    
    <!-- Loading spinner -->
    <div v-if="loading" 
      class="absolute inset-0 flex items-center justify-center"
    >
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  </button>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from "../stores/authStore";
import { useMainStore } from "~/stores/main";

// Add router to your component setup
const router = useRouter();
const authStore = useAuthStore();
const mainStore = useMainStore();
const { hideModal } = useModal();
const { scenarios, createNewGame, playerGames, loadingGames, fetchPlayerGames } = useGame()


// Add loading and error states
const loading = ref(false);
const error = ref(null);

// Game selection state
const selectedScenario = ref(null);
const selectedOpponent = ref(null);

const currentTab = ref('active')
const tabs = [
  { key: 'active', name: 'Active Games' },
  { key: 'new', name: 'New Game' }
]

// Date formatter
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

// Resume game method
const resumeGame = (gameId) => {
  hideModal('startModal')
  router.push(`/game/${gameId}`)
}

// Load player's games on mount
onMounted(async () => {
  if (authStore.user) {
    await fetchPlayerGames(authStore.user.uid)
  }
})

// Computed property for enabling/disabling start button
const canStart = computed(() => {
  return selectedScenario.value && selectedOpponent.value && !loading.value;
});

// Selection methods
const selectScenario = (scenarioId) => {
  selectedScenario.value = scenarioId;
  error.value = null; // Clear any previous errors
};

const selectOpponent = (opponentType) => {
  selectedOpponent.value = opponentType;
  error.value = null; // Clear any previous errors
};

// Update the startGame method
const startGame = async () => {
  if (!selectedScenario.value || !selectedOpponent.value || loading.value) return;
  
  loading.value = true;
  error.value = null;

  try {
    console.log('Starting game creation...'); // Debug log
    console.log('Auth state:', authStore.user); // Debug log

    if (!authStore.user) {
      throw new Error('Please sign in to start a game');
    }

    console.log('Creating new game...'); // Debug log
    const game = await createNewGame(selectedScenario.value, selectedOpponent.value);
    
    console.log('Game created:', game); // Debug log

    if (!game || !game.id) {
      throw new Error('Failed to create game');
    }

    console.log('Preparing navigation...'); // Debug log
    
    // Wait a moment to ensure database write is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Hiding modal...'); // Debug log
    hideModal('startModal');
    
    console.log('Navigating to game...'); // Debug log
    // Use more specific navigation
    await router.push({
      path: `/game/${game.id}`,
      replace: true,
      force: true
    });

  } catch (err) {
    console.error('Failed to create game:', err);
    error.value = err.message || 'Failed to start game. Please try again.';
  } finally {
    loading.value = false;
  }
};


// Bottom sheet refs and state
const bottomSheet = ref(null);
const sheetContent = ref(null);
const dragIcon = ref(null);

// Dragging state
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const touchStartX = ref(null);
const swipeThreshold = 80;

// Touch handlers
const handleTouchStart = (event) => {
  touchStartX.value = event.touches[0].clientX;
};

const handleTouchEnd = (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const swipeDistance = touchEndX - touchStartX.value;

  if (swipeDistance > swipeThreshold) {
    hideBottomSheet();
  }
};

const hideBottomSheet = () => {
  hideModal('startModal');
  resetSheetHeight();
};

// Drag handlers
const dragStart = (e) => {
  if (!sheetContent.value) return;
  
  isDragging.value = true;
  startY.value = e.pageY || e.touches?.[0].pageY;
  startHeight.value = parseInt(sheetContent.value.style.height) || 80;
  
  if (bottomSheet.value) {
    bottomSheet.value.classList.add("dragging");
  }
};

const dragging = (e) => {
  if (!isDragging.value || !sheetContent.value) return;
  
  const delta = startY.value - (e.pageY || e.touches?.[0].pageY);
  const newHeight = startHeight.value + (delta / window.innerHeight) * 100;
  updateSheetHeight(newHeight);
};

const dragStop = () => {
  if (!isDragging.value || !sheetContent.value) return;
  
  isDragging.value = false;
  if (bottomSheet.value) {
    bottomSheet.value.classList.remove("dragging");
  }
  
  const sheetHeight = parseInt(sheetContent.value.style.height) || 80;
  if (sheetHeight < 25) {
    hideBottomSheet();
  } else if (sheetHeight > 75) {
    updateSheetHeight(80);
  } else {
    updateSheetHeight(80);
  }
};

const updateSheetHeight = (height) => {
  if (!sheetContent.value) return;
  
  const clampedHeight = Math.max(0, Math.min(80, height));
  sheetContent.value.style.height = `${clampedHeight}vh`;
  
  if (bottomSheet.value) {
    bottomSheet.value.classList.toggle("fullscreen", clampedHeight === 80);
  }
};

const resetSheetHeight = () => {
  if (sheetContent.value) {
    sheetContent.value.style.height = "80vh";
  }
};

// Lifecycle hooks
onMounted(() => {
  if (sheetContent.value) {
    sheetContent.value.style.height = "80vh";
  }

  document.addEventListener("mousemove", dragging);
  document.addEventListener("mouseup", dragStop);
  document.addEventListener("touchmove", dragging);
  document.addEventListener("touchend", dragStop);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", dragging);
  document.removeEventListener("mouseup", dragStop);
  document.removeEventListener("touchmove", dragging);
  document.removeEventListener("touchend", dragStop);
});
</script>

  <style scoped>
  .bottom-sheet {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    opacity: 1;
    pointer-events: auto;
    align-items: center;
    flex-direction: column;
    justify-content: flex-end;
    transition: 0.1s linear;
  }
  
  .bottom-sheet .content {
    width: 100%;
    position: relative;
    background: #fff;
    max-height: 80vh;
    height: 50vh;
    max-width: 1150px;
    padding: 25px 30px;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
    transition: 0.3s ease;
  }
  
  .bottom-sheet.dragging .content {
    transition: none;
  }
  
  .bottom-sheet.fullscreen .content {
    border-radius: 0;
    overflow-y: hidden;
  }
  
  .bottom-sheet .header {
    display: flex;
    justify-content: center;
    margin: 0;
    min-height: 1vh;
    max-height: 1vh;
  }
  
  .bottom-sheet .modalBody {
    scrollbar-width: none;
    margin: 1rem;
  }
  
  .bottom-sheet .modalBody::-webkit-scrollbar {
    width: 0;
  }
  </style>