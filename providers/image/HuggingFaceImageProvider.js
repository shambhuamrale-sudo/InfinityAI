import { PlaceholderImageProvider } from './PlaceholderImageProvider.js'

/**
 * HuggingFaceImageProvider (placeholder) — Inference API / endpoints.
 */
export class HuggingFaceImageProvider extends PlaceholderImageProvider {
  constructor(env = {}) {
    super({
      id: 'huggingface',
      name: 'Hugging Face',
      apiBaseUrl: env.baseUrl || process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co',
      env: { apiKey: env.apiKey || process.env.HUGGINGFACE_API_KEY },
      capabilities: {
        textToImage: true,
        imageToImage: true,
        inpainting: true,
        outpainting: false,
        upscale: true,
        backgroundRemoval: false,
        faceRestoration: false,
        controlNet: false
      },
      models: [
        { id: 'black-forest-labs/FLUX.1-dev', name: 'FLUX.1 Dev', speed: 'medium', quality: 'excellent' },
        { id: 'stabilityai/stable-diffusion-3.5-large', name: 'SD 3.5 Large', speed: 'medium', quality: 'excellent' },
        { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base 1.0', speed: 'fast', quality: 'good' }
      ]
    })
  }
}

export default HuggingFaceImageProvider
