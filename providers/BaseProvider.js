/**
 * BaseProvider
 * -------------
 * Abstract contract that every AI provider adapter must implement.
 *
 * The provider system is intentionally modular: the {@link ProviderManager}
 * only ever talks to providers through this interface, so new providers can be
 * added without touching the manager, the routes, or the UI.
 *
 * Concrete providers should override:
 *   - isAvailable()      : whether the provider is reachable / configured
 *   - validateApiKey()   : lightweight credential validation
 *   - listModels()       : the models the provider exposes
 *   - chat()             : perform a chat completion and return normalized text
 *
 * A provider must NEVER throw for "expected" failures (offline, missing key).
 * Instead it returns a structured result so the manager can fall back cleanly.
 */
export class BaseProvider {
  /**
   * @param {object} config
   * @param {string} config.id            Stable machine id, e.g. "ollama"
   * @param {string} config.name          Human label, e.g. "Ollama (Local)"
   * @param {'local'|'cloud'} config.type Deployment type
   * @param {boolean} [config.requiresApiKey]
   * @param {object} [config.env]         Snapshot of relevant env vars
   */
  constructor(config = {}) {
    this.id = config.id
    this.name = config.name
    this.type = config.type || 'cloud'
    this.requiresApiKey = Boolean(config.requiresApiKey)
    this.env = config.env || {}
    // Providers not yet wired to a real backend are "placeholder": they expose
    // interfaces and configuration but return a graceful fallback response.
    this.implemented = Boolean(config.implemented)
  }

  /** @returns {boolean} true when the provider is a local (self-hosted) runtime. */
  isLocal() {
    return this.type === 'local'
  }

  /**
   * Whether the provider has the credentials/config it needs to be *usable*.
   * This is a cheap, synchronous check (no network).
   * @returns {boolean}
   */
  isConfigured() {
    if (!this.requiresApiKey) return true
    return Boolean(this.getApiKey())
  }

  /** @returns {string|undefined} the configured API key, if any. */
  getApiKey() {
    return this.env.apiKey
  }

  /**
   * Static description of what this provider can do. The manager merges this
   * with runtime status to expose provider capabilities to the UI/admin.
   * @returns {object}
   */
  getCapabilities() {
    return {
      chat: true,
      streaming: false,
      images: false,
      vision: false,
      tools: false
    }
  }

  /**
   * Runtime availability check. May perform a network probe.
   * Must resolve (never reject) with a boolean.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return this.isConfigured()
  }

  /**
   * Validate the supplied (or configured) API key.
   * Must resolve with { valid: boolean, reason?: string }.
   * @param {string} [_apiKey]
   * @returns {Promise<{valid: boolean, reason?: string}>}
   */
  async validateApiKey(_apiKey) {
    if (!this.requiresApiKey) return { valid: true, reason: 'no-key-required' }
    const key = _apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    // Placeholder providers cannot truly verify; report "unverified".
    return { valid: false, reason: 'not-implemented' }
  }

  /**
   * The list of models this provider exposes, each annotated with metadata the
   * UI needs (speed, quality, local/cloud). Must resolve to an array.
   * @returns {Promise<Array<object>>}
   */
  async listModels() {
    return []
  }

  /**
   * Perform a chat completion.
   * MUST resolve with { text, provider, model, usedFallback }.
   * @param {object} _params
   * @param {string} _params.prompt
   * @param {string} [_params.model]
   * @param {Array} [_params.messages]
   * @returns {Promise<{text: string, provider: string, model?: string, usedFallback: boolean}>}
   */
  async chat(_params) {
    throw new Error(`chat() not implemented for provider "${this.id}"`)
  }

  /**
   * Stream a chat completion. If not implemented, falls back to non-streaming chat.
   * @param {object} _params
   * @param {string} _params.prompt
   * @param {string} [_params.model]
   * @param {Array} [_params.messages]
   * @param {function} _onChunk - callback for each text chunk
   * @returns {Promise<{text: string, provider: string, model?: string, usedFallback: boolean}>}
   */
  async streamChat(_params, _onChunk) {
    return this.chat(_params)
  }
}

export default BaseProvider
