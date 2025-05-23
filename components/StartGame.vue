<template>
  <div class="bottom-sheet" ref="bottomSheet">
    <div
      ref="sheetContent"
      class="content"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <button 
              v-if="currentTab === 'new' && selectedScenario"
              @click="selectedScenario = null"
              class="p-1 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-lg font-semibold text-gray-900">
              {{ currentTab === 'new' ? (selectedScenario ? 'Select Opponent' : 'Choose Scenario') : 'Your Games' }}
            </h1>
          </div>
          <button 
            @click="hideModal('startModal')"
            class="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="px-4">
          <nav class="flex space-x-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="currentTab = tab.key"
              class="relative py-4 px-1"
            >
              <span
                :class="[
                  currentTab === tab.key
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                ]"
                class="text-sm font-medium"
              >
                {{ tab.name }}
              </span>
              <span
                :class="[
                  currentTab === tab.key
                    ? 'bg-purple-600'
                    : 'bg-transparent'
                ]"
                class="absolute bottom-0 left-0 w-full h-0.5"
              />
            </button>
          </nav>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto">
        <!-- Active Games List -->
        <div v-if="currentTab === 'active'" class="p-4 space-y-4">
          <div v-if="loadingGames" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>

          <div v-else-if="activeGames.length === 0" class="text-center py-12">
            <div class="rounded-full bg-gray-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p class="text-gray-500 text-sm">No active games found</p>
            <button 
              @click="currentTab = 'new'"
              class="mt-4 text-purple-600 text-sm font-medium"
            >
              Start a new game
            </button>
          </div>

          <template v-else>
            <div 
              v-for="game in activeGames" 
              :key="game.id"
              class="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-medium text-gray-900">
                      {{ game.scenario.title }}
                    </h3>
                    <div class="mt-1 flex items-center space-x-2">
                      <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                        Round {{ game.currentRound }}/5
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ formatDate(game.createdAt) }}
                      </span>
                    </div>
                  </div>
                  <button 
                    @click="resumeGame(game.id)"
                    class="p-2 text-purple-600 hover:bg-purple-50 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- New Game Flow -->
        <div v-else class="p-4">
          <!-- Scenarios Selection -->
          <div v-if="!selectedScenario" class="space-y-6">
            <!-- Horizontal scrolling scenarios -->
            <div class="relative">
              <div class="overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4">
                <div 
                  v-for="scenario in availableScenarios" 
                  :key="scenario.id"
                  @click="selectScenario(scenario.id)"
                  class="snap-center shrink-0 w-[calc(100%-2rem)] sm:w-72 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <!-- Scenario Image -->
                  <div class="aspect-video w-full bg-purple-100 relative">
                    <img 
                      :src="scenario?.imageUrl || '/api/placeholder/288/162'" 
                      :alt="scenario?.title"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Scenario Info -->
                  <div class="p-4">
                    <h3 class="font-medium text-gray-900 line-clamp-1">
                      {{ scenario?.title }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-500 line-clamp-2">
                      {{ scenario.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Scroll indicators (optional) -->
              <div class="absolute left-0 right-0 bottom-4 hidden sm:flex justify-center space-x-2">
                <div class="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              </div>
            </div>

            <!-- Ad Banner -->
            <div class="rounded-lg overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-purple-100">Featured</p>
                  <h3 class="text-lg font-semibold">Premium Scenarios</h3>
                  <p class="text-sm text-purple-100">Get access to exclusive content</p>
                </div>
                <button class="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          </div>

          <!-- Opponent Selection -->
          <div v-else>
            <div class="space-y-6">
              <!-- Opponent Type Selection -->
              <div class="grid grid-cols-1 gap-4">
                <button
                  @click="selectOpponent('ai')"
                  class="flex items-center p-4 rounded-lg border bg-white"
                  :class="selectedOpponent === 'ai' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'"
                >
                  <div class="p-2 rounded-full bg-purple-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium text-gray-900">AI Opponent</div>
                    <div class="text-sm text-gray-500">Play against our advanced AI</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  @click="selectOpponent('player')"
                  class="flex items-center p-4 rounded-lg border bg-white"
                  :class="selectedOpponent === 'player' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'"
                >
                  <div class="p-2 rounded-full bg-purple-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium text-gray-900">Real Player</div>
                    <div class="text-sm text-gray-500">Challenge another player</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <!-- Player Selection (when Real Player is chosen) -->
              <div v-if="selectedOpponent === 'player'" class="mt-6">
                <div v-if="loadingPlayers" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>

                <div v-else-if="availablePlayers.length === 0" class="text-center py-8">
                  <p class="text-sm text-gray-500">No players available</p>
                </div>

                <div v-else class="space-y-2">
                  <div 
                    v-for="player in availablePlayers" 
                    :key="player.id"
                    @click="selectPlayerOpponent(player)"
                    class="p-4 bg-white rounded-lg shadow-sm flex items-center space-x-4 cursor-pointer"
                    :class="selectedPlayerOpponent?.id === player.id ? 'ring-2 ring-purple-500' : ''"
                  >
                    <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span class="text-lg text-purple-600">
                        {{ player.name?.charAt(0)?.toUpperCase() || '?' }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ player.name || 'Anonymous' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Last online: {{ formatDate(player.lastSeen) }}
                      </p>
                    </div>
                    <div v-if="selectedPlayerOpponent?.id === player.id" class="text-purple-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div 
        v-if="currentTab === 'new' && selectedScenario"
        class="sticky bottom-0 bg-white border-t border-gray-200 p-4"
      >
        <div v-if="error" class="mb-4 px-4 py-3 rounded-md bg-red-50 text-red-600 text-sm">
          {{ error }}
        </div>
        
        <button
          @click="startGame"
          :disabled="!canStart"
          class="w-full rounded-lg py-3 px-4 text-sm font-semibold text-white shadow-sm transition-colors relative"
          :class="canStart ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-300'"
        >
          <span :class="{ 'opacity-0': loading }">
            Start Game
          </span>
          
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from "../stores/authStore";
import { useMainStore } from "~/stores/main";
import { useGame } from '~/composables/useGame';
import { useSceneManager } from '~/composables/useSceneManager';
import { useMultiplayer } from '~/composables/useMultiplayer';

// Initialize composables and stores
const router = useRouter();
const authStore = useAuthStore();
const mainStore = useMainStore();
const { hideModal } = useModal();
const { scenarios, createNewGame, playerGames, loadingGames, fetchPlayerGames, cleanupGameListener } = useGame();
const sceneManager = useSceneManager();
const { 
  pendingGames, 
  createMultiplayerGame, 
  joinGame, 
  getAvailablePlayers,
  watchPendingGames,
  loadingMultiplayer,
  error: multiplayerError,
  cleanup 
} = useMultiplayer();

const availableScenarios = computed(() => sceneManager.getScenarios())
// State
const loading = ref(false);
const error = ref(null);
const selectedScenario = ref(null);
const selectedOpponent = ref(null);
const currentTab = ref('new');
const loadingPlayers = ref(false);
const availablePlayers = ref([]);
const selectedPlayerOpponent = ref(null);

// Bottom sheet refs
const bottomSheet = ref(null);
const sheetContent = ref(null);
const dragIcon = ref(null);

// Dragging state
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const touchStartX = ref(null);
const swipeThreshold = 80;

// Constants
const tabs = [
{ key: 'new', name: 'New Game' },
  { key: 'active', name: 'Active Games' }
];const selectOpponent = async (opponentType) => {
  selectedOpponent.value = opponentType;
  selectedPlayerOpponent.value = null;
  error.value = null;
  
  if (opponentType === 'player') {
    loadingPlayers.value = true;
    try {
      const players = await getAvailablePlayers();
      availablePlayers.value = players.filter(p => p.id !== authStore.user.uid);
    } catch (err) {
      error.value = 'Failed to load available players';
      console.error(err);
    } finally {
      loadingPlayers.value = false;
    }
  }
};

// Add method to select a specific player
const selectPlayerOpponent = (player) => {
  selectedPlayerOpponent.value = player;
};

// Modify the canStart computed property
const canStart = computed(() => {
  if (!selectedScenario.value || !selectedOpponent.value || loading.value) {
    return false;
  }
  
  if (selectedOpponent.value === 'player' && !selectedPlayerOpponent.value) {
    return false;
  }
  
  return true;
});

// Modify the startGame method
const startGame = async () => {
  if (!canStart.value) return;
  
  loading.value = true;
  error.value = null;

  try {
    if (!authStore.user) {
      throw new Error('Please sign in to start a game');
    }

    let game;
    if (selectedOpponent.value === 'player') {
      game = await createMultiplayerGame(selectedScenario.value, selectedPlayerOpponent.value.id);
    } else {
      game = await createNewGame(selectedScenario.value);
    }
    
    if (!game || !game.id) {
      throw new Error('Failed to create game');
    }

    cleanupGameListener();
    hideModal('startModal');
    await router.push(`/game/${game.id}`);

  } catch (err) {
    console.error('Failed to create game:', err);
    error.value = err.message || 'Failed to start game. Please try again.';
  } finally {
    loading.value = false;
  }
};

//////



// Methods
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const resumeGame = async (gameId) => {
  try {
    // Find the game in the playerGames array
    const game = playerGames.value.find(g => g.id === gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if game is completed
    if (game.status === 'completed') {
      await router.push(`/game/${gameId}/summary`);
      return;
    }

    // Hide modal before navigation
    hideModal('startModal');
    
    // Navigate to game
    await router.push(`/game/${gameId}`);
  } catch (err) {
    console.error('Error resuming game:', err);
    error.value = 'Failed to resume game. Please try again.';
  }
};

// Computed properties to filter games
const activeGames = computed(() => {
  return playerGames.value.filter(game => game.status == 'active')
})

const completedGames = computed(() => {
  return playerGames.value.filter(game => game.status === 'completed')
})

// View summary method
const viewGameSummary = async (gameId) => {
  try {
    hideModal('startModal')
    await router.push(`/game/${gameId}/summary`)
  } catch (err) {
    console.error('Error viewing game summary:', err)
    error.value = 'Failed to view game summary'
  }
}

const selectScenario = (scenarioId) => {
  selectedScenario.value = scenarioId;
  error.value = null;
};


// Add new methods for multiplayer
const handleCreateMultiplayerGame = async () => {
  if (!selectedScenario.value) {
    error.value = 'Please select a scenario first';
    return;
  }

  loading.value = true;
  try {
    const game = await createMultiplayerGame(selectedScenario.value);
    if (game) {
      hideModal('startModal');
      await router.push(`/game/${game.id}`);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleJoinGame = async (gameId) => {
  loading.value = true;
  try {
    await joinGame(gameId);
    hideModal('startModal');
    await router.push(`/game/${gameId}`);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};


// Bottom sheet methods
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
onMounted(async () => {
  // Set initial sheet height
  if (sheetContent.value) {
    sheetContent.value.style.height = "80vh";
  }

  // Add event listeners
  document.addEventListener("mousemove", dragging);
  document.addEventListener("mouseup", dragStop);
  document.addEventListener("touchmove", dragging);
  document.addEventListener("touchend", dragStop);

  // Load player's games
  if (authStore.user) {
    await fetchPlayerGames(authStore.user.uid);
    watchPendingGames();
  }
});

onUnmounted(() => {
  // Remove event listeners
  document.removeEventListener("mousemove", dragging);
  document.removeEventListener("mouseup", dragStop);
  document.removeEventListener("touchmove", dragging);
  document.removeEventListener("touchend", dragStop);
});

  // Add multiplayer cleanup
  cleanup();
  cleanupGameListener();
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
  align-items: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.bottom-sheet .content {
  width: 100%;
  position: relative;
  background: #fff;
  max-height: 90vh;
  height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-out;
  overflow: hidden;
}

.bottom-sheet.dragging .content {
  transition: none;
}

.bottom-sheet .header {
  user-select: none;
  padding: 10px 0;
  display: flex;
  justify-content: center;
}

/* Custom scrollbar for webkit browsers */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #E2E8F0 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #E2E8F0;
  border-radius: 20px;
}

/* Smooth transitions */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Card hover effects */
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}

/* Aspect ratio for scenario images */
.aspect-video {
  aspect-ratio: 16 / 9;
}

/* Animation for loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Smooth color transitions */
.bg-purple-600,
.text-purple-600,
.border-purple-500 {
  transition: all 0.2s ease-in-out;
}

/* Touch feedback */
@media (hover: none) {
  .hover\:bg-purple-50:active {
    background-color: #F5F3FF;
  }
  
  .hover\:shadow-md:active {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
}

/* Horizontal scroll styling */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
}

.overflow-x-auto::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* Snap scrolling */
.snap-x {
  scroll-snap-type: x mandatory;
}

.snap-center {
  scroll-snap-align: center;
}

/* Gradient for ad banner */
.from-purple-500 {
  --tw-gradient-from: #8B5CF6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0));
}

.to-indigo-600 {
  --tw-gradient-to: #4F46E5;
}
</style>