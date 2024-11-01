// composables/useNarrativeGenerator.js
import { ref } from 'vue'

export const useNarrativeGenerator = () => {
    const generateDMNarration = (context) => {
        const { 
          roundNumber, 
          scenarioId, 
          previousChoices = {},
          lastRoundChoice,
          playerHistory = {},
          aiHistory = {}
        } = context
      
        // Initial narrations for each scenario
        const initialNarrations = {
          'shadow-syndicate': [
            "Fascinating... your partner spent quite some time negotiating privately before you arrived. They don't know I'm telling you this, of course.",
            "The question is - do you trust their convenient explanation of where they were, or would you like to know what really happened?"
          ],
          'rico-investigation': [
            "Your cover identity is solid, but I've noticed something concerning about your handler's recent behavior - patterns that suggest possible compromise.",
            "Will you follow standard protocols and maintain your cover story, or risk improvising to gain their confidence more quickly?"
          ]
        }
      
        // If it's round 1, return scenario-specific initial narration
        if (roundNumber === 1) {
          return initialNarrations[scenarioId] || [
            "A new game begins...",
            "What path will you choose?"
          ]
        }
      
        // Dynamic narrations based on scenario and previous choices
        const narratives = {
          'shadow-syndicate': {
            bothCooperated: {
              2: [
                "How touching, such loyalty. Though I noticed your partner's hand trembling slightly when they agreed. Anxiety about the plan... or guilt perhaps?",
                "Now about this vault - they seemed awfully interested in the secondary entrance. The one they didn't mention to you."
              ],
              3: [
                "Two rounds of cooperation? How quaint. Though I wonder if they're building trust only to... but no, I shouldn't plant such ideas.",
                "Speaking of trust, they've been asking about escape route capacities. Probably nothing."
              ],
              4: [
                "Such consistent cooperation... it's almost suspicious. Are they playing a longer game?",
                "They've been rather interested in the investigation's details. Just keeping informed... right?"
              ],
              5: [
                "Four rounds of cooperation... but the biggest prizes are often claimed alone.",
                "They've already asked about individual shares. Just being thorough, they said."
              ]
            },
            playerBetrayed: {
              2: [
                "My, my... they still believe in your loyalty. Such faith! Meanwhile, your little insurance policy remains our secret.",
                "Speaking of secrets - they've left some interesting files unprotected. Trusting souls are so refreshingly naive."
              ],
              3: [
                "They're still playing along, aren't they? Unaware that you've already secured your... advantages.",
                "These escape routes though - one person could easily disappear. Just an observation."
              ],
              4: [
                "They still don't suspect your previous moves. Their faith in you is... exploitable.",
                "This investigation could end several ways. Some more profitable than others."
              ],
              5: [
                "They remain blind to your true position. One final betrayal would be... poetic.",
                "The ultimate prize approaches. Why share when you've already proven loyalty means nothing?"
              ]
            },
            wasBetrayed: {
              2: [
                "You honored the agreement while they... well, let's just say loyalty means different things to different people.",
                "But now an opportunity presents itself. They think you're still in the dark about their little side deal. Such confidence makes people careless..."
              ],
              3: [
                "Your loyalty is admirable, if perhaps misplaced. They're already planning their solo escape.",
                "But what they don't know is that you could beat them at their own game. Interested?"
              ],
              4: [
                "After their betrayal, you still cooperate? Admirable... or foolish?",
                "They think they've covered their tracks. Would you like to prove them wrong?"
              ],
              5: [
                "Even after their betrayals, you persist in loyalty. But this final prize... it could balance the scales.",
                "They think their previous betrayals went unnoticed. Wouldn't it be delicious to prove them wrong?"
              ]
            },
            bothBetrayed: {
              2: [
                "Trust crashes like dominos, doesn't it? Though I must say, they took betrayal to an art form. Would you like to see how?",
                "Now you both circle each other like wounded wolves. But wolves can still bite - and they're preparing their teeth."
              ],
              3: [
                "The facade of partnership lies in ruins, yet they think they can still outmaneuver you.",
                "Want to know which escape route they're really planning to take?"
              ],
              4: [
                "The pretense of trust is gone, yet they think they're still ahead.",
                "This investigation could bury either of you. Or both. Unless..."
              ],
              5: [
                "It all comes down to this. They think they've outplayed you.",
                "But I know something they don't. Something that could change everything."
              ]
            }
          },
          'rico-investigation': {
            bothCooperated: {
              2: [
                "Playing it by the book... admirable. Though I've noticed some irregularities in your handler's recent reports.",
                "These financial records hold more secrets than they're telling you. Perhaps it's time to look deeper?"
              ],
              3: [
                "Such dedication to protocol... while your handler's communications grow increasingly suspicious.",
                "That offer they made you - did you notice the subtle pressure to stick to their narrative?"
              ],
              4: [
                "Following procedure perfectly... yet your handler seems nervous about the internal investigation.",
                "I wonder why they're so interested in controlling which evidence you see?"
              ],
              5: [
                "Your loyalty to the operation is commendable. Though your handler's latest actions raise questions.",
                "The corruption evidence they're hiding... would you like to know who it really implicates?"
              ]
            },
            playerBetrayed: {
              2: [
                "Interesting choice... your handler still thinks you're following protocol. Their confidence is useful.",
                "These documents could expose more than just the organization. Care to see the full picture?"
              ],
              3: [
                "Playing both sides... skillful. Your handler remains unaware of your true insights.",
                "This career offer - it's connected to something bigger. Something they're trying to hide."
              ],
              4: [
                "Maintaining your cover while pursuing the truth... clever. They suspect nothing.",
                "The exposed agent - there's more to their story. Something your handler doesn't want you to know."
              ],
              5: [
                "You've played this perfectly. They still think you're their loyal agent.",
                "The corruption goes deeper than anyone suspects. Ready to see how deep?"
              ]
            },
            wasBetrayed: {
              2: [
                "Your handler's getting creative with the truth, aren't they? While you play it straight.",
                "Those financial records they're so protective of... there's a reason they don't want you looking too closely."
              ],
              3: [
                "Following protocol while your handler goes rogue... interesting strategy.",
                "But what if I told you their off-book operations have a very specific purpose?"
              ],
              4: [
                "Your handler's betrayal runs deeper than you know. Yet you maintain your cover.",
                "The compromised agent - have you wondered why your handler was so quick to distance themselves?"
              ],
              5: [
                "Such dedication to the mission, even as your handler plays their own game.",
                "The corruption evidence - did you notice it leads right back to your own department?"
              ]
            },
            bothBetrayed: {
              2: [
                "The lines between right and wrong blur quickly, don't they? Your handler thinks the same way.",
                "These records could burn everything down. Question is - who controls the fire?"
              ],
              3: [
                "Trust is such a fragile thing in our line of work. Your handler understands this too well.",
                "This offer they're dangling - it's meant to compromise more than just you."
              ],
              4: [
                "The game changes when everyone has an angle. Your handler's playing their own side too.",
                "The internal investigation - it's not about finding truth, is it? It's about controlling it."
              ],
              5: [
                "All the pieces are in play now. Your handler thinks they're the only one with a backup plan.",
                "The corruption evidence cuts both ways. Ready to see who bleeds?"
              ]
            }
          }
        }
      
        // Determine last round's outcome state
        let state = 'bothCooperated'
        if (lastRoundChoice) {
          if (lastRoundChoice.playerChoice === 'cooperate' && lastRoundChoice.aiChoice === 'cooperate') {
            state = 'bothCooperated'
          } else if (lastRoundChoice.playerChoice === 'betray' && lastRoundChoice.aiChoice === 'cooperate') {
            state = 'playerBetrayed'
          } else if (lastRoundChoice.playerChoice === 'cooperate' && lastRoundChoice.aiChoice === 'betray') {
            state = 'wasBetrayed'
          } else {
            state = 'bothBetrayed'
          }
        }
      
        // Get appropriate narration
        const scenarioNarrations = narratives[scenarioId]
        if (!scenarioNarrations) {
          return [
            "The game continues...",
            "What will you choose?"
          ]
        }
      
        const stateNarrations = scenarioNarrations[state]
        if (!stateNarrations) {
          return [
            "Tensions rise as the game continues...",
            "Your next choice could change everything."
          ]
        }
      
        const roundNarration = stateNarrations[roundNumber]
        if (!roundNarration) {
          return [
            "The stakes grow higher...",
            "Choose wisely."
          ]
        }
      
        return roundNarration
      }

  const getDualChoiceState = (playerChoice, aiChoice) => {
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') return 'bothCooperated'
    if (playerChoice === 'betray' && aiChoice === 'cooperate') return 'playerBetrayed'
    if (playerChoice === 'cooperate' && aiChoice === 'betray') return 'wasBetrayed'
    return 'bothBetrayed'
  }

  const getNarrationForScenario = (scenarioId, roundNumber, lastRoundState, playerHistory, aiHistory) => {
    // Calculate betrayal tendencies
    const playerBetrayalCount = Object.values(playerHistory).filter(c => c === 'betray').length
    const aiBetrayalCount = Object.values(aiHistory).filter(c => c === 'betray').length
    const isBothBetraying = playerBetrayalCount > 0 && aiBetrayalCount > 0

    if (scenarioId === 'shadow-syndicate') {
      return getSyndicateNarration(roundNumber, lastRoundState, isBothBetraying)
    }
    
    if (scenarioId === 'rico-investigation') {
      return getRICONarration(roundNumber, lastRoundState, isBothBetraying)
    }

    return getDefaultNarration(roundNumber)
  }

  const getSyndicateNarration = (roundNumber, lastRoundState, isBothBetraying) => {
    const narratives = {
      // Round 1 - Initial Meeting
      1: {
        initial: [
          "Fascinating... your partner spent quite some time negotiating privately before you arrived. They don't know I'm telling you this, of course.",
          "The question is - do you trust their convenient explanation of where they were, or would you like to know what really happened?"
        ],
      },
      // Round 2 - The Vault
      2: {
        bothCooperated: [
          "How touching, such loyalty. Though I noticed your partner's hand trembling slightly when they agreed. Anxiety about the plan... or guilt perhaps?",
          "Now about this vault - they seemed awfully interested in the secondary entrance. The one they didn't mention to you."
        ],
        playerBetrayed: [
          "My, my... they still believe in your loyalty. Such faith! Meanwhile, your little insurance policy remains our secret.",
          "Speaking of secrets - they've left some interesting files unprotected. Trusting souls are so refreshingly naive."
        ],
        wasBetrayed: [
          "You honored the agreement while they... well, let's just say loyalty means different things to different people.",
          "But now an opportunity presents itself. They think you're still in the dark about their little side deal. Such confidence makes people careless..."
        ],
        bothBetrayed: [
          "Trust crashes like dominos, doesn't it? Though I must say, they took betrayal to an art form. Would you like to see how?",
          "Now you both circle each other like wounded wolves. But wolves can still bite - and they're preparing their teeth."
        ]
      },
      // Round 3 - The Escape
      3: {
        bothCooperated: [
          "Two rounds of cooperation? How quaint. Though I wonder if they're building trust only to... but no, I shouldn't plant such ideas.",
          "Speaking of trust, they've been asking about escape route capacities. Probably nothing."
        ],
        playerBetrayed: [
          "They're still playing along, aren't they? Unaware that you've already secured your... advantages.",
          "These escape routes though - one person could easily disappear. Just an observation."
        ],
        wasBetrayed: [
          "Your loyalty is admirable, if perhaps misplaced. They're already planning their solo escape.",
          "But what they don't know is that you could beat them at their own game. Interested?"
        ],
        bothBetrayed: [
          "The facade of partnership lies in ruins, yet they think they can still outmaneuver you.",
          "Want to know which escape route they're really planning to take?"
        ]
      },
      // Round 4 - The Investigation
      4: {
        bothCooperated: [
          "Such consistent cooperation... it's almost suspicious. Are they playing a longer game?",
          "They've been rather interested in the investigation's details. Just keeping informed... right?"
        ],
        playerBetrayed: [
          "They still don't suspect your previous moves. Their faith in you is... exploitable.",
          "This investigation could end several ways. Some more profitable than others."
        ],
        wasBetrayed: [
          "After their betrayal, you still cooperate? Admirable... or foolish?",
          "They think they've covered their tracks. Would you like to prove them wrong?"
        ],
        bothBetrayed: [
          "The pretense of trust is gone, yet they think they're still ahead.",
          "This investigation could bury either of you. Or both. Unless..."
        ]
      },
      // Round 5 - The Final Score
      5: {
        bothCooperated: [
          "Four rounds of cooperation... but the biggest prizes are often claimed alone.",
          "They've already asked about individual shares. Just being thorough, they said."
        ],
        playerBetrayed: [
          "They remain blind to your true position. One final betrayal would be... poetic.",
          "The ultimate prize approaches. Why share when you've already proven loyalty means nothing?"
        ],
        wasBetrayed: [
          "Even after their betrayals, you persist in loyalty. But this final prize... it could balance the scales.",
          "They think their previous betrayals went unnoticed. Wouldn't it be delicious to prove them wrong?"
        ],
        bothBetrayed: [
          "It all comes down to this. They think they've outplayed you.",
          "But I know something they don't. Something that could change everything."
        ]
      }
    }

    if (roundNumber === 1) return narratives[1].initial

    const stateNarration = narratives[roundNumber][lastRoundState]
    if (isBothBetraying) {
      // Add extra spice when both have history of betrayal
      stateNarration[0] += " The trail of betrayals behind you both adds such spice to the game."
    }

    return stateNarration
  }

  const getRICONarration = (roundNumber, lastRoundState, isBothBetraying) => {
    const narratives = {
      // Round 1 - The Introduction
      1: {
        initial: [
          "Your handler's recent behavior has been... interesting. Private meetings, encrypted communications - not all with authorized parties.",
          "Will you follow protocol, or would you like to know what they're really up to?"
        ]
      },
      // Round 2 - The Paper Trail
      2: {
        bothCooperated: [
          "Sticking to protocol... admirable. Though your handler's latest reports contain some concerning inconsistencies.",
          "These financial records could expose everything. But who are they really protecting?"
        ],
        playerBetrayed: [
          "Your handler thinks the operation is proceeding normally. Their confidence is... useful.",
          "These financial documents might reveal more than just organizational crimes. Interested?"
        ],
        wasBetrayed: [
          "Your handler's gone off-book while you play it straight. Admirable, but perhaps naive?",
          "The documents they're requesting... there's more to them than they're telling you."
        ],
        bothBetrayed: [
          "Protocol lies in shambles, yet your handler thinks they're the only one improvising.",
          "These financial records could burn both of you. Or just one. Your choice."
        ]
      },
      // Continue with remaining RICO rounds following similar pattern
    }

    if (roundNumber === 1) return narratives[1].initial
    return narratives[roundNumber][lastRoundState] || getDefaultNarration(roundNumber)
  }

  const getDefaultNarration = (roundNumber) => {
    return [
      "The stakes grow higher, and trust becomes more precious... and dangerous.",
      "What's your next move in this game of shadows?"
    ]
  }

  return {
    generateDMNarration,
  }
}