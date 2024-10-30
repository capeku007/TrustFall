// middleware/game.js
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path.includes('/game/')) {
    const { fetchGame } = useGame()
    const gameId = to.params.id
    
    try {
      const game = await fetchGame(gameId)
      if (!game) {
        return navigateTo('/gamemenu')
      }
    } catch (error) {
      console.error('Game middleware error:', error)
      return navigateTo('/gamemenu')
    }
  }
})