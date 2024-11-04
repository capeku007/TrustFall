// composables/useGame.js
import { ref, computed } from 'vue'
import { useFirebase } from './useFirebase'
import { ref as dbRef, push, set, get, child, onValue, update } from 'firebase/database'
import { query, orderByChild, equalTo } from 'firebase/database'
import { useAIDialogue } from './useAIDialogue'
import { useAdaptiveDifficulty } from './useAdaptiveDifficulty'
import { useSceneManager } from './useSceneManager'
const ConsequenceType = {
  LOYALTY: 'loyalty',
  BETRAYAL: 'betrayal',
  DECEPTION: 'deception',
  FAILURE: 'failure',
  CRITICAL_SUCCESS: 'critical_success',
  CRITICAL_FAILURE: 'critical_failure'
}


const sceneManager = useSceneManager()

const consequenceManager = {
  calculateModifiers(activeConsequences) {
    const modifiers = {
      diceRoll: 0,
      betrayBonus: 0,
      cooperateBonus: 0,
      narrative: []
    }

    if (!Array.isArray(activeConsequences)) return modifiers

    activeConsequences.forEach(consequence => {
      switch (consequence.type) {
        case ConsequenceType.LOYALTY:
          modifiers.diceRoll += 2
          modifiers.cooperateBonus += 1
          modifiers.narrative.push("Your reputation for loyalty precedes you")
          break
        case ConsequenceType.BETRAYAL:
          modifiers.diceRoll -= 1
          modifiers.betrayBonus += 1
          modifiers.narrative.push("Others regard you with suspicion")
          break
        case ConsequenceType.DECEPTION:
          modifiers.betrayBonus += 1
          modifiers.narrative.push("Your silver tongue has become well-known")
          break
        case ConsequenceType.FAILURE:
          modifiers.diceRoll -= 1
          modifiers.narrative.push("Your recent failure still weighs on your mind")
          break
        case ConsequenceType.CRITICAL_SUCCESS:
          modifiers.diceRoll += 1
          modifiers.narrative.push("Your legendary success has boosted your confidence")
          break
        case ConsequenceType.CRITICAL_FAILURE:
          modifiers.diceRoll -= 2
          modifiers.narrative.push("The memory of your spectacular failure haunts you")
          break
      }
    })

    return modifiers
  },

  generateConsequence(choice, diceInfo, baseOutcome) {
    const consequences = []

    // Add consequence based on choice combination
    if (choice === 'cooperate' && baseOutcome.playerChoice === 'cooperate') {
      consequences.push({
        type: ConsequenceType.LOYALTY,
        description: "Your loyalty has been noted",
        duration: 2,
        modifier: 2
      })
    }

    if (choice === 'betray' && baseOutcome.playerPoints > 3) {
      consequences.push({
        type: ConsequenceType.DECEPTION,
        description: "Your deception was masterfully executed",
        duration: 1,
        modifier: 1
      })
    }

    // Add consequence based on dice roll
    if (diceInfo.diceRoll === 20) {
      consequences.push({
        type: ConsequenceType.CRITICAL_SUCCESS,
        description: "Your exceptional performance will be remembered",
        duration: 2,
        modifier: 1
      })
    }

    if (diceInfo.diceRoll === 1) {
      consequences.push({
        type: ConsequenceType.CRITICAL_FAILURE,
        description: "Your dramatic failure has left a lasting impression",
        duration: 2,
        modifier: -2
      })
    }

    // Add consequence based on final result
    if (diceInfo.finalResult < (diceInfo.dcCheck || 4)) {
      consequences.push({
        type: ConsequenceType.FAILURE,
        description: "Your failure has weakened your position",
        duration: 1,
        modifier: -1
      })
    }

    return consequences
  },

  getConsequenceDescription(type) {
    switch (type) {
      case ConsequenceType.LOYALTY:
        return "+2 to rolls when cooperating"
      case ConsequenceType.BETRAYAL:
        return "-1 to all rolls, +1 to betray attempts"
      case ConsequenceType.DECEPTION:
        return "+1 to betray attempts"
      case ConsequenceType.FAILURE:
        return "-1 to all rolls"
      case ConsequenceType.CRITICAL_SUCCESS:
        return "+1 to all rolls"
      case ConsequenceType.CRITICAL_FAILURE:
        return "-2 to all rolls"
      default:
        return ""
    }
  }
}
const ChoiceType = {
  COOPERATE: 'cooperate',
  NEGOTIATE: 'negotiate',
  BETRAY: 'betray'
}

const OutcomeType = {
  BOTH_COOPERATE: 'bothCooperate',
  BOTH_NEGOTIATE: 'bothNegotiate',
  BOTH_BETRAY: 'bothBetray',
  COOPERATE_NEGOTIATE: 'cooperateNegotiate',
  NEGOTIATE_BETRAY: 'negotiateBetray',
  BETRAYED: 'betrayed',
  SUCCESSFUL_BETRAY: 'successfulBetray',
  PARTIAL_BETRAYAL: 'partialBetrayal'
}

const determineOutcome = (playerChoice, aiChoice, roundData, diceInfo) => {
  // Base point values for different outcome combinations
  const pointMatrix = {
    [ChoiceType.COOPERATE]: {
      [ChoiceType.COOPERATE]: { player: 3, ai: 3, dm: 0, type: OutcomeType.BOTH_COOPERATE },
      [ChoiceType.NEGOTIATE]: { player: 2, ai: 3, dm: 1, type: OutcomeType.COOPERATE_NEGOTIATE },
      [ChoiceType.BETRAY]: { player: 0, ai: 5, dm: 2, type: OutcomeType.BETRAYED }
    },
    [ChoiceType.NEGOTIATE]: {
      [ChoiceType.COOPERATE]: { player: 3, ai: 2, dm: 1, type: OutcomeType.COOPERATE_NEGOTIATE },
      [ChoiceType.NEGOTIATE]: { player: 4, ai: 4, dm: 1, type: OutcomeType.BOTH_NEGOTIATE },
      [ChoiceType.BETRAY]: { player: 1, ai: 4, dm: 2, type: OutcomeType.NEGOTIATE_BETRAY }
    },
    [ChoiceType.BETRAY]: {
      [ChoiceType.COOPERATE]: { player: 5, ai: 0, dm: 2, type: OutcomeType.SUCCESSFUL_BETRAY },
      [ChoiceType.NEGOTIATE]: { player: 4, ai: 1, dm: 2, type: OutcomeType.PARTIAL_BETRAYAL },
      [ChoiceType.BETRAY]: { player: 1, ai: 1, dm: 3, type: OutcomeType.BOTH_BETRAY }
    }
  }

  // Get base outcome from matrix
  const baseOutcome = pointMatrix[playerChoice][aiChoice]

  // Calculate dice influence (scaled down from original)
  let pointMultiplier = 1
  let additionalNarrative = ''

  if (diceInfo.diceRoll === 20) {
    // Critical success - 25% bonus instead of double
    pointMultiplier = 1.25
    additionalNarrative = ' Your exceptional skill provides an edge!'
  } else if (diceInfo.diceRoll === 1) {
    // Critical failure - 25% penalty instead of half
    pointMultiplier = 0.75
    additionalNarrative = ' Your mistake costs you some advantage.'
  } else if (diceInfo.finalResult >= (roundData.dcCheck || 10)) {
    // Success - 10% bonus instead of 50%
    pointMultiplier = 1.1
    additionalNarrative = ' Your competence improves the outcome slightly.'
  } else {
    // Failure - 10% penalty instead of 25%
    pointMultiplier = 0.9
    additionalNarrative = ' Your struggle reduces the effectiveness of your choice.'
  }

  // Apply negotiation bonuses
  if (playerChoice === ChoiceType.NEGOTIATE) {
    // Successful negotiation roll provides intelligence
    if (diceInfo.finalResult >= (roundData.dcCheck || 10)) {
      additionalNarrative += ' Your careful negotiation reveals hints about their intentions.'
    }
    
    // Negotiation provides some protection against betrayal
    if (aiChoice === ChoiceType.BETRAY) {
      pointMultiplier += 0.15 // Additional 15% protection
      additionalNarrative += ' Your cautious approach minimizes losses.'
    }
  }

  // Calculate final points
  const finalOutcome = {
    type: baseOutcome.type,
    playerPoints: Math.floor(baseOutcome.player * pointMultiplier),
    aiPoints: baseOutcome.ai,
    dmPoints: baseOutcome.dm,
    narrative: generateOutcomeNarrative(baseOutcome.type, playerChoice, aiChoice) + additionalNarrative,
    intelligence: getIntelligenceGain(playerChoice, aiChoice, diceInfo)
  }

  return finalOutcome
}

const generateOutcomeNarrative = (outcomeType, playerChoice, aiChoice) => {
  const narratives = {
    [OutcomeType.BOTH_COOPERATE]: 
      "Trust prevails as both parties honor their commitments.",
    [OutcomeType.BOTH_NEGOTIATE]: 
      "A careful dance of compromise leads to mutual benefit.",
    [OutcomeType.BOTH_BETRAY]: 
      "Mutual betrayal leaves both parties weakened.",
    [OutcomeType.COOPERATE_NEGOTIATE]: 
      "While one seeks common ground, the other maintains full trust.",
    [OutcomeType.NEGOTIATE_BETRAY]: 
      "Caution proves wise as betrayal reveals itself, though losses are minimized.",
    [OutcomeType.BETRAYED]: 
      "Blind trust meets cruel betrayal.",
    [OutcomeType.SUCCESSFUL_BETRAY]: 
      "Betrayal succeeds against naive trust.",
    [OutcomeType.PARTIAL_BETRAYAL]: 
      "Betrayal finds limited success against cautious negotiation."
  }

  return narratives[outcomeType] || "The round concludes with unexpected results."
}

const getIntelligenceGain = (playerChoice, aiChoice, diceInfo) => {
  if (playerChoice !== ChoiceType.NEGOTIATE) return null

  // Intelligence gained through negotiation
  const intelligence = {
    betrayalLikelihood: 0,
    futureBonuses: []
  }

  if (diceInfo.finalResult >= (diceInfo.dcCheck || 10)) {
    // Successful negotiation provides intelligence
    intelligence.betrayalLikelihood = aiChoice === ChoiceType.BETRAY ? 0.8 : 0.2
    intelligence.futureBonuses.push({
      type: 'insight',
      duration: 1,
      bonus: 2,
      description: 'Recent negotiations provide insight into their methods'
    })
  }

  return intelligence
}

// Enhanced AI choice generation with negotiation
const generateAiChoice = (gameData, roundId) => {
  const playerHistory = gameData.players[auth.currentUser.uid].choices || {}
  const aiHistory = gameData.players.ai.choices || {}
  
  // Calculate tendency metrics
  const playerBetrayalRatio = calculateChoiceRatio(playerHistory, ChoiceType.BETRAY)
  const playerNegotiationRatio = calculateChoiceRatio(playerHistory, ChoiceType.NEGOTIATE)
  
  // Base probabilities
  let probabilities = {
    [ChoiceType.COOPERATE]: 0.4,
    [ChoiceType.NEGOTIATE]: 0.3,
    [ChoiceType.BETRAY]: 0.3
  }
  
  // Adjust based on player history
  if (playerBetrayalRatio > 0.5) {
    // Player betrays often - reduce cooperation, increase negotiation
    probabilities[ChoiceType.COOPERATE] -= 0.2
    probabilities[ChoiceType.NEGOTIATE] += 0.1
    probabilities[ChoiceType.BETRAY] += 0.1
  }
  
  if (playerNegotiationRatio > 0.5) {
    // Player negotiates often - more likely to cooperate or betray
    probabilities[ChoiceType.NEGOTIATE] -= 0.1
    probabilities[ChoiceType.COOPERATE] += 0.05
    probabilities[ChoiceType.BETRAY] += 0.05
  }
  
  // Round influence
  const roundProgress = roundId / 5
  probabilities[ChoiceType.BETRAY] += roundProgress * 0.1 // More likely to betray in later rounds
  
  // Normalize probabilities
  const total = Object.values(probabilities).reduce((a, b) => a + b, 0)
  Object.keys(probabilities).forEach(key => {
    probabilities[key] = probabilities[key] / total
  })
  
  // Make choice based on probabilities
  const random = Math.random()
  let cumulativeProbability = 0
  
  for (const [choice, probability] of Object.entries(probabilities)) {
    cumulativeProbability += probability
    if (random <= cumulativeProbability) {
      return choice
    }
  }
  
  return ChoiceType.COOPERATE // Fallback
}

const calculateChoiceRatio = (history, choiceType) => {
  const choices = Object.values(history)
  if (choices.length === 0) return 0
  return choices.filter(c => c === choiceType).length / choices.length
}

// Create singleton instances for game state
const currentGame = ref(null)
const error = ref(null)
const loading = ref(false)
const playerGames = ref([])
const loadingGames = ref(false)
const roundOutcome = ref(null)
let gameListener = null



export const useGame = () => {
  const { database, auth } = useFirebase()

  
  const validateDatabaseConnection = () => {
    if (!database) {
      throw new Error('Database connection not established')
    }
    
    try {
      const testRef = dbRef(database, '.info/connected')
      return true
    } catch (err) {
      console.error('Database connection error:', err)
      throw new Error('Unable to connect to database')
    }
  }
  
  // Helper function to ensure safe database paths
  const createSafeDatabaseRef = (path) => {
    try {
      return dbRef(database, path)
    } catch (err) {
      console.error('Error creating database reference:', err)
      throw new Error('Invalid database path')
    }
  }
  
  // Update the setupGameListener function
  const setupGameListener = (gameId) => {
    cleanupGameListener()
  
    try {
      const gameRef = createSafeDatabaseRef(`games/${gameId}`)
      gameListener = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          currentGame.value = {
            id: gameId,
            ...snapshot.val()
          }
        } else {
          console.error('Game not found in listener')
        }
      }, (error) => {
        console.error('Game listener error:', error)
      })
    } catch (err) {
      console.error('Error setting up game listener:', err)
      throw err
    }
  }
  
  // Clean up function
  const cleanupGameListener = () => {
    if (gameListener) {
      gameListener()
      gameListener = null
      currentGame.value = null
    }
  }

  const createNewGame = async (scenarioId) => {
    loading.value = true
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get scenario info from SceneManager
      const availableScenarios = sceneManager.getScenarios()
      const scenarioInfo = availableScenarios.find(s => s.id === scenarioId)
      
      if (!scenarioInfo) {
        throw new Error('Invalid scenario selected')
      }

      // Get initial scene
      const firstScene = sceneManager.getRandomFirstRoundScene(scenarioId)
      
      if (!firstScene) {
        throw new Error('Failed to generate initial scene')
      }

      // Add base choices to scene
      firstScene.choices = {
        cooperate: {
          text: 'Honor the Agreement',
          description: 'Maintain trust and cooperation'
        },
        negotiate: {
          text: 'Cautious Approach',
          description: 'Seek middle ground while protecting interests'
        },
        betray: {
          text: 'Seize Advantage',
          description: 'Pursue personal gain at their expense'
        }
      }

      const gameData = {
        scenarioId,
        scenario: scenarioInfo,
        createdAt: Date.now(),
        status: 'active',
        currentRound: 1,
        userId: auth.currentUser.uid,
        dmPoints: 0,
        currentScene: firstScene,
        lastChoices: null,
        choiceHistory: [],
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
        consequences: {}
      }

      // Create game in database
      const gamesRef = dbRef(database, 'games')
      const newGameRef = push(gamesRef)
      
      if (!newGameRef.key) {
        throw new Error('Failed to create game reference')
      }

      await set(dbRef(database, `games/${newGameRef.key}`), gameData)
      
      return {
        id: newGameRef.key,
        ...gameData
      }
    } catch (err) {
      console.error('Error creating game:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

// Update the makeChoice function to use SceneManager
// Inside useGame composable

const makeChoice = async (gameId, choice, diceInfo) => {
  loading.value = true;
  try {
    const gameRef = dbRef(database, `games/${gameId}`);
    const gameData = currentGame.value;

    if (!gameData) {
      throw new Error('Game not found');
    }

    // Generate AI's choice
    const aiChoice = await generateAiChoice(gameData);

    // Record choices for this round
    const roundChoices = {
      playerChoice: choice,
      aiChoice,
      diceRoll: diceInfo,
      timestamp: Date.now()
    };

    // Add to choice history
    const updatedHistory = [...(gameData.choiceHistory || []), roundChoices];

    // Calculate outcome
    const outcome = determineOutcome(
      choice, 
      aiChoice, 
      gameData.currentScene, 
      diceInfo
    );

    // Calculate consequences
    const consequences = consequenceManager.generateConsequence(
      choice,
      diceInfo,
      outcome
    );

    // Determine next scene using SceneManager
    const nextRound = gameData.currentRound + 1;
    let nextScene = null;
    
    if (nextRound <= 5) {
      // Get next scene
      nextScene = sceneManager.determineScene(
        gameData.scenarioId,
        nextRound,
        roundChoices,
        updatedHistory
      );

      // Modify scene based on consequences
      nextScene = sceneManager.modifyScene(
        nextScene,
        consequences,
        updatedHistory
      );

      // Add base choices to the next scene
      nextScene.choices = {
        cooperate: {
          text: 'Honor the Agreement',
          description: 'Maintain trust and cooperation'
        },
        negotiate: {
          text: 'Cautious Approach',
          description: 'Seek middle ground while protecting interests'
        },
        betray: {
          text: 'Seize Advantage',
          description: 'Pursue personal gain at their expense'
        }
      };
    }

    // Create updates object
    const updates = {
      [`players/${auth.currentUser.uid}/choices/${gameData.currentRound}`]: {
        choice,
        diceRoll: diceInfo,
        outcome: outcome
      },
      [`players/${auth.currentUser.uid}/score`]: (gameData.players[auth.currentUser.uid]?.score || 0) + outcome.playerPoints,
      [`players/ai/choices/${gameData.currentRound}`]: {
        choice: aiChoice,
        outcome: outcome
      },
      [`players/ai/score`]: (gameData.players.ai?.score || 0) + outcome.aiPoints,
      dmPoints: (gameData.dmPoints || 0) + outcome.dmPoints,
      lastChoices: roundChoices,
      choiceHistory: updatedHistory
    };

    // Update consequences - make sure we're not just overwriting with an empty object
    if (consequences && consequences.length > 0) {
      const timestamp = Date.now();
      updates.consequences = {
        ...(gameData.consequences || {}),
        ...consequences.reduce((acc, consequence, index) => {
          // Create a safe key using timestamp and index
          const safeKey = `consequence_${timestamp}_${index}`;
          acc[safeKey] = consequence;
          return acc;
        }, {})
      };
    }

    // Add next round info if game is continuing
    if (nextRound <= 5) {
      updates.currentRound = nextRound;
      updates.currentScene = nextScene;
    } else {
      updates.status = 'completed';
      updates.completedAt = Date.now();
    }

    // Update the game in Firebase
    await update(gameRef, updates);

    return {
      outcome,
      nextScene: nextRound <= 5 ? nextScene : null,
      playerChoice: choice,
      aiChoice
    };

  } catch (err) {
    console.error('Error making choice:', err);
    error.value = err.message;
    throw err;
  } finally {
    loading.value = false;
  }
};

// Rest of your useGame composable code...


  // Fetch game with enhanced error handling
  const fetchGame = async (gameId) => {
    if (!gameId) {
      error.value = 'Game ID is required'
      return null
    }
  
    loading.value = true
    error.value = null
  
    try {
      validateDatabaseConnection()
  
      const gameRef = dbRef(database, `games/${gameId}`)
      const snapshot = await get(gameRef)
  
      if (!snapshot.exists()) {
        throw new Error('Game not found')
      }
  
      const gameData = {
        id: gameId,
        ...snapshot.val()
      }
  
      setupGameListener(gameId)
      return gameData
  
    } catch (err) {
      error.value = err.message
      console.error('Error fetching game:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch player games with enhanced filtering
  const fetchPlayerGames = async (userId) => {
    loadingGames.value = true
    try {
      validateDatabaseConnection()
  
      const gamesRef = dbRef(database, 'games')
      const playerGamesQuery = query(
        gamesRef,
        orderByChild('userId'),
        equalTo(userId)
      )
  
      const snapshot = await get(playerGamesQuery)
      
      if (snapshot.exists()) {
        const games = []
        snapshot.forEach((childSnapshot) => {
          games.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          })
        })
        playerGames.value = games.sort((a, b) => b.createdAt - a.createdAt)
      } else {
        playerGames.value = []
      }
    } catch (err) {
      console.error('Error fetching player games:', err)
      error.value = 'Failed to load your games'
    } finally {
      loadingGames.value = false
    }
  }

  // Enhanced AI choice generation based on game state
  const generateAiChoice = async (gameData, roundId) => {
    const { database, auth } = useFirebase()
    const userId = auth.currentUser.uid
    
    // Get player's previous games
    const gamesRef = dbRef(database, 'games')
    const playerGamesQuery = query(
      gamesRef,
      orderByChild('userId'),
      equalTo(userId)
    )
  
    try {
      const snapshot = await get(playerGamesQuery)
      let historicalPatterns = {
        totalGames: 0,
        choiceFrequency: {
          [ChoiceType.COOPERATE]: 0,
          [ChoiceType.NEGOTIATE]: 0,
          [ChoiceType.BETRAY]: 0
        },
        earlyGamePreference: {}, // Rounds 1-2
        lateGamePreference: {},  // Rounds 4-5
        responseToBetrayal: {},  // How they play after being betrayed
        winningChoices: {}       // Choices that led to wins
      }
  
      if (snapshot.exists()) {
        // Analyze all previous completed games
        snapshot.forEach((childSnapshot) => {
          const game = childSnapshot.val()
          // Skip current game and incomplete games
          if (game.id === gameData.id || game.status !== 'completed') return
          
          historicalPatterns.totalGames++
          
          // Analyze player's choices in this game
          Object.entries(game.players[userId].choices || {}).forEach(([round, data]) => {
            const roundNum = parseInt(round)
            const choice = data.choice
            
            // Overall frequency
            historicalPatterns.choiceFrequency[choice]++
            
            // Early vs Late game preferences
            if (roundNum <= 2) {
              historicalPatterns.earlyGamePreference[choice] = (historicalPatterns.earlyGamePreference[choice] || 0) + 1
            } else if (roundNum >= 4) {
              historicalPatterns.lateGamePreference[choice] = (historicalPatterns.lateGamePreference[choice] || 0) + 1
            }
            
            // Response to betrayal (look at choices after AI betrayal)
            if (roundNum > 1 && game.players.ai.choices[roundNum - 1].choice === ChoiceType.BETRAY) {
              historicalPatterns.responseToBetrayal[choice] = (historicalPatterns.responseToBetrayal[choice] || 0) + 1
            }
          })
          
          // Track choices that led to wins
          if (game.players[userId].score > game.players.ai.score) {
            Object.values(game.players[userId].choices).forEach(data => {
              historicalPatterns.winningChoices[data.choice] = (historicalPatterns.winningChoices[data.choice] || 0) + 1
            })
          }
        })
      }
  
      // Calculate base probabilities using historical data
      let probabilities = {
        [ChoiceType.COOPERATE]: 0.33,
        [ChoiceType.NEGOTIATE]: 0.33,
        [ChoiceType.BETRAY]: 0.34
      }
  
      if (historicalPatterns.totalGames > 0) {
        // Pure random choice (20% chance regardless of history)
        if (Math.random() > 0.8) {
          return [ChoiceType.COOPERATE, ChoiceType.NEGOTIATE, ChoiceType.BETRAY][Math.floor(Math.random() * 3)]
        }
  
        // Adjust based on historical patterns
        const totalChoices = Object.values(historicalPatterns.choiceFrequency).reduce((a, b) => a + b, 0)
        
        // Counter most frequent choice
        const mostFrequentChoice = Object.entries(historicalPatterns.choiceFrequency)
          .sort(([,a], [,b]) => b - a)[0][0]
          
        if (roundId <= 2) {
          // Early game - consider early game patterns
          const earlyGameTotal = Object.values(historicalPatterns.earlyGamePreference).reduce((a, b) => a + b, 0)
          if (earlyGameTotal > 0) {
            Object.entries(historicalPatterns.earlyGamePreference).forEach(([choice, count]) => {
              // Counter their early game preference
              const counterChoice = getCounterChoice(choice)
              probabilities[counterChoice] += 0.2
            })
          }
        } else if (roundId >= 4) {
          // Late game - use late game patterns
          const lateGameTotal = Object.values(historicalPatterns.lateGamePreference).reduce((a, b) => a + b, 0)
          if (lateGameTotal > 0) {
            Object.entries(historicalPatterns.lateGamePreference).forEach(([choice, count]) => {
              // Counter their late game preference
              const counterChoice = getCounterChoice(choice)
              probabilities[counterChoice] += 0.2
            })
          }
        }
  
        // Consider their common responses to betrayal
        if (gameData.players.ai.choices?.[roundId - 1]?.choice === ChoiceType.BETRAY) {
          const totalResponses = Object.values(historicalPatterns.responseToBetrayal).reduce((a, b) => a + b, 0)
          if (totalResponses > 0) {
            const expectedResponse = Object.entries(historicalPatterns.responseToBetrayal)
              .sort(([,a], [,b]) => b - a)[0][0]
            const counterResponse = getCounterChoice(expectedResponse)
            probabilities[counterResponse] += 0.15
          }
        }
  
        // Add score-based strategy
        const aiScore = gameData.players.ai?.score || 0
        if (roundId === 5) { // Final round
          if (aiScore < 10) { // Low score - high risk
            probabilities[ChoiceType.BETRAY] += 0.2
          } else { // Good score - more balanced
            probabilities[ChoiceType.NEGOTIATE] += 0.1
          }
        }
      }
  
      // Add round-based unpredictability
      const randomFactor = Math.random() * 0.2
      Object.keys(probabilities).forEach(key => {
        probabilities[key] = Math.max(0.1, probabilities[key] + (Math.random() > 0.5 ? randomFactor : -randomFactor))
      })
  
      // Normalize probabilities
      const total = Object.values(probabilities).reduce((a, b) => a + b, 0)
      Object.keys(probabilities).forEach(key => {
        probabilities[key] = probabilities[key] / total
      })
  
      // Make final choice
      const random = Math.random()
      let cumulativeProbability = 0
      
      for (const [choice, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability
        if (random <= cumulativeProbability) {
          return choice
        }
      }
  
      // Random fallback
      return [ChoiceType.COOPERATE, ChoiceType.NEGOTIATE, ChoiceType.BETRAY][Math.floor(Math.random() * 3)]
    } catch (err) {
      console.error('Error analyzing historical data:', err)
      // Fallback to basic strategy if history analysis fails
      return [ChoiceType.COOPERATE, ChoiceType.NEGOTIATE, ChoiceType.BETRAY][Math.floor(Math.random() * 3)]
    }
  }
  
  // Helper function to determine counter choices
  const getCounterChoice = (choice) => {
    switch(choice) {
      case ChoiceType.COOPERATE:
        return ChoiceType.BETRAY // Counter cooperation with betrayal
      case ChoiceType.NEGOTIATE:
        return ChoiceType.BETRAY // Counter negotiation with betrayal
      case ChoiceType.BETRAY:
        return ChoiceType.NEGOTIATE // Counter betrayal with negotiation
      default:
        return ChoiceType.NEGOTIATE
    }
  }

  const determineOutcome = (playerChoice, aiChoice, roundData, diceInfo) => {
    // Point matrix for all possible combinations
    const pointMatrix = {
      [ChoiceType.COOPERATE]: {
        [ChoiceType.COOPERATE]: { 
          outcome: 'bothCooperate',
          playerPoints: 3, 
          aiPoints: 3,
          dmPoints: 0,
          narrative: "Trust prevails as both parties honor their commitments."
        },
        [ChoiceType.NEGOTIATE]: { 
          outcome: 'cooperateNegotiate',
          playerPoints: 2, 
          aiPoints: 3, 
          dmPoints: 1,
          narrative: "While you maintain full trust, they seek middle ground."
        },
        [ChoiceType.BETRAY]: { 
          outcome: 'betrayed',
          playerPoints: 0, 
          aiPoints: 5,
          dmPoints: 2,
          narrative: "Your trust is betrayed completely."
        }
      },
      [ChoiceType.NEGOTIATE]: {
        [ChoiceType.COOPERATE]: { 
          outcome: 'cooperateNegotiate',
          playerPoints: 3, 
          aiPoints: 2, 
          dmPoints: 1,
          narrative: "Your cautious approach meets their full cooperation."
        },
        [ChoiceType.NEGOTIATE]: { 
          outcome: 'bothNegotiate',
          playerPoints: 4, 
          aiPoints: 4, 
          dmPoints: 1,
          narrative: "A careful dance of compromise leads to mutual benefit."
        },
        [ChoiceType.BETRAY]: { 
          outcome: 'negotiateBetray',
          playerPoints: 1, 
          aiPoints: 4, 
          dmPoints: 2,
          narrative: "Your cautious approach minimizes the impact of their betrayal."
        }
      },
      [ChoiceType.BETRAY]: {
        [ChoiceType.COOPERATE]: { 
          outcome: 'successfulBetray',
          playerPoints: 5, 
          aiPoints: 0, 
          dmPoints: 2,
          narrative: "Your betrayal catches them completely off guard."
        },
        [ChoiceType.NEGOTIATE]: { 
          outcome: 'partialBetrayal',
          playerPoints: 4, 
          aiPoints: 1, 
          dmPoints: 2,
          narrative: "Your betrayal succeeds, though their caution lessens the impact."
        },
        [ChoiceType.BETRAY]: { 
          outcome: 'bothBetray',
          playerPoints: 1, 
          aiPoints: 1, 
          dmPoints: 3,
          narrative: "Mutual betrayal leaves both parties weakened."
        }
      }
    }
  
    // Get base outcome from matrix
    const baseOutcome = pointMatrix[playerChoice][aiChoice]
    if (!baseOutcome) {
      console.error('Invalid choice combination:', { playerChoice, aiChoice });
      throw new Error('Invalid choice combination');
    }
  
    // Calculate dice bonus points
    let diceBonus = 0;
    let diceNarrative = '';
    const dcCheck = roundData.skillCheck?.dcCheck || 7;
  
    // Critical success (rolling 12)
    if (diceInfo.diceRoll === 12) {
      diceBonus = 1;
      diceNarrative = ' Your exceptional skill adds to your success! (+1)';
    }
    // Critical failure (rolling 2)
    else if (diceInfo.diceRoll === 2) {
      diceBonus = -1;
      diceNarrative = ' Your mistake costs you dearly. (-1)';
    }
    // Normal success (meeting or exceeding DC)
    else if (diceInfo.finalResult >= dcCheck) {
      diceBonus = 0.5;
      diceNarrative = ' Your competence provides a small advantage. (+0.5)';
    }
    // Normal failure (below DC)
    else {
      diceBonus = 0;
      diceNarrative = ' Your struggle yields no additional benefit.';
    }
  
    // Add negotiation bonuses
    if (playerChoice === ChoiceType.NEGOTIATE) {
      // Successful negotiation provides intelligence
      if (diceInfo.finalResult >= dcCheck) {
        diceNarrative += ' Your careful negotiation reveals hints about their intentions.';
      }
      
      // Negotiation provides some protection against betrayal
      if (aiChoice === ChoiceType.BETRAY) {
        diceBonus += 0.5;
        diceNarrative += ' Your cautious approach earns you an extra advantage. (+0.5)';
      }
    }
  
    // Calculate final points (rounded to nearest whole number)
    const finalPlayerPoints = Math.round(baseOutcome.playerPoints + diceBonus);
  
    // Calculate final outcome
    const finalOutcome = {
      type: baseOutcome.outcome,
      playerPoints: Math.max(0, finalPlayerPoints), // Ensure points don't go negative
      aiPoints: baseOutcome.aiPoints,  // AI points stay constant
      dmPoints: baseOutcome.dmPoints,
      narrative: baseOutcome.narrative + diceNarrative,
      playerChoice,
      aiChoice,
      diceRoll: diceInfo,
      diceBonus: diceBonus
    }
  
    return finalOutcome;
  }



// Helper function to ensure safe values for Firebase
const ensureSafeValue = (value, fallback = '') => {
  return value === undefined || value === null ? fallback : value
}

  // Computed properties for game state
  const gameStatus = computed(() => currentGame.value?.status || 'inactive')
  const currentRound = computed(() => {
    if (!currentGame.value?.scenario?.rounds) return null
    return currentGame.value.scenario.rounds.find(
      round => round.id === currentGame.value.currentRound
    )
  })

  return {
    // State
    currentGame,
    error,
    loading,
    playerGames,
    loadingGames,
    roundOutcome,
    
    // Computed
    gameStatus,
    currentRound,
    
    // Methods
    createNewGame,
    fetchGame,
    fetchPlayerGames,
    makeChoice,
    cleanupGameListener,
  }
}