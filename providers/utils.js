/**
 * Shared helpers for provider adapters.
 */

/**
 * Deterministic, dependency-free fallback text so the chat experience never
 * hard-fails when a provider is offline or not yet implemented.
 * @param {string} prompt
 * @returns {string}
 */
export function buildChatFallback(prompt) {
  const normalized = (prompt || '').trim() || 'your prompt'
  return `Here is a practical response for: ${normalized}\n\n- Summarize the key points.\n- Suggest the next action.\n- Offer a polished draft you can refine.`
}

/**
 * Normalize an array of chat messages into a single prompt string for
 * providers (like Ollama's /api/generate) that take a flat prompt.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} [fallbackPrompt]
 * @returns {string}
 */
export function messagesToPrompt(messages, fallbackPrompt = '') {
  if (!Array.isArray(messages) || messages.length === 0) return fallbackPrompt
  return messages
    .map((m) => {
      const role = m.role === 'assistant' ? 'Assistant' : m.role === 'system' ? 'System' : 'User'
      return `${role}: ${m.content}`
    })
    .join('\n')
}

/**
 * Fetch with a timeout so a hung provider cannot stall a request.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} [timeoutMs]
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 20_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Rough token estimate (~4 chars/token). Not exact, but good enough for
 * progress/context indicators without a tokenizer dependency.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text) return 0
  return Math.ceil((text.length || 0) / 4)
}

/**
 * Estimate tokens for a full chat transcript (content + small role overhead).
 * @param {Array<{role: string, content: string}>} messages
 * @returns {number}
 */
export function estimateMessageTokens(messages = []) {
  let total = 0
  for (const m of messages) {
    total += estimateTokens(m?.content || '')
    total += 4 // per-message overhead
  }
  return total
}

/**
 * Intelligently truncate a message list so its estimated token count fits
 * within `maxTokens`. Always keeps the most recent messages and preserves the
 * leading system message when one is present. Returns a new array.
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} maxTokens
 * @returns {Array<{role: string, content: string}>}
 */
export function truncateMessagesToContext(messages = [], maxTokens) {
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return messages
  const list = [...messages]
  const systemIdx = list.findIndex((m) => m.role === 'system')
  const systemMessage = systemIdx >= 0 ? list.splice(systemIdx, 1)[0] : null
  const systemTokens = systemMessage ? estimateMessageTokens([systemMessage]) : 0
  let budget = maxTokens - systemTokens

  const kept = []
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const tokens = estimateMessageTokens([list[i]])
    if (tokens <= budget) {
      budget -= tokens
      kept.unshift(list[i])
    } else {
      // Try truncating a single long message to fit instead of dropping it.
      const fits = budget - 4
      if (fits > 20 && list[i].content) {
        const allowedChars = fits * 4
        const trimmed = list[i].content.slice(-allowedChars)
        kept.unshift({ ...list[i], content: `…${trimmed}` })
        budget -= fits
      }
      break
    }
  }
  return systemMessage ? [systemMessage, ...kept] : kept
}

/**
 * Build a messages array suitable for OpenAI-compatible chat APIs.
 * If a flat `prompt` is supplied (no history), it becomes a single user turn.
 * @param {Array<{role: string, content: string}>} [messages]
 * @param {string} [prompt]
 * @returns {Array<{role: string, content: string}>}
 */
export function toChatMessages(messages, prompt) {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user', content: m.content || '' }))
  }
  return [{ role: 'user', content: prompt || '' }]
}

/**
 * Stream a Server-Sent-Events (or newline-delimited JSON) body from a fetch
 * Response, extracting incremental text via `extractText`. Normalises the
 * result to { text, provider, model, usedFallback, usage }.
 *
 * @param {Response} response
 * @param {object} opts
 * @param {string} opts.provider
 * @param {string} opts.model
 * @param {function(object): string|null} opts.extractText - returns the text delta for a parsed JSON event (or null)
 * @param {function(object): object|undefined} [opts.extractUsage] - returns {promptTokens, completionTokens}
 * @param {function(string): void} [opts.onChunk]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<{text: string, provider: string, model: string, usedFallback: boolean, usage?: object}>}
 */
export async function streamSSE({
  response,
  provider,
  model,
  extractText,
  extractUsage,
  onChunk,
  timeoutMs = 180_000
}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const reader = response.body?.getReader?.()
  const decoder = new TextDecoder()
  let fullText = ''
  let usage
  try {
    if (!reader) {
      const data = await response.json()
      const text = extractText(data) || ''
      if (onChunk && text) onChunk(text)
      fullText = text
      usage = extractUsage?.(data)
      return { text: fullText, provider, model, usedFallback: false, usage }
    }
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by a blank line.
      const events = buffer.split(/\n\n/)
      buffer = events.pop() || ''
      for (const event of events) {
        const lines = event.split('\n').filter((l) => l.startsWith('data:'))
        for (const line of lines) {
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const parsed = JSON.parse(payload)
            if (parsed?.error) throw new Error(typeof parsed.error === 'string' ? parsed.error : parsed.error?.message || 'stream error')
            const delta = extractText(parsed)
            if (delta) {
              fullText += delta
              if (onChunk) onChunk(delta)
            }
            const u = extractUsage?.(parsed)
            if (u) usage = u
          } catch (err) {
            if (err.message && !err.message.includes('JSON')) throw err
          }
        }
      }
    }
    return { text: fullText.trim(), provider, model, usedFallback: false, usage }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Post a non-streaming chat completion and normalise the text + usage.
 */
export async function postChat({ url, headers, body, provider, model, extractText, extractUsage, timeoutMs = 60_000 }) {
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  }, timeoutMs)
  if (!response.ok) {
    const message = await safeErrorMessage(response)
    const err = new Error(message)
    err.status = response.status
    throw err
  }
  const data = await response.json()
  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || 'provider error')
  }
  return {
    text: (extractText(data) || '').trim(),
    provider,
    model,
    usedFallback: false,
    usage: extractUsage?.(data)
  }
}

/**
 * Read a human-readable error message from a failed fetch response.
 * @param {Response} response
 * @returns {Promise<string>}
 */
export async function safeErrorMessage(response) {
  let detail = ''
  try {
    const data = await response.json()
    detail = typeof data?.error === 'string' ? data.error : data?.error?.message || data?.message || ''
  } catch {
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }
  }
  const base = `Provider responded with ${response.status}`
  return detail ? `${base}: ${detail}` : base
}

/**
 * Exponential backoff retry wrapper. Retries up to `retries` times on
 * transient failures (network errors, 429, 5xx). Does NOT retry 401.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {object} [opts]
 * @param {number} [opts.retries]
 * @param {number} [opts.baseDelayMs]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, { retries = 3, baseDelayMs = 600 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const status = err?.status || err?.cause?.status
      if (status === 401) throw err
      if (attempt === retries) break
      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}
