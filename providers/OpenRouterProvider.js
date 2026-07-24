import { CloudChatProvider } from './CloudChatProvider.js'
import { postChat, fetchWithTimeout, safeErrorMessage, streamSSE } from './utils.js'

/**
 * OpenRouterProvider
 * ------------------
 * Real OpenRouter integration — an aggregator over many upstream models via an
 * OpenAI-compatible API. Adds the OpenRouter referral headers recommended by
 * their docs. Falls back gracefully when no API key is configured.
 */
export class OpenRouterProvider extends CloudChatProvider {
  constructor(env = {}) {
    super({
      id: 'openrouter',
      name: 'OpenRouter',
      apiBaseUrl: env.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      env: { apiKey: env.apiKey || process.env.OPENROUTER_API_KEY },
      contextWindow: 200_000,
      capabilities: { chat: true, streaming: true, images: false, vision: true, tools: true },
      models: [
        { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', speed: 'fast', quality: 'excellent', contextWindow: 128_000 },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', speed: 'fast', quality: 'excellent', contextWindow: 200_000 },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (via OpenRouter)', speed: 'medium', quality: 'good', contextWindow: 131_072 },
        { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5 (via OpenRouter)', speed: 'very-fast', quality: 'good', contextWindow: 1_000_000 }
      ]
    })
  }

  authHeaders(apiKey) {
    return {
      Authorization: `Bearer ${apiKey || this.getApiKey()}`,
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://infinityai.app',
      'X-Title': 'InfinityAI'
    }
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

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this._models[0]?.id
    if (!this.isConfigured()) {
      throw new Error(`${this.name} API key is missing.`)
    }
    const body = this.buildBody({ messages, prompt, model: usedModel })
    try {
      const result = await postChat({
        url: this.chatEndpoint,
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body,
        provider: this.id,
        model: usedModel,
        extractText: (d) => this.extractText(d),
        extractUsage: (d) => this.extractUsage(d)
      })
      return result
    } catch (error) {
      if (error.status !== 402) throw error
      const retryBody = { ...body, max_tokens: 1024 }
      try {
        const result = await postChat({
          url: this.chatEndpoint,
          headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
          body: retryBody,
          provider: this.id,
          model: usedModel,
          extractText: (d) => this.extractText(d),
          extractUsage: (d) => this.extractUsage(d)
        })
        return result
      } catch (retryError) {
        if (retryError.status === 402) {
          throw new Error(`${this.name} token limit reached.`)
        }
        throw retryError
      }
    }
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this._models[0]?.id
    if (!this.isConfigured()) {
      const err = new Error(`${this.name} API key is missing.`)
      if (onChunk) onChunk('')
      throw err
    }
    const attemptStream = async (maxTokens) => {
      const body = this.buildBody({ messages, prompt, model: usedModel })
      body.stream = true
      if (maxTokens !== undefined) body.max_tokens = maxTokens
      const response = await fetchWithTimeout(this.streamEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
        body: JSON.stringify(body)
      }, 180_000)
      if (!response.ok) {
        const message = await safeErrorMessage(response)
        const err = new Error(message)
        err.status = response.status
        throw err
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
    }
    try {
      return await attemptStream()
    } catch (error) {
      if (error.status !== 402) {
        console.warn(`${this.name} streaming failed:`, error.message)
        const err = new Error(`${this.name} streaming failed: ${error.message}`)
        if (onChunk) onChunk('')
        throw err
      }
      try {
        return await attemptStream(1024)
      } catch (retryError) {
        console.warn(`${this.name} streaming failed after retry:`, retryError.message)
        const err = new Error(`${this.name} token limit reached`)
        if (onChunk) onChunk('')
        throw err
      }
    }
  }
}

export default OpenRouterProvider
