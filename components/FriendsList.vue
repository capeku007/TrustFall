<template>
  <div class="space-y-6">
    <!-- Friends List Section -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">Friends</h3>
        <span class="text-xs text-gray-500">{{ friends.length }} total</span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="friends.length === 0" class="p-8 text-center">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="mt-4 text-sm text-gray-500">No friends added yet</p>
        <p class="mt-2 text-xs text-gray-400">Visit the Lobby to find players</p>
      </div>

      <!-- Friends List -->
      <div v-else class="divide-y divide-gray-200">
        <div 
          v-for="friend in friends" 
          :key="friend.id"
          class="p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-lg text-purple-600">
                  {{ friend.displayName?.charAt(0)?.toUpperCase() || '?' }}
                </span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ friend.displayName || 'Anonymous' }}</p>
              <div class="flex items-center space-x-2">
                <span 
                  class="flex h-2 w-2 rounded-full"
                  :class="friend.online ? 'bg-green-400' : 'bg-gray-300'"
                ></span>
                <p class="text-xs text-gray-500">
                  {{ friend.online ? 'Online' : 'Last seen ' + formatDate(friend.lastSeen) }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="friend.online"
              @click="inviteToGame(friend.id)"
              class="px-3 py-1 bg-purple-100 text-purple-600 text-sm rounded-md hover:bg-purple-200"
            >
              Invite to Game
            </button>
            <button
              @click="removeFriend(friend.id)"
              class="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useFirebase } from '~/composables/useFirebase'
import { useAuthStore } from '~/stores/authStore'
import { ref as dbRef, onValue, update, remove, get } from 'firebase/database'

const { database, auth } = useFirebase()
const authStore = useAuthStore()

// State
const loading = ref(true)
const friends = ref([])
let friendsListener = null

// Methods
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // If less than 24 hours ago, show relative time
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours < 1) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}m ago`
    }
    return `${hours}h ago`
  }

  // Otherwise show the date
  return date.toLocaleDateString()
}

const removeFriend = async (friendId) => {
  if (!auth.currentUser) return

  try {
    const updates = {}
    updates[`friends/${auth.currentUser.uid}/${friendId}`] = null
    updates[`friends/${friendId}/${auth.currentUser.uid}`] = null
    await update(dbRef(database), updates)
  } catch (error) {
    console.error('Error removing friend:', error)
  }
}

const inviteToGame = async (friendId) => {
  // This will be implemented when we add game creation functionality
  console.log('Invite friend to game:', friendId)
}

// Lifecycle hooks
onMounted(() => {
  if (!auth.currentUser) return

  // Listen for friends updates
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
    loading.value = false
  })
})

onUnmounted(() => {
  if (friendsListener) friendsListener()
})
</script>