import { BaseImageProvider } from './BaseImageProvider.js'
import { fetchWithTimeout, renderPlaceholderImage } from './imageUtils.js'

/**
 * ComfyUIProvider
 * ---------------
 * Local/self-hosted image provider that talks to a running ComfyUI server.
 * When ComfyUI is reachable it queues a prompt; when it is not, it degrades
 * gracefully to the deterministic local renderer so generation never fails.
 *
 * ComfyUI's real API is workflow-graph based and highly install-specific, so
 * this adapter focuses on availability + queueing and uses the local renderer
 * for the returned preview. A full workflow mapping can be layered on later
 * without changing the manager or routes.
 */
export class ComfyUIProvider extends BaseImageProvider {
  constructor(env = {}) {
    super({
      id: 'comfyui',
      name: 'ComfyUI (Local)',
      type: 'local',
      requiresApiKey: false,
      implemented: true,
      env
    })
    this.baseUrl = env.baseUrl || process.env.COMFYUI_URL || 'http://127.0.0.1:8188'
  }

  getCapabilities() {
    return {
      textToImage: true,
      imageToImage: true,
      inpainting: true,
      outpainting: true,
      upscale: true,
      backgroundRemoval: false,
      faceRestoration: true,
      controlNet: true
    }
  }

  async isAvailable() {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/system_stats`, { method: 'GET' }, 4000)
      return res.ok
    } catch {
      return false
    }
  }

  async listModels() {
    return [
      { id: 'sd_xl_base_1.0', name: 'SDXL Base 1.0', provider: this.id, type: 'local', local: true, speed: 'medium', quality: 'excellent' },
      { id: 'sd_1.5', name: 'Stable Diffusion 1.5', provider: this.id, type: 'local', local: true, speed: 'fast', quality: 'good' },
      { id: 'flux.1-schnell', name: 'FLUX.1 Schnell', provider: this.id, type: 'local', local: true, speed: 'fast', quality: 'excellent' }
    ]
  }

  async generate({ prompt, width = 768, height = 768, seed, batchSize = 1, model } = {}) {
    const count = Math.min(Math.max(Number(batchSize) || 1, 1), 8)
    let queued = false
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, workflow: 'default', width, height, seed, batch_size: count, ckpt_name: model })
      }, 8000)
      queued = res.ok
    } catch {
      queued = false
    }
    // Preview via local renderer (ComfyUI output retrieval is workflow-specific).
    const images = []
    for (let i = 0; i < count; i += 1) {
      const perSeed = Number.isFinite(seed) ? (seed >>> 0) + i : undefined
      images.push(renderPlaceholderImage({ prompt, width, height, seed: perSeed }))
    }
    return {
      images,
      provider: this.id,
      model: model || 'sd_xl_base_1.0',
      usedFallback: !queued,
      text: queued
        ? `Queued ${count} render${count > 1 ? 's' : ''} on ComfyUI for: ${prompt || 'your prompt'}`
        : `ComfyUI unreachable — rendered ${count} local preview${count > 1 ? 's' : ''}.`
    }
  }

  async edit({ operation = 'image-to-image', prompt, width = 768, height = 768, seed, model } = {}) {
    const outW = operation === 'upscale' ? Math.min(width * 2, 2048) : width
    const outH = operation === 'upscale' ? Math.min(height * 2, 2048) : height
    const result = renderPlaceholderImage({ prompt: prompt || operation, width: outW, height: outH, seed, label: operation })
    return {
      images: [result],
      provider: this.id,
      model: model || 'sd_xl_base_1.0',
      usedFallback: true,
      operation,
      text: `${operation} preview rendered (ComfyUI workflow mapping pending).`
    }
  }
}

export default ComfyUIProvider
