import { CloudImageProvider } from './CloudImageProvider.js'
import { fetchWithTimeout } from './imageUtils.js'

/**
 * HuggingFaceImageProvider
 * ------------------------
 * Real text-to-image via the Hugging Face Inference API. Supports diffusion
 * models such as FLUX.1-Dev, SD 3.5, and SDXL. Returns a binary image which we
 * convert to a data URL. Image editing degrades to the local renderer. Falls
 * back to the local renderer when HUGGINGFACE_API_TOKEN is absent.
 *
 * Docs: https://huggingface.co/docs/api-inference
 */
export class HuggingFaceImageProvider extends CloudImageProvider {
  constructor(env = {}) {
    super({
      id: 'huggingface',
      name: 'Hugging Face',
      apiBaseUrl: env.baseUrl || process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co',
      env: { apiKey: env.apiKey || process.env.HUGGINGFACE_API_TOKEN },
      capabilities: {
        textToImage: true,
        imageToImage: false,
        inpainting: false,
        outpainting: false,
        upscale: false,
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

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'black-forest-labs/FLUX.1-dev'
  }

  buildGenerateInput({ prompt, negativePrompt, model, steps, guidanceScale, seed }) {
    const params = { prompt }
    if (negativePrompt) params.negative_prompt = negativePrompt
    if (Number.isFinite(steps)) params.num_inference_steps = Number(steps)
    if (Number.isFinite(guidanceScale)) params.guidance_scale = Number(guidanceScale)
    if (Number.isFinite(seed)) params.seed = seed >>> 0
    return { model: this.resolveModel(model), params }
  }

  async runGenerate(body, _params) {
    const url = `${this.apiBaseUrl}/models/${body.model}`
    const headers = { 'Content-Type': 'application/json', Accept: 'image/png' }
    const key = this.getApiKey()
    if (key) headers.Authorization = `Bearer ${key}`
    const res = await fetchWithTimeout(url, {
      method: 'POST', headers, body: JSON.stringify(body.params)
    }, 120000)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HuggingFace generation failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    return [`data:image/png;base64,${buf.toString('base64')}`]
  }
}

export default HuggingFaceImageProvider
