import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Copy, Check, RefreshCw, Pencil, AlertCircle, Square, Sparkles, ThumbsUp, ThumbsDown, Share2, Trash2 } from 'lucide-react'
import { ChatMarkdown } from './ChatMarkdown'
import AttachmentPreview from './AttachmentPreview'

export default function MessageBubble({
  role,
  content,
  timestamp,
  status,
  onRetry,
  onRegenerate,
  onEdit,
  onDelete,
  attachments,
  isSearchMatch,
  searchQuery,
  imageRedirect
}) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const navigate = useNavigate()
  const isUser = role === 'user'
  const isError = status === 'error'
  const isStopped = status === 'stopped'
  const isStreaming = status === 'streaming'

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  const handleLike = useCallback(() => {
    setLiked(prev => !prev)
    setDisliked(false)
  }, [])

  const handleDislike = useCallback(() => {
    setDisliked(prev => !prev)
    setLiked(false)
  }, [])

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'InfinityAI Chat',
        text: content
      })
    } catch {
      handleCopy()
    }
  }, [content, handleCopy])

  const handleEditSubmit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim())
    }
    setIsEditing(false)
  }

  const highlightMatch = (text) => {
    if (!searchQuery || !isSearchMatch || !text) return text
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return <mark key={i} className="rounded bg-indigo-500/40 px-0.5 text-white font-medium">{part}</mark>
      }
      return part
    })
  }

  const showActions = !isStreaming && !imageRedirect

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all duration-300 ${
        isUser
          ? 'brand-gradient text-white shadow-[0_8px_24px_-8px_rgba(129,140,248,0.45)]'
          : 'bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_4px_16px_-6px_rgba(129,140,248,0.2)]'
      }`}>
        {isUser ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className={`group/message relative max-w-[78%] rounded-3xl px-5 py-4 text-sm leading-7 transition-all duration-300 ${
        isUser
          ? 'bg-white/[0.09] text-white border border-white/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]'
          : 'bg-white/[0.05] text-slate-200 border border-white/8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]'
      } ${isError ? 'border-red-500/30 bg-red-500/[0.06]' : ''} ${isStopped ? 'border-amber-500/30 bg-amber-500/[0.06]' : ''}`}>
        
        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} onRemove={undefined} />
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleEditSubmit()
                }
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3.5 text-sm text-white outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              autoFocus
              rows={4}
            />
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleEditSubmit}
                className="rounded-full brand-gradient px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(129,140,248,0.5)] transition hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <span className="text-[0.65rem] text-slate-500">Ctrl+Enter to save</span>
            </div>
          </div>
        ) : (
          <>
            <div className={`space-y-2 ${isUser ? '' : 'prose-chat'}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap text-slate-200">{highlightMatch(content)}</p>
              ) : imageRedirect ? (
                <div className="space-y-4">
                  <p className="text-slate-200 leading-7">I can create that image for you.</p>
                  <p className="text-slate-300">Please use AI Image for image generation.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/image')}
                    className="rounded-2xl brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110"
                  >
                    Open AI Image
                  </motion.button>
                </div>
              ) : (
                <ChatMarkdown content={content} />
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[0.7rem] text-slate-500">
              {timestamp && (
                <span>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {isError && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Generation failed
                </span>
              )}
              {isStopped && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Square className="h-3.5 w-3.5" />
                  Stopped
                </span>
              )}
              {isStreaming && (
                <span className="flex items-center gap-1 text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Streaming...
                </span>
              )}
            </div>

            {showActions && (
              <div className="absolute -bottom-3.5 right-3 flex items-center gap-1 opacity-0 translate-y-1 transition-all duration-200 group-hover/message:opacity-100 group-hover/message:translate-y-0">
                {!isUser && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
                      aria-label="Copy"
                      title="Copy message"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
                        aria-label="Regenerate"
                        title="Regenerate response"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onRetry && status === 'error' && (
                      <button
                        onClick={onRetry}
                        className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
                        aria-label="Retry"
                        title="Retry"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={handleLike}
                      className={`grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-110 active:scale-95 ${liked ? 'text-emerald-400 border-emerald-400/20' : ''}`}
                      aria-label="Like"
                      title="Like response"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleDislike}
                      className={`grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-110 active:scale-95 ${disliked ? 'text-red-400 border-red-400/20' : ''}`}
                      aria-label="Dislike"
                      title="Dislike response"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                     <button
                       onClick={handleShare}
                       disabled
                       className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-600 cursor-not-allowed"
                       aria-label="Share coming soon"
                       title="Share response — Coming Soon"
                     >
                       <Share2 className="h-3.5 w-3.5" />
                     </button>
                  </>
                )}
                {isUser && onDelete && (
                  <button
                    onClick={onDelete}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 hover:scale-110 active:scale-95"
                    aria-label="Delete"
                    title="Delete message"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {isUser && onEdit && (
                  <button
                    onClick={() => { setEditText(content); setIsEditing(true) }}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14]/90 text-slate-400 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
                    aria-label="Edit"
                    title="Edit message"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
