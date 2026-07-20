// cache.js — small in-memory TTL cache with key generation and invalidation.
// Used for provider model lists, static config, and other rarely-changing data.

class TTLCache {
  constructor({ defaultTtl = 5 * 60 * 1000, maxEntries = 500 } = {}) {
    this.defaultTtl = defaultTtl
    this.maxEntries = maxEntries
    this.store = new Map()
  }

  static key(...parts) {
    return parts
      .map((part) => {
        if (part === null || part === undefined) return ''
        if (typeof part === 'string' || typeof part === 'number' || typeof part === 'boolean') return String(part)
        try {
          return JSON.stringify(part)
        } catch {
          return String(part)
        }
      })
      .join('::')
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key, value, ttl = this.defaultTtl) {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttl })
    return value
  }

  has(key) {
    return this.get(key) !== undefined
  }

  delete(key) {
    return this.store.delete(key)
  }

  // Remove every key that includes any of the given tags/prefixes.
  invalidate(...matchers) {
    if (matchers.length === 0) {
      this.store.clear()
      return
    }
    for (const key of [...this.store.keys()]) {
      if (matchers.some((m) => key.includes(typeof m === 'string' ? m : String(m)))) {
        this.store.delete(key)
      }
    }
  }
}

export const cache = new TTLCache()

export default cache
