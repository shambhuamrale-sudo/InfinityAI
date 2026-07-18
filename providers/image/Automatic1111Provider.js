import { BaseImageProvider } from './BaseImageProvider.js'
import { fetchWithTimeout, renderPlaceholderImage } from './imageUtils.js'

/**
 * Automatic1111Provider
 * ---------------------
 * Local/self-hosted image provider for the AUTOMATIC1111 Stable Diffusion
 * WebUI (`--api` mode). Its REST API is stable and well documented, so this
 * adapter performs REAL txt2img / img2img calls when the server is reachable
 * and returns base64 PNGs. If the server is unavailable it degrades to the
 * deterministic local renderer.
 */
export class Automatic1111Provider extends BaseImageProvider {
  constructor(env = {}) {
    super({
      id: 'automatic1111',
      name: 'Automatic1111 (Local)',
      type: 'local',
      requiresApiKey: false,
      implemented: true,
      env
    })
    this.baseUrl = env.baseUrl || process.env.AUTOMATIC1111_URL || 'http://127.0.0.1:7860'
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
      const res = await fetchWithTimeout(`${this.baseUrl}/sdapi/v1/sd-models`, { method: 'GET' }, 4000)
      return res.ok
    } catch {
      return false
    }
  }

  async listModels() {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/sdapi/v1/sd-models`, { method: 'GET' }, 4000)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length) {
          return data.slice(0, 12).map((m) => ({
            id: m.title || m.model_name,
            name: m.model_name || m.title,
            provider: this.id,
            type: 'local',
            local: true,
            speed: 'medium',
            quality: 'good'
          }))
        }
      }
    } catch {
      /* fall through */
    }
    return [
      { id: 'v1-5-pruned', name: 'Stable Diffusion 1.5', provider: this.id, type: 'local', local: true, speed: 'fast', quality: 'good' },
      { id: 'sd_xl_base_1.0', name: 'SDXL Base 1.0', provider: this.id, type: 'local', local: true, speed: 'medium', quality: 'excellent' }
    ]
  }

  async generate({ prompt, negativePrompt, width = 768, height = 768, steps = 30, guidanceScale = 7, seed, batchSize = 1, model } = {}) {
    const count = Math.min(Math.max(Number(batchSize) || 1, 1), 8)
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt || '',
          width,
          height,
          steps,
          cfg_scale: guidanceScale,
          seed: Number.isFinite(seed) ? seed : -1,
          batch_size: count,
          override_settings: model ? { sd_model_checkpoint: model } : undefined
        })
      }, 120_000)
      if (res.ok) {
        const data = await res.json()
        const b64 = Array.isArray(data?.images) ? data.images : []
        if (b64.length) {
          const images = b64.map((raw, i) => ({
            url: raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`,
            seed: Number.isFinite(seed) ? seed + i : undefined,
            width,
            height
          }))
          return { images, provider: this.id, model, usedFallback: false, text: `Generated ${images.length} image(s) via Automatic1111.` }
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
      model,
      usedFallback: true,
      text: `Automatic1111 unreachable — rendered ${count} local preview(s).`
    }
  }

  async edit({ operation = 'image-to-image', prompt, negativePrompt, image, width = 768, height = 768, steps = 30, guidanceScale = 7, seed, denoisingStrength = 0.6, model } = {}) {
    // img2img covers image-to-image, inpaint, outpaint (with mask handling upstream).
    if (image && (operation === 'image-to-image' || operation === 'inpaint' || operation === 'outpaint')) {
      try {
        const initImage = image.startsWith('data:') ? image.split(',')[1] : image
        const res = await fetchWithTimeout(`${this.baseUrl}/sdapi/v1/img2img`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            init_images: [initImage],
            prompt: prompt || '',
            negative_prompt: negativePrompt || '',
            width,
            height,
            steps,
            cfg_scale: guidanceScale,
            denoising_strength: denoisingStrength,
            seed: Number.isFinite(seed) ? seed : -1,
            override_settings: model ? { sd_model_checkpoint: model } : undefined
          })
        }, 120_000)
        if (res.ok) {
          const data = await res.json()
          const b64 = Array.isArray(data?.images) ? data.images : []
          if (b64.length) {
            return {
              images: b64.map((raw) => ({ url: raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`, width, height })),
              provider: this.id,
              model,
              usedFallback: false,
              operation,
              text: `${operation} completed via Automatic1111.`
            }
          }
        }
      } catch {
        /* fall through */
      }
    }
    const outW = operation === 'upscale' ? Math.min(width * 2, 2048) : width
    const outH = operation === 'upscale' ? Math.min(height * 2, 2048) : height
    const result = renderPlaceholderImage({ prompt: prompt || operation, width: outW, height: outH, seed, label: operation })
    return { images: [result], provider: this.id, model, usedFallback: true, operation, text: `${operation} preview rendered locally.` }
  }
}

export default Automatic1111Provider
