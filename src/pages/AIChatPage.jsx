import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    loadConversations()
  }, [])

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
    <div className="app-canvas relative flex h-screen overflow-hidden text-white">
      <BackgroundEffects />

      {/* Desktop Sidebar */}
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

      {/* Mobile Sidebar */}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
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
            sidebarOpen={sidebarOpen}
            preferences={preferences}
          />

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            {showSearch && (
              <div className="mb-4">
                <ChatSearch messages={messages} onClose={() => { setShowSearch(false); setSearchQuery('') }} />
              </div>
            )}

            <div
              ref={scrollRef}
              className="h-full space-y-6 overflow-y-auto pr-1 pb-4"
            >
              {messages.length === 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col items-center justify-center text-center"
                >
                  <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">How can I help you today?</h2>
                  <p className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed">
                    Start a conversation, or pick a suggestion to explore what InfinityAI can do.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                    {dynamicSuggestions.map((item) => (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPrompt(item)}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white hover:border-white/15"
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <MessageBubble
                      key={i}
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
                  ))}
                  {loading && streamingStatus !== 'streaming' && <TypingIndicator />}
                  {loading && streamingStatus === 'streaming' && streamingText && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="max-w-[75%] rounded-3xl border border-white/8 bg-white/[0.04] px-5 py-4">
                        <ChatMarkdown content={streamingText} />
                        <span className="inline-block h-4 w-1.5 animate-pulse bg-indigo-300 ml-0.5 rounded-full" />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {!isNearBottom && messages.length > 3 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#0a0c14]/90 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
                  aria-label="Scroll to bottom"
                >
                  New messages
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="mt-4">
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
