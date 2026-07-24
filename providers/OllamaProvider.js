import { BaseProvider } from './BaseProvider.js'
import { fetchWithTimeout, messagesToPrompt } from './utils.js'

/**
 * OllamaProvider
 * --------------
 * Fully working local provider. Talks to a running Ollama server over its
 * REST API. This is the only provider that must function immediately.
 */
export class OllamaProvider extends BaseProvider {
  constructor(env = {}) {
    super({
      id: 'ollama',
      name: 'Ollama (Local)',
      type: 'local',
      requiresApiKey: false,
      implemented: true,
      env
    })
    this.baseUrl = env.baseUrl || process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
    this.defaultModel = env.defaultModel || process.env.OLLAMA_MODEL || 'llama3.2'
  }

  getCapabilities() {
    return { chat: true, streaming: true, images: false, vision: false, tools: false }
  }

  /** Ollama is available when its server responds. */
  async isAvailable() {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' }, 4000)
      return res.ok
    } catch {
      return false
    }
  }

  async validateApiKey() {
    // Local provider needs no key; availability is the meaningful signal.
    const available = await this.isAvailable()
    return available
      ? { valid: true, reason: 'reachable' }
      : { valid: false, reason: 'unreachable' }
  }

  /**
   * Query the live model list from the Ollama server; fall back to a curated
   * default set so the selector is never empty.
   */
  async listModels() {
    const annotate = (name) => ({
      id: name,
      name,
      provider: this.id,
      type: this.type,
      speed: 'fast',
      quality: 'good',
      local: true
    })
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' }, 4000)
      if (res.ok) {
        const data = await res.json()
        const models = Array.isArray(data?.models) ? data.models : []
        if (models.length) return models.map((m) => annotate(m.name || m.model))
      }
    } catch {
      /* fall through to defaults */
    }
    return [this.defaultModel, 'llama3.2', 'llama3.1', 'mistral', 'phi3']
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .map(annotate)
  }

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this.defaultModel
    const fullPrompt = messagesToPrompt(messages, prompt)
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: usedModel,
          prompt: `You are a helpful AI assistant. ${fullPrompt}`,
          stream: false
        })
      }, 60_000)
      if (!response.ok) throw new Error(`Ollama responded with ${response.status}`)
      const data = await response.json()
      if (data?.response) {
        return { text: data.response.trim(), provider: this.id, model: usedModel, usedFallback: false }
      }
    } catch (error) {
      console.warn('Ollama chat failed:', error.message)
      throw new Error('Ollama is not running.')
    }
    throw new Error('Ollama is not running.')
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this.defaultModel
    const fullPrompt = messagesToPrompt(messages, prompt)
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: usedModel,
          prompt: `You are a helpful AI assistant. ${fullPrompt}`,
          stream: true
        })
      }, 120_000)
      if (!response.ok) throw new Error(`Ollama responded with ${response.status}`)
      const reader = response.body?.getReader?.()
      if (!reader) {
        const data = await response.json()
        if (data?.response && onChunk) onChunk(data.response)
        return { text: data?.response?.trim() || '', provider: this.id, model: usedModel, usedFallback: false }
      }
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('{'))
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed?.response && onChunk) {
              onChunk(parsed.response)
              fullText += parsed.response
            }
          } catch { /* skip malformed JSON */ }
        }
      }
      return { text: fullText.trim(), provider: this.id, model: usedModel, usedFallback: false }
    } catch (error) {
      console.warn('Ollama streaming failed:', error.message)
      const err = new Error('Ollama is not running.')
      if (onChunk) onChunk('')
      throw err
    }
  }
}

export default OllamaProvider
