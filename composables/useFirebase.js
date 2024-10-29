
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

export const useFirebase = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBixudJkkN4ZseJDF4WMDxrLg8FWme2tmk",
    authDomain: "trust-me-9b488.firebaseapp.com",
    projectId: "trust-me-9b488",
    storageBucket: "trust-me-9b488.appspot.com",
    messagingSenderId: "65736993214",
    appId: "1:65736993214:web:f17d2a4428d30dbf9cf1ef",
    measurementId: "G-93P2WEN7HZ"
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const database = getDatabase(app)

  return {
    auth,
    database
  }
}