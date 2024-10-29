// composables/useAuth.js
import { ref, computed } from 'vue'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as firebaseAuthStateChanged
} from 'firebase/auth'

export const useAuth = () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  let unsubscribe = null

  const auth = getAuth()

  // Email/Password login
  const login = async (email, password) => {
    try {
      error.value = null
      loading.value = true
      await signInWithEmailAndPassword(auth, email, password)
      navigateTo('/game')
    } catch (e) {
      error.value = getErrorMessage(e.code)
    } finally {
      loading.value = false
    }
  }

  // Google login
  const loginWithGoogle = async () => {
    try {
      error.value = null
      loading.value = true
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigateTo('/game')
    } catch (e) {
      error.value = getErrorMessage(e.code)
    } finally {
      loading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      navigateTo('/')
    } catch (e) {
      error.value = getErrorMessage(e.code)
    }
  }

  // Helper function to get user-friendly error messages
  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/too-many-requests':
        return 'Too many attempts, please try again later'
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing'
      default:
        return 'An error occurred during sign in'
    }
  }

  // Initialize auth state listener
  const init = () => {
    unsubscribe = firebaseAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      loading.value = false
    })
  }

  // Cleanup function
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
    }
  }

  // Initialize on composable creation
  init()

  // Expose cleanup for component unmount
  if (process.client) {
    const nuxtApp = useNuxtApp()
    nuxtApp.hook('app:beforeMount', init)
    nuxtApp.hook('app:unmounted', cleanup)
  }

  return {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: computed(() => user.value !== null)
  }
}