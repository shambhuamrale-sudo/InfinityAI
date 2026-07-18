import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * DeepSeekProvider (placeholder).
 */
export class DeepSeekProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'deepseek',
      name: 'DeepSeek',
      apiBaseUrl: env.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      env: { apiKey: env.apiKey || process.env.DEEPSEEK_API_KEY },
      capabilities: { chat: true, streaming: true, images: false, vision: false, tools: true },
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', speed: 'fast', quality: 'excellent' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', speed: 'medium', quality: 'excellent' }
      ]
    })
  }
}

export default DeepSeekProvider
