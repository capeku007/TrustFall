// composables/useAIDiceRoll.js
import { ref, computed } from 'vue'

export const useAIDiceRoll = () => {
  const diceResults = ref([null, null])
  const isRolling = ref(false)
  const currentModifier = ref(0)
  
  const finalResult = computed(() => {
    if (!diceResults.value[0] || !diceResults.value[1]) return null
    return diceResults.value[0] + diceResults.value[1] + currentModifier.value
  })

  const diceResult = computed(() => {
    if (!diceResults.value[0] || !diceResults.value[1]) return null
    return diceResults.value[0] + diceResults.value[1]
  })

  const rollSingleDie = () => Math.floor(Math.random() * 6) + 1

  const rollDice = async () => {
    isRolling.value = true
    diceResults.value = [rollSingleDie(), rollSingleDie()]
    isRolling.value = false
    return finalResult.value
  }

  const resetRoll = () => {
    diceResults.value = [null, null]
    currentModifier.value = 0
    isRolling.value = false
  }

  return {
    diceResult,
    diceResults,
    finalResult,
    isRolling,
    currentModifier,
    rollDice,
    resetRoll
  }
}
