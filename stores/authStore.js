import { defineStore } from 'pinia'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Attempt to fetch user details from localStorage
    const userDetails = localStorage.getItem('userDetails')
    // if info exists in cache set it else null
    const user = userDetails ? JSON.parse(userDetails) : null
    
    return {
      user
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.user,
    getUser() {
      return this.user
    }
  },

  actions: {
    init() {
      const auth = getAuth()
      // Set up auth state listener
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
          this.setUser(userData)
        } else {
          // User is signed out
          this.logout()
        }
      })
    },

    setUser(data) {
      localStorage.setItem('userDetails', JSON.stringify(data))
      this.user = data
    },

    logout() {
      this.setUser(null)
      localStorage.removeItem('userDetails')
    }
  }
})