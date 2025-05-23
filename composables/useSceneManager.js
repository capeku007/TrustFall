// composables/useSceneManager.js
import { ref } from 'vue'
import { shadowSyndicate } from './scenarios/shadowSyndicate'

export const useSceneManager = () => {
  // Store available scenarios
  const scenarios = {
    'shadow-syndicate': shadowSyndicate
  }

  const baseChoices = {
    cooperate: {
      text: 'Honor the Agreement',
      description: 'Maintain trust and cooperation'
    },
    negotiate: {
      text: 'Cautious Approach',
      description: 'Seek middle ground while protecting interests'
    },
    betray: {
      text: 'Seize Advantage',
      description: 'Pursue personal gain at their expense'
    }
  }

  // Get random scene from first round options
 const getRandomFirstRoundScene = (scenarioId) => {
    const scenario = scenarios[scenarioId]
    if (!scenario?.firstRoundScenes?.length) {
      throw new Error('No first round scenes available')
    }
    
    const randomIndex = Math.floor(Math.random() * scenario.firstRoundScenes.length)
    return scenario.firstRoundScenes[randomIndex]
  }
  
const determineScene = (scenarioId, roundNumber, lastChoices, history) => {
    const scenario = scenarios[scenarioId]
    if (!scenario) {
      throw new Error('Invalid scenario')
    }
  
    // First round gets random initial scene
    if (roundNumber === 1) {
      return getRandomFirstRoundScene(scenarioId)
    }
  
    // Get scene based on last round's choices
    if (lastChoices?.playerChoice && lastChoices?.aiChoice) {
      // Convert choice combination to scene matrix key
      const playerChoice = lastChoices.playerChoice.toUpperCase()
      const aiChoice = lastChoices.aiChoice.toUpperCase()
      
      // Generate key based on whether choices match
      let sceneKey
      if (playerChoice === aiChoice) {
        sceneKey = `BOTH_${playerChoice}`
      } else {
        sceneKey = `PLAYER_${playerChoice}_AI_${aiChoice}`
      }
  
      console.log('Looking for scene with key:', sceneKey, 'in round:', roundNumber)
  
      // Try to get the scene from the matrix
      const nextScene = scenario.sceneMatrix[roundNumber]?.[sceneKey]
  
      if (!nextScene) {
        console.log(`No scene found for key ${sceneKey} in round ${roundNumber}, using default`)
        return scenario.defaultScene
      }
  
      return nextScene
    }
  
    return scenario.defaultScene
  }

  // Modify scene based on history and consequences
  const modifyScene = (scene, consequences = [], history = []) => {
    if (!scene) return scene

    let modifiedScene = { ...scene }
    
    // Add base choices
    modifiedScene.choices = {
      cooperate: {
        text: 'Honor the Agreement',
        description: 'Maintain trust and cooperation'
      },
      negotiate: {
        text: 'Cautious Approach',
        description: 'Seek middle ground while protecting interests'
      },
      betray: {
        text: 'Seize Advantage',
        description: 'Pursue personal gain at their expense'
      }
    }
    
    // Apply consequence modifiers
    consequences.forEach(consequence => {
      if (consequence.type === 'CRITICAL_SUCCESS') {
        modifiedScene.skillCheck.dcCheck = Math.max(1, modifiedScene.skillCheck.dcCheck - 2)
        modifiedScene.description += ' Your previous success gives you an advantage.'
      } else if (consequence.type === 'CRITICAL_FAILURE') {
        modifiedScene.skillCheck.dcCheck += 2
        modifiedScene.description += ' Your previous failure makes this more challenging.'
      }
    })

    // Apply history modifiers
    if (history.length > 0) {
      const recentChoices = history.slice(-2)
      const consecutiveBetrayal = recentChoices.every(c => 
        c.playerChoice === 'betray' || c.aiChoice === 'betray'
      )
      
      if (consecutiveBetrayal) {
        modifiedScene.skillCheck.dcCheck += 1
        modifiedScene.description += ' The atmosphere is thick with suspicion.'
      }
    }

    return modifiedScene
  }

  // Get available scenarios
  const getScenarios = () => {
    return Object.entries(scenarios).map(([id, scenario]) => ({
      id,
      title: scenario.title,
      description: scenario.description,
      image: scenario.image || '/scenarios/default.jpg'
    }))
  }

  return {
    getRandomFirstRoundScene,
    determineScene,
    modifyScene,
    getScenarios
  }
}