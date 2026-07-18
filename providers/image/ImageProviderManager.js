import { LocalImageProvider } from './LocalImageProvider.js'
import { ComfyUIProvider } from './ComfyUIProvider.js'
import { Automatic1111Provider } from './Automatic1111Provider.js'
import { OllamaImageProvider } from './OllamaImageProvider.js'
import { OpenAIImageProvider } from './OpenAIImageProvider.js'
import { StabilityImageProvider } from './StabilityImageProvider.js'
import { ReplicateImageProvider } from './ReplicateImageProvider.js'
import { HuggingFaceImageProvider } from './HuggingFaceImageProvider.js'
import { renderPlaceholderImage, buildRandomPrompt } from './imageUtils.js'

/**
 * ImageProviderManager
 * --------------------
 * Central registry and coordinator for image-generation providers. Mirrors the
 * chat {@link ProviderManager}: routes talk only to the manager, and adding a
 * provider means registering it here — nothing else changes.
 *
 * The default provider is the always-available local renderer, so the Image
 * Studio works immediately in any environment. Local self-hosted providers
 * (ComfyUI, Automatic1111, Ollama-compatible) perform real calls when
 * reachable; cloud providers are configuration placeholders until activated.
 */
export class ImageProviderManager {
  constructor() {
    /** @type {Map<string, import('./BaseImageProvider.js').BaseImageProvider>} */
    this.providers = new Map()
    this.defaultProviderId = 'local'
  }

  register(provider) {
    if (provider?.id) this.providers.set(provider.id, provider)
    return this
  }

  has(id) {
    return this.providers.has(id)
  }

  get(id) {
    return this.providers.get(id)
  }

  list() {
    return [...this.providers.values()]
  }

  /** Resolve the provider to use; falls back to the local renderer. */
  select(requestedId) {
    if (requestedId && this.has(requestedId)) return this.get(requestedId)
    return this.get(this.defaultProviderId)
  }

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

  listProviders() {
    return this.list().map((p) => this.describeProvider(p))
  }

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

  async validateApiKey(id, apiKey) {
    const provider = this.get(id)
    if (!provider) return { id, valid: false, reason: 'unknown-provider' }
    const result = await provider.validateApiKey(apiKey).catch(() => ({ valid: false, reason: 'error' }))
    return { id, ...result }
  }

  getCapabilities(id) {
    if (id) {
      const provider = this.get(id)
      return provider ? provider.getCapabilities() : null
    }
    const map = {}
    for (const provider of this.list()) map[provider.id] = provider.getCapabilities()
    return map
  }

  /** Text-to-image generation via the selected provider (never throws). */
  async generate({ provider: providerId, ...params } = {}) {
    const provider = this.select(providerId)
    if (!provider) {
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'none', usedFallback: true, text: 'No image provider available.' }
    }
    try {
      return await provider.generate(params)
    } catch (error) {
      console.warn(`Image provider "${provider.id}" generate failed:`, error.message)
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'fallback', usedFallback: true, text: 'Rendered local fallback preview.' }
    }
  }

  /** Image editing via the selected provider (never throws). */
  async edit({ provider: providerId, ...params } = {}) {
    const provider = this.select(providerId)
    if (!provider) {
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'none', usedFallback: true, text: 'No image provider available.' }
    }
    try {
      return await provider.edit(params)
    } catch (error) {
      console.warn(`Image provider "${provider.id}" edit failed:`, error.message)
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'fallback', usedFallback: true, text: 'Rendered local fallback preview.' }
    }
  }

  /** Random prompt helper (server-side generator). */
  randomPrompt(seed) {
    return buildRandomPrompt(seed)
  }
}

/**
 * Build a manager pre-registered with every Phase 4 image provider.
 * Local providers work immediately; cloud providers are placeholders.
 */
export function createImageProviderManager(env = {}) {
  const manager = new ImageProviderManager()
  manager
    .register(new LocalImageProvider(env.local))
    .register(new ComfyUIProvider(env.comfyui))
    .register(new Automatic1111Provider(env.automatic1111))
    .register(new OllamaImageProvider(env.ollamaImage))
    .register(new OpenAIImageProvider(env.openai))
    .register(new StabilityImageProvider(env.stability))
    .register(new ReplicateImageProvider(env.replicate))
    .register(new HuggingFaceImageProvider(env.huggingface))
  return manager
}

export default ImageProviderManager
