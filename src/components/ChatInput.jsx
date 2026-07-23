import { motion } from 'framer-motion'
import { Send, Square, Paperclip, Mic, Image, Code, AlertCircle } from 'lucide-react'
import { useEffect, useCallback } from 'react'
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
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [prompt, textareaRef])

  const handleVoice = useCallback(() => {
    addToast({ kind: 'info', title: 'Voice input', message: 'Voice input is coming soon.' })
  }, [addToast])

  const handleImage = useCallback(() => {
    addToast({ kind: 'info', title: 'Image upload', message: 'Use the attachment button to upload images.' })
  }, [addToast])

  const handleCode = useCallback(() => {
    setPrompt((prev) => prev + '```\n\n```')
    textareaRef.current?.focus()
  }, [setPrompt, textareaRef])

  const charCount = prompt.length
  const maxChars = 8000
  const charsNearLimit = charCount > maxChars * 0.9

  return (
    <div className="mt-5 space-y-3">
      {Array.isArray(attachments) && attachments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap gap-2.5"
        >
          {attachments.map((att) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 pr-10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-white/15 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-indigo-300">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">{att.name}</p>
                <p className="text-[0.65rem] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="relative flex items-end gap-2 rounded-3xl border border-white/8 bg-white/[0.04] p-2.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.2)] transition-all duration-200 focus-within:border-indigo-400/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_40px_-12px_rgba(129,140,248,0.25)]">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <div className="relative flex-1">
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
            className="max-h-48 flex-1 w-full resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 transition-all"
            placeholder="Message InfinityAI..."
          />
          {charsNearLimit && (
            <div className="absolute -bottom-5 left-0 text-[0.65rem] text-amber-400">
              {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleImage}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
            aria-label="Image"
            title="Generate image"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            onClick={handleCode}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
            aria-label="Code"
            title="Insert code block"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={handleVoice}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
            aria-label="Voice"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {loading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15 hover:shadow-[0_0_24px_-6px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={!prompt.trim() && (!Array.isArray(attachments) || attachments.length === 0)}
              className="flex items-center gap-2 rounded-2xl brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition-all duration-200 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 active:scale-95"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span className="flex items-center gap-2">
          <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-slate-400">Enter</kbd>
          <span>to send</span>
          <kbd className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-slate-400">Shift+Enter</kbd>
          <span>for new line</span>
        </span>
        <span className="text-[0.65rem] text-slate-600">
          {charCount > 0 && `${charCount.toLocaleString()} chars`}
        </span>
        {error && (
          <span className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
