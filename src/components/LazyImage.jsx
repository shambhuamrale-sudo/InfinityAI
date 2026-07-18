import { useEffect, useRef, useState } from 'react'

/**
 * LazyImage
 * ---------
 * Intersection-observer based lazy image with a skeleton shimmer and graceful
 * fade-in. Used across the Image Studio gallery for performant scrolling.
 */
export default function LazyImage({ src, alt = '', className = '', imgClassName = '', onClick }) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />}
      {inView && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : null}
    </div>
  )
}
