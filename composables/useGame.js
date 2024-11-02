// composables/useGame.js
import { ref, computed } from 'vue'
import { useFirebase } from './useFirebase'
import { ref as dbRef, push, set, get, child, onValue, update } from 'firebase/database'
import { query, orderByChild, equalTo } from 'firebase/database'
import { useAIDialogue } from './useAIDialogue'
import { useAdaptiveDifficulty } from './useAdaptiveDifficulty'
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
            negotiate: {
              text: 'Propose Modifications',
              description: 'Suggest alterations to the plan',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Selective Protection',
              description: 'Propose handling evidence strategically',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Split and Regroup',
              description: 'Propose separate routes to a meeting point',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Limited Disclosure',
              description: 'Share partial information to deflect suspicion',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Partial Partnership',
              description: 'Propose a weighted split of rewards',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Test the Waters',
              description: 'Carefully probe for additional information while maintaining cover',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
              description: 'Take time to establish credibility before accessing documents',
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
            negotiate: {
              text: 'Selective Documentation',
              description: 'Gather key evidence while appearing to protect their interests',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Feigned Interest',
              description: 'Express interest while seeking information about your handler',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Limited Cooperation',
              description: 'Participate in the investigation while protecting yourself',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
            negotiate: {
              text: 'Parallel Investigation',
              description: 'Launch the raid while secretly documenting corruption',
              outcomes: {
                bothNegotiate: {
                  playerPoints: 4,
                  dmPoints: 1
                },
                betrayed: {
                  playerPoints: 1,
                  dmPoints: 2
                },
                successful: {
                  playerPoints: 3,
                  dmPoints: 1
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
  
      // Generate initial narration based on scenario
      const narrativeGenerator = useNarrativeGenerator()
      const initialNarration = await narrativeGenerator.generateDMNarration({
        roundNumber: 1,
        scenarioId: scenarioId,
        previousChoices: {},
        lastRoundChoice: null,
        playerHistory: {},
        aiHistory: {}
      })
  
      const gameData = {
        scenarioId,
        createdAt: Date.now(),
        status: 'active',
        currentRound: 1,
        userId: auth.currentUser.uid,
        dmPoints: 0,
        consequences: {},
        narration: {
          1: initialNarration // Store initial narration
        },
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
      throw new Error(`Invalid outcome combination: ${playerChoice} vs ${aiChoice}`)
    }
  
    // Calculate dice influence (scaled down from original)
    let pointMultiplier = 1
    let additionalNarrative = ''
  
    if (diceInfo.diceRoll === 20) {
      // Critical success - 25% bonus
      pointMultiplier = 1.25
      additionalNarrative = ' Your exceptional skill provides an edge!'
    } else if (diceInfo.diceRoll === 1) {
      // Critical failure - 25% penalty
      pointMultiplier = 0.75
      additionalNarrative = ' Your mistake costs you some advantage.'
    } else if (diceInfo.finalResult >= (roundData.dcCheck || 10)) {
      // Success - 10% bonus
      pointMultiplier = 1.1
      additionalNarrative = ' Your competence improves the outcome slightly.'
    } else {
      // Failure - 10% penalty
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
  
    // Calculate final outcome
    const finalOutcome = {
      type: baseOutcome.outcome,
      playerPoints: Math.floor(baseOutcome.playerPoints * pointMultiplier),
      aiPoints: baseOutcome.aiPoints,
      dmPoints: baseOutcome.dmPoints,
      narrative: baseOutcome.narrative + additionalNarrative,
      playerChoice,
      aiChoice,
      diceRoll: diceInfo
    }
  
    return finalOutcome
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
  
      // Calculate adaptive difficulty
      const adaptiveDifficulty = useAdaptiveDifficulty()
      const calculatedDC = adaptiveDifficulty.calculateDC(
        roundId,
        gameData.players[auth.currentUser.uid]?.choices || {},
        gameData.players[auth.currentUser.uid]?.choices?.[roundId - 1]?.diceRoll
      )
  
      // Update diceInfo with new DC
      const updatedDiceInfo = {
        ...diceInfo,
        dcCheck: calculatedDC,
        difficultyFeedback: adaptiveDifficulty.getDifficultyFeedback(calculatedDC),
        difficultyReasons: adaptiveDifficulty.getDifficultyExplanation(
          calculatedDC,
          roundId,
          gameData.players[auth.currentUser.uid]?.choices || {}
        )
      }
  
      // Generate AI's choice with enhanced context
      const aiChoice = generateAiChoice(gameData, roundId, {
        playerChoice: choice,
        diceResult: updatedDiceInfo,
        difficulty: calculatedDC
      })
  
      // Calculate base outcome with updated difficulty
      const baseOutcome = determineOutcome(
        choice,
        aiChoice,
        currentRound,
        updatedDiceInfo
      )
  
      // Apply difficulty-based modifiers to points
      let pointMultiplier = 1.0
      const isCriticalSuccess = updatedDiceInfo.diceRoll === 20
      const isCriticalFailure = updatedDiceInfo.diceRoll === 1
  
      if (isCriticalSuccess) {
        pointMultiplier = 1.25 // 25% bonus for critical success
      } else if (isCriticalFailure) {
        pointMultiplier = 0.5 // 50% penalty for critical failure
      } else if (updatedDiceInfo.finalResult >= calculatedDC) {
        pointMultiplier = 1.1 // 10% bonus for success
      } else {
        pointMultiplier = 0.75 // 25% penalty for failure
      }
  
      // Additional difficulty modifiers for betrayal attempts
      if (choice === 'betray') {
        const consecutiveBetrayals = Object.entries(gameData.players[auth.currentUser.uid]?.choices || {})
          .sort(([a], [b]) => b - a)
          .slice(0, 3)
          .filter(([_, data]) => data.choice === 'betray')
          .length
  
        if (consecutiveBetrayals > 0) {
          pointMultiplier *= Math.max(0.5, 1 - (consecutiveBetrayals * 0.15))
        }
      }
  
      // Calculate final points
      const finalPlayerPoints = Math.floor(baseOutcome.playerPoints * pointMultiplier)
      const finalAiPoints = baseOutcome.aiPoints
      const finalDmPoints = baseOutcome.dmPoints
  
      // Calculate consequences with difficulty context
      const newConsequences = consequenceManager.generateConsequence(
        choice,
        updatedDiceInfo,
        {
          ...baseOutcome,
          difficulty: calculatedDC,
          pointMultiplier
        }
      )
  
      // Update difficulty tracking
      adaptiveDifficulty.updateDifficulty(roundId, choice, updatedDiceInfo)
  
      // Prepare updates object
      const updates = {
        [`players/${auth.currentUser.uid}/choices/${roundId}`]: {
          choice: choice,
          diceRoll: updatedDiceInfo.diceRoll,
          finalResult: updatedDiceInfo.finalResult,
          difficulty: calculatedDC,
          timestamp: Date.now(),
          outcome: {
            pointMultiplier,
            points: finalPlayerPoints,
            difficultyFeedback: updatedDiceInfo.difficultyFeedback
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
            modifier: c.modifier || 0,
            difficulty: c.difficulty || 0
          }))
        }
      }
  
      // Generate narration for next round
      if (roundId < 5) {
        const narrativeGenerator = useNarrativeGenerator()
        let nextRoundNarration = []
  
        try {
          const generatedNarration = await narrativeGenerator.generateDMNarration({
            roundNumber: roundId + 1,
            scenarioId: gameData.scenarioId,
            previousChoices: gameData.players[auth.currentUser.uid]?.choices || {},
            lastRoundChoice: {
              playerChoice: choice,
              aiChoice,
              difficulty: calculatedDC,
              outcome: baseOutcome
            },
            playerHistory: {
              ...gameData.players[auth.currentUser.uid]?.choices,
              [roundId]: { choice, difficulty: calculatedDC }
            },
            aiHistory: {
              ...gameData.players.ai?.choices,
              [roundId]: { choice: aiChoice }
            }
          })
  
          if (Array.isArray(generatedNarration) && generatedNarration.length > 0) {
            nextRoundNarration = generatedNarration
          }
        } catch (err) {
          console.error('Narration generation error:', err)
          nextRoundNarration = [
            "The stakes continue to rise...",
            "Your choices echo through the shadows..."
          ]
        }
  
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
          finalConsequences: newConsequences || [],
          difficultyProgression: Object.entries(gameData.players[auth.currentUser.uid]?.choices || {})
            .map(([round, data]) => ({
              round: parseInt(round),
              difficulty: data.difficulty,
              success: data.finalResult >= data.difficulty
            }))
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
        difficulty: {
          dc: calculatedDC,
          feedback: updatedDiceInfo.difficultyFeedback,
          reasons: updatedDiceInfo.difficultyReasons
        },
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