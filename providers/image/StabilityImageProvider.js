import { PlaceholderImageProvider } from './PlaceholderImageProvider.js'

/**
 * StabilityImageProvider (placeholder) — Stability AI (SDXL, SD3, …).
 */
export class StabilityImageProvider extends PlaceholderImageProvider {
  constructor(env = {}) {
    super({
      id: 'stability',
      name: 'Stability AI',
      apiBaseUrl: env.baseUrl || process.env.STABILITY_BASE_URL || 'https://api.stability.ai',
      env: { apiKey: env.apiKey || process.env.STABILITY_API_KEY },
      capabilities: {
        textToImage: true,
        imageToImage: true,
        inpainting: true,
        outpainting: true,
        upscale: true,
        backgroundRemoval: true,
        faceRestoration: false,
        controlNet: true
      },
      models: [
        { id: 'stable-diffusion-3.5-large', name: 'Stable Diffusion 3.5 Large', speed: 'medium', quality: 'excellent' },
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', speed: 'medium', quality: 'excellent' },
        { id: 'stable-image-core', name: 'Stable Image Core', speed: 'fast', quality: 'good' }
      ]
    })
  }
}

export default StabilityImageProvider
