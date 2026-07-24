import { BaseProvider } from './BaseProvider.js'
import { fetchWithTimeout, messagesToPrompt } from './utils.js'

export class LMStudioProvider extends BaseProvider {
  constructor(env = {}) {
    super({
      id: 'lm-studio',
      name: 'LM Studio (Local)',
      type: 'local',
      requiresApiKey: false,
      implemented: true,
      env
    })
    this.baseUrl = env.baseUrl || process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234'
    this.defaultModel = env.defaultModel || process.env.LM_STUDIO_MODEL || ''
  }

  getCapabilities() {
    return { chat: true, streaming: true, images: false, vision: false, tools: false }
  }

  async isAvailable() {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/v1/models`, { method: 'GET' }, 4000)
      return res.ok
    } catch {
      return false
    }
  }

  async validateApiKey() {
    const available = await this.isAvailable()
    return available
      ? { valid: true, reason: 'reachable' }
      : { valid: false, reason: 'unreachable' }
  }

  async listModels() {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/v1/models`, { method: 'GET' }, 4000)
      if (res.ok) {
        const data = await res.json()
        const models = Array.isArray(data?.data) ? data.data : []
        if (models.length) {
          return models.map((m) => ({
            id: m.id,
            name: m.id,
            provider: this.id,
            type: this.type,
            speed: 'fast',
            quality: 'good',
            local: true
          }))
        }
      }
    } catch {
      /* fall through to defaults */
    }
    return [{ id: this.defaultModel || 'local-model', name: this.defaultModel || 'Local Model', provider: this.id, type: this.type, speed: 'fast', quality: 'good', local: true }]
  }

  async chat({ prompt, model, messages } = {}) {
    const usedModel = model || this.defaultModel || 'local-model'
    const fullPrompt = messagesToPrompt(messages, prompt)
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: usedModel,
          messages: [{ role: 'user', content: `You are a helpful AI assistant. ${fullPrompt}` }],
          stream: false
        })
      }, 60_000)
      if (!response.ok) throw new Error(`LM Studio responded with ${response.status}`)
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
      if (text) {
        return { text: text.trim(), provider: this.id, model: usedModel, usedFallback: false }
      }
    } catch (error) {
      console.warn('LM Studio chat failed:', error.message)
      throw new Error('LM Studio is not running.')
    }
    throw new Error('LM Studio is not running.')
  }

  async streamChat({ prompt, model, messages } = {}, onChunk) {
    const usedModel = model || this.defaultModel || 'local-model'
    const fullPrompt = messagesToPrompt(messages, prompt)
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: usedModel,
          messages: [{ role: 'user', content: `You are a helpful AI assistant. ${fullPrompt}` }],
          stream: true
        })
      }, 120_000)
      if (!response.ok) throw new Error(`LM Studio responded with ${response.status}`)
      const reader = response.body?.getReader?.()
      if (!reader) {
        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
        if (text && onChunk) onChunk(text)
        return { text: text.trim(), provider: this.id, model: usedModel, usedFallback: false }
      }
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'))
        for (const line of lines) {
          const data = line.replace(/^data:\s*/, '').trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.text || ''
            if (delta && onChunk) {
              onChunk(delta)
              fullText += delta
            }
          } catch {
            /* skip malformed JSON */
          }
        }
      }
      return { text: fullText.trim(), provider: this.id, model: usedModel, usedFallback: false }
    } catch (error) {
      console.warn('LM Studio streaming failed:', error.message)
      const err = new Error('LM Studio is not running.')
      if (onChunk) onChunk('')
      throw err
    }
  }
}

export default LMStudioProvider
