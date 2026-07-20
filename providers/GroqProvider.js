import { CloudChatProvider } from './CloudChatProvider.js'

/**
 * GroqProvider
 * ------------
 * Real Groq integration. Groq exposes an OpenAI-compatible Chat Completions
 * endpoint with extremely low-latency inference. Reuses the shared cloud base.
 */
export class GroqProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'groq',
      name: 'Groq',
      apiBaseUrl: env.baseUrl || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      env: { apiKey: env.apiKey || process.env.GROQ_API_KEY },
      contextWindow: 32_000,
      capabilities: { chat: true, streaming: true, images: false, vision: false, tools: true },
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', speed: 'very-fast', quality: 'excellent', contextWindow: 128_000 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', speed: 'very-fast', quality: 'good', contextWindow: 131_072 },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)', speed: 'very-fast', quality: 'good', contextWindow: 32_768 },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B (Groq)', speed: 'very-fast', quality: 'good', contextWindow: 8_192 }
      ]
    })
  }
}

export default GroqProvider
