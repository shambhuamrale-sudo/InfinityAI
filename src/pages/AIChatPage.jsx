import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import ChatHeader from '../components/ChatHeader'
import ChatInput from '../components/ChatInput'
import MessageBubble from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'
import PremiumSidebar from '../components/PremiumSidebar'
import ChatSearch from '../components/ChatSearch'
import { ChatMarkdown } from '../components/ChatMarkdown'
import { useAppContext } from '../context/useAppContext'
import useChat from '../hooks/useChat'

export default function AIChatPage() {
  const { preferences, canUseTool, addFavorite } = useAppContext()

  const {
    conversationId,
    messages,
    loading,
    error,
    setError,
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
    loadConversations,
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
    exportConversation,
    clearMessages,
    scrollToBottom
  } = useChat()

  const loadConversationsRef = useRef(loadConversations)
  useEffect(() => {
    loadConversationsRef.current = loadConversations
  })

  useEffect(() => {
    loadConversationsRef.current()
  }, [])

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

  const handleNewChat = useCallback(async () => {
    clearMessages()
    const conv = await createConversation('New conversation')
    if (conv) {
      setSidebarOpen(false)
    }
  }, [clearMessages, createConversation])

  const handleSend = useCallback(async () => {
    if (!prompt.trim() && (!Array.isArray(attachments) || attachments.length === 0)) return
    const allowed = canUseTool('chat')
    if (!allowed.allowed) {
      setError(allowed.reason === 'trial-expired' ? 'Your trial has expired.' : 'Your daily chat limit has been reached. Upgrade to continue.')
      return
    }
    const text = prompt.trim()
    setPrompt('')
    pendingForceScroll.current = true
    await sendMessage(text, { provider: preferences?.chatProvider, model: preferences?.chatModel, aiMode: preferences?.defaultAIMode })
  }, [prompt, attachments, canUseTool, setError, sendMessage, preferences])

  const handleRetry = useCallback(async (index) => {
    pendingForceScroll.current = true
    await retryMessage(index)
  }, [retryMessage])

  const handleRegenerate = useCallback(async (index) => {
    pendingForceScroll.current = true
    await regenerateResponse(index)
  }, [regenerateResponse])

  const handleEdit = useCallback(async (index, newContent) => {
    pendingForceScroll.current = true
    await editMessage(index, newContent)
  }, [editMessage])

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      await uploadAttachment(file)
    }
    e.target.value = ''
  }, [uploadAttachment])

  const handleExport = useCallback(async (format) => {
    await exportConversation(format)
    setShowExportMenu(false)
  }, [exportConversation])

  const handleRename = useCallback(async (conversation) => {
    const newTitle = window.prompt('Enter new title:', conversation.title)
    if (newTitle && newTitle.trim()) {
      await updateConversation(conversation.id, { title: newTitle.trim() })
    }
  }, [updateConversation])

  const handlePin = useCallback(async (id) => {
    const conv = allConversations.find((c) => c.id === id)
    if (conv) {
      await updateConversation(id, { pinned: !conv.pinned })
    }
  }, [allConversations, updateConversation])

  const handleArchive = useCallback(async (id) => {
    const conv = allConversations.find((c) => c.id === id)
    if (conv) {
      await updateConversation(id, { archived: !conv.archived })
    }
  }, [allConversations, updateConversation])

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id)
    }
  }, [deleteConversation])

  const handleDuplicate = useCallback(async (id) => {
    await duplicateConversation(id)
  }, [duplicateConversation])

  const handleSuggestionClick = useCallback((item) => {
    setPrompt(item)
  }, [setPrompt])

  const [isNearBottom, setIsNearBottom] = useState(true)
  const scrollHandlerRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const pendingForceScroll = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      return scrollHeight - scrollTop - clientHeight < 120
    }
    scrollHandlerRef.current = check
    setIsNearBottom(check())
    const handler = () => {
      const near = check()
      setIsNearBottom(near)
      if (near) setUnreadCount(0)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (pendingForceScroll.current || isNearBottom) {
      pendingForceScroll.current = false
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else if (loading && streamingStatus === 'streaming') {
      setUnreadCount(prev => prev + 1)
    }
  }, [messages, streamingText, isNearBottom, loading, streamingStatus, scrollRef, pendingForceScroll])

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom?.()
    setUnreadCount(0)
  }, [scrollToBottom])

  return (
    <div className="app-canvas relative flex h-screen overflow-hidden text-white">
      <BackgroundEffects />

      <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
        <div className="glass h-full p-4">
          <PremiumSidebar
            conversations={allConversations}
            conversationId={conversationId}
            onSelectConversation={(id) => selectConversation(id)}
            onNewChat={handleNewChat}
            onRename={handleRename}
            onPin={handlePin}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onExport={handleExport}
            onClose={() => {}}
          />
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden"
            >
              <div className="glass h-full">
                <PremiumSidebar
                  conversations={allConversations}
                  conversationId={conversationId}
                  onSelectConversation={(id) => { selectConversation(id); setSidebarOpen(false) }}
                  onNewChat={handleNewChat}
                  onRename={handleRename}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <ChatHeader
            activeConversation={activeConversation}
            onNewChat={handleNewChat}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleSearch={() => setShowSearch(!showSearch)}
            showSearch={showSearch}
            onExport={handleExport}
            showExportMenu={showExportMenu}
            setShowExportMenu={setShowExportMenu}
            onToggleFavorite={() => {
              addFavorite({ id: activeConversation?.id || 'chat', label: activeConversation?.title || 'AI Chat', path: '/chat' })
            }}
            isFavorite={!!activeConversation?.favorite}
          />

          <div className="flex-1 min-h-0 relative">
            {showSearch && (
              <div className="mb-4">
                <ChatSearch messages={messages} onClose={() => { setShowSearch(false); setSearchQuery('') }} />
              </div>
            )}

            <div
              ref={scrollRef}
              className="h-full space-y-6 overflow-y-auto pr-1 pb-24 custom-scrollbar"
            >
              {messages.length === 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col items-center justify-center text-center"
                >
                  <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_8px_32px_-8px_rgba(129,140,248,0.3)]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight">How can I help you today?</h2>
                  <p className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed">
                    Start a conversation, or pick a suggestion to explore what InfinityAI can do.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-2xl">
                    {dynamicSuggestions.map((item) => (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSuggestionClick(item)}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/15 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((m, i) => {
                    const msgKey = `${m.role}-${i}-${m.timestamp || Date.now()}`
                    return (
                      <MessageBubble
                        key={msgKey}
                        role={m.role}
                        content={m.content}
                        timestamp={m.timestamp}
                        status={m.status}
                        attachments={m.attachments}
                        imageRedirect={m.imageRedirect}
                        isSearchMatch={searchQuery ? (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()) : false}
                        searchQuery={searchQuery}
                        onCopy={(text) => navigator.clipboard.writeText(text)}
                        onRetry={m.status === 'error' ? () => handleRetry(i) : undefined}
                        onRegenerate={m.status === 'complete' && m.role === 'assistant' && i > 0 ? () => handleRegenerate(i) : undefined}
                        onEdit={m.role === 'user' ? (text) => handleEdit(i, text) : undefined}
                      />
                    )
                  })}
                  {loading && streamingStatus !== 'streaming' && (
                    <TypingIndicator 
                      provider={preferences ? { name: preferences.chatProvider } : null}
                      model={preferences ? { name: preferences.chatModel } : null}
                      isLocal={preferences?.defaultAIMode === 'local'}
                      localStatus={preferences?.localStatus}
                      aiMode={preferences?.defaultAIMode}
                    />
                  )}
                  {loading && streamingStatus === 'streaming' && streamingText && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3.5"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_4px_16px_-6px_rgba(129,140,248,0.2)]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="max-w-[78%] rounded-3xl border border-white/8 bg-white/[0.05] px-5 py-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]">
                        <ChatMarkdown content={streamingText} />
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                          className="inline-block h-4 w-1.5 ml-0.5 rounded-full bg-indigo-300"
                        />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <AnimatePresence>
              {!isNearBottom && messages.length > 3 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={handleScrollToBottom}
                  className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0c14]/90 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                  aria-label="Scroll to bottom"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New messages
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400 text-[0.65rem] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 sticky bottom-0 relative z-10">
            <ChatInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSend={handleSend}
              onStop={stopGeneration}
              loading={loading}
              error={error}
              attachments={attachments}
              onAttach={handleFileSelect}
              fileInputRef={fileInputRef}
              textareaRef={textareaRef}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
