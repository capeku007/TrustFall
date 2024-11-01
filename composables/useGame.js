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
      dmPoints: 0,
      rounds: [
        {
          id: 1,
          title: 'The Underground Meeting',
          description: 'In a dimly lit basement of The Rusty Anchor tavern, you and your partner plan a major heist.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 12
          },
          choices: {
            cooperate: {
              text: 'Honor the Partnership',
              description: 'Stay true to your original plan',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Accept the Private Offer',
              description: 'Sign the separate deal',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 2,
          title: 'The Vault',
          description: 'An unexpected vault appears during the operation, containing evidence that could incriminate either of you.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 13
          },
          choices: {
            cooperate: {
              text: 'Destroy All Evidence',
              description: 'Ensure both parties\' safety',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Secure Leverage',
              description: 'Keep evidence against your partner',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 3,
          title: 'The Escape',
          description: 'The authorities are closing in, and separate escape routes become available.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 14
          },
          choices: {
            cooperate: {
              text: 'Stick Together',
              description: 'Escape using the original plan',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Take the Private Exit',
              description: 'Accept the individual escape offer',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 4,
          title: 'The Investigation',
          description: 'A mole is discovered in your operation, and suspicion falls on both of you.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 15
          },
          choices: {
            cooperate: {
              text: 'Maintain Solidarity',
              description: 'Refuse to play the blame game',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Offer Evidence',
              description: 'Provide information about your partner',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 5,
          title: 'The Final Score',
          description: 'A legendary opportunity presents itself, but only one can claim it.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 16
          },
          choices: {
            cooperate: {
              text: 'Share the Opportunity',
              description: 'Propose a joint venture',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Claim the Prize',
              description: 'Take the opportunity for yourself',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        }
      ]
    },
    {
      id: 'rico-investigation',
      title: 'Operation Paper Trail',
      description: 'As an undercover agent investigating a powerful criminal enterprise, you must gather evidence while maintaining your cover. Your handler might be compromised, and every choice could expose your true identity.',
      image: '/scenarios/rico-investigation.jpg',
      dmPoints: 0,
      rounds: [
        {
          id: 1,
          title: 'The Introduction',
          description: 'You\'ve infiltrated a suspected criminal enterprise as a financial consultant. Your handler has arranged a meeting with the organization\'s leadership.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 13
          },
          choices: {
            cooperate: {
              text: 'Follow Protocol',
              description: 'Stick to your cover story and established procedures',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Go Off Script',
              description: 'Improvise to gain their trust faster',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 2,
          title: 'The Paper Trail',
          description: 'You\'ve discovered irregularities in the organization\'s financial records. Your handler wants immediate documentation, but the organization\'s CFO is watching you closely.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 14
          },
          choices: {
            cooperate: {
              text: 'Build Trust First',
              description: 'Take time to establish credibility before accessing sensitive documents',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Seize the Opportunity',
              description: 'Risk copying the documents immediately',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 3,
          title: 'The Double Cross',
          description: 'Your handler misses a scheduled check-in. The organization offers you a legitimate position with substantial benefits.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 15
          },
          choices: {
            cooperate: {
              text: 'Maintain Cover',
              description: 'Continue the investigation despite radio silence',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Consider the Offer',
              description: 'Explore what the organization is really proposing',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 4,
          title: 'The Exposure',
          description: 'Another undercover agent has been discovered. The organization is conducting internal investigations.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 16
          },
          choices: {
            cooperate: {
              text: 'Stand Firm',
              description: 'Maintain your cover story under intense scrutiny',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Shift Suspicion',
              description: 'Implicate others to protect yourself',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
                }
              }
            }
          }
        },
        {
          id: 5,
          title: 'The Takedown',
          description: 'The RICO case is ready, but the organization\'s leader offers evidence of corruption within law enforcement.',
          skillCheck: {
            name: 'Deception',
            dcCheck: 17
          },
          choices: {
            cooperate: {
              text: 'Execute the Raid',
              description: 'Proceed with the planned operation',
              outcomes: {
                bothCooperate: {
                  playerPoints: 3,
                  dmPoints: 0
                },
                betrayed: {
                  playerPoints: 0,
                  dmPoints: 2
                }
              }
            },
            betray: {
              text: 'Investigate Corruption',
              description: 'Delay the raid to expose potential internal corruption',
              outcomes: {
                successful: {
                  playerPoints: 5,
                  dmPoints: 2
                },
                bothBetray: {
                  playerPoints: 1,
                  dmPoints: 3
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
  
      // Generate initial narration for first round
      const narrativeGenerator = useNarrativeGenerator();
      const initialNarration = narrativeGenerator.generateDMNarration({ roundNumber: 1 });
  
      // Create a deep copy of the scenario and inject the initial narration
      const gameScenario = JSON.parse(JSON.stringify(scenario));
      gameScenario.rounds[0].dmNarration = initialNarration;
  
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
        scenario: gameScenario
      };
  
      const gamesRef = dbRef(database, 'games');
      const newGameRef = push(gamesRef);
      
      await set(newGameRef, gameData);
      setupGameListener(newGameRef.key);
  
      return {
        id: newGameRef.key,
        ...gameData
      };
  
    } catch (err) {
      error.value = err.message;
      console.error('Error creating game:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  

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
  
      // Get previous choices and game history
      const previousChoices = gameData.players[auth.currentUser.uid]?.choices || {}
      const aiChoices = gameData.players.ai?.choices || {}
      
      // Generate AI's choice
      const aiChoice = generateAiChoice(gameData, roundId)
  
      // Calculate base outcome
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
  
      // Calculate consequences
      const newConsequences = consequenceManager.generateConsequence(choice, diceInfo, baseOutcome)
  
      // Prepare the base updates object
      const updates = {
        [`players/${auth.currentUser.uid}/choices/${roundId}`]: {
          choice: choice || 'cooperate',
          diceRoll: diceInfo?.diceRoll || 10,
          finalResult: diceInfo?.finalResult || 10,
          modifier: diceInfo?.modifier || 0,
          timestamp: Date.now(),
          outcome: {
            pointMultiplier: pointMultiplier,
            points: finalPlayerPoints
          }
        },
        [`players/${auth.currentUser.uid}/score`]: 
          (gameData.players[auth.currentUser.uid]?.score || 0) + finalPlayerPoints,
  
        [`players/ai/choices/${roundId}`]: {
          choice: aiChoice,
          timestamp: Date.now(),
          outcome: {
            points: finalAiPoints
          }
        },
        [`players/ai/score`]: 
          (gameData.players.ai?.score || 0) + finalAiPoints,
  
        dmPoints: (gameData.dmPoints || 0) + finalDmPoints,
        currentRoundStatus: 'completed'
      }
  
      // Add consequences if any
      if (newConsequences && newConsequences.length > 0) {
        updates.consequences = {
          ...gameData.consequences,
          [roundId]: newConsequences.map(c => ({
            type: c.type || 'neutral',
            description: c.description || 'The round ends.',
            duration: c.duration || 1,
            modifier: c.modifier || 0
          }))
        }
      }
  
      // Handle next round narration if not final round
      if (roundId < 5) {
        const narrativeGenerator = useNarrativeGenerator()
        let nextRoundNarration = [
          "The game continues...",
          "Your choices echo through the shadows..."
        ]
  
        try {
          const generatedNarration = await narrativeGenerator.generateDMNarration({
            roundNumber: roundId + 1,
            scenarioId: gameData.scenarioId,
            previousChoices,
            lastRoundChoice: {
              playerChoice: choice,
              aiChoice: aiChoice
            },
            playerHistory: {
              ...previousChoices,
              [roundId]: { choice }
            },
            aiHistory: {
              ...aiChoices,
              [roundId]: { choice: aiChoice }
            }
          })
  
          if (Array.isArray(generatedNarration) && generatedNarration.length > 0) {
            nextRoundNarration = generatedNarration
          }
        } catch (err) {
          console.error('Narration generation error:', err)
          // Keep default narration
        }
  
        // Store narration in a dedicated path
        updates[`narration/${roundId + 1}`] = nextRoundNarration
        updates.currentRound = roundId + 1
      } else {
        // Final round updates
        updates.currentRound = 6
        updates.status = 'completed'
        updates.completedAt = Date.now()
        updates.finalOutcome = {
          playerScore: (gameData.players[auth.currentUser.uid]?.score || 0) + finalPlayerPoints,
          aiScore: (gameData.players.ai?.score || 0) + finalAiPoints,
          dmScore: (gameData.dmPoints || 0) + finalDmPoints,
          finalConsequences: newConsequences || []
        }
      }
  
      // Batch update all changes
      await update(gameRef, updates)
  
      // Store outcome for UI
      roundOutcome.value = {
        narrative: baseOutcome.narrative || "The round concludes...",
        playerPoints: finalPlayerPoints,
        aiPoints: finalAiPoints,
        dmPoints: finalDmPoints,
        pointMultiplier,
        playerChoice: choice,
        aiChoice,
        consequences: newConsequences || []
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
    
    // Constants
    scenarios
  }
}