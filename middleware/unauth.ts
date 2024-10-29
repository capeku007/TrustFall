// middleware/auth.js
export default defineNuxtRouteMiddleware(() => {
    const authStore = useAuthStore()
    
    if (authStore.isAuthenticated) {
      return navigateTo('/gamemenu')
    }
  })