import { CloudChatProvider } from './CloudChatProvider.js'

/**
 * MistralProvider
 * ---------------
 * Real Mistral Chat Completions integration (Mistral Large, Small, Mixtral).
 * Mistral's API is OpenAI-compatible, so it reuses the shared cloud base.
 */
export class MistralProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'mistral',
      name: 'Mistral',
      apiBaseUrl: env.baseUrl || process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
      env: { apiKey: env.apiKey || process.env.MISTRAL_API_KEY },
      contextWindow: 32_000,
      capabilities: { chat: true, streaming: true, images: false, vision: false, tools: true },
      models: [
        { id: 'mistral-large-latest', name: 'Mistral Large', speed: 'medium', quality: 'excellent', contextWindow: 128_000 },
        { id: 'mistral-small-latest', name: 'Mistral Small', speed: 'fast', quality: 'good', contextWindow: 32_000 },
        { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', speed: 'medium', quality: 'excellent', contextWindow: 64_000 }
      ]
    })
  }
}

export default MistralProvider
