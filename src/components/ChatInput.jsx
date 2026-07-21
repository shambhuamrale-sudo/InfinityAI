import { motion } from 'framer-motion'
import { Send, Square, Paperclip, Mic, Image, Code, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useAppContext } from '../context/useAppContext'

export default function ChatInput({
  prompt,
  setPrompt,
  onSend,
  onStop,
  loading,
  error,
  attachments,
  fileInputRef,
  textareaRef
}) {
  const { addToast } = useAppContext()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [prompt, textareaRef])

  const handleVoice = () => {
    addToast({ kind: 'info', title: 'Voice input', message: 'Voice input is coming soon.' })
  }

  const handleImage = () => {
    addToast({ kind: 'info', title: 'Image upload', message: 'Use the attachment button to upload images.' })
  }

  const handleCode = () => {
    setPrompt((prev) => prev + '```\n\n```')
    textareaRef.current?.focus()
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Attachments preview */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 pr-10"
            >
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-indigo-300">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">{att.name}</p>
                <p className="text-[0.7rem] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-end gap-2 rounded-3xl border border-white/8 bg-white/[0.04] p-2 transition-all duration-200 focus-within:border-indigo-400/40 focus-within:shadow-[0_0_30px_-10px_rgba(129,140,248,0.3)]">
        {/* Attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!loading && (prompt.trim() || (Array.isArray(attachments) && attachments.length > 0))) {
                onSend()
              }
            }
          }}
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="Message InfinityAI..."
        />

        {/* Shortcut buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleImage}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Image"
            title="Image shortcut"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            onClick={handleCode}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Code"
            title="Code shortcut"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={handleVoice}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Voice"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {loading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={!prompt.trim() && (!Array.isArray(attachments) || attachments.length === 0)}
              className="flex items-center gap-2 rounded-2xl brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.65rem]">Enter</kbd>
          <span>to send</span>
          <kbd className="ml-2 rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.65rem]">Shift+Enter</kbd>
          <span>for new line</span>
        </span>
        {error && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
