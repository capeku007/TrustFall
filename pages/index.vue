<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-xl shadow-2xl space-y-8 p-10">
      <div class="text-center">
        <h2 class="text-4xl font-extrabold text-gray-900 tracking-tight">
          {{ isLogin ? 'Welcome Back' : 'Create Account' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ isLogin ? 'Sign in to continue to Prisoner\'s Dilemma' : 'Sign up to join Prisoner\'s Dilemma' }}
        </p>
      </div>

      <!-- Toggle buttons -->
      <div class="flex rounded-lg overflow-hidden shadow-sm">
        <button 
          @click="setMode(true)" 
          class="w-1/2 py-2 text-center text-sm font-medium transition-all duration-200"
          :class="isLogin ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          Sign In
        </button>
        <button 
          @click="setMode(false)" 
          class="w-1/2 py-2 text-center text-sm font-medium transition-all duration-200"
          :class="!isLogin ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          Sign Up
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-6 space-y-6">
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
          <!-- Name field (signup only) -->
          <div v-if="!isLogin">
            <label for="displayName" class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>
          
          <!-- Email field -->
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
          
          <!-- Password field -->
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
          
          <!-- Confirm Password (signup only) -->
          <div v-if="!isLogin">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || (!isLogin && password !== confirmPassword)"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <i class="bx bx-loader-alt animate-spin"></i>
              {{ isLogin ? 'Signing in...' : 'Signing up...' }}
            </span>
            <span v-else>{{ isLogin ? 'Sign in' : 'Sign up' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import "boxicons/css/boxicons.min.css"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useFirebase } from '~/composables/useFirebase'
import { useAuthStore } from '~/stores/authStore'

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const { auth } = useFirebase()
const authStore = useAuthStore()

definePageMeta({
  middleware: ['unauth']
})

const setMode = (mode) => {
  isLogin.value = mode
  error.value = null // Clear any errors when switching modes
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const processUserData = (userCredential) => {
  const user = userCredential.user
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || displayName.value || email.value.split('@')[0], // Use provided name or fallback
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
  
  // For signup, validate passwords match
  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  error.value = null

  try {
    let userCredential
    
    if (isLogin.value) {
      // Handle login
      userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      // Handle signup
      userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      
      // Set display name if provided
      if (displayName.value && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName.value
        })
      }
    }
    
    const userData = processUserData(userCredential)
    console.log(isLogin.value ? 'Logged in user:' : 'Created user:', userData)
    await navigateTo('/gamemenu')
  } catch (err) {
    error.value = getErrorMessage(err.code)
    console.error(isLogin.value ? 'Login error:' : 'Signup error:', err)
  } finally {
    loading.value = false
  }
}

// Enhanced error handling function
const getErrorMessage = (code) => {
  switch (code) {
    // Login errors
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/too-many-requests':
      return 'Too many attempts, please try again later'
      
    // Signup errors
    case 'auth/email-already-in-use':
      return 'This email is already registered'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters'
      
    default:
      return 'An error occurred during authentication'
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