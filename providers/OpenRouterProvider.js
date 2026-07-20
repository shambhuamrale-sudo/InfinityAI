import { CloudChatProvider } from './CloudChatProvider.js'

/**
 * OpenRouterProvider
 * ------------------
 * Real OpenRouter integration — an aggregator over many upstream models via an
 * OpenAI-compatible API. Adds the OpenRouter referral headers recommended by
 * their docs. Falls back gracefully when no API key is configured.
 */
export class OpenRouterProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'openrouter',
      name: 'OpenRouter',
      apiBaseUrl: env.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      env: { apiKey: env.apiKey || process.env.OPENROUTER_API_KEY },
      contextWindow: 200_000,
      capabilities: { chat: true, streaming: true, images: false, vision: true, tools: true },
      models: [
        { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', speed: 'fast', quality: 'excellent', contextWindow: 128_000 },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', speed: 'fast', quality: 'excellent', contextWindow: 200_000 },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (via OpenRouter)', speed: 'medium', quality: 'good', contextWindow: 131_072 },
        { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5 (via OpenRouter)', speed: 'very-fast', quality: 'good', contextWindow: 1_000_000 }
      ]
    })
  }

  authHeaders(apiKey) {
    return {
      Authorization: `Bearer ${apiKey || this.getApiKey()}`,
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://infinityai.app',
      'X-Title': 'InfinityAI'
    }
  }

  extractUsage(data) {
    const u = data?.usage
    if (!u) return undefined
    return {
      promptTokens: u.prompt_tokens ?? u.promptTokens,
      completionTokens: u.completion_tokens ?? u.completionTokens,
      totalTokens: u.total_tokens ?? u.totalTokens
    }
  }
}

export default OpenRouterProvider
