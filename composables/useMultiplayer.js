// composables/useMultiplayer.js
import { ref, computed } from 'vue'
import { useFirebase } from './useFirebase'
import { ref as dbRef, push, set, get, update, onValue, remove } from 'firebase/database'
import { query, orderByChild, equalTo } from 'firebase/database'

export const useMultiplayer = () => {
  const { database, auth } = useFirebase()
  
  // State
  const pendingGames = ref([])
  const gameInvites = ref([])
  const currentMatch = ref(null)
  const loadingMultiplayer = ref(false)
  const error = ref(null)
  const availablePlayers = ref([])
  const loadingPlayers = ref(false)
  let gameListener = null
  
  const getAvailablePlayers = async () => {
    loadingPlayers.value = true
    try {
      // Get online users from presence system
      const onlineUsersRef = dbRef(database, 'status')
      const snapshot = await get(onlineUsersRef)

      if (!snapshot.exists()) {
        return []
      }

      const users = []
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val()
        // Don't include current user
        if (childSnapshot.key !== auth.currentUser?.uid) {
          users.push({
            id: childSnapshot.key,
            name: user.displayName || 'Anonymous',
            lastSeen: user.lastSeen || user.timestamp,
            status: user.state,
            photoURL: user.photoURL
          })
        }
      })

      availablePlayers.value = users
      return users
    } catch (err) {
      console.error('Error getting available players:', err)
      error.value = err.message
      return []
    } finally {
      loadingPlayers.value = false
    }
  }

  // Add method to watch for online players
  const watchAvailablePlayers = () => {
    const onlineUsersRef = dbRef(database, 'status')
    
    onValue(onlineUsersRef, (snapshot) => {
      if (!snapshot.exists()) {
        availablePlayers.value = []
        return
      }

      const users = []
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val()
        // Don't include current user
        if (childSnapshot.key !== auth.currentUser?.uid) {
          users.push({
            id: childSnapshot.key,
            name: user.displayName || 'Anonymous',
            lastSeen: user.lastSeen || user.timestamp,
            status: user.state,
            photoURL: user.photoURL
          })
        }
      })

      availablePlayers.value = users
    })
  }

  // Add to cleanup
  const cleanup = () => {
    if (gameListener) {
      gameListener()
      gameListener = null
    }
    currentMatch.value = null
    pendingGames.value = []
    gameInvites.value = []
    availablePlayers.value = []
  }

  // Modify createMultiplayerGame to accept targetPlayerId
  const createMultiplayerGame = async (scenarioId, targetPlayerId = null) => {
    if (!auth.currentUser) {
      throw new Error('Must be authenticated to create a game')
    }

    loadingMultiplayer.value = true
    try {
      const gameData = {
        scenarioId,
        createdAt: Date.now(),
        status: 'pending',
        hostId: auth.currentUser.uid,
        hostName: auth.currentUser.displayName || 'Anonymous',
        players: {
          [auth.currentUser.uid]: {
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || 'Anonymous',
            status: 'ready',
            score: 0,
            choices: {}
          }
        },
        playerCount: 1,
        maxPlayers: 2,
        targetPlayerId // Add this to track invited player
      }

      const gamesRef = dbRef(database, 'multiplayerGames')
      const newGameRef = push(gamesRef)
      await set(newGameRef, gameData)

      // If there's a target player, create an invite
      if (targetPlayerId) {
        const inviteRef = dbRef(database, `invites/${targetPlayerId}/${newGameRef.key}`)
        await set(inviteRef, {
          gameId: newGameRef.key,
          from: auth.currentUser.uid,
          fromName: auth.currentUser.displayName || 'Anonymous',
          timestamp: Date.now(),
          scenarioId
        })
      }

      return {
        id: newGameRef.key,
        ...gameData
      }
    } catch (err) {
      console.error('Error creating multiplayer game:', err)
      error.value = err.message
      throw err
    } finally {
      loadingMultiplayer.value = false
    }
  }


  // Join an existing game
  const joinGame = async (gameId) => {
    if (!auth.currentUser) {
      throw new Error('Must be authenticated to join a game')
    }

    loadingMultiplayer.value = true
    try {
      const gameRef = dbRef(database, `multiplayerGames/${gameId}`)
      const snapshot = await get(gameRef)

      if (!snapshot.exists()) {
        throw new Error('Game not found')
      }

      const gameData = snapshot.val()

      if (gameData.status !== 'pending') {
        throw new Error('Game is no longer accepting players')
      }

      if (gameData.playerCount >= gameData.maxPlayers) {
        throw new Error('Game is full')
      }

      // Add player to the game
      const updates = {
        [`players/${auth.currentUser.uid}`]: {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anonymous',
          status: 'ready',
          score: 0,
          choices: {}
        },
        playerCount: gameData.playerCount + 1,
        status: gameData.playerCount + 1 >= gameData.maxPlayers ? 'active' : 'pending'
      }

      await update(gameRef, updates)

      return {
        id: gameId,
        ...gameData,
        ...updates
      }
    } catch (err) {
      console.error('Error joining game:', err)
      error.value = err.message
      throw err
    } finally {
      loadingMultiplayer.value = false
    }
  }

  // Leave a game
  const leaveGame = async (gameId) => {
    if (!auth.currentUser) return

    try {
      const gameRef = dbRef(database, `multiplayerGames/${gameId}`)
      const snapshot = await get(gameRef)

      if (!snapshot.exists()) return

      const gameData = snapshot.val()

      // If host leaves, remove the game
      if (gameData.hostId === auth.currentUser.uid) {
        await remove(gameRef)
        return
      }

      // Otherwise, remove the player
      const updates = {
        [`players/${auth.currentUser.uid}`]: null,
        playerCount: gameData.playerCount - 1
      }

      await update(gameRef, updates)
    } catch (err) {
      console.error('Error leaving game:', err)
      error.value = err.message
    }
  }

  // Make a move in multiplayer game
  const makeMultiplayerMove = async (gameId, choice, diceInfo) => {
    if (!auth.currentUser) {
      throw new Error('Must be authenticated to make a move')
    }

    try {
      const gameRef = dbRef(database, `multiplayerGames/${gameId}`)
      const snapshot = await get(gameRef)

      if (!snapshot.exists()) {
        throw new Error('Game not found')
      }

      const gameData = snapshot.val()
      const currentRound = gameData.currentRound || 1

      // Record the player's move
      const updates = {
        [`players/${auth.currentUser.uid}/choices/${currentRound}`]: {
          type: choice,
          diceRoll: diceInfo,
          timestamp: Date.now()
        }
      }

      await update(gameRef, updates)

      // Check if all players have made their moves
      const allPlayersMoved = Object.values(gameData.players).every(
        player => player.choices?.[currentRound]
      )

      if (allPlayersMoved) {
        // Calculate round outcome
        const roundOutcome = calculateMultiplayerOutcome(gameData, currentRound)
        
        // Update scores and advance round
        const scoreUpdates = {
          currentRound: currentRound + 1,
          roundOutcomes: {
            ...gameData.roundOutcomes,
            [currentRound]: roundOutcome
          }
        }

        // Update player scores
        Object.entries(roundOutcome.scores).forEach(([playerId, score]) => {
          scoreUpdates[`players/${playerId}/score`] = 
            (gameData.players[playerId].score || 0) + score
        })

        await update(gameRef, scoreUpdates)
      }

      return { success: true }
    } catch (err) {
      console.error('Error making move:', err)
      error.value = err.message
      throw err
    }
  }

  // Calculate outcome for multiplayer round
  const calculateMultiplayerOutcome = (gameData, roundNumber) => {
    const choices = Object.values(gameData.players).map(player => ({
      playerId: player.id,
      choice: player.choices[roundNumber]?.type,
      diceRoll: player.choices[roundNumber]?.diceRoll
    }))

    const scores = {}
    const narratives = []

    // Calculate base scores
    choices.forEach(playerChoice => {
      const otherChoices = choices.filter(c => c.playerId !== playerChoice.playerId)
      let score = 0

      // Score based on choices
      if (playerChoice.choice === 'cooperate') {
        score += otherChoices.every(c => c.choice === 'cooperate') ? 3 : 0
      } else if (playerChoice.choice === 'betray') {
        score += otherChoices.filter(c => c.choice === 'cooperate').length * 2
      } else if (playerChoice.choice === 'negotiate') {
        score += otherChoices.filter(c => c.choice !== 'betray').length
      }

      // Adjust score based on dice roll
      if (playerChoice.diceRoll.isCritical) score *= 1.5
      if (playerChoice.diceRoll.isCriticalFail) score *= 0.5

      scores[playerChoice.playerId] = Math.floor(score)
    })

    // Generate narrative
    const cooperators = choices.filter(c => c.choice === 'cooperate').length
    const betrayers = choices.filter(c => c.choice === 'betray').length
    const negotiators = choices.filter(c => c.choice === 'negotiate').length

    if (cooperators === choices.length) {
      narratives.push("Perfect harmony as all players cooperate!")
    } else if (betrayers === choices.length) {
      narratives.push("Total chaos as everyone attempts betrayal!")
    } else {
      if (betrayers > 0) {
        narratives.push(`${betrayers} player${betrayers > 1 ? 's' : ''} chose betrayal`)
      }
      if (cooperators > 0) {
        narratives.push(`${cooperators} player${cooperators > 1 ? 's' : ''} maintained trust`)
      }
      if (negotiators > 0) {
        narratives.push(`${negotiators} player${negotiators > 1 ? 's' : ''} sought middle ground`)
      }
    }

    return {
      scores,
      narrative: narratives.join('. '),
      choices: choices.reduce((acc, { playerId, choice }) => {
        acc[playerId] = choice
        return acc
      }, {})
    }
  }

  // Watch for available games
  const watchPendingGames = () => {
    const gamesRef = dbRef(database, 'multiplayerGames')
    const pendingQuery = query(gamesRef, orderByChild('status'), equalTo('pending'))

    onValue(pendingQuery, (snapshot) => {
      const games = []
      snapshot.forEach((childSnapshot) => {
        games.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        })
      })
      pendingGames.value = games
    })
  }

  // Watch current game
  const watchMultiplayerGame = (gameId) => {
    if (gameListener) {
      gameListener()
      gameListener = null
    }

    const gameRef = dbRef(database, `multiplayerGames/${gameId}`)
    gameListener = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        currentMatch.value = {
          id: snapshot.key,
          ...snapshot.val()
        }
      } else {
        currentMatch.value = null
      }
    })
  }


  return {
    // State
    pendingGames,
    gameInvites,
    currentMatch,
    loadingMultiplayer,
    error,

    availablePlayers,
    loadingPlayers,
    getAvailablePlayers,
    watchAvailablePlayers,

    // Methods
    createMultiplayerGame,
    joinGame,
    leaveGame,
    makeMultiplayerMove,
    watchPendingGames,
    watchMultiplayerGame,
    cleanup
  }
}