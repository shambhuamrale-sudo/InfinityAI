import { useEffect, useMemo, useRef, useState } from 'react'
import jsPDF from 'jspdf'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export function useChat() {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingText, setStreamingText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [conversations, setConversations] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const controllerRef = useRef(null)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)
  const searchInputRef = useRef(null)
  const [streamingStatus, setStreamingStatus] = useState('idle')
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter((m) => (m.content || '').toLowerCase().includes(q))
  }, [messages, searchQuery])

  const scrollToBottom = useMemo(() => {
    return () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120
      if (isNearBottom || streamingStatus === 'streaming') {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
  }, [messages, streamingText, streamingStatus])

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  const loadConversations = async () => {
    try {
      const res = await fetch(`${apiBase}/conversations`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (e) {
      console.warn('Failed to load conversations', e)
    }
  }

  const createConversation = async (title, initialMessages = []) => {
    try {
      const res = await fetch(`${apiBase}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, messages: initialMessages })
      })
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversation.id)
        setMessages(data.conversation.messages || [])
        await loadConversations()
        return data.conversation
      }
    } catch (e) {
      console.warn('Failed to create conversation', e)
    }
    return null
  }

  const selectConversation = async (id) => {
    try {
      const res = await fetch(`${apiBase}/conversations/${id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConversationId(data.conversation.id)
        setMessages(data.conversation.messages || [])
      }
    } catch (e) {
      console.warn('Failed to load conversation', e)
    }
  }

  const updateConversation = async (id, updates) => {
    try {
      const res = await fetch(`${apiBase}/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch (e) {
      console.warn('Failed to update conversation', e)
    }
  }

  const deleteConversation = async (id) => {
    try {
      const res = await fetch(`${apiBase}/conversations/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
        if (conversationId === id) {
          setConversationId(null)
          setMessages([])
        }
      }
    } catch (e) {
      console.warn('Failed to delete conversation', e)
    }
  }

  const duplicateConversation = async (id) => {
    try {
      const res = await fetch(`${apiBase}/conversations/${id}/duplicate`, { method: 'POST', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch (e) {
      console.warn('Failed to duplicate conversation', e)
    }
  }

  const sendMessage = async (content, options = {}) => {
    if (!content.trim() && attachments.length === 0) return
    setError(null)
    const userMessage = { role: 'user', content: content.trim(), timestamp: new Date().toISOString(), attachments: attachments.map((a) => ({ name: a.name, type: a.type, size: a.size })) }
    const assistantPlaceholder = { role: 'assistant', content: '', timestamp: new Date().toISOString(), status: 'streaming' }
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder])
    setAttachments([])
    setLoading(true)
    setStreamingText('')
    setStreamingStatus('streaming')

    const abort = new AbortController()
    controllerRef.current = abort

    const currentMessages = [...messagesRef.current, userMessage]
    const useStreaming = options.streaming !== false

    try {
      if (useStreaming) {
        const response = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content.trim(),
            provider: options.provider,
            model: options.model,
            messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
            stream: true
          }),
          credentials: 'include',
          signal: abort.signal
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const reader = response.body?.getReader?.()
        const decoder = new TextDecoder()
        let fullText = ''
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.text) {
                    fullText += parsed.text
                    setStreamingText(fullText)
                    setMessages((prev) => {
                      const next = [...prev]
                      next[next.length - 1] = { ...next[next.length - 1], content: fullText }
                      return next
                    })
                  }
                  if (parsed.error) throw new Error(parsed.error)
                } catch (parseError) {
                  if (parseError.message !== 'Unexpected end of JSON input' && !parseError.message.includes('JSON')) {
                    throw parseError
                  }
                }
              }
            }
          }
        } else {
          const data = await response.json()
          fullText = data.text || data.response || ''
          setStreamingText(fullText)
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { ...next[next.length - 1], content: fullText }
            return next
          })
        }
        setStreamingStatus('idle')
        setStreamingText('')
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], status: 'complete' }
          return next
        })
      } else {
        const response = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content.trim(),
            provider: options.provider,
            model: options.model,
            messages: currentMessages.map((m) => ({ role: m.role, content: m.content }))
          }),
          credentials: 'include',
          signal: abort.signal
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        const answer = data.text || data.response || 'No response generated.'
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], content: answer, status: 'complete' }
          return next
        })
        setStreamingStatus('idle')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], content: 'The chat service is temporarily unavailable. Please try again shortly.', status: 'error' }
          return next
        })
      }
    } finally {
      setLoading(false)
      setStreamingStatus('idle')
      setStreamingText('')
      controllerRef.current = null
      if (conversationId) {
        const last = messages[messages.length - 1]
        if (last) {
          updateConversation(conversationId, { messages: [...messages, userMessage] })
        }
      }
    }
  }

  const stopGeneration = () => {
    controllerRef.current?.abort()
    setLoading(false)
    setStreamingStatus('idle')
    setStreamingText('')
    controllerRef.current = null
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const next = [...prev]
      const last = next[next.length - 1]
      if (last.role === 'assistant' && last.status === 'streaming') {
        next[next.length - 1] = { ...last, status: 'stopped' }
      }
      return next
    })
  }

  const retryMessage = async (index) => {
    const current = messagesRef.current
    const target = current[index]
    if (!target || target.role !== 'assistant') return
    const userMsg = current[index - 1]
    if (!userMsg || userMsg.role !== 'user') return
    const newMessages = current.slice(0, index)
    setMessages(newMessages)
    await sendMessage(userMsg.content, { provider: userMsg.provider, model: userMsg.model })
  }

  const regenerateResponse = async (index) => {
    const current = messagesRef.current
    const userMsg = current[index - 1]
    if (!userMsg || userMsg.role !== 'user') return
    const newMessages = current.slice(0, index)
    setMessages(newMessages)
    await sendMessage(userMsg.content, { provider: userMsg.provider, model: userMsg.model })
  }

  const editMessage = async (index, newContent) => {
    const newMessages = messagesRef.current.map((m, i) => (i === index ? { ...m, content: newContent } : m))
    setMessages(newMessages)
    const userMsg = newMessages[index]
    const following = newMessages.slice(index + 1)
    const trimmed = following.filter((m) => m.role !== 'assistant' || m.status !== 'streaming')
    setMessages([...newMessages.slice(0, index + 1), ...trimmed])
    await sendMessage(newContent, { provider: userMsg.provider, model: userMsg.model })
  }

  const uploadAttachment = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
    try {
      const xhr = new XMLHttpRequest()
      const promise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress((prev) => ({ ...prev, [file.name]: Math.round((e.loaded / e.total) * 100) }))
          }
        })
        xhr.addEventListener('load', () => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }))
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })
        xhr.addEventListener('error', () => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }))
          reject(new Error('Upload failed'))
        })
      })
      xhr.open('POST', `${apiBase}/chat/upload`)
      xhr.send(formData)
      const result = await promise
      setAttachments((prev) => [...prev, result.attachment])
      return result.attachment
    } catch (e) {
      console.warn('Attachment upload failed', e)
      setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }))
      return null
    }
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const exportConversation = async (format) => {
    if (!conversationId) return null
    try {
      if (format === 'pdf') {
        const res = await fetch(`${apiBase}/conversations/${conversationId}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Export failed')
        const data = await res.json()
        const conversation = data.conversation
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text(conversation.title || 'Conversation', 14, 22)
        doc.setFontSize(10)
        let y = 32
        for (const m of conversation.messages || []) {
          if (y > 270) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.text(m.role === 'user' ? 'You' : 'Assistant', 14, y)
          y += 6
          doc.setFont('helvetica', 'normal')
          const lines = doc.splitTextToSize(m.content || '', 180)
          doc.text(lines, 14, y)
          y += lines.length * 5 + 8
        }
        doc.save(`${(conversation.title || 'conversation').replace(/[^a-z0-9]/gi, '_')}.pdf`)
        return true
      }
      const res = await fetch(`${apiBase}/conversations/${conversationId}/export?format=${format}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversation_${conversationId}.${format === 'md' ? 'md' : format === 'html' ? 'html' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    } catch (e) {
      console.warn('Export failed', e)
      return false
    }
  }

  const clearMessages = () => {
    setMessages([])
    setStreamingText('')
    setError(null)
  }

  const dynamicSuggestions = useMemo(() => {
    if (messages.length === 0) {
      return [
        'Summarize the key points',
        'Explain this in simple terms',
        'Draft a follow-up action plan',
        'Identify potential issues',
        'Generate a step-by-step guide',
        'Compare and contrast options'
      ]
    }
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant') {
      return [
        'Explain more about this',
        'Give examples',
        'Make it more concise',
        'What are the alternatives?',
        'Help me implement this'
      ]
    }
    return [
      'Continue this thought',
      'Add more detail',
      'Provide a summary',
      'Challenge this assumption'
    ]
  }, [messages])

  return {
    conversationId,
    messages: filteredMessages,
    allMessages: messages,
    loading,
    error,
    streamingText,
    streamingStatus,
    searchQuery,
    showSearch,
    conversations,
    attachments,
    uploadProgress,
    dynamicSuggestions,
    scrollRef,
    textareaRef,
    searchInputRef,
    setShowSearch,
    setSearchQuery,
    setConversationId,
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
    removeAttachment,
    exportConversation,
    clearMessages,
    scrollToBottom
  }
}

export default useChat