<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-xl shadow-2xl space-y-8 p-10">
      <div class="text-center">
        <h2 class="text-4xl font-extrabold text-gray-900 tracking-tight">
          Welcome Back
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to continue to Prisoner's Dilemma
        </p>
      </div>

      <!-- Social Login -->
      <div class="space-y-4">
        <button
          type="button"
          @click="handleGoogleLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span v-if="loading">Signing in...</span>
          <span v-else>Continue with Google</span>
        </button>
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <!-- Show any errors -->
        <div v-if="error" 
          class="rounded-lg bg-red-50 p-4 border border-red-200">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="bx bx-error text-red-400 text-xl"></i>
            </div>
            <div class="ml-3">
              <div class="text-sm text-red-800">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="togglePassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="['bx text-gray-400 text-xl', showPassword ? 'bx-hide' : 'bx-show']"></i>
              </button>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <i class="bx bx-loader-alt animate-spin"></i>
              Signing in...
            </span>
            <span v-else>Sign in</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import "boxicons/css/boxicons.min.css"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useFirebase } from '~/composables/useFirebase'
import { useAuthStore } from '~/stores/authStore'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const { auth } = useFirebase()
const authStore = useAuthStore()

definePageMeta({
  middleware: ['unauth']
})



const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const processUserData = (userCredential) => {
  const user = userCredential.user
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || email.value.split('@')[0], // Fallback display name
    photoURL: user.photoURL,
    lastLoginAt: new Date().toISOString(),
    providerData: user.providerData
  }
  
  // Update auth store
  authStore.setUser(userData)
  
  return userData
}

const handleSubmit = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const userData = processUserData(userCredential)
    console.log('Logged in user:', userData)
    await navigateTo('/gamemenu')
  } catch (err) {
    error.value = getErrorMessage(err.code)
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const userData = processUserData(userCredential)
    console.log('Logged in user with Google:', userData)
    await navigateTo('/gamemenu')
  } catch (err) {
    error.value = getErrorMessage(err.code)
    console.error('Google login error:', err)
  } finally {
    loading.value = false
  }
}

// Error handling function remains the same
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

// Initialize auth store
onMounted(() => {
  authStore.init()
})
</script>


<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.15s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>