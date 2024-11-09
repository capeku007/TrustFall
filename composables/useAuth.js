// composables/useAuth.js
import { ref, computed } from 'vue'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import { useAuthStore } from "@/stores/authStore"
import { useFirebase } from './useFirebase'

export const useAuth = () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const { auth } = useFirebase()
  const authStore = useAuthStore()

  let unsubscribe = null

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

  const logout = async () => {
    try {
      await signOut(auth)
      navigateTo('/')
    } catch (e) {
      error.value = getErrorMessage(e.code)
    }
  }

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

  const updateProfileImage = async (file) => {
    if (!file) {
      console.error("No file selected");
      return null;
    }
  
    if (!auth.currentUser) {
      console.error("User must be authenticated");
      return null;
    }
  
    try {
      loading.value = true;
      error.value = null;
  
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', auth.currentUser.uid);
  
      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
  
      const { fileUrl } = await response.json();
  
      // Update Firebase auth profile
      await updateProfile(auth.currentUser, {
        photoURL: fileUrl
      });
  
      // Update auth store
      authStore.setUser({
        ...authStore.user,
        photoURL: fileUrl,
      });
  
      return fileUrl;
  
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  const init = () => {
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser
      if (currentUser) {
        authStore.setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        })
      } else {
        authStore.clearUser()
      }
      loading.value = false
    })
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
    }
  }

  // Initialize on composable creation
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
    updateProfileImage,
    loading,
    error,
    isAuthenticated: computed(() => user.value !== null)
  }
}