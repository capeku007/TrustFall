import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate request
  if (!body.context) {
    throw createError({
      statusCode: 400,
      message: 'Missing context'
    })
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })

  try {
    const prompt = `Generate a dramatic narrative outcome for this scenario:
    Player Choice: ${body.context.playerChoice}
    AI Choice: ${body.context.aiChoice}
    Dice Roll: ${body.context.diceRoll}
    Roll Result: ${body.context.rollSuccess ? 'Success' : 'Failure'}
    Active Consequences: ${body.context.consequences?.join(', ') || 'None'}
    Previous Narrative: ${body.context.previousNarrative || 'None'}

    Create a dramatic, personal narrative that incorporates the dice roll result and any relevant consequences.
    Keep it under 2 sentences.`

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 100
    })

    return {
      narrative: completion.choices[0].message.content
    }
  } catch (error) {
    console.error('Outcome narrative generation error:', error)
    return {
      narrative: getBackupNarrative(body.context)
    }
  }
})