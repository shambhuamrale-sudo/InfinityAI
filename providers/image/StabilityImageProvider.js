import { CloudImageProvider } from './CloudImageProvider.js'
import { fetchWithTimeout } from './imageUtils.js'

/**
 * StabilityImageProvider
 * ----------------------
 * Real Stable Diffusion generation via the Stability AI REST API: SDXL 1.0,
 * Stable Image Core/Ultra, plus SD3.5 via the SD3 endpoints. Supports
 * text-to-image and image-to-image. Inpainting/outpainting/upscale route to the
 * appropriate stable-image endpoints. Falls back to the local renderer when
 * STABILITY_API_KEY is absent.
 *
 * Docs: https://platform.stability.ai/docs/api-reference
 */
export class StabilityImageProvider extends CloudImageProvider {
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
        { id: 'sd3.5-large', name: 'SD 3.5 Large', speed: 'medium', quality: 'excellent' },
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', speed: 'medium', quality: 'excellent' },
        { id: 'stable-image-core', name: 'Stable Image Core', speed: 'fast', quality: 'good' },
        { id: 'stable-image-ultra', name: 'Stable Image Ultra', speed: 'medium', quality: 'excellent' }
      ]
    })
    this.apiVersion = env.apiVersion || 'v2beta'
  }

  getApiKeyHeader() {
    return { Authorization: `Bearer ${this.getApiKey()}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  }

  buildGenerateInput({ prompt, negativePrompt, width, height, seed, batchSize, model, steps, guidanceScale }) {
    const m = model || 'sd3.5-large'
    return {
      model: m,
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

  endpointFor(model) {
    const m = model || 'sd3.5-large'
    if (m.startsWith('sd3')) return `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/sd3`
    if (m.startsWith('stable-diffusion-xl')) return `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/sd-xl`
    if (m.startsWith('stable-image-core')) return `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/core`
    if (m.startsWith('stable-image-ultra')) return `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/ultra`
    return `${this.apiBaseUrl}/${this.apiVersion}/stable-image/generate/sd3`
  }

  async runGenerate(input, _params) {
    const url = this.endpointFor(input.model)
    const res = await fetchWithTimeout(url, { method: 'POST', headers: this.getApiKeyHeader(), body: JSON.stringify(input) }, 120000)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Stability generation failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    return (data.images || []).map((im) => `data:${im.mime_type || 'image/png'};base64,${im.base64}`)
  }

  buildEditInput({ operation, prompt, negativePrompt, image, seed, model, _steps, _guidanceScale }) {
    if (!image) return null
    const b64 = typeof image === 'string' && image.startsWith('data:') ? image.split(',')[1] : image
    const base = {
      prompt,
      negative_prompt: negativePrompt || undefined,
      init_image: b64,
      seed: Number.isFinite(seed) ? (seed >>> 0) : undefined,
      output_format: 'png'
    }
    const m = model || 'sd3.5-large'
    if (operation === 'image-to-image') {
      base.strength = 0.6
      return { _endpoint: this.endpointFor(m), ...base }
    }
    if (operation === 'inpaint') {
      base.mode = 'mask_comment' // requires mask; best-effort via local when absent
      return { _endpoint: `${this.apiBaseUrl}/${this.apiVersion}/stable-image/edit/inpaint`, ...base }
    }
    if (operation === 'outpaint') {
      base.left = 256; base.right = 256; base.up = 256; base.down = 256
      return { _endpoint: `${this.apiBaseUrl}/${this.apiVersion}/stable-image/edit/outpaint`, ...base }
    }
    if (operation === 'upscale') {
      return { _endpoint: `${this.apiBaseUrl}/${this.apiVersion}/stable-image/upscale`, init_image: b64, output_format: 'png' }
    }
    if (operation === 'background-removal') {
      return { _endpoint: `${this.apiBaseUrl}/${this.apiVersion}/stable-image/edit/remove-background`, init_image: b64, output_format: 'png' }
    }
    return null
  }

  async runEdit(input, _params) {
    const { _endpoint, ...body } = input
    const res = await fetchWithTimeout(_endpoint, { method: 'POST', headers: this.getApiKeyHeader(), body: JSON.stringify(body) }, 120000)
    if (!res.ok) throw new Error(`Stability edit failed (${res.status})`)
    const data = await res.json()
    return (data.images || []).map((im) => `data:${im.mime_type || 'image/png'};base64,${im.base64}`)
  }
}

export default StabilityImageProvider
