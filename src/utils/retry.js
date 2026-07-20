// retry.js — resilient fetch/async wrapper with exponential backoff + jitter.
// Handles transient failures (429, 5xx, network errors) by retrying with
// increasing delays, capped by jitter to avoid retry storms.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const MAX_BACKOFF_MS = 30_000

export function isRetryableError(error) {
  if (!error) return false
  if (error.name === 'TypeError' || error.name === 'NetworkError' || error.message === 'Network request failed') {
    return true
  }
  if (error.name === 'AbortError' || error.message === 'The user aborted a request.') {
    return false
  }
  if (typeof error.status === 'number' && RETRYABLE_STATUS.has(error.status)) return true
  if (typeof error.code === 'string' && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND')) return true
  return false
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RetryError extends Error {
  constructor(message, { attempts, lastError } = {}) {
    super(message)
    this.name = 'RetryError'
    this.attempts = attempts
    this.lastError = lastError
  }
}

/**
 * retryWithBackoff
 * @param {() => Promise<any>} fn async function to execute; may throw or return
 *   an object like { ok: false, status } to signal a retryable failure.
 * @param {object} options
 * @param {number} options.maxRetries default 3
 * @param {number} options.baseDelay initial delay in ms (default 1000)
 * @param {AbortSignal} options.signal external cancellation
 * @param {(attempt:number, delay:number)=>void} options.onRetry
 */
export async function retryWithBackoff(fn, { maxRetries = 3, baseDelay = 1000, signal, onRetry } = {}) {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    try {
      const result = await fn(attempt)
      // Allow fn to communicate a retryable failure without throwing.
      if (result && typeof result === 'object' && result.ok === false && isRetryableError(result.error)) {
        lastError = result.error
      } else {
        return result
      }
    } catch (error) {
      if (error.name === 'AbortError') throw error
      lastError = error
      if (!isRetryableError(error)) throw error
    }

    if (attempt === maxRetries) break

    const exponential = baseDelay * Math.pow(2, attempt)
    // Full jitter: random in [0, exponential], capped.
    const jitter = Math.random() * Math.min(exponential, MAX_BACKOFF_MS)
    const delay = Math.min(jitter, MAX_BACKOFF_MS)

    onRetry?.(attempt + 1, delay, lastError)
    await sleep(delay)
  }

  throw new RetryError(
    lastError?.message || 'Request failed after multiple retries',
    { attempts: maxRetries + 1, lastError }
  )
}

export default retryWithBackoff
