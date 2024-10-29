// plugins/navigation.js
export default defineNuxtPlugin(() => {
    const router = useRouter()
    const authStore = useAuthStore()
  
    router.beforeEach((to, from, next) => {
      // Debug logs
      console.log('Navigation - to:', to.path)
      console.log('Navigation - from:', from.path)
      console.log('Auth state:', authStore.isAuthenticated)
  
      // Handle game routes
      if (to.path.startsWith('/game/')) {
        if (authStore.isAuthenticated) {
          console.log('Allowing game route access')
          next()
          return
        }
        console.log('Unauthorized game access, redirecting')
        next('/')
        return
      }
  
      // Handle root route for authenticated users
      if (to.path === '/' && authStore.isAuthenticated) {
        console.log('Authenticated user at root, redirecting to game menu')
        next('/gamemenu')
        return
      }
  
      next()
    })
  })