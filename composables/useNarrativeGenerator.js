// composables/useNarrativeGenerator.js
import { ref } from 'vue'

export const useNarrativeGenerator = () => {
  const narrativeTemplates = {
    dmNarration: {
      intro: [
        "The shadows lengthen as {situation}...",
        "Tension fills the air while {situation}...",
        "A moment of truth approaches as {situation}...",
        "The stakes rise higher as {situation}...",
        "Time seems to slow as {situation}..."
      ],
      situations: {
        1: [
          "alliances are tested",
          "loyalties hang in the balance",
          "opportunities present themselves",
          "decisions must be made",
          "trust becomes currency"
        ],
        2: [
          "secrets threaten to surface",
          "past choices echo forward",
          "complications arise",
          "the plot thickens",
          "motives become unclear"
        ],
        3: [
          "escape routes dwindle",
          "pressure mounts",
          "time runs short",
          "dangers close in",
          "options narrow"
        ],
        4: [
          "suspicions grow",
          "accusations fly",
          "trust fractures",
          "loyalty is questioned",
          "truth becomes murky"
        ],
        5: [
          "everything comes to a head",
          "final choices must be made",
          "destinies await",
          "legacies hang in the balance",
          "the endgame begins"
        ]
      }
    },
    outcomes: {
      bothCooperate: {
        success: [
          "Your mutual trust creates a perfect synergy. {consequence}",
          "Working together, you achieve something remarkable. {consequence}",
          "Unity proves to be your greatest strength. {consequence}",
          "Your combined loyalty overcomes all obstacles. {consequence}"
        ],
        failure: [
          "Despite your best efforts, circumstances work against you both. {consequence}",
          "Your good intentions meet unexpected resistance. {consequence}",
          "Though united, victory remains just out of reach. {consequence}"
        ]
      },
      betrayed: {
        success: [
          "Even as trust crumbles, you maintain your dignity. {consequence}",
          "Your integrity shines through betrayal. {consequence}",
          "You weather the betrayal with grace. {consequence}"
        ],
        failure: [
          "The betrayal cuts deep, leaving lasting wounds. {consequence}",
          "Trust given freely becomes a weapon against you. {consequence}",
          "Your loyalty becomes your downfall. {consequence}"
        ]
      },
      successful: {
        success: [
          "Your cunning plan unfolds perfectly. {consequence}",
          "The betrayal goes exactly as planned. {consequence}",
          "Your deception yields the desired results. {consequence}"
        ],
        failure: [
          "Your betrayal backfires unexpectedly. {consequence}",
          "The plan unravels at a crucial moment. {consequence}",
          "Your deception proves costly. {consequence}"
        ]
      },
      bothBetray: {
        success: [
          "In the chaos of mutual betrayal, you find an advantage. {consequence}",
          "Double-cross meets double-cross, yet you come out ahead. {consequence}",
          "Amid the wreckage of trust, you salvage a victory. {consequence}"
        ],
        failure: [
          "Mutual betrayal leads to mutual destruction. {consequence}",
          "In the end, no one wins. {consequence}",
          "Trust shatters completely, leaving only regret. {consequence}"
        ]
      }
    },
    consequences: {
      positive: [
        "Your reputation grows stronger.",
        "New opportunities present themselves.",
        "Valuable allies take notice.",
        "Your influence expands.",
        "Future paths become clearer."
      ],
      negative: [
        "Shadows of doubt linger.",
        "Trust becomes harder to earn.",
        "Your reputation takes a hit.",
        "Future opportunities narrow.",
        "Old allies grow wary."
      ]
    }
  }

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)]
  }

  const generateDMNarration = (context) => {
    const { roundNumber } = context
    const intro = getRandomElement(narrativeTemplates.dmNarration.intro)
    const situation = getRandomElement(narrativeTemplates.dmNarration.situations[roundNumber])
    
    const narration = [
      intro.replace('{situation}', situation),
      getRandomElement(narrativeTemplates.dmNarration.situations[roundNumber]),
      "What path will you choose?"
    ]
    
    return narration
  }

  const generateOutcomeNarrative = (context) => {
    const { 
      playerChoice, 
      aiChoice, 
      rollSuccess,
      diceRoll
    } = context

    let outcomeType
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
      outcomeType = 'bothCooperate'
    } else if (playerChoice === 'cooperate' && aiChoice === 'betray') {
      outcomeType = 'betrayed'
    } else if (playerChoice === 'betray' && aiChoice === 'cooperate') {
      outcomeType = 'successful'
    } else {
      outcomeType = 'bothBetray'
    }

    // Handle critical rolls
    if (diceRoll === 20) {
      return "Critical Success! " + getRandomElement(narrativeTemplates.outcomes[outcomeType].success)
        .replace('{consequence}', getRandomElement(narrativeTemplates.consequences.positive))
    }
    if (diceRoll === 1) {
      return "Critical Failure! " + getRandomElement(narrativeTemplates.outcomes[outcomeType].failure)
        .replace('{consequence}', getRandomElement(narrativeTemplates.consequences.negative))
    }

    // Normal rolls
    const templates = rollSuccess ? 
      narrativeTemplates.outcomes[outcomeType].success :
      narrativeTemplates.outcomes[outcomeType].failure

    const consequence = rollSuccess ?
      getRandomElement(narrativeTemplates.consequences.positive) :
      getRandomElement(narrativeTemplates.consequences.negative)

    return getRandomElement(templates).replace('{consequence}', consequence)
  }

  return {
    generateDMNarration,
    generateOutcomeNarrative
  }
}