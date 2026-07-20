import { BaseImageProvider } from './BaseImageProvider.js'
import { LocalImageProvider } from './LocalImageProvider.js'
import { renderPlaceholderImage } from './imageUtils.js'

/**
 * CloudImageProvider
 * ------------------
 * Shared base for real cloud image-generation adapters. It implements the full
 * normalized contract (generate / edit with every parameter, graceful fallback)
 * and leaves only the transport-specific work to subclasses via the hooks:
 *   - buildGenerateInput(params) → API request payload
 *   - runGenerate(input, params) → array of image URL strings
 *   - buildEditInput(params)     → API request payload for editing
 *   - runEdit(input, params)     → array of image URL strings
 *
 * Every provider:
 *   - reads its API key from env (REPLICATE_API_TOKEN, STABILITY_API_KEY, …)
 *   - degrades to the LocalImageProvider when the key is missing or the call
 *     fails, so the Image Studio never breaks and no secret is ever required.
 */
export class CloudImageProvider extends BaseImageProvider {
  /** @param {object} config */
  constructor(config = {}) {
    super({
      id: config.id,
      name: config.name,
      type: 'cloud',
      requiresApiKey: true,
      implemented: true,
      env: config.env || {}
    })
    this.apiBaseUrl = config.apiBaseUrl
    this._models = (config.models || []).map((m) => ({ provider: this.id, type: 'cloud', local: false, ...m }))
    this._capabilities = config.capabilities || {
      textToImage: true,
      imageToImage: true,
      inpainting: true,
      outpainting: true,
      upscale: true,
      backgroundRemoval: true,
      faceRestoration: true,
      controlNet: false
    }
    this.fallback = new LocalImageProvider()
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
    return { valid: true, reason: 'verified-on-use', note: 'Key present; verified on first generation.' }
  }

  async listModels() {
    let models = this._models.map((m) => ({ ...m }))
    try {
      const discovered = await this.discoverModels?.()
      if (Array.isArray(discovered) && discovered.length) models = discovered
    } catch {
      /* keep static catalog */
    }
    return models
  }

  /** @returns {string} resolved model id for the request. */
  resolveModel(model, fallbackId) {
    const known = this._models.map((m) => m.id)
    if (model && known.includes(model)) return model
    return model || fallbackId || known[0]?.id || ''
  }

  /**
   * Normalize whatever a provider returned into { url, seed, width, height }.
   * Accepts a data URL string, a remote URL string, or an object.
   */
  normalizeImage(item, params, _index) {
    let url
    let width = params.width
    let height = params.height
    let seed = params.seed
    if (typeof item === 'string') url = item
    else if (item && typeof item === 'object') {
      url = item.url || item.dataURL || item.data_url || item.output || item
      width = item.width || width
      height = item.height || height
      seed = item.seed ?? seed
    }
    if (typeof url === 'object' && url?.url) url = url.url
    if (!url) return null
    return { url: String(url), seed: Number.isFinite(seed) ? seed >>> 0 : undefined, width, height }
  }

  /** Subclasses must implement. Returns the request payload object. */
  buildGenerateInput(_params) {
    throw new Error(`buildGenerateInput not implemented for ${this.id}`)
  }

  /** Subclasses must implement. Returns an array of image URL strings. */
  async runGenerate(_input, _params) {
    throw new Error(`runGenerate not implemented for ${this.id}`)
  }

  /** Subclasses may override. Default: not supported → fall back to local. */
  buildEditInput(_params) {
    return null
  }

  async runEdit(_input, _params) {
    throw new Error(`runEdit not implemented for ${this.id}`)
  }

  async generate(params = {}) {
    const {
      prompt,
      negativePrompt,
      width = 768,
      height = 768,
      seed,
      batchSize = 1,
      model,
      steps,
      guidanceScale
    } = params

    if (!this.isConfigured()) {
      return this.fallbackResult(() => this.fallback.generate({ prompt, negativePrompt, width, height, seed, batchSize, model }), 'missing-api-key')
    }

    try {
      const input = this.buildGenerateInput({ prompt, negativePrompt, width, height, seed, batchSize, model: this.resolveModel(model), steps, guidanceScale })
      const outputs = await this.runGenerate(input, { prompt, negativePrompt, width, height, seed, batchSize, model: this.resolveModel(model), steps, guidanceScale })
      const images = (Array.isArray(outputs) ? outputs : [outputs])
        .map((o, i) => this.normalizeImage(o, { width, height, seed: Number.isFinite(seed) ? (seed >>> 0) + i : undefined }, i))
        .filter(Boolean)
      if (!images.length) throw new Error('Provider returned no images')
      return {
        images,
        provider: this.id,
        model: this.resolveModel(model),
        usedFallback: false,
        text: `Generated ${images.length} image${images.length > 1 ? 's' : ''} via ${this.name}.`
      }
    } catch (error) {
      console.warn(`[${this.id}] generate failed, using local fallback:`, error.message)
      return this.fallbackResult(() => this.fallback.generate({ prompt, negativePrompt, width, height, seed, batchSize, model }), 'generate-error')
    }
  }

  async edit(params = {}) {
    const {
      operation = 'image-to-image',
      prompt,
      negativePrompt,
      image,
      width = 768,
      height = 768,
      seed,
      model,
      steps,
      guidanceScale
    } = params

    if (!this.isConfigured()) {
      return this.fallbackResult(() => this.fallback.edit({ operation, prompt, negativePrompt, image, width, height, seed, model }), 'missing-api-key')
    }

    let input = null
    try {
      input = this.buildEditInput({ operation, prompt, negativePrompt, image, width, height, seed, model: this.resolveModel(model), steps, guidanceScale })
    } catch {
      input = null
    }

    if (!input) {
      // Editing not supported by this provider's API surface → local edit.
      return this.fallbackResult(() => this.fallback.edit({ operation, prompt, negativePrompt, image, width, height, seed, model }), 'edit-unsupported')
    }

    try {
      const outputs = await this.runEdit(input, { operation, prompt, negativePrompt, image, width, height, seed, model: this.resolveModel(model), steps, guidanceScale })
      const images = (Array.isArray(outputs) ? outputs : [outputs])
        .map((o, i) => this.normalizeImage(o, { width, height, seed: Number.isFinite(seed) ? (seed >>> 0) + i : undefined }, i))
        .filter(Boolean)
      if (!images.length) throw new Error('Provider returned no images')
      return {
        images,
        provider: this.id,
        model: this.resolveModel(model),
        usedFallback: false,
        operation,
        text: `${operation} completed via ${this.name}.`
      }
    } catch (error) {
      console.warn(`[${this.id}] edit failed, using local fallback:`, error.message)
      return this.fallbackResult(() => this.fallback.edit({ operation, prompt, negativePrompt, image, width, height, seed, model }), 'edit-error')
    }
  }

  /** Wrap a local fallback result and tag it as a fallback. */
  fallbackResult(producer, reason) {
    try {
      const result = producer()
      return {
        ...result,
        provider: result.provider || 'local',
        usedFallback: true,
        note: `${reason}: rendered local preview.`
      }
    } catch {
      return {
        images: [renderPlaceholderImage({ prompt: 'fallback', width: 768, height: 768, label: 'Fallback' })],
        provider: 'local',
        usedFallback: true,
        note: `${reason}: local fallback unavailable.`
      }
    }
  }
}

export default CloudImageProvider
