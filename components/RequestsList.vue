<template>
    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
  
      <!-- Empty State -->
      <div v-else-if="requests.length === 0" class="p-8 text-center">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p class="mt-4 text-sm text-gray-500">No pending friend requests</p>
      </div>
  
      <!-- Requests List -->
      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="request in requests"
          :key="request.id"
          class="py-4 flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-lg text-purple-600">
                  {{ request.fromName?.charAt(0)?.toUpperCase() || '?' }}
                </span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ request.fromName }}</p>
              <p class="text-xs text-gray-500">Sent {{ formatDate(request.timestamp) }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="acceptRequest(request.id)"
              class="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
              :disabled="isProcessing === request.id"
            >
              Accept
            </button>
            <button
              @click="rejectRequest(request.id)"
              class="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200"
              :disabled="isProcessing === request.id"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue'
  import { useFirebase } from '~/composables/useFirebase'
  import { ref as dbRef, onValue, update, remove, get } from 'firebase/database'
  
  const props = defineProps({
    count: {
      type: Number,
      default: 0
    }
  })
  
  const emit = defineEmits(['update:count'])
  
  const { database, auth } = useFirebase()
  
  // State
  const loading = ref(true)
  const requests = ref([])
  const isProcessing = ref(null)
  let requestsListener = null
  
  // Methods
  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
  
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      if (hours < 1) {
        const minutes = Math.floor(diff / (60 * 1000))
        return `${minutes}m ago`
      }
      return `${hours}h ago`
    }
  
    return date.toLocaleDateString()
  }
  
  // Watch for requests changes to update count
  watch(requests, (newRequests) => {
    emit('update:count', newRequests.length)
  })
  
  // Request handling methods
  const acceptRequest = async (requestId) => {
    if (!auth.currentUser) return
    isProcessing.value = requestId
  
    try {
      const requestRef = dbRef(database, `friendRequests/${auth.currentUser.uid}/${requestId}`)
      const request = await get(requestRef)
      
      if (!request.exists()) throw new Error('Request not found')
      
      const requestData = request.val()
      const updates = {}
  
      updates[`friends/${auth.currentUser.uid}/${requestData.fromId}`] = {
        id: requestData.fromId,
        displayName: requestData.fromName,
        timestamp: Date.now()
      }
      updates[`friends/${requestData.fromId}/${auth.currentUser.uid}`] = {
        id: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        timestamp: Date.now()
      }
  
      updates[`friendRequests/${auth.currentUser.uid}/${requestId}`] = null
  
      await update(dbRef(database), updates)
    } catch (error) {
      console.error('Error accepting friend request:', error)
    } finally {
      isProcessing.value = null
    }
  }
  
  const rejectRequest = async (requestId) => {
    if (!auth.currentUser) return
    isProcessing.value = requestId
  
    try {
      await remove(dbRef(database, `friendRequests/${auth.currentUser.uid}/${requestId}`))
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    } finally {
      isProcessing.value = null
    }
  }
  
  // Lifecycle hooks
  onMounted(() => {
    if (!auth.currentUser) return
  
    const requestsRef = dbRef(database, `friendRequests/${auth.currentUser.uid}`)
    requestsListener = onValue(requestsRef, (snapshot) => {
      const requestsData = []
      snapshot.forEach((childSnapshot) => {
        requestsData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        })
      })
      requests.value = requestsData
      loading.value = false
    })
  })
  
  onUnmounted(() => {
    if (requestsListener) requestsListener()
  })
  </script>