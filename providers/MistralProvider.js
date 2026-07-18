import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * MistralProvider (placeholder).
 */
export class MistralProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'mistral',
      name: 'Mistral',
      apiBaseUrl: env.baseUrl || process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
      env: { apiKey: env.apiKey || process.env.MISTRAL_API_KEY },
      capabilities: { chat: true, streaming: true, images: false, vision: false, tools: true },
      models: [
        { id: 'mistral-large-latest', name: 'Mistral Large', speed: 'medium', quality: 'excellent' },
        { id: 'mistral-small-latest', name: 'Mistral Small', speed: 'fast', quality: 'good' },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', speed: 'medium', quality: 'excellent' }
      ]
    })
  }
}

export default MistralProvider
