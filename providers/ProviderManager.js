import { OllamaProvider } from './OllamaProvider.js'
import { OpenAIProvider } from './OpenAIProvider.js'
import { GeminiProvider } from './GeminiProvider.js'
import { AnthropicProvider } from './AnthropicProvider.js'
import { DeepSeekProvider } from './DeepSeekProvider.js'
import { MistralProvider } from './MistralProvider.js'
import { OpenRouterProvider } from './OpenRouterProvider.js'
import { GroqProvider } from './GroqProvider.js'
import { LMStudioProvider } from './LMStudioProvider.js'

/**
 * ProviderManager
 * ---------------
 * Central registry and coordinator for AI providers.
 *
 * Responsibilities (Phase 2):
 *   - register providers and expose them by id
 *   - select the active provider (with safe fallback to default)
 *   - check provider availability
 *   - validate API keys
 *   - expose provider capabilities and model catalogs
 *   - select providers by AI mode (cloud / local)
 *
 * The manager is the ONLY thing the server routes talk to; adding a provider
 * means registering it here, nothing else changes.
 */
export class ProviderManager {
  constructor(defaultProviderId = process.env.DEFAULT_PROVIDER || 'openrouter') {
    /** @type {Map<string, import('./BaseProvider.js').BaseProvider>} */
    this.providers = new Map()
    this.defaultProviderId = defaultProviderId
  }

  static get LOCAL_PROVIDER_ORDER() {
    return ['ollama', 'lm-studio']
  }

  static get CLOUD_PROVIDER_ORDER() {
    return ['openrouter', 'groq', 'openai', 'gemini', 'anthropic', 'deepseek', 'mistral']
  }

  /** Register a provider instance. */
  register(provider) {
    if (provider?.id) this.providers.set(provider.id, provider)
    return this
  }

  /** @returns {boolean} */
  has(id) {
    return this.providers.has(id)
  }

  /** @returns {import('./BaseProvider.js').BaseProvider | undefined} */
  get(id) {
    return this.providers.get(id)
  }

  /** @returns {Array<import('./BaseProvider.js').BaseProvider>} */
  list() {
    return [...this.providers.values()]
  }

  /**
   * Resolve the provider to use for a request. Falls back to the default
   * (openrouter) when the requested id is unknown, so callers can never break.
   * @param {string} [requestedId]
   */
  select(requestedId) {
    if (requestedId && this.has(requestedId)) return this.get(requestedId)
    return this.get(this.defaultProviderId)
  }

  /**
   * Select the first available provider matching the requested AI mode.
   * For 'local': tries Ollama then LM Studio.
   * For 'cloud': tries the configured cloud default.
   * Returns undefined when no provider in that mode is available.
   * @param {'cloud' | 'local'} mode
   */
  async selectForMode(mode) {
    if (mode === 'local') {
      for (const id of ProviderManager.LOCAL_PROVIDER_ORDER) {
        const provider = this.get(id)
        if (provider && await provider.isAvailable().catch(() => false)) {
          return provider
        }
      }
      return undefined
    }
    const cloudProvider = this.select(this.defaultProviderId)
    if (cloudProvider && await cloudProvider.isAvailable().catch(() => false)) {
      return cloudProvider
    }
    return undefined
  }

  /**
   * Summarize a single provider (static + light runtime info).
   * @param {import('./BaseProvider.js').BaseProvider} provider
   */
  describeProvider(provider) {
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      local: provider.isLocal(),
      requiresApiKey: provider.requiresApiKey,
      implemented: provider.implemented,
      configured: provider.isConfigured(),
      capabilities: provider.getCapabilities()
    }
  }

  /** List all providers with static descriptors (no network). */
  listProviders() {
    return this.list().map((p) => this.describeProvider(p))
  }

  /**
   * List all providers together with their model catalogs. Model discovery may
   * hit the network (Ollama, LM Studio), so this is async and resilient per-provider.
   */
  async listProvidersWithModels() {
    const out = []
    for (const provider of this.list()) {
      let models = []
      try {
        models = await provider.listModels()
      } catch {
        models = []
      }
      out.push({ ...this.describeProvider(provider), models })
    }
    return out
  }

  /** Check runtime availability of one provider (or all when id omitted). */
  async checkAvailability(id) {
    if (id) {
      const provider = this.get(id)
      if (!provider) return { id, available: false, reason: 'unknown-provider' }
      const available = await provider.isAvailable().catch(() => false)
      return { id, available }
    }
    const results = {}
    for (const provider of this.list()) {
      results[provider.id] = await provider.isAvailable().catch(() => false)
    }
    return results
  }

  /** Check whether any local provider is currently available. */
  async checkLocalAvailability() {
    for (const id of ProviderManager.LOCAL_PROVIDER_ORDER) {
      const provider = this.get(id)
      if (provider && await provider.isAvailable().catch(() => false)) {
        return { available: true, providerId: id }
      }
    }
    return { available: false, providerId: null }
  }

  /** Validate an API key for a provider. */
  async validateApiKey(id, apiKey) {
    const provider = this.get(id)
    if (!provider) return { id, valid: false, reason: 'unknown-provider' }
    const result = await provider.validateApiKey(apiKey).catch(() => ({ valid: false, reason: 'error' }))
    return { id, ...result }
  }

  /** Get capabilities for one provider (or all when id omitted). */
  getCapabilities(id) {
    if (id) {
      const provider = this.get(id)
      return provider ? provider.getCapabilities() : null
    }
    const map = {}
    for (const provider of this.list()) map[provider.id] = provider.getCapabilities()
    return map
  }

  /**
   * Perform a chat completion via the selected provider. Returns the result
   * on success, or throws the provider error on failure. No silent fallback
   * to fake responses.
   */
  async chat({ provider: providerId, prompt, model, messages, aiMode } = {}) {
    const targetProvider = aiMode === 'local' ? 'local' : providerId || this.defaultProviderId
    console.log(`[ProviderManager] chat request: provider=${targetProvider}, aiMode=${aiMode || 'cloud'}, model=${model || 'default'}`)
    let primary
    if (aiMode === 'local') {
      primary = await this.selectForMode('local')
      if (!primary) {
        console.warn('[ProviderManager] No local provider available')
        throw new Error('Local AI is unavailable. Switch to Cloud mode or verify your local setup.')
      }
    } else {
      primary = this.select(providerId)
      if (!primary) {
        console.warn(`[ProviderManager] Provider "${providerId}" not found, fallback "${this.defaultProviderId}" also missing`)
      } else {
        console.log(`[ProviderManager] Selected provider: ${primary.id} (${primary.name})`)
      }
    }

    if (!primary) {
      throw new Error('No AI provider available.')
    }

    const params = { prompt, model, messages }
    try {
      const result = await primary.chat(params)
      console.log(`[ProviderManager] chat success: provider=${result.provider}, model=${result.model}, textLength=${result.text?.length || 0}`)
      return result
    } catch (error) {
      console.warn(`[ProviderManager] Provider "${providerId || primary.id}" chat failed:`, error.message)
      throw error
    }
  }

  /**
   * Stream a chat completion via the selected provider. Throws the provider
   * error on failure. No silent fallback.
   */
  async streamChat({ provider: providerId, prompt, model, messages, aiMode } = {}, onChunk) {
    const targetProvider = aiMode === 'local' ? 'local' : providerId || this.defaultProviderId
    console.log(`[ProviderManager] streamChat request: provider=${targetProvider}, aiMode=${aiMode || 'cloud'}, model=${model || 'default'}`)
    let primary
    if (aiMode === 'local') {
      primary = await this.selectForMode('local')
      if (!primary) {
        console.warn('[ProviderManager] No local provider available for stream')
        throw new Error('Local AI is unavailable. Switch to Cloud mode or verify your local setup.')
      }
    } else {
      primary = this.select(providerId)
      if (!primary) {
        console.warn(`[ProviderManager] Provider "${providerId}" not found for stream, fallback missing`)
      } else {
        console.log(`[ProviderManager] Selected stream provider: ${primary.id} (${primary.name})`)
      }
    }

    if (!primary) {
      throw new Error('No AI provider available.')
    }
    const params = { prompt, model, messages }
    return primary.streamChat(params, onChunk)
  }
}

/**
 * Build a manager pre-registered with every Phase 2 provider.
 * Cloud is default; local providers activate when reachable.
 */
export function createProviderManager(env = {}, defaultProviderId = process.env.DEFAULT_PROVIDER || 'openrouter') {
  const manager = new ProviderManager(defaultProviderId)
  manager
    .register(new OllamaProvider(env.ollama))
    .register(new LMStudioProvider(env.lmStudio))
    .register(new OpenAIProvider(env.openai))
    .register(new GeminiProvider(env.gemini))
    .register(new AnthropicProvider(env.anthropic))
    .register(new DeepSeekProvider(env.deepseek))
    .register(new MistralProvider(env.mistral))
    .register(new OpenRouterProvider(env.openrouter))
    .register(new GroqProvider(env.groq))
  return manager
}

export default ProviderManager
