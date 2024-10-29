// middleware/game.js
export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore()
    const { currentGame } = useGame()
    
    // If not authenticated, redirect to root
    if (!authStore.isAuthenticated) {
      return navigateTo('/')
    }
  
    // If no game ID in the route, redirect to game menu
    if (!to.params.id) {
      return navigateTo('/gamemenu')
    }
  
    // Allow access to game route
    return
  })