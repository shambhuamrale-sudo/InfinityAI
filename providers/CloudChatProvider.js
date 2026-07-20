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
 * CloudChatProvider
 * -----------------
 * Shared base for cloud providers that speak the OpenAI-compatible Chat
 * Completions protocol (OpenAI, OpenRouter, Mistral, DeepSeek, Groq).
 *
 * Concrete providers only supply: id, name, apiBaseUrl, env/apiKey, the model
 * catalog, an `authHeaders()` implementation, and an optional context window.
 * chat()/streamChat()/validateApiKey() are implemented once here.
 */
export class CloudChatProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: config.id,
      name: config.name,
      type: 'cloud',
      requiresApiKey: true,
      implemented: true,
      env: config.env || {}
    })
    this.apiBaseUrl = config.apiBaseUrl
    this._models = (config.models || []).map((m) => ({
      provider: this.id,
      type: 'cloud',
      local: false,
      ...m
    }))
    this._capabilities = config.capabilities || { chat: true, streaming: true, images: false, vision: false, tools: false }
    this.contextWindow = config.contextWindow || 128_000
    this.streamEndpoint = config.streamEndpoint || `${this.apiBaseUrl}/chat/completions`
    this.chatEndpoint = config.chatEndpoint || `${this.apiBaseUrl}/chat/completions`
    this.validateEndpoint = config.validateEndpoint || `${this.apiBaseUrl}/models`
  }

  getCapabilities() {
    return { ...this._capabilities }
  }

  /** Headers required to authenticate with the provider. Override per provider. */
  authHeaders(apiKey) {
    return { Authorization: `Bearer ${apiKey || this.getApiKey()}` }
  }

  async isAvailable() {
    return this.isConfigured()
  }

  async validateApiKey(apiKey) {
    const key = apiKey || this.getApiKey()
    if (!key) return { valid: false, reason: 'missing-key' }
    try {
      const response = await fetchWithTimeout(this.validateEndpoint, {
        method: 'GET',
        headers: this.authHeaders(key)
      }, 10_000)
      if (response.ok) return { valid: true, reason: 'verified' }
      if (response.status === 401) return { valid: false, reason: 'invalid-key' }
      if (response.status === 403) return { valid: false, reason: 'forbidden' }
      return { valid: false, reason: `status-${response.status}` }
    } catch (error) {
      return { valid: false, reason: 'unreachable', note: error.message }
    }
  }

  /** Build the chat request body (override for non-OpenAI shapes if needed). */
  buildBody({ messages, model }) {
    return {
      model: model || this._models[0]?.id,
      messages: toChatMessages(messages),
      stream: false
    }
  }

  extractText(data) {
    return data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
  }

  extractUsage(data) {
    const u = data?.usage
    if (!u) return undefined
    return {
      promptTokens: u.prompt_tokens ?? u.promptTokens,
      completionTokens: u.completion_tokens ?? u.completionTokens,
      totalTokens: u.total_tokens ?? u.totalTokens
    }
  }

  async listModels() {
    return this._models.map((m) => ({ ...m }))
  }

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this._models[0]?.id
    if (!this.isConfigured()) {
      return { text: buildChatFallback(prompt), provider: 'fallback', model: usedModel, usedFallback: true, note: `${this.name} API key not configured.` }
    }
    try {
      const result = await withRetry(() =>
        postChat({
          url: this.chatEndpoint,
          headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
          body: this.buildBody({ messages, prompt, model: usedModel }),
          provider: this.id,
          model: usedModel,
          extractText: (d) => this.extractText(d),
          extractUsage: (d) => this.extractUsage(d)
        })
      )
      return result
    } catch (error) {
      console.warn(`${this.name} chat failed, using fallback:`, error.message)
      return { text: buildChatFallback(prompt), provider: 'fallback', model: usedModel, usedFallback: true, error: error.message }
    }
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this._models[0]?.id
    if (!this.isConfigured()) {
      const fallback = buildChatFallback(prompt)
      if (onChunk) onChunk(fallback)
      return { text: fallback, provider: 'fallback', model: usedModel, usedFallback: true, note: `${this.name} API key not configured.` }
    }
    try {
      const body = this.buildBody({ messages, prompt, model: usedModel })
      body.stream = true
      const response = await withRetry(() =>
        fetchWithTimeout(this.streamEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
          body: JSON.stringify(body)
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
        extractText: (d) => {
          if (d?.choices?.[0]?.delta?.content) return d.choices[0].delta.content
          if (d?.choices?.[0]?.text) return d.choices[0].text
          return null
        },
        extractUsage: (d) => this.extractUsage(d),
        onChunk
      })
    } catch (error) {
      console.warn(`${this.name} streaming failed, using fallback:`, error.message)
      const fallback = buildChatFallback(prompt)
      if (onChunk) onChunk(fallback)
      return { text: fallback, provider: 'fallback', model: usedModel, usedFallback: true, error: error.message }
    }
  }

  /** Estimate the context (token) budget for this provider's model. */
  getContextWindow(model) {
    const m = this._models.find((x) => x.id === model)
    return m?.contextWindow || this.contextWindow
  }
}

export default CloudChatProvider
