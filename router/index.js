// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useFirebase } from '~/composables/useFirebase'
import { ref as dbRef, get } from 'firebase/database'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('~/pages/index.vue')
  },
  {
    path: '/gamemenu',
    name: 'game-menu',
    component: () => import('~/pages/gamemenu.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id',
    name: 'game',
    component: () => import('~/pages/game/[id].vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/game/:id/summary',
    name: 'game-summary',
    component: () => import('~/components/GameSummary.vue'),
    meta: { requiresAuth: true },
    props: true
  }
]

export default function (nuxtApp) {
  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const { database } = useFirebase()
    const { cleanupGameListener } = useGame()

    console.log('Navigation attempt:', {
      to: to.path,
      name: to.name,
      params: to.params,
      auth: authStore.isAuthenticated
    })

    // Clean up game listener when leaving game routes
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

      // Verify game exists and belongs to user
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

          // Check game ownership
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

      next()
      return
    }

    // Handle protected routes
    if (to.meta?.requiresAuth) {
      if (!authStore.isAuthenticated) {
        next('/')
        return
      }
    }

    // Redirect authenticated users from home
    if (to.path === '/' && authStore.isAuthenticated) {
      next('/gamemenu')
      return
    }

    next()
  })

  // Add error handling for navigation failures
  router.onError((error, to) => {
    console.error('Navigation error:', error)
    if (to.path.startsWith('/game/')) {
      router.push('/gamemenu')
    }
  })

  return router
}