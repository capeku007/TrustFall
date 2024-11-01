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
    const prompt = `As a cunning Dungeon Master in a game of trust and betrayal, generate 3 dramatic lines of dialogue for this scenario:
    Current Round: ${body.context.roundNumber}
    Round Theme: ${body.context.roundTheme}
    Previous Choice: ${body.context.previousChoice || 'None'}
    Active Consequences: ${body.context.consequences?.join(', ') || 'None'}
    Dice Roll Result: ${body.context.diceResult || 'Not rolled yet'}
    
    Make it dramatic, personal, and reference past choices if any. Focus on the tension between trust and betrayal.
    Return only the three lines of dialogue, separated by line breaks.`

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 150
    })

    return {
      lines: completion.choices[0].message.content.split('\n')
        .filter(line => line.trim().length > 0)
    }
  } catch (error) {
    console.error('DM narration generation error:', error)
    return {
      lines: [
        "The air grows thick with tension...",
        "Your choices echo in the shadows.",
        "What will you decide?"
      ]
    }
  }
})