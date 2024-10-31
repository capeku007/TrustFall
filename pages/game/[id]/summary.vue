<!-- pages/game/[id]/summary.vue -->
<template>
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
        <p class="text-red-600">{{ error }}</p>
        <button 
          @click="router.push('/gamemenu')"
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Return to Menu
        </button>
      </div>
    </div>
  
    <GameSummary v-else :gameId="route.params.id" />
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGame } from '~/composables/useGame'
  
definePageMeta({
  middleware: ['auth'],
  layout: "ingame",
})
  const route = useRoute()
  const router = useRouter()
  const { currentGame, fetchGame } = useGame()
  
  const isLoading = ref(true)
  const error = ref(null)
  
  onMounted(async () => {
    try {
      await fetchGame(route.params.id)
      isLoading.value = false
    } catch (err) {
      error.value = err.message
      console.error('Error loading game:', err)
    }
  })
  </script>