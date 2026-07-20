import { OllamaProvider } from './OllamaProvider.js'
import { OpenAIProvider } from './OpenAIProvider.js'
import { GeminiProvider } from './GeminiProvider.js'
import { AnthropicProvider } from './AnthropicProvider.js'
import { DeepSeekProvider } from './DeepSeekProvider.js'
import { MistralProvider } from './MistralProvider.js'
import { OpenRouterProvider } from './OpenRouterProvider.js'
import { GroqProvider } from './GroqProvider.js'

/**
 * ProviderManager
 * ---------------
 * Central registry and coordinator for AI providers.
 *
 * Responsibilities (Phase 2):
 *   - register providers and expose them by id
 *   - select the active provider (with safe fallback to Ollama)
 *   - check provider availability
 *   - validate API keys
 *   - expose provider capabilities and model catalogs
 *
 * The manager is the ONLY thing the server routes talk to; adding a provider
 * means registering it here, nothing else changes.
 */
export class ProviderManager {
  constructor() {
    /** @type {Map<string, import('./BaseProvider.js').BaseProvider>} */
    this.providers = new Map()
    this.defaultProviderId = 'ollama'
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
   * (Ollama) when the requested id is unknown, so callers can never break.
   * @param {string} [requestedId]
   */
  select(requestedId) {
    if (requestedId && this.has(requestedId)) return this.get(requestedId)
    return this.get(this.defaultProviderId)
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
   * hit the network (Ollama), so this is async and resilient per-provider.
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
  async chat({ provider: providerId, prompt, model, messages } = {}) {
    const primary = this.select(providerId)
    const params = { prompt, model, messages }

    if (!primary) {
      throw new Error('No AI provider available.')
    }

    try {
      return await primary.chat(params)
    } catch (error) {
      console.warn(`Provider "${providerId || primary.id}" chat failed:`, error.message)
      throw error
    }
  }

  /**
   * Stream a chat completion via the selected provider. Throws the provider
   * error on failure. No silent fallback.
   */
  async streamChat({ provider: providerId, prompt, model, messages } = {}, onChunk) {
    const primary = this.select(providerId)
    const params = { prompt, model, messages }
    if (!primary) {
      throw new Error('No AI provider available.')
    }
    return primary.streamChat(params, onChunk)
  }
}

/**
 * Build a manager pre-registered with every Phase 2 provider.
 * Only Ollama is fully implemented; the rest are configured placeholders.
 */
export function createProviderManager(env = {}) {
  const manager = new ProviderManager()
  manager
    .register(new OllamaProvider(env.ollama))
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
