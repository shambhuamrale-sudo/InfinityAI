import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * OpenAIProvider (placeholder)
 * Interface + config + model catalog ready; live calls activated later.
 */
export class OpenAIProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'openai',
      name: 'OpenAI',
      apiBaseUrl: env.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      env: { apiKey: env.apiKey || process.env.OPENAI_API_KEY },
      capabilities: { chat: true, streaming: true, images: true, vision: true, tools: true },
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', speed: 'fast', quality: 'excellent' },
        { id: 'gpt-4o-mini', name: 'GPT-4o mini', speed: 'very-fast', quality: 'good' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', speed: 'medium', quality: 'excellent' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', speed: 'very-fast', quality: 'good' }
      ]
    })
  }
}

export default OpenAIProvider
