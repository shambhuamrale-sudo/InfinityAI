import { PlaceholderProvider } from './PlaceholderProvider.js'

/**
 * GeminiProvider (placeholder) — Google Gemini.
 */
export class GeminiProvider extends PlaceholderProvider {
  constructor(env = {}) {
    super({
      id: 'gemini',
      name: 'Google Gemini',
      apiBaseUrl: env.baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      env: { apiKey: env.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY },
      capabilities: { chat: true, streaming: true, images: false, vision: true, tools: true },
      models: [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', speed: 'medium', quality: 'excellent' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', speed: 'very-fast', quality: 'good' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', speed: 'very-fast', quality: 'excellent' }
      ]
    })
  }
}

export default GeminiProvider
