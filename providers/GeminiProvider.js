import { BaseProvider } from './BaseProvider.js'
import {
  buildChatFallback,
  fetchWithTimeout,
  toChatMessages,
  postChat,
  safeErrorMessage,
  withRetry
} from './utils.js'

/**
 * GeminiProvider
 * --------------
 * Real Google Gemini integration via the Generative Language API.
 *   - Endpoint carries the key as a query param, not a header
 *   - Body uses `contents` with `parts[].text` (roles: user / model)
 *   - Streaming uses `streamGenerateContent?alt=sse`
 * Supports non-streaming and streaming chat with graceful fallback.
 */
export class GeminiProvider extends BaseProvider {
  constructor(env = {}) {
    super({
      id: 'gemini',
      name: 'Google Gemini',
      type: 'cloud',
      requiresApiKey: true,
      implemented: true,
      env: { apiKey: env.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY }
    })
    this.apiBaseUrl = env.baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
    this.defaultModel = env.model || process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    this.contextWindow = 1_000_000
    this._models = [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', speed: 'medium', quality: 'excellent', provider: this.id, type: 'cloud', local: false, contextWindow: 2_097_152 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', speed: 'very-fast', quality: 'good', provider: this.id, type: 'cloud', local: false, contextWindow: 1_048_576 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', speed: 'very-fast', quality: 'excellent', provider: this.id, type: 'cloud', local: false, contextWindow: 1_048_576 }
    ]
  }

  getCapabilities() {
    return { chat: true, streaming: true, images: false, vision: true, tools: true }
  }

  getApiKey() {
    return this.env.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  }

  async isAvailable() {
    return this.isConfigured()
  }

  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    try {
      const url = `${this.apiBaseUrl}/models?key=${encodeURIComponent(key)}`
      const res = await fetchWithTimeout(url, { method: 'GET' }, 10_000)
      if (res.ok) return { valid: true, reason: 'verified' }
      if (res.status === 400) return { valid: false, reason: 'invalid-key' }
      return { valid: false, reason: `status-${res.status}` }
    } catch (error) {
      return { valid: false, reason: 'unreachable', note: error.message }
    }
  }

  async listModels() {
    return this._models.map((m) => ({ ...m }))
  }

  buildContents(messages, prompt) {
    const chat = toChatMessages(messages, prompt)
    const contents = []
    for (const m of chat) {
      const role = m.role === 'assistant' ? 'model' : 'user'
      contents.push({ role, parts: [{ text: m.content || '' }] })
    }
    return contents
  }

  buildBody({ messages, prompt }) {
    return { contents: this.buildContents(messages, prompt) }
  }

  extractText(data) {
    return data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  }

  extractUsage(data) {
    const u = data?.usageMetadata
    if (!u) return undefined
    return {
      promptTokens: u.promptTokenCount ?? u.prompt_tokens,
      completionTokens: u.candidatesTokenCount ?? u.candidates_tokens,
      totalTokens: u.totalTokenCount ?? u.total_tokens
    }
  }

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this.defaultModel
    if (!this.isConfigured()) {
      throw new Error(`${this.name} API key not configured.`)
    }
    try {
      const result = await withRetry(() =>
        postChat({
          url: `${this.apiBaseUrl}/models/${usedModel}:generateContent?key=${encodeURIComponent(this.getApiKey())}`,
          headers: { 'Content-Type': 'application/json' },
          body: this.buildBody({ messages, prompt }),
          provider: this.id,
          model: usedModel,
          extractText: (d) => this.extractText(d),
          extractUsage: (d) => this.extractUsage(d)
        })
      )
      return result
    } catch (error) {
      console.warn('Gemini chat failed:', error.message)
      throw new Error(`Gemini chat failed: ${error.message}`)
    }
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this.defaultModel
    if (!this.isConfigured()) {
      const err = new Error(`${this.name} API key not configured.`)
      if (onChunk) onChunk('')
      throw err
    }
    try {
      const response = await withRetry(() =>
        fetchWithTimeout(`${this.apiBaseUrl}/models/${usedModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.getApiKey())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.buildBody({ messages, prompt }))
        }, 180_000)
      )
      if (!response.ok) {
        const message = await safeErrorMessage(response)
        throw new Error(message)
      }
      const reader = response.body?.getReader?.()
      const decoder = new TextDecoder()
      let fullText = ''
      let usage
      if (!reader) {
        const data = await response.json()
        const text = this.extractText(data)
        if (onChunk && text) onChunk(text)
        return { text, provider: this.id, model: usedModel, usedFallback: false, usage: this.extractUsage(data) }
      }
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split(/\n\n/)
        buffer = events.pop() || ''
        for (const event of events) {
          const lines = event.split('\n').filter((l) => l.startsWith('data:'))
          for (const line of lines) {
            const payload = line.slice(5).trim()
            if (!payload) continue
            try {
              const parsed = JSON.parse(payload)
              if (parsed?.error) throw new Error(parsed.error.message || 'Gemini stream error')
              const text = this.extractText(parsed)
              if (text) {
                fullText += text
                if (onChunk) onChunk(text)
              }
              const u = this.extractUsage(parsed)
              if (u) usage = u
            } catch (err) {
              if (err.message && !err.message.includes('JSON')) throw err
            }
          }
        }
      }
      return { text: fullText.trim(), provider: this.id, model: usedModel, usedFallback: false, usage }
    } catch (error) {
      console.warn('Gemini streaming failed:', error.message)
      const err = new Error(`Gemini streaming failed: ${error.message}`)
      if (onChunk) onChunk('')
      throw err
    }
  }

  getContextWindow(model) {
    const m = this._models.find((x) => x.id === model)
    return m?.contextWindow || this.contextWindow
  }
}

export default GeminiProvider
