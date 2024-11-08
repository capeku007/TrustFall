<template>
    <div class="space-y-6">
      <!-- Players List Section -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">Players Online</h3>
            <!-- Search Input -->
            <div class="relative w-64">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search players..."
                class="w-full pl-8 pr-4 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
              <svg class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
  
        <!-- Loading State -->
        <div v-if="loading" class="p-8 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
  
        <!-- Empty State -->
        <div v-else-if="filteredPlayers.length === 0" class="p-8 text-center">
          <p class="text-sm text-gray-500">No players found</p>
        </div>
  
        <!-- Players List -->
        <div v-else class="divide-y divide-gray-200">
          <div 
            v-for="player in filteredPlayers" 
            :key="player.id"
            class="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span class="text-lg text-purple-600">
                    {{ player.displayName?.charAt(0)?.toUpperCase() || '?' }}
                  </span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ player.displayName || 'Anonymous' }}</p>
                <div class="flex items-center space-x-2">
                  <span 
                    class="flex h-2 w-2 rounded-full bg-green-400"
                  ></span>
                  <p class="text-xs text-gray-500">Online</p>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                v-if="!isFriend(player.id) && !isPendingRequest(player.id)"
                @click="sendFriendRequest(player.id)"
                class="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                :disabled="isProcessing === player.id"
              >
                Add Friend
              </button>
              <button
                v-else-if="isPendingRequest(player.id)"
                class="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md cursor-not-allowed"
                disabled
              >
                Request Sent
              </button>
              <button
                v-else
                class="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md cursor-not-allowed"
                disabled
              >
                Friends
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useFirebase } from '~/composables/useFirebase'
  import { useAuthStore } from '~/stores/authStore'
  import { ref as dbRef, onValue, set, get } from 'firebase/database'
  
  const { database, auth } = useFirebase()
  const authStore = useAuthStore()
  
  // State
  const loading = ref(true)
  const searchQuery = ref('')
  const players = ref([])
  const friends = ref([])
  const pendingRequests = ref([])
  const isProcessing = ref(null)
  let playersListener = null
  let friendsListener = null
  let requestsListener = null
  
  // Computed
  const filteredPlayers = computed(() => {
    return players.value
      .filter(player => 
        // Don't show current user
        player.id !== auth.currentUser?.uid &&
        // Filter by search query
        (player.displayName || 'Anonymous')
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())
      )
  })
  
  // Methods
  const isFriend = (playerId) => {
    return friends.value.some(friend => friend.id === playerId)
  }
  
  const isPendingRequest = (playerId) => {
    return pendingRequests.value.includes(playerId)
  }
  
  const sendFriendRequest = async (targetId) => {
    if (!auth.currentUser) return
    isProcessing.value = targetId
  
    try {
      const requestData = {
        fromId: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Anonymous',
        timestamp: Date.now(),
        status: 'pending'
      }
  
      await set(dbRef(database, `friendRequests/${targetId}/${auth.currentUser.uid}`), requestData)
      pendingRequests.value.push(targetId)
    } catch (error) {
      console.error('Error sending friend request:', error)
    } finally {
      isProcessing.value = null
    }
  }
  
  // Lifecycle hooks
  onMounted(() => {
    if (!auth.currentUser) return
  
    // Listen for online players
    const playersRef = dbRef(database, 'users')
    playersListener = onValue(playersRef, (snapshot) => {
      const playersData = []
      snapshot.forEach((childSnapshot) => {
        playersData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        })
      })
      players.value = playersData
      loading.value = false
    })
  
    // Listen for friends list to know who's already a friend
    const friendsRef = dbRef(database, `friends/${auth.currentUser.uid}`)
    friendsListener = onValue(friendsRef, (snapshot) => {
      const friendsData = []
      snapshot.forEach((childSnapshot) => {
        friendsData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        })
      })
      friends.value = friendsData
    })
  
    // Listen for outgoing friend requests
    const requestsRef = dbRef(database, `friendRequests`)
    requestsListener = onValue(requestsRef, (snapshot) => {
      const requests = []
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((requestSnapshot) => {
          if (requestSnapshot.val().fromId === auth.currentUser.uid) {
            requests.push(userSnapshot.key)
          }
        })
      })
      pendingRequests.value = requests
    })
  })
  
  onUnmounted(() => {
    if (playersListener) playersListener()
    if (friendsListener) friendsListener()
    if (requestsListener) requestsListener()
  })
  </script>