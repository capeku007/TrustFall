import { ref } from 'vue'

export const useAIDialogue = () => {
  const isGenerating = ref(false)
  const error = ref(null)

  const generateDMNarration = async (context) => {
    try {
      isGenerating.value = true
      
      const response = await $fetch('/api/dialogue/dm-narration', {
        method: 'POST',
        body: { context }
      })

      return response.lines
    } catch (err) {
      console.error('Error in DM narration:', err)
      return [
        "The air grows thick with tension...",
        "Your choices echo in the shadows.",
        "What will you decide?"
      ]
    } finally {
      isGenerating.value = false
    }
  }

  const generateOutcomeNarrative = async (context) => {
    try {
      isGenerating.value = true

      const response = await $fetch('/api/dialogue/outcome', {
        method: 'POST',
        body: { context }
      })

      return response.narrative
    } catch (err) {
      console.error('Error in outcome narrative:', err)
      return determineBackupNarrative(context)
    } finally {
      isGenerating.value = false
    }
  }

  const determineBackupNarrative = (context) => {
    const { playerChoice, aiChoice, rollSuccess } = context
    
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
      return rollSuccess 
        ? "Your mutual trust yields a perfect outcome."
        : "Despite good intentions, the execution is flawed."
    }
    if (playerChoice === 'cooperate' && aiChoice === 'betray') {
      return rollSuccess
        ? "Though betrayed, you maintain your dignity."
        : "Your trust was misplaced and costly."
    }
    if (playerChoice === 'betray' && aiChoice === 'cooperate') {
      return rollSuccess
        ? "Your betrayal is executed flawlessly."
        : "Your attempted betrayal falters."
    }
    return rollSuccess
      ? "In the chaos of mutual betrayal, you gain the upper hand."
      : "Your plans collapse as trust shatters completely."
  }

  return {
    isGenerating,
    error,
    generateDMNarration,
    generateOutcomeNarrative
  }
}