import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Square, Copy, Sparkles, Plus, Check, Zap, ShieldCheck, Paperclip, Search, X, MoreVertical, Pin, Archive, Trash2, CopyPlus, Pencil, RefreshCw, AlertCircle, MessageSquareText, ChevronDown, Download, FileText, FileType } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ModelSelector from '../components/ModelSelector'
import ToastBanner from '../components/ToastBanner'
import AttachmentPreview from '../components/AttachmentPreview'
import ChatSearch from '../components/ChatSearch'
import { ChatMarkdown } from '../components/ChatMarkdown'
import { useAppContext } from '../context/useAppContext'
import useChat from '../hooks/useChat'

function Message({ role, content, timestamp, status, onRetry, onRegenerate, onEdit, attachments, isSearchMatch, searchQuery }) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
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
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${isUser ? 'brand-gradient text-white' : 'bg-white/[0.05] text-indigo-300 ring-1 ring-white/10'}`}>
        {isUser ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`group relative max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-7 ${isUser ? 'bg-white/[0.06] text-white' : 'border border-white/8 bg-white/[0.03] text-slate-200'} ${isError ? 'border-red-500/30 bg-red-500/5' : ''}`}>
        {attachments && attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-indigo-400/50"
              autoFocus
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={handleEditSubmit} className="rounded-full brand-gradient px-3 py-1.5 text-xs font-semibold text-white">Save</button>
              <button onClick={() => setIsEditing(false)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className={`space-y-1.5 ${isUser ? '' : 'prose-chat'}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap text-slate-200">{highlightMatch(content)}</p>
              ) : (
                <ChatMarkdown content={content} />
              )}
            </div>
            {timestamp && (
              <p className="mt-1.5 text-[0.7rem] text-slate-500">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            )}
            {isError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Generation failed</span>
              </div>
            )}
            {isStopped && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400">
                <Square className="h-3.5 w-3.5" />
                <span>Stopped</span>
              </div>
            )}
          </>
        )}
        {!isEditing && (
          <div className="absolute -bottom-3 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!isUser && (
              <>
                <button onClick={handleCopy} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:text-white" aria-label="Copy">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {status === 'error' && onRetry && (
                  <button onClick={onRetry} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:text-white" aria-label="Retry">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                {onRegenerate && (
                  <button onClick={onRegenerate} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:text-white" aria-label="Regenerate">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
            {isUser && onEdit && (
              <button onClick={() => { setEditText(content); setIsEditing(true) }} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:text-white" aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Bot className="h-4 w-4" /></div>
      <div className="flex items-center gap-1.5 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
        {[0, 1, 2].map((d) => (
          <motion.span key={d} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }} className="h-2 w-2 rounded-full bg-indigo-300" />
        ))}
      </div>
    </motion.div>
  )
}

function ConversationMenu({ conversation, onRename, onPin, onArchive, onDelete, onDuplicate, onExport }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setOpen(!open)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Conversation options">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute right-0 top-8 z-50 w-48 rounded-xl border border-white/10 bg-[#0a0c14] p-1 shadow-xl">
          <button onClick={() => { onRename(conversation); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4" /> Rename</button>
          <button onClick={() => { onPin(conversation.id); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><Pin className="h-4 w-4" /> {conversation.pinned ? 'Unpin' : 'Pin'}</button>
          <button onClick={() => { onArchive(conversation.id); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><Archive className="h-4 w-4" /> {conversation.archived ? 'Unarchive' : 'Archive'}</button>
          <button onClick={() => { onDuplicate(conversation.id); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><CopyPlus className="h-4 w-4" /> Duplicate</button>
          <div className="my-1 h-px bg-white/10" />
          <button onClick={() => { onExport('md'); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><FileText className="h-4 w-4" /> Export Markdown</button>
          <button onClick={() => { onExport('html'); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"><FileType className="h-4 w-4" /> Export HTML</button>
          <button onClick={() => { onDelete(conversation.id); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-white/10 hover:text-red-300"><Trash2 className="h-4 w-4" /> Delete</button>
        </motion.div>
      )}
    </div>
  )
}

export default function AIChatPage() {
  const { preferences, adminConfig, subscription, canUseTool, addFavorite } = useAppContext()

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const {
    conversationId,
    messages,
    loading,
    error,
    streamingText,
    streamingStatus,
    searchQuery,
    showSearch,
    conversations,
    attachments,
    dynamicSuggestions,
    scrollRef,
    textareaRef,
    setShowSearch,
    setSearchQuery,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    duplicateConversation,
    sendMessage,
    stopGeneration,
    retryMessage,
    regenerateResponse,
    editMessage,
    uploadAttachment,
    removeAttachment,
    exportConversation,
    clearMessages,
    scrollToBottom
  } = useChat()

  const [prompt, setPrompt] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const fileInputRef = useRef(null)

  const allConversations = useMemo(() => {
    const map = new Map()
    for (const c of (conversations || [])) map.set(c.id, c)
    return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [conversations])

  const activeConversation = useMemo(() => {
    const convs = conversations || []
    return convs.find((c) => c.id === conversationId)
  }, [conversations, conversationId])

  const limitStatus = useMemo(() => {
    const plan = subscription.plan || 'free-trial'
    const limits = adminConfig?.planLimits?.[plan] || adminConfig?.planLimits?.['free-trial'] || {}
    return `${(limits.maxChatsPerDay || 20)} daily chats available`
  }, [adminConfig, subscription])

  const handleNewChat = async () => {
    clearMessages()
    const conv = await createConversation('New conversation')
    if (conv) {
      setSidebarOpen(false)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() && attachments.length === 0) return
    const allowed = canUseTool('chat')
    if (!allowed.allowed) {
      setError(allowed.reason === 'trial-expired' ? 'Your trial has expired.' : 'Your daily chat limit has been reached. Upgrade to continue.')
      return
    }
    const text = prompt.trim()
    setPrompt('')
    await sendMessage(text, { provider: preferences?.chatProvider, model: preferences?.chatModel })
  }

  const handleRetry = async (index) => {
    await retryMessage(index)
  }

  const handleRegenerate = async (index) => {
    await regenerateResponse(index)
  }

  const handleEdit = async (index, newContent) => {
    await editMessage(index, newContent)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      await uploadAttachment(file)
    }
    e.target.value = ''
  }

  const handleExport = async (format) => {
    await exportConversation(format)
    setShowExportMenu(false)
  }

  const handleRename = async (conversation) => {
    const newTitle = prompt('Enter new title:', conversation.title)
    if (newTitle && newTitle.trim()) {
      await updateConversation(conversation.id, { title: newTitle.trim() })
    }
  }

  const handlePin = async (id) => {
    const conv = allConversations.find((c) => c.id === id)
    if (conv) {
      await updateConversation(id, { pinned: !conv.pinned })
    }
  }

  const handleArchive = async (id) => {
    const conv = allConversations.find((c) => c.id === id)
    if (conv) {
      await updateConversation(id, { archived: !conv.archived })
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id)
    }
  }

  const handleDuplicate = async (id) => {
    await duplicateConversation(id)
  }

  const [isNearBottom, setIsNearBottom] = useState(true)
  const scrollHandlerRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      return scrollHeight - scrollTop - clientHeight < 150
    }
    scrollHandlerRef.current = check
    setIsNearBottom(check())
    const handler = () => setIsNearBottom(check())
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isNearBottom) {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, streamingText, isNearBottom])

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="hidden lg:block w-72 shrink-0">
              <GlassPanel className="flex h-[calc(100vh-120px)] flex-col p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Conversations</h3>
                  <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-1.5 overflow-y-auto">
                  {allConversations.length === 0 && (
                    <p className="text-xs text-slate-400">No conversations yet. Start a new chat to begin.</p>
                  )}
                  {allConversations.map((conv) => (
                    <motion.button
                      key={conv.id}
                      onClick={() => { selectConversation(conv.id); setSidebarOpen(false) }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${conv.pinned ? 'border-indigo-400/30 bg-indigo-500/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-white">{conv.title}</p>
                        {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-indigo-300" />}
                      </div>
                      <p className="truncate text-xs text-slate-500">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                    </motion.button>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0">
          <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass mb-6 flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 lg:hidden" aria-label="Toggle sidebar">
                <MessageSquareText className="h-5 w-5" />
              </button>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Bot className="h-5 w-5" /></div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">AI Chat</p>
                <h1 className="text-xl font-semibold tracking-tight text-white">{activeConversation?.title || 'Ask anything. Get a premium response.'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector className="w-56" />
              <button onClick={handleNewChat} className="flex items-center gap-2 rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110"><Plus className="h-4 w-4" /> New chat</button>
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10" aria-label="Export">
                  <Download className="h-4 w-4" />
                </button>
                {showExportMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-12 z-50 w-40 rounded-xl border border-white/10 bg-[#0a0c14] p-1 shadow-xl">
                    <button onClick={() => handleExport('md')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">Markdown</button>
                    <button onClick={() => handleExport('html')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">HTML</button>
                    <button onClick={() => handleExport('pdf')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">PDF</button>
                  </motion.div>
                )}
              </div>
              <button onClick={() => addFavorite({ id: 'chat', label: 'AI Chat', path: '/chat' })} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10" aria-label="Save"><Sparkles className="h-4 w-4" /></button>
            </div>
          </motion.header>

          <GlassPanel className="flex h-[calc(100vh-220px)] min-h-[460px] flex-col p-5">
            {/* Search */}
            {showSearch && (
              <div className="mb-3">
                <ChatSearch messages={messages} onClose={() => { setShowSearch(false); setSearchQuery('') }} />
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto pr-1">
              {messages.length === 0 && !loading ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Bot className="h-7 w-7" /></div>
                  <h2 className="text-xl font-semibold text-white">How can I help you today?</h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">Start a conversation, or pick a suggestion to explore what InfinityAI can do.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {dynamicSuggestions.map((item) => (
                      <button key={item} onClick={() => setPrompt(item)} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{item}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <Message
                      key={i}
                      role={m.role}
                      content={m.content}
                      timestamp={m.timestamp}
                      status={m.status}
                      attachments={m.attachments}
                      isSearchMatch={searchQuery ? (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()) : false}
                      searchQuery={searchQuery}
                      onCopy={(text) => navigator.clipboard.writeText(text)}
                      onRetry={m.status === 'error' ? () => handleRetry(i) : undefined}
                      onRegenerate={m.status === 'complete' && m.role === 'assistant' && i > 0 ? () => handleRegenerate(i) : undefined}
                      onEdit={m.role === 'user' ? (text) => handleEdit(i, text) : undefined}
                    />
                  ))}
                  {loading && streamingStatus !== 'streaming' && <TypingIndicator />}
                  {loading && streamingStatus === 'streaming' && streamingText && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Bot className="h-4 w-4" /></div>
                      <div className="max-w-[78%] rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <ChatMarkdown content={streamingText} />
                        <span className="inline-block h-4 w-1 animate-pulse bg-indigo-300 ml-0.5" />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {!isNearBottom && messages.length > 3 && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={scrollToBottom} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 rounded-full border border-white/10 bg-[#0a0c14]/90 px-3 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-xl transition hover:bg-white/10 hover:text-white" aria-label="Scroll to bottom">
                  <ChevronDown className="mr-1 inline h-3.5 w-3.5" />
                  New messages
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="mt-4">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <AttachmentPreview key={att.id} attachment={att} onRemove={removeAttachment} />
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-3xl border border-white/8 bg-white/[0.04] p-2 transition focus-within:border-indigo-400/40">
                <button onClick={() => fileInputRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Attach file">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp" multiple />
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend() } }}
                  rows={1}
                  className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Message InfinityAI…"
                />
                {loading ? (
                  <button onClick={stopGeneration} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"><Square className="h-4 w-4" /> Stop</button>
                ) : (
                  <button onClick={handleSend} disabled={!prompt.trim() && attachments.length === 0} className="flex items-center gap-2 rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Send className="h-4 w-4" /></button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-indigo-300" /> {loading ? 'Generating response…' : limitStatus}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSearch(!showSearch)} className={`flex items-center gap-1 transition ${showSearch ? 'text-indigo-300' : 'hover:text-white'}`}><Search className="h-3.5 w-3.5" /> Search</button>
                  {copied && <span className="flex items-center gap-1 text-emerald-300"><Check className="h-3.5 w-3.5" /> Copied</span>}
                  {error && <span className="flex items-center gap-1 text-red-400"><AlertCircle className="h-3.5 w-3.5" /> {error}</span>}
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Sidebar - Desktop */}
        <div className="hidden xl:flex w-80 shrink-0 flex-col gap-6">
          <GlassPanel className="p-5">
            <ToastBanner tone="success" title="Live session" message="Connected to the backend with streaming responses and persisted history." />
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-white">Secure & local-ready</p>
                <p className="text-xs text-slate-400">Privacy-conscious by design.</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Conversation history</p>
                <h3 className="text-lg font-semibold text-white">Recent threads</h3>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              <AnimatePresence>
                {allConversations.length ? allConversations.slice(0, 8).map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]">
                    <button onClick={() => selectConversation(item.id)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{new Date(item.updatedAt).toLocaleString()} {item.pinned && 'Pinned'}{item.archived && 'Archived'}</p>
                    </button>
                    <ConversationMenu
                      conversation={item}
                      onRename={handleRename}
                      onPin={handlePin}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onExport={handleExport}
                    />
                  </motion.div>
                )) : <p className="text-sm text-slate-400">No chat history yet. Start a conversation to save it.</p>}
              </AnimatePresence>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}