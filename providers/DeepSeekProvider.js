import { CloudChatProvider } from './CloudChatProvider.js'

/**
 * DeepSeekProvider
 * ----------------
 * Real DeepSeek Chat Completions integration (deepseek-chat, deepseek-reasoner).
 * DeepSeek exposes an OpenAI-compatible endpoint, reused via the shared base.
 */
export class DeepSeekProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'deepseek',
      name: 'DeepSeek',
      apiBaseUrl: env.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      env: { apiKey: env.apiKey || process.env.DEEPSEEK_API_KEY },
      contextWindow: 64_000,
      capabilities: { chat: true, streaming: true, images: false, vision: false, tools: true },
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', speed: 'fast', quality: 'excellent', contextWindow: 64_000 },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', speed: 'medium', quality: 'excellent', contextWindow: 64_000 }
      ]
    })
  }
}

export default DeepSeekProvider
