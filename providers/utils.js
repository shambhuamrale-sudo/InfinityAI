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
