<template>
  <div class="min-h-screen bg-purple-200">
    <!-- Wrap all your existing content in this single root div -->
    <div class="container mx-auto rounded-2xl">
      <div
        ref="bottomSheet"
        id="startModal"
        tabindex="-1"
        data-modal-target="startModal"
        data-modal-placement="bottom"
        aria-hidden="true"
        class="fixed bottom-0 left-0 right-0 z-50 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
      >
        <StartGame />
      </div>
      <div class="parent">
        <div class="div1">
          <!-- My card -->
          <div class="cardCon">
            <div class="tl">
              <div class="tlCon">
                <div class="wrapper">
                  <span data-text="...Trust"></span>
                  <span data-text="Fall..."></span>
                </div>
              </div>
            </div>
            <div class="tr flex items-center sm:pl-8 pl-2">
              <!-- Added flex and items-center here -->
              <div class="flex items-center w-full">
                <!-- Added w-full for full width -->
                <div class="flex-shrink-0">
                  <img
                    class="w-8 h-8 rounded-full"
                    src="../assets/high.png"
                    alt="Neil image"
                  />
                </div>
                <div class="flex-1 min-w-0 ml-2">
                  <!-- Added ml-2 for spacing -->
                  <p class="text-xs text-gray-500 truncate">Highscore</p>
                  <p class="text-sm font-medium text-[#FFBA11] truncate">
                    1,234,000
                  </p>
                </div>
              </div>
            </div>
            <div class="m flex relative w-full h-full">
              <!-- Description container - always present but opacity controlled by showInfo -->
              <div
                class="absolute inset-0 flex items-center justify-center p-8"
                :class="{ 'opacity-40': !showInfo, 'opacity-100': showInfo }"
              >
                <p
                  class="text-gray-600 text-sm sm:text-base text-center font-light leading-relaxed max-w-md transition-opacity duration-300"
                >
                  The Prisoner's Dilemma is a game theory scenario where two
                  prisoners must decide whether to betray each other or stay
                  silent. If both stay silent, they serve minimal time. If both
                  betray, they serve moderate time. If one betrays while the
                  other stays silent, the betrayer goes free while the silent
                  one serves maximum time.
                </p>
              </div>

              <!-- Image container - visibility controlled by showInfo -->
              <div
                class="absolute inset-0 flex justify-center items-center transition-opacity duration-300"
                :class="{ 'opacity-100': !showInfo, 'opacity-0': showInfo }"
              >
                <div class="animate-bounce-slow">
                  <img
                    src="../assets/cha.png"
                    alt="Character"
                    class="w-44 h-[95%] object-contain z-10 relative"
                  />
                </div>
              </div>
            </div>
            <div class="bl">
              <div class="blCon p-4 h-full flex flex-col justify-center gap-2">
                <!-- Info Button -->
                <button
                  type="button"
                  @click="showInfoTimed"
                  :disabled="showInfo"
                  class="inline-flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors"
                  :class="[
                    showInfo
                      ? 'text-[#9061f9] bg-white cursor-not-allowed opacity-75'
                      : 'text-white bg-[#9061f9] hover:bg-[#7d4ff8]',
                    'rounded-lg',
                  ]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <span class="ml-2 hidden sm:inline">Info</span>
                </button>

                <!-- Share Button -->
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#9061f9] rounded-lg hover:bg-[#7d4ff8] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span class="ml-2 hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
            <div class="br h-full">
              <div class="h-full flex flex-col px-4 pt-4 pb-2">
                <!-- Top section with player info and button -->
                <div class="flex items-center">
                  <!-- Player Info Section -->
                  <div class="flex-1 flex flex-col justify-center">
                    <p class="text-xl font-bold text-gray-900 truncate">
                      {{ user.displayName }}
                    </p>
                    <div class="flex items-center space-x-2 mt-0.5">
                      <span class="text-xs text-gray-500">Personality</span>
                      <span
                        class="px-2 py-0.5 bg-[#9061f9]/10 rounded-full text-xs font-medium text-[#9061f9]"
                      >
                        FOX
                      </span>
                    </div>
                  </div>

                  <!-- Play Button Section -->
                  <div class="flex items-center">
                    <button
                      @click="showModal('startModal')"
                      type="button"
                      class="inline-flex items-center justify-center p-5 text-sm font-semibold text-white bg-green-500 rounded-full hover:bg-green-500 transition-colors shadow-sm hover:shadow"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span class="ml-2 hidden sm:inline">Play</span>
                    </button>
                  </div>
                </div>

                <!-- Personality description -->
                <p class="text-xs text-gray-500 sm:line-clamp-3 line-clamp-2">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit. Iste
                  cumque totam autem quia amet consequatur doloremque dolor,
                  minima voluptates consequuntur commodi, sunt nihil quidem,
                  veritatis aliquid temporibus ea sed blanditiis?
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- leaderboard -->
        <div class="div2 h-full">
          <div class="w-full h-full flex flex-col px-4">
            <!-- Header section -->
            <div class="flex items-center justify-between h-4 ">
              <h2 class="text-sm font-bold text-gray-800">Top five</h2>
              
            </div>

            <!-- Cards container with remaining height -->
            <div class="overflow-x-auto -mx-4 px-4 flex-1 flex items-center">
              <div class="flex gap-3 md:gap-4">
                <div
                  v-for="(player, index) in topPlayers"
                  :key="player.id"
                  class="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative perspective"
                >
                  <div
                    class="relative w-full h-full transform-style-preserve-3d transition-transform duration-300 hover:rotate-y-180 group"
                  >
                    <!-- Front face -->
                    <div
                      class="absolute w-full h-full bg-white rounded-lg shadow-sm backface-hidden"
                    >
                      <!-- Position Badge -->
                      <div
                        class="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-[#9061f9] rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm"
                      >
                        {{ index + 1 }}
                      </div>

                      <!-- Avatar Container -->
                      <div
                        class="w-full h-full flex flex-col items-center justify-center pt-1"
                      >
                        <div
                          class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gray-200 overflow-hidden"
                        >
                          <img
                            src="../assets/profile-image.jpg"
                            :alt="player.name"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <p
                          class="text-[10px] sm:text-xs md:text-sm font-medium text-gray-800 truncate w-full text-center mt-0.5 sm:mt-1"
                        >
                          {{ player.name }}
                        </p>
                      </div>
                    </div>

                    <!-- Back face -->
                    <div
                      class="absolute w-full h-full bg-blue-600 rounded-lg shadow-sm backface-hidden rotate-y-180"
                    >
                      <div
                        class="w-full h-full flex flex-col items-center justify-center"
                      >
                        <p
                          class="text-white font-bold text-xs sm:text-sm md:text-base"
                        >
                          {{ player.score }}
                        </p>
                        <p class="text-white text-[8px] sm:text-xs md:text-sm">
                          points
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ad placement -->
        <div class="div3 bg-white">
          <div class="w-full flex justify-center items-center h-full">
            <!-- Banner container with standard mobile dimensions -->
            <div
              class="banner-container w-[320px] h-[50px] bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <span class="text-sm text-gray-500">Advertisement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Access user details
import { useAuthStore } from "~/stores/authStore";
const authStore = useAuthStore();
const user = computed(() => authStore.user);
// pages/gamemenu.vue

const { showModal, hideModal } = useModal();
definePageMeta({
  middleware: ["auth"],
});

const showInfo = ref(false);

const showInfoTimed = () => {
  showInfo.value = true;
  setTimeout(() => {
    showInfo.value = false;
  }, 7000);
};

// Mock leaderboard data - This could be replaced with real Firebase data
const topPlayers = ref([
  { id: 1, name: "Player 1", score: 2500, rank: 1 },
  { id: 2, name: "Player 2", score: 2300, rank: 2 },
  { id: 3, name: "Player 3", score: 2100, rank: 3 },
  { id: 4, name: "Player 4", score: 2000, rank: 4 },
  { id: 5, name: "Player 5", score: 1900, rank: 5 },
]);
</script>
<style scoped>
.parent {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 65% 20% 10%; /* Adjusted to 65/20/10 split */
  grid-row-gap: 10px;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0.5rem;
  background: #DCD7FE;
}

.div1 {
  grid-area: 1 / 1 / 2 / 2;
  width: 100%;
  display: flex;
  justify-content: center;
}

.div2 {
  grid-area: 2 / 1 / 3 / 2;
  width: 100%;
  border-radius: 1rem;
  overflow: hidden;
}

.div3 {
  grid-area: 3 / 1 / 4 / 2;
  width: 100%;
  border-radius: 1rem;
  overflow: hidden;
}

.banner-container {
  /* Optional: Add shadow or border for development */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
<!-- card style -->
<style scoped>
.cardCon {
  width: 100%;
  max-width: 500px; /* Add a max-width for larger screens */
  height: 100%;
  background-color: #9061f9;
  border-radius: 2rem;
  border: 4px solid #fff;
  overflow: hidden;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(2, 1fr) 2fr;
  grid-template-rows: 1fr 4fr 2fr;
  grid-gap: 0px;
}

.tl {
  grid-area: 1 / 1 / 2 / 3;
  background-color: #fff;
}
.tlCon {
  height: 100%;
  background-color: #9061f9;
  border-radius: 0px 0px 2rem 0px;
}
.tr {
  grid-area: 1 / 3 / 2 / 4;
  background-color: #fff;
  border-radius: 2rem 2rem 0px 0px;
}
.m {
  grid-area: 2 / 1 / 3 / 4;
  background-color: #fff;
  border-radius: 2rem 0px 0px 2rem;
}
.bl {
  grid-area: 3 / 1 / 4 / 2;
  background-color: #fff;
}
.blCon {
  height: 100%;
  background-color: #9061f9;
  border-radius: 0px 2rem 0px 0px;
  padding: 8px;
}
.br {
  grid-area: 3 / 2 / 4 / 4;
  background-color: #fff;
  border-radius: 0px 0px 2rem 2rem;
}
</style>

<style>
:deep(.modal-wrapper) {
  border-radius: 1rem;
  max-width: 600px;
  height: 90%;
  margin: auto;
}

ion-list-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0;
}

.wrapper {
  font-size: 22px; /* Reduced from 28px for mobile */
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  mix-blend-mode: normal;
}

/* Larger font size for bigger screens */
@media (min-width: 640px) {
  .wrapper {
    font-size: 28px;
  }
}

.wrapper.invert span {
  color: black;
}

.wrapper.invert span::before {
  -webkit-text-stroke: 0.1em var(--color);
}

.wrapper span {
  --color: #ffba11;
  font-family: Impact, "Anton", Haettenschweiler, "Arial Narrow Bold",
    sans-serif;
  font-weight: 700;
  font-style: italic;
  display: block;
  position: absolute;
  color: var(--color);
  letter-spacing: -0.005em;
}

.wrapper span::before,
.wrapper span::after {
  content: attr(data-text);
  display: block;
  position: relative;
  padding: 0 0.1em;
  z-index: 1;
}
.wrapper span::before {
  position: absolute;
  -webkit-text-stroke: 0.1em black;
  z-index: 0;
}
.wrapper span:first-child {
  transform: translate(-0.255em, -0.25em);
}
.wrapper span:last-child {
  --color: #fff;
  transform: translate(0.255em, 0.25em);
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}

.perspective {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.hover\:rotate-y-180:hover {
  transform: rotateY(180deg);
}
</style>