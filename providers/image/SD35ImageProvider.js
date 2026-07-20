import { CloudImageProvider } from './CloudImageProvider.js'
import { fetchWithTimeout } from './imageUtils.js'

/**
 * SD35ImageProvider
 * -----------------
 * Stable Diffusion 3.5 (Large / Turbo / Medium) via the Stability AI REST API.
 * Uses the stable-diffusion-3.5 family of endpoints. Falls back to the local
 * renderer when STABILITY_API_KEY is absent.
 *
 * Docs: https://platform.stability.ai/docs/api-reference
 */
export class SD35ImageProvider extends CloudImageProvider {
  constructor(env = {}) {
    super({
      id: 'sd35',
      name: 'SD 3.5 (Stability)',
      apiBaseUrl: env.baseUrl || process.env.STABILITY_BASE_URL || 'https://api.stability.ai',
      env: { apiKey: env.apiKey || process.env.STABILITY_API_KEY },
      capabilities: {
        textToImage: true,
        imageToImage: true,
        inpainting: true,
        outpainting: true,
        upscale: true,
        backgroundRemoval: false,
        faceRestoration: false,
        controlNet: true
      },
      models: [
        { id: 'sd3.5-large', name: 'SD 3.5 Large', speed: 'medium', quality: 'excellent' },
        { id: 'sd3.5-large-turbo', name: 'SD 3.5 Large Turbo', speed: 'fast', quality: 'good' },
        { id: 'sd3.5-medium', name: 'SD 3.5 Medium', speed: 'medium', quality: 'good' }
      ]
    })
    this.apiVersion = env.apiVersion || 'v2beta'
  }

  getApiKeyHeader() {
    return { Authorization: `Bearer ${this.getApiKey()}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  }

  buildGenerateInput({ prompt, negativePrompt, width, height, seed, batchSize, model, steps, guidanceScale }) {
    return {
      model: model || 'sd3.5-large',
      prompt,
      negative_prompt: negativePrompt || undefined,
      width: Math.min(Math.max(Number(width) || 1024, 256), 1536),
      height: Math.min(Math.max(Number(height) || 1024, 256), 1536),
      samples: Math.min(Math.max(Number(batchSize) || 1, 1), 4),
      steps: Number.isFinite(steps) ? Number(steps) : 40,
      cfg_scale: Number.isFinite(guidanceScale) ? Number(guidanceScale) : 7,
      seed: Number.isFinite(seed) ? (seed >>> 0) : undefined,
      output_format: 'png'
    }
  }

  async runGenerate(input, _params) {
    const url = `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/sd3`
    const res = await fetchWithTimeout(url, { method: 'POST', headers: this.getApiKeyHeader(), body: JSON.stringify(input) }, 120000)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Stability SD3.5 failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    const images = (data.images || []).map((im) => `data:${im.mime_type || 'image/png'};base64,${im.base64}`)
    return images.length ? images : []
  }

  buildEditInput({ operation, prompt, negativePrompt, image, width, height, seed, model, steps, guidanceScale }) {
    if (!image) return null
    // SD3.5 supports image-to-image via the generate/sd3 with an init image.
    if (operation !== 'image-to-image') return null
    const input = this.buildGenerateInput({ prompt, negativePrompt, width, height, seed, batchSize: 1, model, steps, guidanceScale })
    input.init_image = typeof image === 'string' && image.startsWith('data:') ? image.split(',')[1] : image
    input.strength = 0.6
    delete input.seed
    return input
  }

  async runEdit(input, _params) {
    const url = `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/sd3`
    const res = await fetchWithTimeout(url, { method: 'POST', headers: this.getApiKeyHeader(), body: JSON.stringify(input) }, 120000)
    if (!res.ok) throw new Error(`Stability SD3.5 edit failed (${res.status})`)
    const data = await res.json()
    const images = (data.images || []).map((im) => `data:${im.mime_type || 'image/png'};base64,${im.base64}`)
    return images
  }
}

export default SD35ImageProvider
