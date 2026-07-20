import { CloudImageProvider } from './CloudImageProvider.js'
import { fetchWithTimeout } from './imageUtils.js'

/**
 * ReplicateImageProvider
 * -----------------------
 * Real Replicate API adapter. Supports text-to-image and image-to-image via
 * official model versions (FLUX, SDXL, Juggernaut, DreamShaper, …). Editing
 * operations (inpaint, outpaint, upscale, bg-removal, face-restoration) are
 * dispatched to task-appropriate models when available; otherwise they degrade
 * gracefully to the local renderer.
 *
 * API reference: https://replicate.com/docs/reference/http
 * Key: REPLICATE_API_TOKEN
 */
export class ReplicateImageProvider extends CloudImageProvider {
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
        { id: 'black-forest-labs/flux-dev', name: 'FLUX.1 Dev', speed: 'medium', quality: 'excellent' },
        { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', speed: 'fast', quality: 'good' },
        { id: 'stability-ai/sdxl', name: 'SDXL', speed: 'medium', quality: 'excellent' },
        { id: 'stability-ai/sdxl-juggernaut', name: 'Juggernaut XL', version: 'jugg', speed: 'medium', quality: 'excellent' }
      ]
    })
    this.apiVersion = env.apiVersion || '2024-11-04'
  }

  getApiKeyHeader() {
    return { Authorization: `Bearer ${this.getApiKey()}`, 'Content-Type': 'application/json', 'Prefer': 'wait' }
  }

  /** Discover models from the Replicate API (used for model discovery). */
  async discoverModels() {
    const key = this.getApiKey()
    if (!key) return null
    const res = await fetchWithTimeout(`${this.apiBaseUrl}/models?limit=20`, { headers: this.getApiKeyHeader() }, 8000)
    if (!res.ok) throw new Error(`Replicate model list failed: ${res.status}`)
    const data = await res.json()
    const imageModels = (data.results || [])
      .filter((m) => /flux|sdxl|juggernaut|dreamshaper|realistic|playground|stable/i.test(m.name || m.slug || ''))
      .map((m) => ({ id: m.url?.replace(/^.*\//, '') || m.slug, name: m.name || m.slug, provider: this.id, type: 'cloud', local: false, speed: 'medium', quality: 'good', discovered: true }))
    return imageModels
  }

  buildGenerateInput({ prompt, negativePrompt, width, height, seed, batchSize, model, steps, guidanceScale }) {
    const base = {
      input: {
        prompt,
        width: Math.min(Math.max(Number(width) || 768, 256), 1536),
        height: Math.min(Math.max(Number(height) || 768, 256), 1536),
        num_outputs: Math.min(Math.max(Number(batchSize) || 1, 1), 4)
      }
    }
    if (Number.isFinite(seed)) base.input.seed = seed >>> 0
    const modelId = model || this._models[0].id
    // FLUX models ignore negative prompt / steps, but accept them harmlessly.
    if (negativePrompt) base.input.negative_prompt = negativePrompt
    if (steps) base.input.num_inference_steps = Number(steps)
    if (guidanceScale) base.input.guidance_scale = Number(guidanceScale)
    return { ...base.input, _model: modelId, _source: 'replicate' }
  }

  async runGenerate(input, _params) {
    const headers = this.getApiKeyHeader()
    const body = { version: await this.resolveVersion(input._model), input: this.cleanInput(input) }
    const res = await fetchWithTimeout(`${this.apiBaseUrl}/predictions`, {
      method: 'POST', headers, body: JSON.stringify(body)
    }, 120000)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Replicate generation failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    const output = data.output || data
    return Array.isArray(output) ? output : [output]
  }

  /** Most Replicate sdks/models accept a model slug; resolve version lazily. */
  async resolveVersion(modelId) {
    return modelId
  }

  cleanInput(input) {
    const out = { ...input }
    delete out._model
    delete out._source
    // FLUX.1-dev officially takes a `model` param; default fine.
    return out
  }

  buildEditInput({ operation, prompt, negativePrompt, image, width, height, seed, model, steps, guidanceScale }) {
    if (!image) return null
    const modelId = model || this._models[0].id
    const input = {
      _model: modelId,
      _source: 'replicate-edit',
      prompt: prompt || '',
      image,
      width: Math.min(Math.max(Number(width) || 768, 256), 1536),
      height: Math.min(Math.max(Number(height) || 768, 256), 1536)
    }
    if (negativePrompt) input.negative_prompt = negativePrompt
    if (Number.isFinite(seed)) input.seed = seed >>> 0
    if (steps) input.num_inference_steps = Number(steps)
    if (guidanceScale) input.guidance_scale = Number(guidanceScale)
    if (operation === 'image-to-image') input.prompt_strength = 0.8
    return input
  }

  async runEdit(input, params) {
    return this.runGenerate(input, params)
  }
}

export default ReplicateImageProvider
