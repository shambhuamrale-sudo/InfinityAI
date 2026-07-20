import { LocalImageProvider } from './LocalImageProvider.js'
import { ComfyUIProvider } from './ComfyUIProvider.js'
import { Automatic1111Provider } from './Automatic1111Provider.js'
import { OllamaImageProvider } from './OllamaImageProvider.js'
import { OpenAIImageProvider } from './OpenAIImageProvider.js'
import { StabilityImageProvider } from './StabilityImageProvider.js'
import { ReplicateImageProvider } from './ReplicateImageProvider.js'
import { HuggingFaceImageProvider } from './HuggingFaceImageProvider.js'
import { FluxImageProvider } from './FluxImageProvider.js'
import { SDXLImageProvider } from './SDXLImageProvider.js'
import { SD35ImageProvider } from './SD35ImageProvider.js'
import { JuggernautXLProvider } from './JuggernautXLProvider.js'
import { DreamShaperXLProvider } from './DreamShaperXLProvider.js'
import { RealisticVisionProvider } from './RealisticVisionProvider.js'
import { PlaygroundV2Provider } from './PlaygroundV2Provider.js'
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
 * reachable; cloud providers perform real calls when their API keys are present
 * and gracefully fall back to the local renderer otherwise.
 *
 * A fallback chain lets a generation attempt the requested cloud provider and,
 * on any failure, transparently retry with the next configured provider before
 * finally rendering a local preview.
 */
export class ImageProviderManager {
  constructor() {
    /** @type {Map<string, import('./BaseImageProvider.js').BaseImageProvider>} */
    this.providers = new Map()
    this.defaultProviderId = 'local'
    /**
     * Cloud fallback order used when a generation fails at the selected
     * provider. Ordered from most-capable / most-likely-configured to least.
     * @type {string[]}
     */
    this.fallbackChain = ['replicate', 'stability', 'openai-image', 'huggingface', 'flux', 'sdxl', 'sd35', 'juggernaut-xl', 'dreamshaper-xl', 'realistic-vision', 'playground-v2']
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

  /**
   * Discover models from Replicate's API and merge them into the Replicate /
   * FLUX / SDXL provider catalogs so newly published versions show up without
   * a code change. Never throws; on any failure the static catalogs remain.
   */
  async discoverReplicateModels() {
    const replicate = this.get('replicate')
    if (!replicate || !replicate.discoverModels) return
    if (!replicate.isConfigured()) return
    try {
      const discovered = await replicate.discoverModels()
      if (!Array.isArray(discovered) || !discovered.length) return
      for (const pid of ['replicate', 'flux', 'sdxl']) {
        const p = this.get(pid)
        if (p && Array.isArray(p._models)) {
          const existing = new Set(p._models.map((m) => m.id))
          discovered.forEach((m) => { if (!existing.has(m.id)) p._models.push(m) })
        }
      }
    } catch (error) {
      console.warn('Replicate model discovery failed:', error.message)
    }
  }

  /**
   * Text-to-image generation via the selected provider. On failure it walks the
   * fallback chain (configured cloud providers) and finally the local renderer.
   * Never throws.
   */
  async generate({ provider: providerId, ...params } = {}) {
    const primary = this.select(providerId)
    if (!primary) {
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'none', usedFallback: true, text: 'No image provider available.' }
    }
    try {
      const result = await primary.generate(params)
      if (result && !result.usedFallback) return result
      return this.fallbackChainGenerate(providerId, params, result)
    } catch (error) {
      console.warn(`Image provider "${primary.id}" generate failed:`, error.message)
      return this.fallbackChainGenerate(providerId, params)
    }
  }

  /** Try the remaining configured cloud providers, then the local renderer. */
  async fallbackChainGenerate(skipId, params, lastResult) {
    for (const id of this.fallbackChain) {
      if (id === skipId || !this.has(id)) continue
      const provider = this.get(id)
      if (!provider || !provider.isConfigured()) continue
      try {
        const result = await provider.generate(params)
        if (result && !result.usedFallback) {
          return { ...result, note: `Recovered via ${provider.name} after fallback.` }
        }
      } catch (error) {
        console.warn(`Fallback provider "${id}" generate failed:`, error.message)
      }
    }
    if (lastResult && Array.isArray(lastResult.images)) return lastResult
    const fallback = renderPlaceholderImage(params)
    return { images: [fallback], provider: 'fallback', usedFallback: true, text: 'Rendered local fallback preview.' }
  }

  /**
   * Image editing via the selected provider. On failure it walks the fallback
   * chain and finally the local renderer. Never throws.
   */
  async edit({ provider: providerId, ...params } = {}) {
    const primary = this.select(providerId)
    if (!primary) {
      const fallback = renderPlaceholderImage(params)
      return { images: [fallback], provider: 'none', usedFallback: true, text: 'No image provider available.' }
    }
    try {
      const result = await primary.edit(params)
      if (result && !result.usedFallback) return result
      return this.fallbackChainEdit(providerId, params, result)
    } catch (error) {
      console.warn(`Image provider "${primary.id}" edit failed:`, error.message)
      return this.fallbackChainEdit(providerId, params)
    }
  }

  async fallbackChainEdit(skipId, params, lastResult) {
    for (const id of this.fallbackChain) {
      if (id === skipId || !this.has(id)) continue
      const provider = this.get(id)
      if (!provider || !provider.isConfigured()) continue
      try {
        const result = await provider.edit(params)
        if (result && !result.usedFallback) {
          return { ...result, note: `Recovered via ${provider.name} after fallback.` }
        }
      } catch (error) {
        console.warn(`Fallback provider "${id}" edit failed:`, error.message)
      }
    }
    if (lastResult && Array.isArray(lastResult.images)) return lastResult
    const fallback = renderPlaceholderImage(params)
    return { images: [fallback], provider: 'fallback', usedFallback: true, text: 'Rendered local fallback preview.' }
  }

  /** Random prompt helper (server-side generator). */
  randomPrompt(seed) {
    return buildRandomPrompt(seed)
  }
}

/**
 * Build a manager pre-registered with every Phase 4 image provider.
 * Local providers work immediately; cloud providers activate when configured.
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
    .register(new FluxImageProvider(env.flux))
    .register(new SDXLImageProvider(env.sdxl))
    .register(new SD35ImageProvider(env.sd35))
    .register(new JuggernautXLProvider(env.juggernaut))
    .register(new DreamShaperXLProvider(env.dreamshaper))
    .register(new RealisticVisionProvider(env.realistic))
    .register(new PlaygroundV2Provider(env.playground))
  return manager
}

export default ImageProviderManager
