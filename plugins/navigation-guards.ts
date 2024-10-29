// plugins/navigation-guards.ts
export default defineNuxtPlugin(() => {
    addRouteMiddleware('game-guard', (to) => {
      const authStore = useAuthStore();
      if (to.path.startsWith('/game/') && !authStore.user) {
        return navigateTo('/login');
      }
    }, { global: true });
  });