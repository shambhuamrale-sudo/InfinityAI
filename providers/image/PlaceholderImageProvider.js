import { BaseImageProvider } from './BaseImageProvider.js'
import { renderPlaceholderImage } from './imageUtils.js'

/**
 * PlaceholderImageProvider
 * ------------------------
 * Base class for cloud image providers that are wired with correct interfaces,
 * configuration, model catalogs, and API-key validation scaffolding, but whose
 * live network call is intentionally deferred until credentials are configured
 * and the provider is activated (per Phase 4: "Others should use the same
 * modular provider architecture with placeholders until configured").
 *
 * When an API key is present, {@link isConfigured}/{@link isAvailable} report
 * "ready". The generation call always returns a graceful, clearly-labeled
 * local preview so the Studio never breaks and no secret is ever required to
 * demo the workflow.
 */
export class PlaceholderImageProvider extends BaseImageProvider {
  /**
   * @param {object} config
   * @param {string} config.id
   * @param {string} config.name
   * @param {string} config.apiBaseUrl
   * @param {Array<object>} config.models
   * @param {object} [config.env]
   * @param {object} [config.capabilities]
   */
  constructor(config = {}) {
    super({
      id: config.id,
      name: config.name,
      type: 'cloud',
      requiresApiKey: true,
      implemented: false,
      env: config.env || {}
    })
    this.apiBaseUrl = config.apiBaseUrl
    this._models = (config.models || []).map((m) => ({ provider: this.id, type: 'cloud', local: false, ...m }))
    this._capabilities = config.capabilities || {
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

  getCapabilities() {
    return { ...this._capabilities }
  }

  async isAvailable() {
    return this.isConfigured()
  }

  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    if (typeof key !== 'string' || key.length < 8) return { valid: false, reason: 'malformed-key' }
    return { valid: true, reason: 'unverified', note: 'Key present; live verification pending provider activation.' }
  }

  async listModels() {
    return this._models.map((m) => ({ ...m }))
  }

  async generate({ prompt, width = 768, height = 768, seed, batchSize = 1, model } = {}) {
    const count = Math.min(Math.max(Number(batchSize) || 1, 1), 8)
    const images = []
    for (let i = 0; i < count; i += 1) {
      const perSeed = Number.isFinite(seed) ? (seed >>> 0) + i : undefined
      images.push(renderPlaceholderImage({ prompt, width, height, seed: perSeed, label: this.name }))
    }
    return {
      images,
      provider: this.id,
      model: model || this._models[0]?.id,
      usedFallback: true,
      note: `${this.name} is configured as a placeholder. Add credentials and activate to enable live generation.`,
      text: `Local preview for ${this.name}: ${prompt || 'your prompt'}`
    }
  }

  async edit({ operation = 'image-to-image', prompt, width = 768, height = 768, seed, model } = {}) {
    const outW = operation === 'upscale' ? Math.min(width * 2, 2048) : width
    const outH = operation === 'upscale' ? Math.min(height * 2, 2048) : height
    const result = renderPlaceholderImage({ prompt: prompt || operation, width: outW, height: outH, seed, label: this.name })
    return {
      images: [result],
      provider: this.id,
      model: model || this._models[0]?.id,
      usedFallback: true,
      operation,
      note: `${this.name} editing is a placeholder. Add credentials and activate to enable live editing.`,
      text: `Local ${operation} preview for ${this.name}.`
    }
  }
}

export default PlaceholderImageProvider
