import { PlaceholderImageProvider } from './PlaceholderImageProvider.js'

/**
 * ReplicateImageProvider (placeholder) — hosted model runner.
 */
export class ReplicateImageProvider extends PlaceholderImageProvider {
  constructor(env = {}) {
    super({
      id: 'replicate',
      name: 'Replicate',
      apiBaseUrl: env.baseUrl || process.env.REPLICATE_BASE_URL || 'https://api.replicate.com/v1',
      env: { apiKey: env.apiKey || process.env.REPLICATE_API_TOKEN },
      capabilities: {
        textToImage: true,
        imageToImage: true,
        inpainting: true,
        outpainting: true,
        upscale: true,
        backgroundRemoval: true,
        faceRestoration: true,
        controlNet: true
      },
      models: [
        { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro', speed: 'medium', quality: 'excellent' },
        { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', speed: 'fast', quality: 'good' },
        { id: 'stability-ai/sdxl', name: 'SDXL', speed: 'medium', quality: 'excellent' }
      ]
    })
  }
}

export default ReplicateImageProvider
