import { BaseImageProvider } from './BaseImageProvider.js'
import { fetchWithTimeout, renderPlaceholderImage } from './imageUtils.js'

/**
 * OllamaImageProvider
 * -------------------
 * Local provider for Ollama-compatible image runtimes. Ollama's core does not
 * yet expose native text-to-image, but the ecosystem includes OpenAI-compatible
 * local image servers (e.g. LocalAI, `sd`-style bridges) that mirror the
 * `/v1/images/generations` contract. This adapter targets that shape when a
 * compatible endpoint is reachable and otherwise degrades to the deterministic
 * local renderer, so it always works immediately as a local provider.
 */
export class OllamaImageProvider extends BaseImageProvider {
  constructor(env = {}) {
    super({
      id: 'ollama-image',
      name: 'Ollama-compatible (Local)',
      type: 'local',
      requiresApiKey: false,
      implemented: true,
      env
    })
    this.baseUrl = env.baseUrl || process.env.OLLAMA_IMAGE_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
  }

  getCapabilities() {
    return {
      textToImage: true,
      imageToImage: false,
      inpainting: false,
      outpainting: false,
      upscale: false,
      backgroundRemoval: false,
      faceRestoration: false,
      controlNet: false
    }
  }

  async isAvailable() {
    // Reachable base URL is enough to consider it available; the image endpoint
    // is probed lazily during generation with graceful fallback.
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' }, 3000)
      return res.ok
    } catch {
      return false
    }
  }

  async listModels() {
    return [
      { id: 'sd-local', name: 'Local Diffusion (compatible)', provider: this.id, type: 'local', local: true, speed: 'fast', quality: 'good' }
    ]
  }

  async generate({ prompt, width = 768, height = 768, seed, batchSize = 1, model } = {}) {
    const count = Math.min(Math.max(Number(batchSize) || 1, 1), 8)
    // Try an OpenAI-compatible local images endpoint if present.
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, n: count, size: `${width}x${height}`, model: model || 'sd-local', response_format: 'b64_json' })
      }, 60_000)
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data?.data) ? data.data : []
        const images = items
          .map((it, i) => {
            if (it.b64_json) return { url: `data:image/png;base64,${it.b64_json}`, seed: Number.isFinite(seed) ? seed + i : undefined, width, height }
            if (it.url) return { url: it.url, seed: Number.isFinite(seed) ? seed + i : undefined, width, height }
            return null
          })
          .filter(Boolean)
        if (images.length) {
          return { images, provider: this.id, model: model || 'sd-local', usedFallback: false, text: `Generated ${images.length} image(s) via Ollama-compatible endpoint.` }
        }
      }
    } catch {
      /* fall through to local renderer */
    }
    const images = []
    for (let i = 0; i < count; i += 1) {
      const perSeed = Number.isFinite(seed) ? (seed >>> 0) + i : undefined
      images.push(renderPlaceholderImage({ prompt, width, height, seed: perSeed }))
    }
    return {
      images,
      provider: this.id,
      model: model || 'sd-local',
      usedFallback: true,
      text: `No compatible local image endpoint — rendered ${count} local preview(s).`
    }
  }

  async edit({ operation = 'image-to-image', prompt, width = 768, height = 768, seed, model } = {}) {
    const outW = operation === 'upscale' ? Math.min(width * 2, 2048) : width
    const outH = operation === 'upscale' ? Math.min(height * 2, 2048) : height
    const result = renderPlaceholderImage({ prompt: prompt || operation, width: outW, height: outH, seed, label: operation })
    return { images: [result], provider: this.id, model: model || 'sd-local', usedFallback: true, operation, text: `${operation} preview rendered locally.` }
  }
}

export default OllamaImageProvider
