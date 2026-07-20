// requestQueue.js — bounded concurrency queue with priorities and abort support.
// - maxConcurrent default 3
// - priority: 'high' (chat) | 'normal' (tools) | 'low' (analytics)
// - queue items can be aborted individually via AbortController.

const PRIORITY_WEIGHT = { high: 0, normal: 1, low: 2 }

const PRIORITY_COMPARATOR = (a, b) => {
  if (a.priority !== b.priority) return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
  return a.seq - b.seq
}

export class RequestQueue {
  constructor({ maxConcurrent = 3 } = {}) {
    this.maxConcurrent = maxConcurrent
    this.active = new Set()
    this.waiting = []
    this.seq = 0
  }

  get size() {
    return this.active.size + this.waiting.length
  }

  _schedule() {
    if (this.active.size >= this.maxConcurrent) return
    if (this.waiting.length === 0) return
    this.waiting.sort(PRIORITY_COMPARATOR)
    const next = this.waiting.shift()
    if (!next || next.cancelled) {
      this._schedule()
      return
    }
    this.active.add(next)
    Promise.resolve()
      .then(() => next.run())
      .catch(() => {})
      .finally(() => {
        this.active.delete(next)
        this._schedule()
      })
  }

  /**
   * @param {() => Promise<any>} task
   * @param {object} options
   * @param {'high'|'normal'|'low'} options.priority
   * @param {AbortSignal} options.signal
   * @returns {Promise<any>}
   */
  enqueue(task, { priority = 'normal', signal } = {}) {
    return new Promise((resolve, reject) => {
      let cancelled = false
      const item = {
        priority,
        seq: this.seq++,
        cancelled: false,
        run: async () => {
          if (cancelled) {
            reject(new DOMException('Request cancelled', 'AbortError'))
            return
          }
          if (signal?.aborted) {
            reject(new DOMException('Request cancelled', 'AbortError'))
            return
          }
          try {
            const result = await task({ signal })
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
      }
      const onAbort = () => {
        cancelled = true
        item.cancelled = true
      }
      if (signal) {
        if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', onAbort, { once: true })
      }
      this.waiting.push(item)
      this._schedule()
    })
  }

  clear() {
    for (const item of this.waiting) item.cancelled = true
    this.waiting = []
  }
}

// Shared singleton used across the app.
export const requestQueue = new RequestQueue({ maxConcurrent: 3 })

export default requestQueue
