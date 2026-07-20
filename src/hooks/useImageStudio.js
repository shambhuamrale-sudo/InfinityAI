import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE as apiBase } from '../config/api'

// Cache generated data URLs in-memory so re-rendering the gallery does not
// re-decode large payloads and repeated lookups are cheap.
const imageCache = new Map()

export function cacheImage(key, url) {
  if (key && url) imageCache.set(key, url)
}
export function getCachedImage(key) {
  return imageCache.get(key)
}

const MAX_RETRIES = 2

/**
 * useImageStudio
 * --------------
 * Encapsulates all Image Studio generation/editing network logic:
 *   - provider + model catalog loading
 *   - text-to-image generation with progress + cancelation
 *   - AI editing (img2img, upscale, bg-removal, inpaint, outpaint, …)
 *   - random prompt generation
 *   - a small generation queue (batch operations) with per-image progress
 *   - retry logic for failed generations
 *
 * The hook never throws for expected failures; callers get a normalized result.
 */
export function useImageStudio() {
  const [providers, setProviders] = useState([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [queue, setQueue] = useState([])
  const [batchProgress, setBatchProgress] = useState(null)
  const controllerRef = useRef(null)
  const progressTimerRef = useRef(null)

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true)
    try {
      const res = await fetch(`${apiBase}/image/providers/models`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setProviders(Array.isArray(data.providers) ? data.providers : [])
      }
    } catch {
      /* selector degrades gracefully */
    } finally {
      setProvidersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProviders()
    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current)
      controllerRef.current?.abort()
    }
  }, [loadProviders])

  const startProgress = useCallback(() => {
    setProgress(4)
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current)
    progressTimerRef.current = window.setInterval(() => {
      // Ease toward 90% while awaiting the server; snap to 100 on completion.
      setProgress((p) => (p >= 90 ? p : p + Math.max(1, Math.round((90 - p) * 0.08))))
    }, 200)
  }, [])

  const stopProgress = useCallback((final = 100) => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(final)
    window.setTimeout(() => setProgress(0), 600)
  }, [])

  const request = useCallback(async (path, params, signal) => {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include',
      signal
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  const generate = useCallback(async (params) => {
    setError(null)
    setGenerating(true)
    startProgress()
    const abort = new AbortController()
    controllerRef.current = abort
    try {
      let data
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          data = await request('/image', params, abort.signal)
          if (data && !data.error) break
        } catch (err) {
          if (err.name === 'AbortError') throw err
          if (attempt === MAX_RETRIES) throw err
        }
      }
      stopProgress(100)
      return data
    } catch (err) {
      stopProgress(0)
      if (err.name === 'AbortError') {
        setError('cancelled')
        return { cancelled: true }
      }
      setError(err.message || 'Generation failed')
      return { error: err.message || 'Generation failed' }
    } finally {
      setGenerating(false)
      controllerRef.current = null
    }
  }, [startProgress, stopProgress, request])

  const edit = useCallback(async (params) => {
    setError(null)
    setGenerating(true)
    startProgress()
    const abort = new AbortController()
    controllerRef.current = abort
    try {
      let data
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          data = await request('/image/edit', params, abort.signal)
          if (data && !data.error) break
        } catch (err) {
          if (err.name === 'AbortError') throw err
          if (attempt === MAX_RETRIES) throw err
        }
      }
      stopProgress(100)
      return data
    } catch (err) {
      stopProgress(0)
      if (err.name === 'AbortError') {
        setError('cancelled')
        return { cancelled: true }
      }
      setError(err.message || 'Edit failed')
      return { error: err.message || 'Edit failed' }
    } finally {
      setGenerating(false)
      controllerRef.current = null
    }
  }, [startProgress, stopProgress, request])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const randomPrompt = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/image/random-prompt?seed=${Date.now()}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        return data.prompt || ''
      }
    } catch {
      /* fall through */
    }
    return ''
  }, [])

  /**
   * Generate multiple variants as a queue, tracking per-image status. Returns a
   * normalized array of { params, result, status } once the queue drains.
   * @param {Array<object>} items each item is a full generate() params object
   */
  const runQueue = useCallback(async (items) => {
    if (!Array.isArray(items) || !items.length) return []
    setGenerating(true)
    setQueue(items.map((it, i) => ({ id: i, params: it, status: 'pending', result: null })))
    setBatchProgress({ done: 0, total: items.length })
    const abort = new AbortController()
    controllerRef.current = abort
    const results = []
    for (let i = 0; i < items.length; i += 1) {
      if (abort.signal.aborted) break
      setQueue((q) => q.map((j) => (j.id === i ? { ...j, status: 'running' } : j)))
      let result = null
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          result = await request('/image', items[i], abort.signal)
          if (result && !result.error) break
        } catch (err) {
          if (err.name === 'AbortError') { result = { cancelled: true }; break }
          result = { error: err.message }
        }
      }
      results.push({ params: items[i], result, status: result?.error ? 'failed' : 'done' })
      setQueue((q) => q.map((j) => (j.id === i ? { ...j, status: result?.error ? 'failed' : 'done', result } : j)))
      setBatchProgress({ done: i + 1, total: items.length })
    }
    setGenerating(false)
    controllerRef.current = null
    setQueue([])
    window.setTimeout(() => setBatchProgress(null), 800)
    return results
  }, [request])

  return {
    providers,
    providersLoading,
    generating,
    progress,
    error,
    queue,
    batchProgress,
    generate,
    edit,
    cancel,
    randomPrompt,
    runQueue,
    reloadProviders: loadProviders
  }
}

export default useImageStudio
