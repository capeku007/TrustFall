import { useNarrativeGenerator } from './useNarrativeGenerator'

export const useAIDialogue = () => {
  const isGenerating = ref(false)
  const error = ref(null)
  const narrativeGenerator = useNarrativeGenerator()

  const generateDMNarration = async (context) => {
    try {
      isGenerating.value = true
      return narrativeGenerator.generateDMNarration(context)
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
      return narrativeGenerator.generateOutcomeNarrative(context)
    } catch (err) {
      console.error('Error in outcome narrative:', err)
      return determineBackupNarrative(context)
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    error,
    generateDMNarration,
    generateOutcomeNarrative
  }
}