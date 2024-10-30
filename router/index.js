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
    props: true,
  },
  {
    path: '/game/:id/summary',
    name: 'game-summary',
    component: () => import('~/pages/game/[id]/summary.vue'),
    meta: { requiresAuth: true },
    props: true // Changed to true instead of the route function
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

    // Clean up game listener when leaving game routes completely
    if (from.path.startsWith('/game/') && !to.path.startsWith('/game/')) {
      cleanupGameListener()
    }

    // Handle protected routes first
    if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
      console.log('Unauthorized access, redirecting to home')
      next('/')
      return
    }

    // Redirect authenticated users from home
    if (to.path === '/' && authStore.isAuthenticated) {
      next('/gamemenu')
      return
    }

    // Handle game routes (including summary)
    if (to.path.startsWith('/game/')) {
      if (!authStore.isAuthenticated) {
        console.log('Unauthorized game access, redirecting to home')
        next('/')
        return
      }

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

          // If all checks pass, continue
          next()
        } catch (error) {
          console.error('Error checking game:', error)
          next('/gamemenu')
          return
        }
      } else {
        next('/gamemenu')
        return
      }
    } else {
      next()
    }
  })

  // Enhanced error handling for navigation failures
  router.onError((error, to) => {
    console.error('Navigation error:', error)
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      router.push('/')
    } else {
      router.push('/gamemenu')
    }
  })

  return router
}