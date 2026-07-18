import { BaseProvider } from './BaseProvider.js'
import { buildChatFallback } from './utils.js'

/**
 * PlaceholderProvider
 * -------------------
 * Base class for cloud providers that are wired with correct interfaces,
 * configuration, model catalogs, and API-key validation *scaffolding*, but
 * whose live chat call is intentionally deferred (Phase 2 requirement:
 * "implemented with configuration placeholders and proper interfaces").
 *
 * Each concrete cloud provider supplies:
 *   - id / name
 *   - apiBaseUrl (documented endpoint, ready for later activation)
 *   - a static model catalog with speed/quality metadata
 *
 * When an API key is configured, {@link isConfigured} returns true so the
 * admin/UI can show the provider as "ready"; the actual network call is a
 * clearly-labeled fallback so nothing breaks and no secrets are required.
 */
export class PlaceholderProvider extends BaseProvider {
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
    this._models = (config.models || []).map((m) => ({
      provider: this.id,
      type: 'cloud',
      local: false,
      ...m
    }))
    this._capabilities = config.capabilities || {
      chat: true,
      streaming: false,
      images: false,
      vision: false,
      tools: false
    }
  }

  getCapabilities() {
    return { ...this._capabilities }
  }

  /**
   * Availability for a cloud placeholder = "has a key configured". We do not
   * perform a live probe (which would require spending a real API call).
   */
  async isAvailable() {
    return this.isConfigured()
  }

  /**
   * Validate the key format. Real verification is deferred until the provider
   * is fully activated, so a well-formed key is reported as "unverified".
   */
  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    if (typeof key !== 'string' || key.length < 8) {
      return { valid: false, reason: 'malformed-key' }
    }
    return { valid: true, reason: 'unverified', note: 'Key present; live verification pending provider activation.' }
  }

  async listModels() {
    return this._models.map((m) => ({ ...m }))
  }

  async chat({ prompt, model } = {}) {
    const usedModel = model || this._models[0]?.id
    // Placeholder: return a graceful, clearly-labeled fallback so existing
    // chat flows keep working even without live cloud credentials.
    return {
      text: buildChatFallback(prompt),
      provider: 'fallback',
      model: usedModel,
      usedFallback: true,
      note: `${this.name} is configured as a placeholder. Add credentials and activate to enable live responses.`
    }
  }
}

export default PlaceholderProvider
