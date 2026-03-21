import groq from '../configs/groq'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const chatWithFallback = async (messages: Message[]) => {
  console.log('Calling Groq API...')
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 8000,
    temperature: 0.7,
  })
  console.log('Groq responded successfully')
  return response
}
