import { CloudChatProvider } from './CloudChatProvider.js'

/**
 * OpenAIProvider
 * --------------
 * Real OpenAI Chat Completions integration (GPT-4o, GPT-4o mini, etc.) with
 * non-streaming and SSE streaming support. Falls back gracefully when no API
 * key is configured.
 */
export class OpenAIProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'openai',
      name: 'OpenAI',
      apiBaseUrl: env.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      env: { apiKey: env.apiKey || process.env.OPENAI_API_KEY },
      contextWindow: 128_000,
      capabilities: { chat: true, streaming: true, images: true, vision: true, tools: true },
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', speed: 'fast', quality: 'excellent', contextWindow: 128_000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o mini', speed: 'very-fast', quality: 'good', contextWindow: 128_000 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', speed: 'medium', quality: 'excellent', contextWindow: 128_000 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', speed: 'very-fast', quality: 'good', contextWindow: 16_385 }
      ]
    })
  }
}

export default OpenAIProvider
