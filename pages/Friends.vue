<template>
    <div class="space-y-6">
      <div class="bg-white rounded-lg shadow-sm">
        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-4" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="currentTab = tab.key"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2"
              :class="[
                currentTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <!-- Icons -->
              <svg v-if="tab.key === 'friends'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-if="tab.key === 'lobby'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-if="tab.key === 'requests'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              
              <span>{{ tab.name }}</span>
              
              <!-- Request count badge -->
              <span 
                v-if="tab.key === 'requests' && pendingRequestsCount > 0"
                class="ml-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full"
              >
                {{ pendingRequestsCount }}
              </span>
            </button>
          </nav>
        </div>
  
        <!-- Content -->
        <div class="p-4">
          <!-- Friends List Tab -->
          <div v-show="currentTab === 'friends'">
            <FriendsList />
          </div>
  
          <!-- Lobby Tab -->
          <div v-show="currentTab === 'lobby'">
            <div class="text-center py-8">
              <div class="mx-auto h-12 w-12 text-gray-400">
                <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Find New Friends</h3>
              <p class="mt-1 text-sm text-gray-500">
                Search and connect with other players
              </p>
            </div>
          </div>
  
          <!-- Requests Tab -->
          <div v-show="currentTab === 'requests'">
            <RequestsList v-model:count="pendingRequestsCount" />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  definePageMeta({
  middleware: ["auth"],
});
  
  // State
  const currentTab = ref('friends')
  const pendingRequestsCount = ref(0)
  
  // Tabs configuration
  const tabs = [
    { key: 'friends', name: 'Friends' },
    { key: 'lobby', name: 'Search' },
    { key: 'requests', name: 'Requests' }
  ]
  </script>