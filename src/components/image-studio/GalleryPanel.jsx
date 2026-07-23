import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useRef, useEffect } from 'react'
import { GalleryHorizontalEnd, Search, Star, Folder, X, Download, Copy, CopyPlus, RefreshCw, Trash2, Share2, Tag, FolderPlus } from 'lucide-react'
import LazyImage from '../LazyImage'
import GlassPanel from '../GlassPanel'
import ImageViewer from './ImageViewer'

export default function GalleryPanel({ images, onAction, collections, isOpen }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [viewerImages, setViewerImages] = useState([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const sentinelRef = useRef(null)

  const filtered = useMemo(() => {
    let list = images || []
    if (filter === 'favorites') list = list.filter((i) => i.favorite)
    else if (filter !== 'all') list = list.filter((i) => i.collectionId === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((i) =>
        (i.prompt || '').toLowerCase().includes(q) ||
        (i.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [images, filter, query])

  const visible = filtered.slice(0, visibleCount)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, query])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filtered.length) {
        setVisibleCount((c) => c + PAGE_SIZE)
      }
    }, { rootMargin: '300px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [visibleCount, filtered.length])

  const openViewer = (imgList, idx) => {
    setViewerImages(imgList)
    setViewerIndex(idx ?? 0)
    setShowViewer(true)
  }

  const handleViewerDelete = async (id) => {
    onAction('delete', { id })
  }

  const handleViewerToggleFavorite = (id) => {
    onAction('favorite', { id })
  }

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} xl:translate-x-0 xl:opacity-100`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar pl-1">
        {/* Search & Filters */}
        <GlassPanel className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition focus-within:border-indigo-400/40 focus-within:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prompts or tags"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              {query && (
                <button onClick={() => setQuery('')} className="shrink-0 text-slate-400 hover:text-white transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
            <FilterChip active={filter === 'favorites'} onClick={() => setFilter('favorites')}>
              <Star className="h-3.5 w-3.5" /> Favorites
            </FilterChip>
            {collections.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                <Folder className="h-3.5 w-3.5" /> {c.name}
              </FilterChip>
            ))}
          </div>
        </GlassPanel>

        {/* Gallery */}
        <GlassPanel className="p-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GalleryHorizontalEnd className="h-5 w-5 text-indigo-300" />
              <h3 className="text-lg font-semibold text-white">Gallery</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{filtered.length}</span>
            </div>
          </div>

          <div className="columns-1 gap-4 sm:columns-2 xl:columns-2">
            <AnimatePresence>
              {visible.length ? (
                visible.map((entry, i) => (
                  <GalleryCard
                    key={entry.id}
                    index={i}
                    entry={entry}
                    onAction={onAction}
                    onView={() => openViewer(visible, i)}
                    searchQuery={query}
                  />
                ))
              ) : images.length ? (
                <div className="break-inside-avoid">
                  <EmptyGalleryMessage query={query} onClearQuery={() => setQuery('')} />
                </div>
              ) : (
                <div className="break-inside-avoid">
                  <EmptyGalleryMessage onClearQuery={() => {}} isNew />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div ref={sentinelRef} className="h-8" />
          {visibleCount < filtered.length && (
            <p className="py-4 text-center text-sm text-slate-500">Loading more…</p>
          )}
        </GlassPanel>
      </div>

      {/* Gallery Viewer */}
      <ImageViewer
        images={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setShowViewer(false)}
        onDelete={handleViewerDelete}
        onToggleFavorite={handleViewerToggleFavorite}
        onNavigate={setViewerIndex}
      />
    </div>
  )
}

function EmptyGalleryMessage({ query, onClearQuery, isNew }) {
  if (isNew) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10">
          <GalleryHorizontalEnd className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-white">No images yet</p>
        <p className="mt-2 text-sm text-slate-400">Generate your first concept and it will appear here.</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10">
        <Search className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">No matches found</p>
      <p className="mt-2 text-sm text-slate-400">Try a different keyword, tag, or filter.</p>
      {query && (
        <button onClick={onClearQuery} className="mt-3 text-sm text-indigo-300 hover:text-indigo-200 transition">Clear search</button>
      )}
    </div>
  )
}

function GalleryCard({ entry, onAction, onView, index }) {
  const [showActions, setShowActions] = useState(false)
  const primary = entry.images?.[0]?.url

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-[1.25rem] border border-white/8 bg-white/[0.03] transition-all duration-300 hover:border-white/15 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <div onClick={onView} className="relative cursor-zoom-in">
        {primary ? (
          <LazyImage src={primary} alt={entry.prompt} className="w-full" />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-indigo-300">
            <GalleryHorizontalEnd className="h-8 w-8" />
          </div>
        )}
        {entry.favorite && (
          <div className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-amber-400/90 text-black shadow-lg ring-2 ring-amber-200/50">
            <Star className="h-3.5 w-3.5 fill-current" />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 p-3"
          >
            <p className="pointer-events-auto line-clamp-2 text-xs leading-5 text-white/90 mb-2">{entry.prompt}</p>
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              <ActionBtn label="View" onClick={onView}><span className="text-[0.65rem]">👁</span></ActionBtn>
              <ActionBtn label="Download" onClick={() => onAction('download', entry)}><Download className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Copy prompt" onClick={() => onAction('copy-prompt', entry)}><Copy className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Duplicate" onClick={() => onAction('duplicate', entry)}><CopyPlus className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Regenerate" onClick={() => onAction('regenerate', entry)}><RefreshCw className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Share" onClick={() => onAction('share', entry)}><Share2 className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label={entry.favorite ? 'Unfavorite' : 'Favorite'} onClick={() => onAction('favorite', entry)} active={entry.favorite}>
                <Star className={`h-3.5 w-3.5 ${entry.favorite ? 'fill-current' : ''}`} />
              </ActionBtn>
              <ActionBtn label="Tags" onClick={() => onAction('tags', entry)}><Tag className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Collection" onClick={() => onAction('collection', entry)}><FolderPlus className="h-3.5 w-3.5" /></ActionBtn>
              <ActionBtn label="Delete" onClick={() => onAction('delete', entry)} danger><Trash2 className="h-3.5 w-3.5" /></ActionBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ActionBtn({ children, label, onClick, danger, active }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`pointer-events-auto grid h-7 w-7 place-items-center rounded-full border border-white/15 backdrop-blur transition-all duration-200 hover:scale-110 active:scale-90 ${
        danger ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : active ? 'bg-amber-400/30 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.2)]' : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-[0_0_8px_rgba(255,255,255,0.1)]'
      }`}
    >
      {children}
    </button>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
        active
          ? 'border-indigo-400/50 bg-indigo-500/20 text-white shadow-[0_0_12px_rgba(129,140,248,0.2)]'
          : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:border-white/15'
      }`}
    >
      {children}
    </button>
  )
}
