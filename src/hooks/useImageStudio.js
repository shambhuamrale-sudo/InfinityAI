import { useCallback, useEffect, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

// Cache generated data URLs in-memory so re-rendering the gallery does not
// re-decode large payloads and repeated lookups are cheap.
const imageCache = new Map()

export function cacheImage(key, url) {
  if (key && url) imageCache.set(key, url)
}
export function getCachedImage(key) {
  return imageCache.get(key)
}

/**
 * useImageStudio
 * --------------
 * Encapsulates all Image Studio generation/editing network logic:
 *   - provider + model catalog loading
 *   - text-to-image generation with progress + cancelation
 *   - AI editing (img2img, upscale, bg-removal, inpaint, outpaint, …)
 *   - random prompt generation
 *
 * The hook never throws for expected failures; callers get a normalized result.
 */
export function useImageStudio() {
  const [providers, setProviders] = useState([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
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

  const generate = useCallback(async (params) => {
    setError(null)
    setGenerating(true)
    startProgress()
    const abort = new AbortController()
    controllerRef.current = abort
    try {
      const res = await fetch(`${apiBase}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
        signal: abort.signal
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
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
  }, [startProgress, stopProgress])

  const edit = useCallback(async (params) => {
    setError(null)
    setGenerating(true)
    startProgress()
    const abort = new AbortController()
    controllerRef.current = abort
    try {
      const res = await fetch(`${apiBase}/image/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'include',
        signal: abort.signal
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
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
  }, [startProgress, stopProgress])

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

  return {
    providers,
    providersLoading,
    generating,
    progress,
    error,
    generate,
    edit,
    cancel,
    randomPrompt,
    reloadProviders: loadProviders
  }
}

export default useImageStudio
