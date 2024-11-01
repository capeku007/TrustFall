// composables/useNarrativeGenerator.js
import { ref } from 'vue'

export const useNarrativeGenerator = () => {
  const narrativeTemplates = {
    dmNarration: {
      // First part sets the scene and reveals information
      setup: {
        1: [
          "I know you and your partner are planning a heist, but there's something crucial you're not aware of - your partner knows more than they're letting on about what's really at stake.",
          "The contracts before you seem identical, but only I know what's written in invisible ink - and what your partner has already agreed to behind your back.",
          "While you've been meticulously planning this heist, I've been watching both of you - and I've seen your partner making moves they haven't told you about."
        ],
        2: [
          "That vault you're planning to crack? There's something inside that your partner desperately wants to keep hidden from you - something that could change everything.",
          "Your carefully laid plans for the vault are based on outdated information - information your partner deliberately kept from you to protect their own interests.",
          "While you've been focusing on the main vault, your partner has been secretly scouting a different target - one that holds something far more valuable than mere gold."
        ],
        3: [
          "The authorities closing in aren't here by chance - someone's been feeding them information, and your partner's recent behavior raises some interesting questions.",
          "I've arranged two separate escape routes, but here's what makes this interesting - your partner has already negotiated their own terms without consulting you.",
          "The escape plan you're counting on has a fatal flaw that your partner is well aware of - but they've secured their own backup plan without telling you."
        ],
        4: [
          "The mole in your operation isn't who you think - I have evidence that will make you question everything your partner has told you up until now.",
          "Your partner's loyalty seems admirable, but I have documents that tell a very different story - one they've been carefully hiding from you.",
          "The investigation into the mole has revealed some surprising connections - ones that your partner has gone to great lengths to keep hidden."
        ],
        5: [
          "This final score isn't what it appears to be - your partner has negotiated a separate deal that completely changes the game's stakes.",
          "The legendary score I'm offering comes with a twist - your partner already knows about it and has made their own arrangements without your knowledge.",
          "What you see as the ultimate heist is actually something far more complex - and your partner has been playing their own angle from the start."
        ]
      },
      // Second part presents the challenge/question
      challenge: {
        1: [
          "So here's my question: do you want to learn what they're hiding from you, or stay loyal to what they've told you?",
          "Now you have to decide: trust in your partner's silence, or hear the truth from someone who knows all the secrets?",
          "The choice is yours: maintain your loyalty in the face of doubt, or discover what's really going on behind the scenes?"
        ],
        2: [
          "What matters more to you: maintaining trust in your partnership, or knowing the full extent of what's in that vault?",
          "So what's it going to be: stick to the plan you know, or learn why your partner's been so careful with the details?",
          "Time to decide: trust in your partner's judgment, or discover what they're really after in that vault?"
        ],
        3: [
          "The question now is: do you trust your partner's escape plan, or would you rather know about their private arrangements?",
          "Which matters more: maintaining your partnership in the face of danger, or ensuring your own safe escape?",
          "You need to choose: stand together despite the risks, or secure your own way out?"
        ],
        4: [
          "So what's it going to be: defend your partner's honor, or learn the truth about their involvement?",
          "The choice is simple but crucial: maintain solidarity, or discover who's really been pulling the strings?",
          "Now you must decide: stay loyal to your partner, or uncover the truth about their actions?"
        ],
        5: [
          "Here's the real question: will you stick with your partner's version of events, or learn how deep this really goes?",
          "What matters more at this final moment: partnership loyalty, or knowing the whole truth?",
          "One last choice: trust in what you've built together, or discover what's really at stake?"
        ]
      }
    },
    outcomes: {
      bothCooperate: {
        success: [
          "Your unwavering loyalty to each other pays off - the perfect foundation for what comes next. {consequence}",
          "Together, you prove that trust can overcome any obstacle. Your unity becomes legendary in the underworld. {consequence}",
          "Your mutual faith creates something rare in our world - a partnership that actually works. {consequence}"
        ],
        failure: [
          "Your loyalty is admirable, but sometimes trust alone isn't enough. {consequence}",
          "You stayed true to each other, but the circumstances had other plans. {consequence}",
          "Your partnership remains strong, even if the results weren't what you hoped for. {consequence}"
        ]
      },
      betrayed: {
        success: [
          "Your loyalty becomes a shield, even as your partner's betrayal comes to light. {consequence}",
          "They chose betrayal, but your integrity will serve you better in the long run. {consequence}",
          "Your partner's betrayal stings, but your reputation for loyalty opens new doors. {consequence}"
        ],
        failure: [
          "Your trust was misplaced, and the price is steep. {consequence}",
          "Sometimes loyalty is a weakness others can't wait to exploit. {consequence}",
          "Your partner's betrayal leaves you vulnerable and exposed. {consequence}"
        ]
      },
      successful: {
        success: [
          "Your betrayal is masterfully executed, leaving no loose ends. {consequence}",
          "Sometimes the best move is the one nobody sees coming. {consequence}",
          "Your partner never saw it coming - their trust was their downfall. {consequence}"
        ],
        failure: [
          "Your attempted betrayal backfires, leaving you in a precarious position. {consequence}",
          "The double-cross falls apart at the crucial moment. {consequence}",
          "Your deception is exposed at the worst possible time. {consequence}"
        ]
      },
      bothBetray: {
        success: [
          "In the chaos of mutual betrayal, you manage to come out ahead. {consequence}",
          "When trust crumbles completely, only the clever survive. {consequence}",
          "You navigate the web of betrayal better than your partner. {consequence}"
        ],
        failure: [
          "Your mutual betrayal leaves you both worse off than before. {consequence}",
          "In the end, neither of you wins - trust is harder to rebuild than to break. {consequence}",
          "The double-cross leaves nothing but wreckage in its wake. {consequence}"
        ]
      }
    },
    consequences: {
      positive: [
        "Your reputation in the underworld grows stronger.",
        "New opportunities begin to surface.",
        "Powerful figures take notice of your actions.",
        "Your influence in criminal circles expands.",
        "Valuable connections recognize your potential."
      ],
      negative: [
        "Your standing in the criminal world takes a hit.",
        "Former allies begin to distance themselves.",
        "Your reputation becomes a liability.",
        "Future opportunities become more scarce.",
        "Trust becomes harder to come by in your circles."
      ]
    }
  }

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)]
  }

  const generateDMNarration = (context) => {
    const { roundNumber } = context
    
    // Get setup and challenge for the current round
    const setup = getRandomElement(narrativeTemplates.dmNarration.setup[roundNumber])
    const challenge = getRandomElement(narrativeTemplates.dmNarration.challenge[roundNumber])
    
    return [
      setup,
      challenge
    ]
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
      return "A masterful play! " + getRandomElement(narrativeTemplates.outcomes[outcomeType].success)
        .replace('{consequence}', getRandomElement(narrativeTemplates.consequences.positive))
    }
    if (diceRoll === 1) {
      return "A catastrophic turn! " + getRandomElement(narrativeTemplates.outcomes[outcomeType].failure)
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