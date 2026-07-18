import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * OpenRouterProvider (placeholder) — aggregator of many upstream models.
 */
export class OpenRouterProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'openrouter',
      name: 'OpenRouter',
      apiBaseUrl: env.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      env: { apiKey: env.apiKey || process.env.OPENROUTER_API_KEY },
      capabilities: { chat: true, streaming: true, images: false, vision: true, tools: true },
      models: [
        { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', speed: 'fast', quality: 'excellent' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', speed: 'fast', quality: 'excellent' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (via OpenRouter)', speed: 'medium', quality: 'good' },
        { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5 (via OpenRouter)', speed: 'very-fast', quality: 'good' }
      ]
    })
  }
}

export default OpenRouterProvider
