// plugins/navigation.js
import { useFirebase } from '~/composables/useFirebase'
import { ref as dbRef, get } from 'firebase/database'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const authStore = useAuthStore()
  const { cleanupGameListener } = useGame()

  router.beforeEach(async (to, from, next) => {
    const { database } = useFirebase()
    
    console.log('Navigation attempt:', {
      to: to.path,
      from: from.path,
      auth: authStore.isAuthenticated
    })

    // Always clean up game listener when navigating away from game routes
    if (from.path.startsWith('/game/') && !to.path.startsWith('/game/')) {
      cleanupGameListener()
    }

    // Handle game routes
    if (to.path.startsWith('/game/')) {
      if (!authStore.isAuthenticated) {
        console.log('Unauthorized game access, redirecting to home')
        next('/')
        return
      }

      // Check if game exists for specific game routes
      const gameId = to.params.id
      if (gameId) {
        try {
          const gameRef = dbRef(database, `games/${gameId}`)
          const snapshot = await get(gameRef)
          
          if (!snapshot.exists()) {
            console.log('Game not found, redirecting to game menu')
            next('/gamemenu')
            return
          }

          // Verify game belongs to user
          const gameData = snapshot.val()
          if (!gameData.players?.[authStore.user?.uid]) {
            console.log('Unauthorized game access')
            next('/gamemenu')
            return
          }
        } catch (error) {
          console.error('Error checking game:', error)
          next('/gamemenu')
          return
        }
      }
    }

    // Handle other routes
    if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
      next('/')
      return
    }

    if (to.path === '/' && authStore.isAuthenticated) {
      next('/gamemenu')
      return
    }

    next()
  })
})