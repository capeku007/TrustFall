// middleware/game.js
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const { currentGame, fetchGame } = useGame()
  
  // Only handle game routes
  if (!to.path.startsWith('/game/')) {
    return
  }

  // Check authentication
  if (!authStore.isAuthenticated) {
    return navigateTo('/')
  }

  // Verify game exists for specific game routes
  if (to.params.id) {
    try {
      await fetchGame(to.params.id)
      if (!currentGame.value) {
        return navigateTo('/gamemenu')
      }
    } catch (error) {
      console.error('Error loading game:', error)
      return navigateTo('/gamemenu')
    }
  }
})