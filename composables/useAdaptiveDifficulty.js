// composables/useAdaptiveDifficulty.js
import { ref, computed } from 'vue'

const DifficultyModifiers = {
  BETRAYAL: 2,           // Each betrayal increases difficulty
  COOPERATION: -1,       // Cooperation slightly reduces difficulty
  CRITICAL_FAIL: 3,      // Critical failure significantly increases next check
  CRITICAL_SUCCESS: -2,  // Critical success makes next check easier
  NEGOTIATION: 0,        // Neutral baseline for negotiation
  BASE_DIFFICULTY: 12    // Starting difficulty level
}

const ActionTypes = {
  BETRAY: 'betray',
  COOPERATE: 'cooperate',
  NEGOTIATE: 'negotiate'
}

export const useAdaptiveDifficulty = () => {
  const difficultyHistory = ref([])
  const temporaryModifiers = ref({})
  
  // Calculate current DC based on history and modifiers
  const calculateDC = (roundNumber, playerHistory, lastRollInfo) => {
    let dc = DifficultyModifiers.BASE_DIFFICULTY
    
    // Base scaling with round number
    dc += Math.floor(roundNumber * 0.5)
    
    // Analyze recent history (last 3 rounds)
    const recentChoices = Object.entries(playerHistory)
      .sort(([a], [b]) => b - a) // Sort by round number descending
      .slice(0, 3)
      .map(([_, data]) => data.choice)
    
    // Apply choice-based modifiers
    const betrayalCount = recentChoices.filter(c => c === ActionTypes.BETRAY).length
    const cooperationCount = recentChoices.filter(c => c === ActionTypes.COOPERATE).length
    
    dc += betrayalCount * DifficultyModifiers.BETRAYAL
    dc += cooperationCount * DifficultyModifiers.COOPERATION
    
    // Apply temporary modifiers from previous roll
    if (lastRollInfo) {
      if (lastRollInfo.diceRoll === 1) { // Critical failure
        dc += DifficultyModifiers.CRITICAL_FAIL
      } else if (lastRollInfo.diceRoll === 20) { // Critical success
        dc += DifficultyModifiers.CRITICAL_SUCCESS
      }
    }
    
    // Add any scenario-specific modifiers
    const roundModifier = temporaryModifiers.value[roundNumber] || 0
    dc += roundModifier
    
    // Ensure DC stays within reasonable bounds
    return Math.min(Math.max(dc, 10), 20)
  }
  
  // Update history and modifiers after each round
  const updateDifficulty = (roundNumber, choice, rollResult) => {
    difficultyHistory.value.push({
      round: roundNumber,
      choice,
      rollResult
    })
    
    // Calculate temporary modifiers for next round
    if (rollResult.diceRoll === 1) { // Critical failure
      temporaryModifiers.value[roundNumber + 1] = 
        (temporaryModifiers.value[roundNumber + 1] || 0) + DifficultyModifiers.CRITICAL_FAIL
    } else if (rollResult.diceRoll === 20) { // Critical success
      temporaryModifiers.value[roundNumber + 1] = 
        (temporaryModifiers.value[roundNumber + 1] || 0) + DifficultyModifiers.CRITICAL_SUCCESS
    }
    
    // Additional modifiers based on choice patterns
    if (choice === ActionTypes.BETRAY) {
      const consecutiveBetrayals = getConsecutiveActions(ActionTypes.BETRAY)
      if (consecutiveBetrayals >= 2) {
        temporaryModifiers.value[roundNumber + 1] = 
          (temporaryModifiers.value[roundNumber + 1] || 0) + consecutiveBetrayals
      }
    }
  }
  
  // Helper to check for consecutive actions
  const getConsecutiveActions = (actionType) => {
    let count = 0
    for (let i = difficultyHistory.value.length - 1; i >= 0; i--) {
      if (difficultyHistory.value[i].choice === actionType) {
        count++
      } else {
        break
      }
    }
    return count
  }
  
  // Get difficulty feedback for UI
  const getDifficultyFeedback = (dc) => {
    if (dc <= 12) return { level: 'Easy', description: 'The situation seems manageable.' }
    if (dc <= 15) return { level: 'Moderate', description: 'Requires careful consideration.' }
    if (dc <= 18) return { level: 'Hard', description: 'Success will be challenging.' }
    return { level: 'Very Hard', description: 'The odds are stacked against you.' }
  }
  
  // Get explanation for current DC
  const getDifficultyExplanation = (dc, roundNumber, playerHistory) => {
    const reasons = []
    
    // Base difficulty
    reasons.push(`Base DC: ${DifficultyModifiers.BASE_DIFFICULTY}`)
    
    // Round progression
    const roundModifier = Math.floor(roundNumber * 0.5)
    if (roundModifier) {
      reasons.push(`Round progression: +${roundModifier}`)
    }
    
    // Recent choices
    const recentChoices = Object.entries(playerHistory)
      .sort(([a], [b]) => b - a)
      .slice(0, 3)
      
    const betrayals = recentChoices.filter(([_, data]) => data.choice === ActionTypes.BETRAY).length
    if (betrayals) {
      reasons.push(`Recent betrayals: +${betrayals * DifficultyModifiers.BETRAYAL}`)
    }
    
    const cooperation = recentChoices.filter(([_, data]) => data.choice === ActionTypes.COOPERATE).length
    if (cooperation) {
      reasons.push(`Recent cooperation: ${cooperation * DifficultyModifiers.COOPERATION}`)
    }
    
    // Temporary modifiers
    const tempMod = temporaryModifiers.value[roundNumber] || 0
    if (tempMod) {
      reasons.push(`Special conditions: ${tempMod > 0 ? '+' : ''}${tempMod}`)
    }
    
    return reasons
  }
  
  return {
    calculateDC,
    updateDifficulty,
    getDifficultyFeedback,
    getDifficultyExplanation,
    DifficultyModifiers,
    ActionTypes
  }
}