/**
 * BaseImageProvider
 * -----------------
 * Abstract contract every image-generation adapter must implement.
 *
 * The image provider system mirrors the chat provider system: the
 * {@link ImageProviderManager} only ever talks to providers through this
 * interface, so new image backends (Stability, Replicate, ComfyUI, …) can be
 * added without touching the manager, the routes, or the UI.
 *
 * Concrete providers should override:
 *   - isAvailable()   : whether the provider is reachable / configured
 *   - listModels()    : the image models the provider exposes
 *   - generate()      : text-to-image generation
 *   - edit()          : image editing (img2img, upscale, bg-removal, …)
 *
 * A provider must NEVER throw for "expected" failures (offline, missing key).
 * Instead it returns a structured result so the manager can fall back cleanly.
 *
 * Normalized generation result shape:
 *   {
 *     images: Array<{ url: string, seed?: number, width?: number, height?: number }>,
 *     provider: string,
 *     model?: string,
 *     usedFallback: boolean,
 *     text?: string,        // human-readable status (kept for legacy /api/image)
 *     note?: string
 *   }
 */
export class BaseImageProvider {
  /**
   * @param {object} config
   * @param {string} config.id
   * @param {string} config.name
   * @param {'local'|'cloud'} config.type
   * @param {boolean} [config.requiresApiKey]
   * @param {boolean} [config.implemented]
   * @param {object} [config.env]
   */
  constructor(config = {}) {
    this.id = config.id
    this.name = config.name
    this.type = config.type || 'cloud'
    this.requiresApiKey = Boolean(config.requiresApiKey)
    this.implemented = Boolean(config.implemented)
    this.env = config.env || {}
  }

  /** @returns {boolean} true when the provider is a local (self-hosted) runtime. */
  isLocal() {
    return this.type === 'local'
  }

  /** Cheap synchronous check: does the provider have what it needs to be usable? */
  isConfigured() {
    if (!this.requiresApiKey) return true
    return Boolean(this.getApiKey())
  }

  /** @returns {string|undefined} */
  getApiKey() {
    return this.env.apiKey
  }

  /**
   * Static description of what this provider can do. Merged with runtime status
   * by the manager for the UI/admin.
   * @returns {object}
   */
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

  /** Runtime availability. Must resolve (never reject) with a boolean. */
  async isAvailable() {
    return this.isConfigured()
  }

  /** Validate the supplied (or configured) API key. */
  async validateApiKey(_apiKey) {
    if (!this.requiresApiKey) return { valid: true, reason: 'no-key-required' }
    const key = _apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    return { valid: false, reason: 'not-implemented' }
  }

  /** The image models this provider exposes. Must resolve to an array. */
  async listModels() {
    return []
  }

  /**
   * Text-to-image generation.
   * MUST resolve with a normalized result (see class docs).
   * @param {object} _params
   */
  async generate(_params) {
    throw new Error(`generate() not implemented for image provider "${this.id}"`)
  }

  /**
   * Image editing operations (img2img, upscale, bg-removal, inpaint, …).
   * MUST resolve with a normalized result.
   * @param {object} _params
   */
  async edit(_params) {
    throw new Error(`edit() not implemented for image provider "${this.id}"`)
  }
}

export default BaseImageProvider
