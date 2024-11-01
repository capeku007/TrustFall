// composables/useNarrativeGenerator.js
import { ref } from 'vue'

export const useNarrativeGenerator = () => {
  const generateDMNarration = (context) => {
    const { 
      roundNumber, 
      scenarioId, 
      previousChoices, // Array of previous round choices
      lastRoundChoice, // Immediately previous round
      playerHistory = {},  // All player's past choices
      aiHistory = {} // All AI's past choices
    } = context

    // Get the final round choice states
    const lastRoundState = lastRoundChoice ? getDualChoiceState(lastRoundChoice.playerChoice, lastRoundChoice.aiChoice) : null

    // Get scenario-specific narration
    const narratives = getNarrationForScenario(scenarioId, roundNumber, lastRoundState, playerHistory, aiHistory)
    
    return narratives
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