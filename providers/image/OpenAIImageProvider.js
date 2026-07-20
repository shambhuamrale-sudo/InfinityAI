import { CloudImageProvider } from './CloudImageProvider.js'
import { fetchWithTimeout } from './imageUtils.js'

/**
 * OpenAIImageProvider
 * -------------------
 * Real DALL·E 3 / GPT-Image-1 generation via the OpenAI Images API. Supports
 * text-to-image with size, quality, and style controls. Image editing (img2img,
 * inpaint) is forwarded to the local renderer when not directly supported by the
 * chosen model. Falls back to the local renderer when OPENAI_API_KEY is absent.
 *
 * Docs: https://platform.openai.com/docs/api-reference/images
 */
export class OpenAIImageProvider extends CloudImageProvider {
  constructor(env = {}) {
    super({
      id: 'openai-image',
      name: 'OpenAI Images',
      apiBaseUrl: env.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      env: { apiKey: env.apiKey || process.env.OPENAI_API_KEY },
      capabilities: {
        textToImage: true,
        imageToImage: false,
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

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'dall-e-3'
  }

  getApiKeyHeader() {
    return { Authorization: `Bearer ${this.getApiKey()}`, 'Content-Type': 'application/json' }
  }

  buildGenerateInput({ prompt, model, width, height, batchSize }) {
    const size = this.resolveSize(width, height)
    const m = this.resolveModel(model)
    const body = { model: m, prompt, n: Math.min(Math.max(Number(batchSize) || 1, 1), 4), size }
    if (m === 'dall-e-3') {
      body.quality = 'standard'
      body.style = 'vivid'
      body.n = 1
    }
    if (m === 'gpt-image-1') {
      body.output_format = 'png'
      delete body.n
      body.size = size
    }
    return body
  }

  resolveSize(width, height) {
    const w = Number(width) || 1024
    const h = Number(height) || 1024
    const ratio = w / h
    if (Math.abs(ratio - 1) < 0.05) return '1024x1024'
    if (ratio > 1.3) return '1792x1024'
    if (ratio < 0.8) return '1024x1792'
    return '1024x1024'
  }

  async runGenerate(body, _params) {
    const res = await fetchWithTimeout(`${this.apiBaseUrl}/images/generations`, {
      method: 'POST', headers: this.getApiKeyHeader(), body: JSON.stringify(body)
    }, 120000)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI generation failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    const out = (data.data || []).map((d) => {
      if (d.b64_json) return `data:image/png;base64,${d.b64_json}`
      return d.url
    })
    return out
  }

  buildEditInput({ operation, prompt, image }) {
    // DALL·E 3 / GPT-Image-1 only support inpaint via the edits endpoint with a mask.
    if (operation !== 'inpaint') return null
    if (!image) return null
    return {
      image: typeof image === 'string' && image.startsWith('data:') ? image.split(',')[1] : image,
      prompt: prompt || '',
      model: this.resolveModel()
    }
  }

  async runEdit(input, _params) {
    const fd = new FormData()
    fd.append('model', input.model)
    fd.append('prompt', input.prompt)
    if (typeof input.image === 'string') fd.append('image', input.image)
    const res = await fetchWithTimeout(`${this.apiBaseUrl}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.getApiKey()}` },
      body: fd
    }, 120000)
    if (!res.ok) throw new Error(`OpenAI edit failed (${res.status})`)
    const data = await res.json()
    return (data.data || []).map((d) => (d.b64_json ? `data:image/png;base64,${d.b64_json}` : d.url))
  }
}

export default OpenAIImageProvider
