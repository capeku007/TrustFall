export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  console.log('Auth Middleware - Route:', to.path); // Debug log
  console.log('Auth State:', authStore.isAuthenticated); // Debug log

  // Explicitly handle game routes
  if (to.path.startsWith('/game/')) {
    console.log('Game route detected'); // Debug log
    if (authStore.isAuthenticated) {
      console.log('User authenticated, allowing game access'); // Debug log
      return;
    }
  }

  // Handle authentication for other routes
  if (!authStore.isAuthenticated) {
    console.log('User not authenticated, redirecting to home'); // Debug log
    return navigateTo('/');
  }

  // Handle root route for authenticated users
  if (authStore.isAuthenticated && to.path === '/') {
    console.log('Authenticated user at root, redirecting to game menu'); // Debug log
    return navigateTo('/gamemenu');
  }
});