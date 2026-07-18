import { motion } from 'framer-motion'
import { Download, Copy, CopyPlus, Trash2, Share2, RefreshCw, Star, Wand2, Tag, FolderPlus } from 'lucide-react'
import { useState } from 'react'
import LazyImage from './LazyImage'

/**
 * Single gallery card with hover action overlay.
 */
export default function ImageCard({ entry, onAction, searchQuery = '' }) {
  const [showTags, setShowTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const primary = entry.images?.[0]?.url

  const highlight = (text) => {
    if (!searchQuery) return text
    const parts = String(text).split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="rounded bg-indigo-500/40 px-0.5 text-white">{part}</mark>
        : part
    )
  }

  const addTag = () => {
    const value = tagInput.trim()
    if (!value) return
    const next = Array.from(new Set([...(entry.tags || []), value]))
    onAction('tags', entry, next)
    setTagInput('')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-[1.25rem] border border-white/8 bg-white/[0.03]"
    >
      {primary ? (
        <LazyImage src={primary} alt={entry.prompt} className="w-full" />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-indigo-300">
          <Wand2 className="h-8 w-8" />
        </div>
      )}

      {entry.favorite && (
        <div className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-amber-400/90 text-black shadow-lg">
          <Star className="h-3.5 w-3.5 fill-current" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="pointer-events-auto line-clamp-2 text-xs leading-5 text-white/90">{highlight(entry.prompt)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ActionBtn label="Download" onClick={() => onAction('download', entry)}><Download className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Copy prompt" onClick={() => onAction('copy-prompt', entry)}><Copy className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Duplicate settings" onClick={() => onAction('duplicate', entry)}><CopyPlus className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Regenerate" onClick={() => onAction('regenerate', entry)}><RefreshCw className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Share" onClick={() => onAction('share', entry)}><Share2 className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label={entry.favorite ? 'Unfavorite' : 'Favorite'} onClick={() => onAction('favorite', entry)} active={entry.favorite}><Star className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Tags" onClick={() => setShowTags((v) => !v)}><Tag className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Add to collection" onClick={() => onAction('collection', entry)}><FolderPlus className="h-3.5 w-3.5" /></ActionBtn>
          <ActionBtn label="Delete" onClick={() => onAction('delete', entry)} danger><Trash2 className="h-3.5 w-3.5" /></ActionBtn>
        </div>
        {(entry.tags?.length || showTags) ? (
          <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-1.5">
            {(entry.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white/80">#{tag}</span>
            ))}
            {showTags && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="add tag"
                className="w-20 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-white outline-none placeholder:text-white/40"
              />
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function ActionBtn({ children, label, onClick, danger, active }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`pointer-events-auto grid h-7 w-7 place-items-center rounded-full border border-white/15 backdrop-blur transition hover:scale-105 ${
        danger ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' : active ? 'bg-amber-400/30 text-amber-200' : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
}
