
import { ref, watch, onUnmounted } from 'vue'
import { useFirebase } from './useFirebase'
import { ref as dbRef, push, set, get, child, onValue } from 'firebase/database'
import { query, orderByChild, equalTo } from 'firebase/database'

export const useGame = () => {
  const { database, auth } = useFirebase()
  const currentGame = ref(null)
  const error = ref(null)
  const loading = ref(false)
  let gameListener = null
    // Keep your existing scenarios data structure
    const scenarios = [
      {
        id: 'bank-heist',
        title: 'Bank Heist',
        description: 'A high-stakes game of trust during a bank robbery.',
        image: '/scenarios/bank-heist.jpg',
        rounds: [
          {
            id: 1,
            title: 'The Heist',
            description: 'Will you share intel about guard positions with your partner?',
            choices: {
              cooperate: {
                text: 'Share Intel',
                description: 'Share accurate information about guard positions'
              },
              betray: {
                text: 'Keep Intel Secret',
                description: 'Withhold or provide misleading information'
              }
            }
          },
          {
            id: 2,
            title: 'The Split',
            description: 'How will you handle dividing the stolen money?',
            choices: {
              cooperate: {
                text: 'Split Fairly',
                description: 'Share the money equally as agreed'
              },
              betray: {
                text: 'Hide Some Money',
                description: 'Keep a portion secretly for yourself'
              }
            }
          },
          {
            id: 3,
            title: 'The Holding Cell',
            description: 'You\'re both in custody. Will you maintain silence?',
            choices: {
              cooperate: {
                text: 'Stay Silent',
                description: 'Maintain complete silence during questioning'
              },
              betray: {
                text: 'Show Weakness',
                description: 'Begin hinting at your partner\'s involvement'
              }
            }
          },
          {
            id: 4,
            title: 'The Plea Deal',
            description: 'You\'re offered a reduced sentence to testify. What\'s your choice?',
            choices: {
              cooperate: {
                text: 'Reject the Deal',
                description: 'Stay loyal and face the full charges'
              },
              betray: {
                text: 'Accept the Deal',
                description: 'Testify against your partner for leniency'
              }
            }
          },
          {
            id: 5,
            title: 'Final Interrogation',
            description: 'This is your last chance. Betray or remain silent?',
            choices: {
              cooperate: {
                text: 'Maintain Silence',
                description: 'Stay loyal until the end'
              },
              betray: {
                text: 'Full Confession',
                description: 'Tell everything about your partner\'s involvement'
              }
            }
          }
        ]
      }
    ]

    const playerGames = ref([])
  const loadingGames = ref(false)

  const createNewGame = async (scenarioId, opponentType = 'ai') => {
    loading.value = true;
    error.value = null;
  
    try {
      validateDatabaseConnection();
  
      if (!auth.currentUser) {
        throw new Error('User must be authenticated');
      }
      
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        throw new Error('Invalid scenario');
      }
  
      // Create new game structure
      const gameData = {
        scenarioId,
        createdAt: Date.now(),
        status: 'active',
        currentRound: 1,
        userId: auth.currentUser.uid, // Add this line for indexing
        players: {
          [auth.currentUser.uid]: {
            type: 'human',
            score: 0,
            choices: {}
          },
          ai: {
            type: 'ai',
            score: 0,
            choices: {}
          }
        },
        scenario: scenario
      };
  
      // Create new game in database
      const gamesRef = dbRef(database, 'games');
      const newGameRef = push(gamesRef);
      
      await set(newGameRef, gameData);
  
      // Store the current game reference
      currentGame.value = {
        id: newGameRef.key,
        ...gameData
      };
  
      // Set up game listener after successful creation
      if (newGameRef.key) {
        setupGameListener(newGameRef.key);
      }
  
      return currentGame.value;
  
    } catch (err) {
      error.value = err.message;
      console.error('Error creating game:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // Update the fetchPlayerGames method
  const fetchPlayerGames = async (userId) => {
    loadingGames.value = true;
    try {
      const gamesRef = dbRef(database, 'games');
      const playerGamesQuery = query(
        gamesRef,
        orderByChild('userId'),
        equalTo(userId)
      );
  
      const snapshot = await get(playerGamesQuery);
      if (snapshot.exists()) {
        const games = [];
        snapshot.forEach((childSnapshot) => {
          const gameData = childSnapshot.val();
          // Only include active games
          if (gameData.status === 'active') {
            games.push({
              id: childSnapshot.key,
              ...gameData
            });
          }
        });
        // Sort games by creation date, newest first
        playerGames.value = games.sort((a, b) => b.createdAt - a.createdAt);
      } else {
        playerGames.value = [];
      }
    } catch (err) {
      console.error('Error fetching player games:', err);
      error.value = 'Failed to load your games';
    } finally {
      loadingGames.value = false;
    }
  };


  const setupGameListener = (gameId) => {
    if (gameListener) {
      gameListener()
    }

    try {
      // Use dbRef instead of ref for Firebase database reference
      const gameRef = dbRef(database, `games/${gameId}`)
      gameListener = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          currentGame.value = {
            id: gameId,
            ...snapshot.val()
          }
        } else {
          currentGame.value = null
        }
      }, (error) => {
        console.error('Game listener error:', error)
      })
    } catch (err) {
      console.error('Error setting up game listener:', err)
    }
  }

  const fetchGame = async (gameId) => {
    loading.value = true
    error.value = null

    try {
      const gameRef = dbRef(database, `games/${gameId}`)
      const snapshot = await get(gameRef)

      if (!snapshot.exists()) {
        throw new Error('Game not found')
      }

      currentGame.value = {
        id: gameId,
        ...snapshot.val()
      }

      // Setup real-time listener after successful fetch
      setupGameListener(gameId)

      return currentGame.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Make sure to clean up the listener when the component unmounts
  onUnmounted(() => {
    if (gameListener) {
      gameListener()
      gameListener = null
    }
  })

  // Watch for game state changes
  watch(currentGame, (newGame) => {
    if (newGame && newGame.id) {
      console.log('Game state updated:', newGame)
    }
  }, { deep: true })

  // Rest of your code remains the same...
  // (scenarios, makeChoice, calculateScores, etc.)
    // Make choice with improved error handling
    const makeChoice = async (gameId, roundId, choice) => {
      loading.value = true
      error.value = null
  
      try {
        validateDatabaseConnection()
  
        if (!auth.currentUser) {
          throw new Error('User must be authenticated')
        }
        
        const gameRef = dbRef(database, `games/${gameId}`)
        const snapshot = await get(gameRef)
        
        if (!snapshot.exists()) {
          throw new Error('Game not found')
        }
  
        const gameData = snapshot.val()
  
        if (gameData.currentRound !== roundId) {
          throw new Error('Invalid round')
        }
  
        // Record player's choice
        await set(child(gameRef, `players/${auth.currentUser.uid}/choices/${roundId}`), choice)
  
        // Generate and record AI's choice
        const aiChoice = generateAiChoice(gameData, roundId)
        await set(child(gameRef, `players/ai/choices/${roundId}`), aiChoice)
  
        // Calculate and update scores
        const scores = calculateScores(choice, aiChoice)
        await set(child(gameRef, `players/${auth.currentUser.uid}/score`), 
          gameData.players[auth.currentUser.uid].score + scores.playerScore)
        await set(child(gameRef, `players/ai/score`), 
          gameData.players.ai.score + scores.aiScore)
  
        // Advance to next round or end game
        if (roundId === 5) {
          await set(child(gameRef, 'status'), 'completed')
        } else {
          await set(child(gameRef, 'currentRound'), roundId + 1)
        }
  
        return currentGame.value
  
      } catch (err) {
        error.value = err.message
        console.error('Error making choice:', err)
        throw err
      } finally {
        loading.value = false
      }
    }
    // Helper function to validate database connection
  const validateDatabaseConnection = () => {
    if (!database) {
      throw new Error('Database connection not established')
    }
    return true
  }
    // Keep your existing helper functions
    const generateAiChoice = (gameData, roundId) => {
      return Math.random() < 0.7 ? 'cooperate' : 'betray'
    }
  
    const calculateScores = (playerChoice, aiChoice) => {
      if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
        return { playerScore: 3, aiScore: 3 }
      } else if (playerChoice === 'betray' && aiChoice === 'cooperate') {
        return { playerScore: 5, aiScore: 0 }
      } else if (playerChoice === 'cooperate' && aiChoice === 'betray') {
        return { playerScore: 0, aiScore: 5 }
      } else {
        return { playerScore: 1, aiScore: 1 }
      }
    }

  return {
    scenarios,
    currentGame,
    error,
    loading,
    createNewGame,
    makeChoice,
    fetchGame,
    playerGames,
    loadingGames,
    fetchPlayerGames
  }
}