// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('~/pages/index.vue')
  },
  {
    path: '/new-game',
    name: 'new-game',
    component: () => import('~/components/StartGame.vue')
  },
  {
    path: '/game/:gameId',
    name: 'game-play',
    component: () => import('~/components/GamePlay.vue')
  },
  {
    path: '/game/:gameId/summary',
    name: 'game-summary',
    component: () => import('~/components/GameSummary.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard to check if game exists
router.beforeEach(async (to, from, next) => {
  if (to.params.gameId) {
    const { currentGame } = useGame()
    if (!currentGame.value) {
      // Redirect to home if game doesn't exist
      next('/')
      return
    }
  }
  next()
})