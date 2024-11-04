<template>
  <div class="bottom-sheet" ref="bottomSheet">
    <div
      ref="sheetContent"
      class="content"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="relative bg-white">
        <!-- Close button -->
        <button
          @click="hideModal('analysisModal')"
          class="absolute right-0 top-0 -mt-4 -mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <Icon name="lucide:x" class="h-4 w-4 text-gray-600" />
        </button>

        <div
          @mousedown="dragStart"
          @touchstart="dragStart"
          class="grid grid-rows-[1fr] min-h-full max-h-full"
        >
          <div class="p-4 h-full overflow-y-auto">
            <!-- Analysis Content -->
            <div class="w-full mx-auto space-y-6">
              <!-- Player Profile -->
              <div
                class="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-6"
              >
                <div class="flex items-center gap-4 mb-6">
                  <Icon name="lucide:star" class="w-8 h-8 text-yellow-500" />
                  <div>
                    <h2 class="text-2xl font-bold">{{ playerTitle }}</h2>
                    <p class="text-gray-600">Your Strategic Identity</p>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 p-4">
                  <div
                    v-for="(style, move) in styles"
                    :key="move"
                    :class="[style.bg, 'rounded-lg p-4']"
                  >
                    <h2
                      class="hidden sm:block text-sm capitalize text-center mb-4"
                    >
                      <!-- title -->
                      {{ move }}
                    </h2>
                    <div class="flex flex-col sm:flex-row justify-between">
                      <div class="w-1/2 flex justify-center">
                        <!-- icon --><Icon
                          :name="style.icon"
                          :class="[style.color, 'w-12 h-12 mx-auto mb-2']"
                        />
                      </div>
                      <div class="w-1/2 flex justify-center">
                        <span
                          class="text-lg sm:text-2xl lg:text-4xl font-bold"
                          :class="[style.color]"
                        >
                          <!-- percentage -->
                          {{ getMovePercentage(move) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Battle Stats -->
              <div class="rounded-lg bg-white border border-gray-200">
                <div class="p-6">
                  <h3
                    class="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <Icon name="lucide:trending-up" class="w-5 h-5" />
                    Battle Report
                  </h3>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div
                      v-for="(stat, index) in battleStats"
                      :key="index"
                      :class="[stat.bgColor, 'text-center p-4 rounded-lg']"
                    >
                      <Icon
                        :name="stat.icon"
                        :class="[stat.iconColor, 'w-5 h-5 mx-auto mb-2']"
                      />
                      <div class="text-lg font-bold">{{ stat.value }}</div>
                      <div class="text-sm text-gray-600">{{ stat.label }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Timeline -->
              <div class="rounded-lg bg-white border border-gray-200">
                <div class="p-6">
                  <h3
                    class="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <Icon name="lucide:history" class="w-5 h-5" />
                    Mission Timeline
                  </h3>

                  <div class="space-y-4">
                    <div
                      v-for="round in processedRounds"
                      :key="round.id"
                      class="bg-gray-50 rounded-lg p-4"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium"
                          >Round {{ round.id }}</span
                        >
                        <div class="flex items-center gap-2">
                          <span
                            :class="[
                              getChoiceClass(round.playerChoice),
                              'px-2 py-1 rounded-full text-sm',
                            ]"
                          >
                            {{ round.playerChoice }}
                          </span>
                          <span class="text-gray-400">vs</span>
                          <span
                            :class="[
                              getChoiceClass(round.aiChoice),
                              'px-2 py-1 rounded-full text-sm',
                            ]"
                          >
                            {{ round.aiChoice }}
                          </span>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-sm">
                        <span :class="getScoreClass(round.playerPoints)">
                          {{ round.playerPoints > 0 ? "+" : ""
                          }}{{ round.playerPoints }}
                        </span>
                        <span
                          v-if="round.diceRoll"
                          class="flex items-center gap-1"
                        >
                          <Icon name="lucide:dice" class="w-4 h-4" />
                          {{ round.diceRoll }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Strategic Intel -->
              <div
                class="rounded-lg bg-gradient-to-br from-green-50 to-blue-50"
              >
                <div class="p-6">
                  <h3
                    class="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <Icon name="lucide:brain" class="w-5 h-5" />
                    Strategic Intel
                  </h3>

                  <div class="space-y-4">
                    <p class="text-gray-700">{{ strategicAdvice }}</p>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        v-for="(tip, index) in battleTips"
                        :key="index"
                        class="bg-white bg-opacity-50 rounded-lg p-4"
                      >
                        <div class="flex items-start gap-2">
                          <Icon
                            :name="tip.icon"
                            class="w-5 h-5 text-purple-600 mt-0.5"
                          />
                          <p class="text-sm text-gray-700">{{ tip.text }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
const props = defineProps({
  gameData: {
    type: Object,
    required: true,
  },
});

const { hideModal } = useModal();

// Bottom sheet refs and state
const bottomSheet = ref(null);
const sheetContent = ref(null);
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const touchStartX = ref(null);
const swipeThreshold = 80;

// Style configurations
const styles = {
  cooperate: {
    icon: "lucide:shield",
    color: "text-green-600",
    bg: "bg-green-100",
  },
  negotiate: {
    icon: "lucide:brain",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  betray: {
    icon: "lucide:sword",
    color: "text-red-600",
    bg: "bg-red-100",
  },
};

// Computed properties
const choices = computed(
  () => props.gameData.players[props.gameData.userId].choices
);
const totalRounds = computed(() => Object.keys(choices.value).length);

const stats = computed(() => {
  return Object.entries(choices.value).reduce((acc, [_, round]) => {
    acc[round.choice] = (acc[round.choice] || 0) + 1;
    return acc;
  }, {});
});

const playerTitle = computed(() => {
  const s = stats.value;
  const total = totalRounds.value;

  if ((s.betray || 0) > total * 0.4) return "The Mastermind";
  if ((s.negotiate || 0) > total * 0.4) return "The Diplomat";
  if ((s.cooperate || 0) > total * 0.4) return "The Ally";
  return "The Strategist";
});

const battleStats = computed(() => [
  {
    icon: "lucide:dice",
    value: Object.values(choices.value).filter((c) => c.diceRoll === 12).length,
    label: "Perfect Rolls",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: "lucide:thumbs-up",
    value: Object.values(choices.value).filter((c) => c.pointsEarned > 0)
      .length,
    label: "Victories",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: "lucide:target",
    value: Object.values(choices.value).filter((c) => c.finalResult >= 7)
      .length,
    label: "Skill Checks",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: "lucide:star",
    value: totalRounds.value * 10,
    label: "Points Earned",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
]);

const processedRounds = computed(() => {
  return props.gameData.scenario.rounds.map((round) => {
    const playerChoice =
      props.gameData.players[props.gameData.userId].choices[round.id];
    const aiChoice = props.gameData.players.ai.choices[round.id];

    return {
      id: round.id,
      playerChoice: playerChoice?.choice,
      aiChoice: aiChoice?.choice,
      diceRoll: playerChoice?.diceRoll,
      playerPoints: playerChoice?.pointsEarned || 0,
    };
  });
});

const strategicAdvice = computed(() => {
  switch (playerTitle.value) {
    case "The Mastermind":
      return "Your cunning serves you well, but remember - even the greatest masterminds know when to forge alliances.";
    case "The Diplomat":
      return "Your silver tongue has opened many doors. Keep negotiating, but don't forget to show strength when needed.";
    case "The Ally":
      return "Your trustworthy nature is admirable, but stay alert - not everyone shares your honorable intentions.";
    default:
      return "Your balanced approach keeps opponents guessing. Continue adapting your tactics to stay one step ahead.";
  }
});

const battleTips = computed(() => {
  const tips = [];
  const rounds = processedRounds.value;
  const lastRounds = rounds.slice(-3);

  // Analyze recent patterns
  const recentChoices = new Set(lastRounds.map((r) => r.playerChoice));
  if (recentChoices.size === 1) {
    tips.push({
      icon: "lucide:lightbulb",
      text: "Mix up your tactics - your recent moves have become predictable.",
    });
  }

  // Analyze opponent behavior
  const aiBetrayal = rounds.filter((r) => r.aiChoice === "betray").length;
  if (aiBetrayal > rounds.length / 2) {
    tips.push({
      icon: "lucide:shield-alert",
      text: "Your opponent tends to betray. Consider a more defensive strategy.",
    });
  }

  // Add basic tips if we don't have enough context-specific ones
  if (tips.length < 2) {
    tips.push({
      icon: "lucide:target",
      text: "Watch for patterns in your opponent's behavior to predict their next move.",
    });
  }

  return tips;
});

// Methods
const getMovePercentage = (move) => {
  const count = stats.value[move] || 0;
  return Math.round((count / totalRounds.value) * 100);
};

const getChoiceClass = (choice) => {
  switch (choice) {
    case "cooperate":
      return "bg-green-100 text-green-800";
    case "negotiate":
      return "bg-purple-100 text-purple-800";
    case "betray":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getScoreClass = (points) => {
  if (points > 0) return "text-green-600 font-medium";
  if (points < 0) return "text-red-600 font-medium";
  return "text-gray-600";
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
  hideModal("analysisModal");
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
onMounted(() => {
  // Set initial sheet height
  if (sheetContent.value) {
    sheetContent.value.style.height = "80vh";
  }

  // Add event listeners
  document.addEventListener("mousemove", dragging);
  document.addEventListener("mouseup", dragStop);
  document.addEventListener("touchmove", dragging);
  document.addEventListener("touchend", dragStop);
});

onUnmounted(() => {
  // Remove event listeners
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
  z-index: 50;
}

.bottom-sheet .content {
  width: 100%;
  position: relative;
  background: #fff;
  max-height: 80vh;
  overflow-y: auto;
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
}

@media (max-width: 640px) {
  .grid {
    grid-gap: 1rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .bottom-sheet .content {
    padding: 20px;
  }
}

/* Scrollbar styles */
.content::-webkit-scrollbar {
  width: 8px;
}

.content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* Safe area inset padding for notched devices */
.pb-safe-area-inset {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Animation classes */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>