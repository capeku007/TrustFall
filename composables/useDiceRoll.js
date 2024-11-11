import { ref, computed } from 'vue'

export const useDiceRoll = () => {
  const diceResults = ref([0, 0])
  const isRolling = ref(false)
  const currentModifier = ref(0)
  const showChoices = ref(false)

  // Sum of both dice
  const diceResult = computed(() => {
    return diceResults.value[0] + diceResults.value[1]
  })

  // Final result including modifier
  const finalResult = computed(() => {
    return diceResult.value + currentModifier.value
  })

  const rollSingleDie = () => {
    return Math.floor(Math.random() * 6) + 1
  }

  const rollDice = async () => {
    showChoices.value = false
    isRolling.value = true
    
    // Animate roll for both dice
    for (let i = 0; i < 8; i++) {
      diceResults.value = [rollSingleDie(), rollSingleDie()]
      await new Promise(resolve => setTimeout(resolve, 75))
    }
    
    // Final results
    diceResults.value = [rollSingleDie(), rollSingleDie()]
    isRolling.value = false
    
    // Delay showing choices
    await new Promise(resolve => setTimeout(resolve, 2000))
    showChoices.value = true
    
    return {
      diceRoll: diceResult.value,
      finalResult: finalResult.value,
      diceResults: [...diceResults.value],
      modifier: currentModifier.value
    }
  }

  const resetRoll = () => {
    diceResults.value = [0, 0]
    currentModifier.value = 0
    isRolling.value = false
    showChoices.value = false
  }

  const calculateDiceBonus = (dcCheck = 7) => {
    if (diceResult.value === 0) return 0
    if (diceResult.value === 12) return 1
    if (diceResult.value === 2) return -1
    if (finalResult.value >= dcCheck) return 0.5
    return 0
  }

  const getRollDescription = (dcCheck = 7) => {
    if (diceResult.value === 0) return ''
    if (diceResult.value === 12) return 'Critical Success! (+1 point)'
    if (diceResult.value === 2) return 'Critical Failure! (-1 point)'
    if (finalResult.value >= dcCheck) return 'Success! (+0.5 points)'
    return `Failure (DC ${dcCheck} required)`
  }

  const getRollClass = (dcCheck = 7) => {
    if (diceResult.value === 0) return ''
    if (diceResult.value === 12) return 'text-green-400'
    if (diceResult.value === 2) return 'text-red-400'
    if (finalResult.value >= dcCheck) return 'text-blue-400'
    return 'text-gray-400'
  }

  return {
    diceResult,
    diceResults,
    finalResult,
    isRolling,
    showChoices,
    currentModifier,
    rollDice,
    resetRoll,
    calculateDiceBonus,
    getRollDescription,
    getRollClass
  }
}