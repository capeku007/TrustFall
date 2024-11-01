// composables/useGame.js
import { ref, computed } from 'vue'
import { useFirebase } from './useFirebase'
import { ref as dbRef, push, set, get, child, onValue, update } from 'firebase/database'
import { query, orderByChild, equalTo } from 'firebase/database'
import { useAIDialogue } from './useAIDialogue'
const ConsequenceType = {
  LOYALTY: 'loyalty',
  BETRAYAL: 'betrayal',
  DECEPTION: 'deception',
  FAILURE: 'failure',
  CRITICAL_SUCCESS: 'critical_success',
  CRITICAL_FAILURE: 'critical_failure'
}

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
    if (diceInfo.finalResult < (diceInfo.dcCheck || 10)) {
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

// Create singleton instances for game state
const currentGame = ref(null)
const error = ref(null)
const loading = ref(false)
const playerGames = ref([])
const loadingGames = ref(false)
const roundOutcome = ref(null)
const { generateDMNarration, generateOutcomeNarrative } = useAIDialogue()
let gameListener = null

export const useGame = () => {
  const { database, auth } = useFirebase()

  const scenarios = [
    {
      id: 'shadow-syndicate',
      title: 'The Shadow Syndicate',
      description: 'A tale of intrigue in the criminal underworld where trust is currency and betrayal is always profitable... for someone.',
      image: '/scenarios/shadow-syndicate.jpg',
      dmPoints: 0, // Track Dungeon Master's points
      rounds: [
        {
          id: 1,
          title: 'The Underground Meeting',
          description: 'In a dimly lit basement of The Rusty Anchor tavern, you and your partner plan a major heist. The Dungeon Master, playing as a mysterious crime lord, offers each of you a separate deal.',
          dmNarration: [
            "The air is thick with pipe smoke and distrust. I slide two identical contracts across the table, one to each of you.",
            "Remember, what you discuss here might not reflect what happens in private...",
            "The question is: do you trust your partner more than you trust my offer?"
          ],
          choices: {
            cooperate: {
              text: 'Honor the Partnership',
              description: 'Stay true to your original plan',
              outcomes: {
                bothCooperate: {
                  narrative: "You both nod silently, burning the crime lord's contracts. Your mutual trust strengthens.",
                  playerPoints: 3,
                  dmPoints: 0,
                  consequence: "Your reputation for loyalty spreads in the underworld."
                },
                betrayed: {
                  narrative: "Your partner's signature on the crime lord's contract seals your fate.",
                  playerPoints: 0,
                  dmPoints: 2,
                  consequence: "You lose access to certain black market contacts."
                }
              }
            },
            betray: {
              text: 'Accept the Crime Lord\'s Offer',
              description: 'Sign the private contract',
              outcomes: {
                successful: {
                  narrative: "You smile as your partner's loyalty becomes their downfall.",
                  playerPoints: 5,
                  dmPoints: 2,
                  consequence: "Gain a powerful ally, but others will hear of your betrayal."
                },
                bothBetray: {
                  narrative: "You both signed the contracts. The crime lord laughs, having played you against each other.",
                  playerPoints: 1,
                  dmPoints: 3,
                  consequence: "Your reputation suffers in the criminal underworld."
                }
              }
            }
          }
        },
        {
          id: 2,
          title: 'The Heist',
          description: 'During the operation, an unexpected vault appears. The Dungeon Master reveals it contains evidence that could incriminate either of you.',
          dmNarration: [
            "Behind this vault door lies more than gold...",
            "There's enough evidence to send one of you away for a long time.",
            "Question is: who gets to decide which evidence makes it out?"
          ],
          choices: {
            cooperate: {
              text: 'Destroy All Evidence',
              description: 'Ensure both parties\' safety',
              outcomes: {
                bothCooperate: {
                  narrative: "Together, you ensure all traces of both your involvements disappear.",
                  playerPoints: 3,
                  dmPoints: 0,
                  consequence: "Your partnership becomes legendary in criminal circles."
                },
                betrayed: {
                  narrative: "While you burn your partner's evidence, they pocket yours.",
                  playerPoints: 0,
                  dmPoints: 2,
                  consequence: "You're now vulnerable to blackmail."
                }
              }
            },
            betray: {
              text: 'Secure Leverage',
              description: 'Keep evidence against your partner',
              outcomes: {
                successful: {
                  narrative: "You pocket the evidence while they trustingly destroy theirs.",
                  playerPoints: 5,
                  dmPoints: 2,
                  consequence: "Gain powerful leverage, but word of your treachery spreads."
                },
                bothBetray: {
                  narrative: "You both scramble for evidence, ultimately ensuring mutual destruction.",
                  playerPoints: 1,
                  dmPoints: 3,
                  consequence: "Both of you become vulnerable to future manipulation."
                }
              }
            }
          }
        },
        {
          id: 3,
          title: 'The Escape',
          description: 'The authorities are closing in. The Dungeon Master offers each of you a separate escape route, but there\'s a catch.',
          dmNarration: [
            "I can offer each of you a guaranteed escape...",
            "But the price might be more than you're willing to pay.",
            "Sometimes survival means making difficult choices."
          ],
          choices: {
            cooperate: {
              text: 'Stick Together',
              description: 'Escape using the original plan',
              outcomes: {
                bothCooperate: {
                  narrative: "Working together, you execute a flawless escape.",
                  playerPoints: 3,
                  dmPoints: 0,
                  consequence: "Your teamwork becomes stuff of legend."
                },
                betrayed: {
                  narrative: "Your partner takes the escape route, leaving you to face the authorities.",
                  playerPoints: 0,
                  dmPoints: 2,
                  consequence: "Your loyalty becomes a cautionary tale."
                }
              }
            },
            betray: {
              text: 'Take the Private Exit',
              description: 'Accept the individual escape offer',
              outcomes: {
                successful: {
                  narrative: "You slip away while your partner faces the consequences.",
                  playerPoints: 5,
                  dmPoints: 2,
                  consequence: "Gain notoriety, but lose underworld respect."
                },
                bothBetray: {
                  narrative: "In the chaos of separate escapes, both plans fall apart.",
                  playerPoints: 1,
                  dmPoints: 3,
                  consequence: "Neither escape route works as promised."
                }
              }
            }
          }
        },
        {
          id: 4,
          title: 'The Aftermath',
          description: 'Tensions rise as the Dungeon Master reveals there\'s a mole in your operation. One of you must be cleared.',
          dmNarration: [
            "Someone talked. The question is who...",
            "I have ways of finding out, but loyalty has its price.",
            "Will you trust your partner, or protect yourself?"
          ],
          choices: {
            cooperate: {
              text: 'Maintain Solidarity',
              description: 'Refuse to play the blame game',
              outcomes: {
                bothCooperate: {
                  narrative: "Your united front crumbles the investigation.",
                  playerPoints: 3,
                  dmPoints: 0,
                  consequence: "Your loyalty earns respect from all sides."
                },
                betrayed: {
                  narrative: "Your partner's testimony seals your fate as the fall guy.",
                  playerPoints: 0,
                  dmPoints: 2,
                  consequence: "Your reputation is permanently damaged."
                }
              }
            },
            betray: {
              text: 'Offer Evidence',
              description: 'Provide information about your partner',
              outcomes: {
                successful: {
                  narrative: "Your partner's loyalty becomes their undoing.",
                  playerPoints: 5,
                  dmPoints: 2,
                  consequence: "Clear your name, but become known as an informant."
                },
                bothBetray: {
                  narrative: "Your mutual accusations destroy any credibility either of you had.",
                  playerPoints: 1,
                  dmPoints: 3,
                  consequence: "Both of you lose standing in the criminal world."
                }
              }
            }
          }
        },
        {
          id: 5,
          title: 'The Final Deal',
          description: 'The Dungeon Master offers a chance at a legendary score, but only one of you can claim it.',
          dmNarration: [
            "This is the big one. The score of a lifetime...",
            "But there's only room for one at the top.",
            "The question is: how much is loyalty worth?"
          ],
          choices: {
            cooperate: {
              text: 'Share the Opportunity',
              description: 'Propose a joint venture',
              outcomes: {
                bothCooperate: {
                  narrative: "Together, you turn the opportunity into an even bigger score.",
                  playerPoints: 3,
                  dmPoints: 0,
                  consequence: "Your partnership becomes the stuff of legend."
                },
                betrayed: {
                  narrative: "Your partner claims the score, leaving you with nothing.",
                  playerPoints: 0,
                  dmPoints: 2,
                  consequence: "Your generosity becomes a warning to others."
                }
              }
            },
            betray: {
              text: 'Claim the Prize',
              description: 'Take the opportunity for yourself',
              outcomes: {
                successful: {
                  narrative: "You secure the score while your partner is left empty-handed.",
                  playerPoints: 5,
                  dmPoints: 2,
                  consequence: "Gain immense wealth, but become universally distrusted."
                },
                bothBetray: {
                  narrative: "Your mutual greed causes the opportunity to slip through your fingers.",
                  playerPoints: 1,
                  dmPoints: 3,
                  consequence: "The legendary score is lost to both of you."
                }
              }
            }
          }
        }
      ]
    }
  ];

  // Validate database connection
  const validateDatabaseConnection = () => {
    if (!database) {
      throw new Error('Database connection not established')
    }
    return true
  }

  // Clean up game listener
  const cleanupGameListener = () => {
    if (gameListener) {
      gameListener()
      gameListener = null
      currentGame.value = null
      roundOutcome.value = null
    }
  }

  // Set up game listener with error handling
  const setupGameListener = (gameId) => {
    cleanupGameListener()
  
    try {
      const gameRef = dbRef(database, `games/${gameId}`)
      gameListener = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          currentGame.value = {
            id: gameId,
            ...data
          }
        } else {
          console.error('Game not found in listener')
        }
      }, (error) => {
        console.error('Game listener error:', error)
      })
    } catch (err) {
      console.error('Error setting up game listener:', err)
    }
  }

  // Create new game with enhanced structure
  const createNewGame = async (scenarioId) => {
    loading.value = true
    error.value = null

    try {
      validateDatabaseConnection()

      if (!auth.currentUser) {
        throw new Error('User must be authenticated')
      }
      
      const scenario = scenarios.find(s => s.id === scenarioId)
      if (!scenario) {
        throw new Error('Invalid scenario')
      }

      const gameData = {
        scenarioId,
        createdAt: Date.now(),
        status: 'active',
        currentRound: 1,
        userId: auth.currentUser.uid,
        dmPoints: 0,
        consequences: {},
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
        scenario
      }

      const gamesRef = dbRef(database, 'games')
      const newGameRef = push(gamesRef)
      
      await set(newGameRef, gameData)
      setupGameListener(newGameRef.key)

      return {
        id: newGameRef.key,
        ...gameData
      }

    } catch (err) {
      error.value = err.message
      console.error('Error creating game:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

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
  const generateAiChoice = (gameData, roundId) => {
    const playerHistory = gameData.players[auth.currentUser.uid].choices || {}
    const aiHistory = gameData.players.ai.choices || {}
    
    // Calculate betrayal tendencies
    const calculateBetrayalRatio = (history) => {
      const choices = Object.values(history)
      const betrayals = choices.filter(c => c === 'betray').length
      return choices.length > 0 ? betrayals / choices.length : 0
    }
    
    const playerBetrayalRatio = calculateBetrayalRatio(playerHistory)
    
    // Dynamic AI behavior
    const baseBetrayalChance = 0.3
    const historyInfluence = playerBetrayalRatio * 0.3
    const roundInfluence = (roundId / 5) * 0.2
    const randomFactor = Math.random() * 0.2
    
    const betrayalChance = baseBetrayalChance + historyInfluence + roundInfluence + randomFactor
    
    return Math.random() < betrayalChance ? 'betray' : 'cooperate'
  }

  const determineOutcome = (playerChoice, aiChoice, roundData, diceInfo) => {
    const choices = roundData.choices[playerChoice]
    let outcome
    
    // Base outcome determination
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
      outcome = choices.outcomes.bothCooperate
    } else if (playerChoice === 'cooperate' && aiChoice === 'betray') {
      outcome = choices.outcomes.betrayed
    } else if (playerChoice === 'betray' && aiChoice === 'cooperate') {
      outcome = choices.outcomes.successful
    } else {
      outcome = choices.outcomes.bothBetray
    }
  
    // Apply dice roll modifiers
    let pointMultiplier = 1
    let additionalNarrative = ''
  
    if (diceInfo.diceRoll === 20) {
      // Critical success
      pointMultiplier = 2
      additionalNarrative = ' Your exceptional skill turns the tide dramatically!'
    } else if (diceInfo.diceRoll === 1) {
      // Critical failure
      pointMultiplier = 0.5
      additionalNarrative = ' Your attempt spectacularly backfires!'
    } else if (diceInfo.finalResult >= (roundData.dcCheck || 10)) {
      // Normal success
      pointMultiplier = 1.5
      additionalNarrative = ' Your expertise improves the outcome.'
    } else {
      // Normal failure
      pointMultiplier = 0.75
      additionalNarrative = ' The situation proves more challenging than expected.'
    }
    
    return {
      ...outcome,
      playerChoice,
      aiChoice,
      narrative: outcome.narrative + additionalNarrative,
      playerPoints: Math.floor(outcome.playerPoints * pointMultiplier),
      diceRoll: diceInfo
    }
  }


  // Enhanced choice making with narrative outcomes
// Helper function to ensure safe values for Firebase
const ensureSafeValue = (value, fallback = '') => {
  return value === undefined || value === null ? fallback : value
}

const makeChoice = async (gameId, roundId, choice, diceInfo) => {
  loading.value = true
  error.value = null
  roundOutcome.value = null

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

    // Get current round data
    const currentRound = gameData.scenario.rounds.find(r => r.id === roundId)
    if (!currentRound) {
      throw new Error('Round not found')
    }

    // Generate AI's choice
    const aiChoice = generateAiChoice(gameData, roundId)

    // Calculate base outcome first (this is our fallback narrative source)
    const baseOutcome = determineOutcome(
      choice, 
      aiChoice, 
      currentRound, 
      diceInfo || { diceRoll: 10, finalResult: 10 }
    )

    // Calculate final points
    const pointMultiplier = (diceInfo?.finalResult >= (currentRound.dcCheck || 10)) ? 1.5 : 0.75
    const finalPlayerPoints = Math.floor((baseOutcome.playerPoints || 0) * pointMultiplier)
    const finalAiPoints = aiChoice === 'betray' ? 2 : 0
    const finalDmPoints = baseOutcome.dmPoints || 0

    // Ensure we have a narrative either from baseOutcome or a fallback
    let outcomeNarrative = ensureSafeValue(
      baseOutcome.narrative,
      "Your choice leads to an uncertain outcome..."
    )

    try {
      // Try to get AI-generated narrative
      const narrativeContext = {
        roundNumber: roundId,
        roundTheme: currentRound.title,
        playerChoice: choice,
        aiChoice,
        diceRoll: diceInfo?.diceRoll || 10,
        finalResult: diceInfo?.finalResult || 10,
        rollSuccess: (diceInfo?.finalResult || 10) >= (currentRound.dcCheck || 10),
        consequences: [],
        previousNarrative: gameData.lastNarrative || '',
        playerHistory: gameData.players[auth.currentUser.uid].choices || {}
      }

      const generatedNarrative = await generateOutcomeNarrative(narrativeContext)
      if (generatedNarrative) {
        outcomeNarrative = generatedNarrative
      }
    } catch (err) {
      console.error('Narrative generation failed, using base outcome:', err)
      // We already have a fallback narrative, so we can continue
    }

    // Prepare safe updates object
    const updates = {
      [`players/${auth.currentUser.uid}/choices/${roundId}`]: {
        choice: ensureSafeValue(choice, 'cooperate'),
        diceRoll: ensureSafeValue(diceInfo?.diceRoll, 10),
        finalResult: ensureSafeValue(diceInfo?.finalResult, 10),
        modifier: ensureSafeValue(diceInfo?.modifier, 0),
        outcome: {
          narrative: outcomeNarrative,
          pointMultiplier: ensureSafeValue(pointMultiplier, 1)
        }
      },
      [`players/${auth.currentUser.uid}/score`]: 
        ensureSafeValue(gameData.players[auth.currentUser.uid]?.score, 0) + finalPlayerPoints,

      [`players/ai/choices/${roundId}`]: {
        choice: ensureSafeValue(aiChoice, 'cooperate'),
        outcome: {
          points: ensureSafeValue(finalAiPoints, 0)
        }
      },
      [`players/ai/score`]: 
        ensureSafeValue(gameData.players.ai?.score, 0) + finalAiPoints,

      dmPoints: ensureSafeValue(gameData.dmPoints, 0) + finalDmPoints,
      lastNarrative: outcomeNarrative,
      currentRoundStatus: 'completed'
    }

    // Update round or complete game
    if (roundId === 5) {
      updates.currentRound = 6
      updates.status = 'completed'
      updates.completedAt = Date.now()
      updates.finalOutcome = {
        playerScore: ensureSafeValue(gameData.players[auth.currentUser.uid]?.score, 0) + finalPlayerPoints,
        aiScore: ensureSafeValue(gameData.players.ai?.score, 0) + finalAiPoints,
        dmScore: ensureSafeValue(gameData.dmPoints, 0) + finalDmPoints
      }
    } else {
      updates.currentRound = roundId + 1
    }

    // Try to get next round narration if not final round
    if (roundId < 5) {
      const nextRound = gameData.scenario.rounds.find(r => r.id === roundId + 1)
      if (nextRound) {
        try {
          const narrationContext = {
            roundNumber: roundId + 1,
            roundTheme: nextRound.title,
            previousChoice: choice,
            diceResult: diceInfo?.diceRoll || 10
          }

          const nextNarration = await generateDMNarration(narrationContext)
          if (nextNarration && Array.isArray(nextNarration) && nextNarration.length > 0) {
            updates[`scenario/rounds/${roundId + 1}/dmNarration`] = nextNarration
          }
        } catch (err) {
          console.error('Failed to generate next round narration:', err)
          // Continue without next round narration
        }
      }
    }

    // Batch update all changes
    await update(gameRef, updates)

    // Store outcome for UI
    roundOutcome.value = {
      narrative: outcomeNarrative,
      playerPoints: finalPlayerPoints,
      aiPoints: finalAiPoints,
      dmPoints: finalDmPoints,
      pointMultiplier,
      playerChoice: choice,
      aiChoice
    }

    return {
      outcome: roundOutcome.value,
      gameState: currentGame.value
    }

  } catch (err) {
    error.value = err.message
    console.error('Error making choice:', err)
    throw err
  } finally {
    loading.value = false
  }
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
    
    // Constants
    scenarios
  }
}