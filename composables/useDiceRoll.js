import { ref, computed } from 'vue'

export const useDiceRoll = () => {
  const diceResults = ref([null, null]) // Track both dice separately
  const isRolling = ref(false)
  const currentModifier = ref(0)
  
  // Sum of both dice plus modifier
  const finalResult = computed(() => {
    if (!diceResults.value[0] || !diceResults.value[1]) return null
    return diceResults.value[0] + diceResults.value[1] + currentModifier.value
  })

  // Individual die result for display
  const diceResult = computed(() => {
    if (!diceResults.value[0] || !diceResults.value[1]) return null
    return diceResults.value[0] + diceResults.value[1]
  })

  const rollSingleDie = () => {
    return Math.floor(Math.random() * 6) + 1
  }

  const rollDice = async () => {
    isRolling.value = true
    
    // Animate roll for both dice
    for (let i = 0; i < 8; i++) {
      diceResults.value = [rollSingleDie(), rollSingleDie()]
      await new Promise(resolve => setTimeout(resolve, 75))
    }
    
    // Final results
    diceResults.value = [rollSingleDie(), rollSingleDie()]
    isRolling.value = false
    return finalResult.value
  }

  const resetRoll = () => {
    diceResults.value = [null, null]
    currentModifier.value = 0
    isRolling.value = false
  }

  // Calculate bonus points based on roll result
  const calculateDiceBonus = (dcCheck = 7) => {
    if (!diceResult.value) return 0
    
    // Critical success (rolling 12) adds +1 point
    if (diceResult.value === 12) return 1
    
    // Critical failure (rolling 2) subtracts 1 point
    if (diceResult.value === 2) return -1
    
    // Normal success (meeting or exceeding DC) adds 0.5 points
    if (finalResult.value >= dcCheck) return 0.5
    
    // Normal failure has no point impact
    return 0
  }

  // Helper to get descriptive text for the roll
  const getRollDescription = (dcCheck = 7) => {
    if (!diceResult.value) return ''
    if (diceResult.value === 12) return 'Critical Success! (+1 point)'
    if (diceResult.value === 2) return 'Critical Failure! (-1 point)'
    if (finalResult.value >= dcCheck) return 'Success! (+0.5 points)'
    return 'Failure'
  }

  // Helper to get CSS class for the roll result
  const getRollClass = (dcCheck = 7) => {
    if (!diceResult.value) return ''
    if (diceResult.value === 12) return 'text-green-600'
    if (diceResult.value === 2) return 'text-red-600'
    if (finalResult.value >= dcCheck) return 'text-blue-600'
    return 'text-gray-600'
  }

  return {
    diceResult,
    diceResults,
    finalResult,
    isRolling,
    currentModifier,
    rollDice,
    resetRoll,
    calculateDiceBonus,
    getRollDescription,
    getRollClass
  }
}