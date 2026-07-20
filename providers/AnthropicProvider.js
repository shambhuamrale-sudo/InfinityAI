import { BaseProvider } from './BaseProvider.js'
import {
  buildChatFallback,
  fetchWithTimeout,
  toChatMessages,
  streamSSE,
  postChat,
  safeErrorMessage,
  withRetry
} from './utils.js'

/**
 * AnthropicProvider
 * -----------------
 * Real Anthropic (Claude) integration. Anthropic uses a distinct REST shape:
 *   - Header auth: `x-api-key` + `anthropic-version`
 *   - A top-level `system` field (not a system role message)
 *   - SSE stream chunks carry `delta.text`
 * Supports non-streaming and streaming chat with graceful fallback.
 */
export class AnthropicProvider extends BaseProvider {
  constructor(env = {}) {
    super({
      id: 'anthropic',
      name: 'Anthropic Claude',
      type: 'cloud',
      requiresApiKey: true,
      implemented: true,
      env: { apiKey: env.apiKey || process.env.ANTHROPIC_API_KEY }
    })
    this.apiBaseUrl = env.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'
    this.defaultModel = env.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'
    this.contextWindow = 200_000
    this._models = [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', speed: 'fast', quality: 'excellent', provider: this.id, type: 'cloud', local: false, contextWindow: 200_000 },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', speed: 'very-fast', quality: 'good', provider: this.id, type: 'cloud', local: false, contextWindow: 200_000 },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', speed: 'medium', quality: 'excellent', provider: this.id, type: 'cloud', local: false, contextWindow: 200_000 }
    ]
  }

  getCapabilities() {
    return { chat: true, streaming: true, images: false, vision: true, tools: true }
  }

  authHeaders(apiKey) {
    return {
      'x-api-key': apiKey || this.getApiKey(),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    }
  }

  async isAvailable() {
    return this.isConfigured()
  }

  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    try {
      const res = await fetchWithTimeout(`${this.apiBaseUrl}/models`, { method: 'GET', headers: this.authHeaders(key) }, 10_000)
      if (res.ok) return { valid: true, reason: 'verified' }
      if (res.status === 401) return { valid: false, reason: 'invalid-key' }
      return { valid: false, reason: `status-${res.status}` }
    } catch (error) {
      return { valid: false, reason: 'unreachable', note: error.message }
    }
  }

  async listModels() {
    return this._models.map((m) => ({ ...m }))
  }

  /** Split system message out of the chat history for the Anthropic shape. */
  buildMessages(messages, prompt) {
    const chat = toChatMessages(messages, prompt)
    let system
    const rest = chat.filter((m) => {
      if (m.role === 'system') {
        system = m.content
        return false
      }
      return true
    })
    return { system, messages: rest }
  }

  buildBody({ messages, prompt, model, stream }) {
    const { system, messages: rest } = this.buildMessages(messages, prompt)
    const body = {
      model: model || this.defaultModel,
      messages: rest,
      max_tokens: 4096,
      stream: Boolean(stream)
    }
    if (system) body.system = system
    return body
  }

  extractText(data) {
    return data?.content?.[0]?.text || ''
  }

  extractUsage(data) {
    const u = data?.usage
    if (!u) return undefined
    return { promptTokens: u.input_tokens, completionTokens: u.output_tokens, totalTokens: (u.input_tokens || 0) + (u.output_tokens || 0) }
  }

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this.defaultModel
    if (!this.isConfigured()) {
      return { text: buildChatFallback(prompt), provider: 'fallback', model: usedModel, usedFallback: true, note: 'Anthropic API key not configured.' }
    }
    try {
      const result = await withRetry(() =>
        postChat({
          url: `${this.apiBaseUrl}/messages`,
          headers: this.authHeaders(),
          body: this.buildBody({ messages, prompt, model: usedModel, stream: false }),
          provider: this.id,
          model: usedModel,
          extractText: (d) => this.extractText(d),
          extractUsage: (d) => this.extractUsage(d)
        })
      )
      return result
    } catch (error) {
      console.warn('Anthropic chat failed, using fallback:', error.message)
      return { text: buildChatFallback(prompt), provider: 'fallback', model: usedModel, usedFallback: true, error: error.message }
    }
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this.defaultModel
    if (!this.isConfigured()) {
      const fallback = buildChatFallback(prompt)
      if (onChunk) onChunk(fallback)
      return { text: fallback, provider: 'fallback', model: usedModel, usedFallback: true, note: 'Anthropic API key not configured.' }
    }
    try {
      const response = await withRetry(() =>
        fetchWithTimeout(`${this.apiBaseUrl}/messages`, {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(this.buildBody({ messages, prompt, model: usedModel, stream: true }))
        }, 180_000)
      )
      if (!response.ok) {
        const message = await safeErrorMessage(response)
        throw new Error(message)
      }
      return await streamSSE({
        response,
        provider: this.id,
        model: usedModel,
        extractText: (d) => d?.delta?.text || null,
        extractUsage: (d) => this.extractUsage(d),
        onChunk
      })
    } catch (error) {
      console.warn('Anthropic streaming failed, using fallback:', error.message)
      const fallback = buildChatFallback(prompt)
      if (onChunk) onChunk(fallback)
      return { text: fallback, provider: 'fallback', model: usedModel, usedFallback: true, error: error.message }
    }
  }

  getContextWindow(model) {
    const m = this._models.find((x) => x.id === model)
    return m?.contextWindow || this.contextWindow
  }
}

export default AnthropicProvider
