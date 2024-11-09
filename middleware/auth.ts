// middleware/auth.js
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  console.log('Auth middleware check:', { route: to.path, auth: authStore.isAuthenticated })

  // // Skip middleware for non-game routes
  // if (!to.path.startsWith('/game/') && !to.meta?.requiresAuth) {
  //   return
  // }

  if (!authStore.isAuthenticated) {
    return navigateTo('/')
  }
})

