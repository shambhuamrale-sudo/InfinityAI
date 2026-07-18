import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * AnthropicProvider (placeholder) — Anthropic Claude.
 */
export class AnthropicProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'anthropic',
      name: 'Anthropic Claude',
      apiBaseUrl: env.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
      env: { apiKey: env.apiKey || process.env.ANTHROPIC_API_KEY },
      capabilities: { chat: true, streaming: true, images: false, vision: true, tools: true },
      models: [
        { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', speed: 'fast', quality: 'excellent' },
        { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', speed: 'very-fast', quality: 'good' },
        { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', speed: 'medium', quality: 'excellent' }
      ]
    })
  }
}

export default AnthropicProvider
