import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Trash2, Star, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, RefreshCcw } from 'lucide-react'

export default function ImageViewer({
  images,
  initialIndex,
  onClose,
  onDelete,
  onToggleFavorite,
  onNavigate,
}) {
  const [index, setIndex] = useState(initialIndex || 0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  const currentImage = images[index]
  const isFavorite = currentImage?.favorite

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const goNext = useCallback(() => {
    if (index < images.length - 1) {
      const next = index + 1
      setIndex(next)
      onNavigate?.(next)
      resetView()
    }
  }, [index, images.length, onNavigate, resetView])

  const goPrev = useCallback(() => {
    if (index > 0) {
      const prev = index - 1
      setIndex(prev)
      onNavigate?.(prev)
      resetView()
    }
  }, [index, onNavigate, resetView])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)))
  }, [])

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleDoubleClick = () => {
    if (scale > 1.1) {
      resetView()
    } else {
      setScale(2.5)
      setPosition({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(5, s + 0.25))
      if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.25))
      if (e.key === '0') resetView()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev, resetView])

  useEffect(() => {
    const node = containerRef.current
    if (node) {
      node.addEventListener('wheel', handleWheel, { passive: false })
      return () => node.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  if (!currentImage) return null

  const primaryUrl = currentImage.images?.[0]?.url

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="text-xs text-slate-400">
          {index + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggleFavorite?.(currentImage.id)} className={`rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 ${isFavorite ? 'text-amber-300' : ''}`}>
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button onClick={() => onDelete?.(currentImage.id)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/30">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={() => onClose()} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          {index > 0 && (
            <button onClick={goPrev} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:scale-105">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button onClick={goNext} className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:scale-105">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </>
      )}

      {/* Image */}
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center cursor-zoom-in"
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
        {primaryUrl && (
          <motion.img
            ref={imageRef}
            src={primaryUrl}
            alt={currentImage.prompt}
            animate={{ scale, x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
            draggable={false}
          />
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
        <button onClick={() => setScale((s) => Math.min(5, s + 0.5))} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:scale-105" title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.5))} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:scale-105" title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={resetView} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:scale-105" title="Fit">
          <Maximize className="h-4 w-4" />
        </button>
        <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }) }} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:scale-105" title="Original Size">
          <RefreshCcw className="h-4 w-4" />
        </button>
        {primaryUrl && (
          <button onClick={() => window.open(primaryUrl, '_blank')} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:scale-105" title="Open original">
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
