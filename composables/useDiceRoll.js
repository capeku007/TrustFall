// composables/useDiceRoll.js
import { ref, computed } from 'vue'

export const useDiceRoll = () => {
  const diceResult = ref(null)
  const isRolling = ref(false)
  const currentModifier = ref(0)
  
  const finalResult = computed(() => {
    if (!diceResult.value) return null
    return diceResult.value + currentModifier.value
  })

  const rollDice = async (diceType = 20) => {
    isRolling.value = true
    
    // Animate roll
    for (let i = 0; i < 8; i++) {
      diceResult.value = Math.floor(Math.random() * diceType) + 1
      await new Promise(resolve => setTimeout(resolve, 75))
    }
    
    // Final result
    const result = Math.floor(Math.random() * diceType) + 1
    diceResult.value = result
    isRolling.value = false
    return finalResult.value
  }

  const resetRoll = () => {
    diceResult.value = null
    currentModifier.value = 0
    isRolling.value = false
  }

  return {
    diceResult,
    finalResult,
    isRolling,
    currentModifier,
    rollDice,
    resetRoll
  }
}