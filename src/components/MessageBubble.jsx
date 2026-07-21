import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Copy, Check, RefreshCw, Pencil, AlertCircle, Square, Sparkles } from 'lucide-react'
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
  attachments,
  isSearchMatch,
  searchQuery,
  imageRedirect
}) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const navigate = useNavigate()
  const isUser = role === 'user'
  const isError = status === 'error'
  const isStopped = status === 'stopped'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleEditSubmit = () => {
    if (editText.trim()) {
      onEdit(editText.trim())
    }
    setIsEditing(false)
  }

  const highlightMatch = (text) => {
    if (!searchQuery || !isSearchMatch) return text
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return <mark key={i} className="rounded bg-indigo-500/40 px-0.5 text-white">{part}</mark>
      }
      return part
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
        isUser
          ? 'brand-gradient text-white shadow-[0_8px_24px_-8px_rgba(129,140,248,0.5)]'
          : 'bg-white/[0.06] text-indigo-300 ring-1 ring-white/10'
      }`}>
        {isUser ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div className={`group relative max-w-[75%] rounded-3xl px-5 py-4 text-sm leading-7 ${
        isUser
          ? 'bg-white/[0.08] text-white border border-white/8'
          : 'bg-white/[0.04] text-slate-200 border border-white/6'
      } ${isError ? 'border-red-500/30 bg-red-500/5' : ''}`}>
        
        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400/50"
              autoFocus
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSubmit}
                className="rounded-full brand-gradient px-4 py-2 text-xs font-semibold text-white"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`space-y-2 ${isUser ? '' : 'prose-chat'}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap text-slate-200">{highlightMatch(content)}</p>
              ) : imageRedirect ? (
                <div className="space-y-4">
                  <p className="text-slate-200">I can create that image for you.</p>
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

            {timestamp && (
              <p className="mt-2 text-[0.7rem] text-slate-500">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {isError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Generation failed</span>
              </div>
            )}

            {isStopped && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                <Square className="h-3.5 w-3.5" />
                <span>Stopped</span>
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="absolute -bottom-3 right-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {!isUser && (
              <>
                <button
                  onClick={handleCopy}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Copy"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {status === 'error' && onRetry && (
                  <button
                    onClick={onRetry}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Retry"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Regenerate"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
            {isUser && onEdit && (
              <button
                onClick={() => { setEditText(content); setIsEditing(true) }}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
