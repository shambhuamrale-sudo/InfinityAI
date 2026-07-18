import { PlaceholderImageProvider } from './PlaceholderImageProvider.js'

/**
 * OpenAIImageProvider (placeholder) — DALL·E / gpt-image models.
 */
export class OpenAIImageProvider extends PlaceholderImageProvider {
  constructor(env = {}) {
    super({
      id: 'openai-image',
      name: 'OpenAI Images',
      apiBaseUrl: env.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      env: { apiKey: env.apiKey || process.env.OPENAI_API_KEY },
      capabilities: {
        textToImage: true,
        imageToImage: true,
        inpainting: true,
        outpainting: false,
        upscale: false,
        backgroundRemoval: false,
        faceRestoration: false,
        controlNet: false
      },
      models: [
        { id: 'gpt-image-1', name: 'GPT Image 1', speed: 'medium', quality: 'excellent' },
        { id: 'dall-e-3', name: 'DALL·E 3', speed: 'medium', quality: 'excellent' },
        { id: 'dall-e-2', name: 'DALL·E 2', speed: 'fast', quality: 'good' }
      ]
    })
  }
}

export default OpenAIImageProvider
