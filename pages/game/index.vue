// pages/game/index.vue
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full mx-auto p-6">
      <div class="bg-white rounded-lg shadow-sm p-6 text-center">
        <div class="mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-12 w-12 mx-auto text-purple-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">
          No Game Selected
        </h1>
        <p class="text-gray-600 mb-6">
          Please start a new game or return to the game menu to continue.
        </p>
        <div class="space-y-3">
          <button
            @click="startNewGame"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Start New Game
          </button>
          <button
            @click="goToGameMenu"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Return to Game Menu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const { showModal } = useModal()

// Methods
const startNewGame = () => {
  showModal('startModal')
}

const goToGameMenu = () => {
  router.push('/gamemenu')
}
</script>