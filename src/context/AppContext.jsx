import { useEffect, useMemo, useState } from 'react'
import { createDefaultState, normalizeState } from './stateSchema'
import { AppContext } from './useAppContext'

const STORAGE_KEY = 'infinityai-state-v1'

function getErrorMessage(err) {
  const data = err?.response?.data

  if (!data) return 'Something went wrong.'

  if (typeof data.error === 'string')
    return data.error

  if (typeof data.error === 'object') {
    return Object.values(data.error)
      .flat()
      .join('\n')
  }

  if (typeof data.message === 'string')
    return data.message

  return 'Something went wrong.'
}

export function AppProvider({ children }) {
  const [state, setState] = useState(createDefaultState)
  const [hydrated, setHydrated] = useState(false)
  const [auth, setAuth] = useState({ user: null, isAuthenticated: false, loading: true })

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const response = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setAuth({ user: data.user || null, isAuthenticated: true, loading: false })
        } else if (response.status === 401) {
          setAuth({ user: null, isAuthenticated: false, loading: false })
        } else {
          // Transient failures (429 rate-limit, 5xx, network) must NOT log the
          // user out. Keep them on the page; the guard treats loading=false +
          // isAuthenticated=false as a redirect only for genuine 401s.
          setAuth((prev) => ({ ...prev, loading: false }))
        }
      } catch {
        setAuth((prev) => ({ ...prev, loading: false }))
      }
    }

    const loadState = async () => {
      hydrateAuth()

      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setState((prev) => normalizeState({ ...prev, ...parsed, user: { ...prev.user, ...(parsed.user || {}) }, subscription: { ...prev.subscription, ...(parsed.subscription || {}) }, usage: { ...prev.usage, ...(parsed.usage || {}) }, adminConfig: { ...prev.adminConfig, ...(parsed.adminConfig || {}), planLimits: { ...prev.adminConfig.planLimits, ...(parsed.adminConfig?.planLimits || {}) }, providerConfig: { ...prev.adminConfig.providerConfig, ...(parsed.adminConfig?.providerConfig || {}) } }, preferences: { ...prev.preferences, ...(parsed.preferences || {}) }, ui: { ...prev.ui, ...(parsed.ui || {}) } }))
        }
      } catch (error) {
        console.error('Failed to load app state', error)
      }

      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const [plansRes, configRes, serverStateRes] = await Promise.all([
          fetch(`${apiBase}/api/plans`),
          fetch(`${apiBase}/api/config`),
          fetch(`${apiBase}/api/state`)
        ])
        if (plansRes.ok) {
          const plans = await plansRes.json()
          setState((prev) => ({ ...prev, plans }))
        }
        if (configRes.ok) {
          const config = await configRes.json()
          setState((prev) => ({ ...prev, adminConfig: { ...prev.adminConfig, ...config, planLimits: { ...prev.adminConfig.planLimits, ...(config.planLimits || {}) }, providerConfig: { ...prev.adminConfig.providerConfig, ...(config.providerConfig || {}) } } }))
        }
        if (serverStateRes.ok) {
          const serverState = await serverStateRes.json()
          setState((prev) => normalizeState({ ...prev, ...serverState, user: { ...prev.user, ...(serverState.user || {}) }, subscription: { ...prev.subscription, ...(serverState.subscription || {}) }, usage: { ...prev.usage, ...(serverState.usage || {}) }, adminConfig: { ...prev.adminConfig, ...(serverState.adminConfig || {}), planLimits: { ...prev.adminConfig.planLimits, ...(serverState.adminConfig?.planLimits || {}) }, providerConfig: { ...prev.adminConfig.providerConfig, ...(serverState.adminConfig?.providerConfig || {}) } }, preferences: { ...prev.preferences, ...(serverState.preferences || {}) }, ui: { ...prev.ui, ...(serverState.ui || {}) } }))
        }
      } catch (error) {
        console.warn('Using cached app state', error)
      }

      setHydrated(true)
    }

    loadState()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    let timeoutId
    const persistState = { ...state, toasts: [] }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistState))
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    timeoutId = window.setTimeout(() => {
      fetch(`${apiBase}/api/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persistState)
      }).catch(() => {})
    }, 800)
    return () => window.clearTimeout(timeoutId)
  }, [state, hydrated])

  useEffect(() => {
    if (!hydrated || !state.toasts?.length) return
    const timers = state.toasts.map((toast) => window.setTimeout(() => {
      setState((prev) => ({ ...prev, toasts: prev.toasts.filter((item) => item.id !== toast.id) }))
    }, toast.duration || 3200))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [state.toasts, hydrated])

  const addToast = (toast) => {
    const entry = { id: Date.now() + Math.random(), kind: 'info', duration: 3200, ...toast }
    setState((prev) => ({ ...prev, toasts: [entry, ...prev.toasts].slice(0, 5) }))
  }

  const dismissToast = (id) => {
    setState((prev) => ({ ...prev, toasts: prev.toasts.filter((toast) => toast.id !== id) }))
  }

  const canUseTool = (tool = 'chat') => {
    const plan = state.subscription.plan || 'free-trial'
    const limits = state.adminConfig?.planLimits?.[plan] || state.adminConfig?.planLimits?.['free-trial'] || {}
    const isTrialExpired = plan === 'free-trial' && Date.now() > state.subscription.expiresAt
    if (isTrialExpired) {
      return { allowed: false, reason: 'trial-expired' }
    }
    if (tool === 'chat' && state.usage.dayChats >= (limits.maxChatsPerDay || 20)) {
      return { allowed: false, reason: 'chat-limit' }
    }
    if (tool === 'image' && state.usage.dayImages >= (limits.maxImagesPerDay || 5)) {
      return { allowed: false, reason: 'image-limit' }
    }
    return { allowed: true }
  }

  const addChatEntry = (prompt, response) => {
    const check = canUseTool('chat')
    if (!check.allowed) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, upgradeModalOpen: true } }))
      return false
    }
    const entry = {
      id: Date.now(),
      title: prompt.slice(0, 40),
      prompt,
      response,
      createdAt: new Date().toISOString(),
      tool: 'chat'
    }
    setState((prev) => ({
      ...prev,
      chats: [entry, ...prev.chats].slice(0, 20),
      usage: { ...prev.usage, dayChats: prev.usage.dayChats + 1, monthChats: prev.usage.monthChats + 1 },
      activity: [{ id: Date.now(), title: 'New chat created', description: prompt.slice(0, 48), time: 'Just now' }, ...prev.activity].slice(0, 8),
      notifications: [{ id: Date.now(), title: 'Conversation saved', message: 'Your latest chat is stored in history.', unread: true }, ...prev.notifications].slice(0, 6)
    }))
    addToast({ kind: 'success', title: 'Chat saved', message: 'Your latest chat is stored and available in history.' })
    return true
  }

  const addConversation = (conversation) => {
    setState((prev) => ({
      ...prev,
      conversations: [conversation, ...(prev.conversations || [])].slice(0, 50)
    }))
  }

  const updateConversation = (id, updates) => {
    setState((prev) => ({
      ...prev,
      conversations: (prev.conversations || []).map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
    }))
  }

  const deleteConversation = (id) => {
    setState((prev) => ({
      ...prev,
      conversations: (prev.conversations || []).filter((c) => c.id !== id)
    }))
  }

  const addImageEntry = (prompt, result, meta = {}) => {
    const check = canUseTool('image')
    if (!check.allowed) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, upgradeModalOpen: true } }))
      return false
    }
    const entry = {
      id: meta.id || Date.now() + Math.floor(Math.random() * 1000),
      prompt,
      result,
      images: Array.isArray(meta.images) ? meta.images : [],
      negativePrompt: meta.negativePrompt || '',
      provider: meta.provider || 'local',
      model: meta.model || '',
      settings: meta.settings || {},
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      collectionId: meta.collectionId || null,
      favorite: Boolean(meta.favorite),
      createdAt: new Date().toISOString(),
      tool: 'image'
    }
    setState((prev) => ({
      ...prev,
      images: [entry, ...prev.images].slice(0, 200),
      imageStudio: {
        ...prev.imageStudio,
        promptHistory: prompt
          ? [prompt, ...(prev.imageStudio?.promptHistory || []).filter((p) => p !== prompt)].slice(0, 40)
          : prev.imageStudio?.promptHistory || []
      },
      usage: { ...prev.usage, dayImages: prev.usage.dayImages + 1, monthImages: prev.usage.monthImages + 1 },
      activity: [{ id: Date.now(), title: 'Image generated', description: (prompt || '').slice(0, 48), time: 'Just now' }, ...prev.activity].slice(0, 8),
      notifications: [{ id: Date.now(), title: 'Image saved', message: 'Your image concept is now in history.', unread: true }, ...prev.notifications].slice(0, 6)
    }))
    addToast({ kind: 'success', title: 'Image ready', message: 'Your new concept was saved to your image history.' })
    return entry
  }

  const updateImageEntry = (id, updates) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, ...updates } : img))
    }))
  }

  const deleteImageEntry = (id) => {
    setState((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== id) }))
  }

  const toggleImageFavorite = (id) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, favorite: !img.favorite } : img))
    }))
  }

  const setImageTags = (id, tags) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, tags } : img))
    }))
  }

  const addImageCollection = (name) => {
    const collection = { id: `col_${Date.now()}`, name, createdAt: new Date().toISOString() }
    setState((prev) => ({
      ...prev,
      imageStudio: { ...prev.imageStudio, collections: [collection, ...(prev.imageStudio?.collections || [])] }
    }))
    return collection
  }

  const deleteImageCollection = (id) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.collectionId === id ? { ...img, collectionId: null } : img)),
      imageStudio: { ...prev.imageStudio, collections: (prev.imageStudio?.collections || []).filter((c) => c.id !== id) }
    }))
  }

  const assignImageCollection = (imageId, collectionId) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === imageId ? { ...img, collectionId } : img))
    }))
  }

  const saveImageSettings = (settings) => {
    setState((prev) => ({
      ...prev,
      imageStudio: { ...prev.imageStudio, settings: { ...prev.imageStudio.settings, ...settings } }
    }))
  }

  const clearImagePromptHistory = () => {
    setState((prev) => ({ ...prev, imageStudio: { ...prev.imageStudio, promptHistory: [] } }))
  }

  const addFavorite = (favorite) => {
    setState((prev) => ({
      ...prev,
      favorites: [favorite, ...prev.favorites.filter((entry) => entry.id !== favorite.id)].slice(0, 10)
    }))
    addToast({ kind: 'success', title: 'Favorite added', message: 'The tool is pinned to your launch shortcuts.' })
  }

  const addNotification = (notification) => {
    setState((prev) => ({ ...prev, notifications: [notification, ...prev.notifications].slice(0, 10) }))
  }

  const updateSubscription = (plan) => {
    const now = Date.now()
    const trialDuration = state.adminConfig?.trialDays || 2
    setState((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        plan,
        trialStartedAt: now,
        trialDays: trialDuration,
        expiresAt: now + trialDuration * 24 * 60 * 60 * 1000,
        status: 'active'
      },
      user: { ...prev.user, plan },
      ui: { ...prev.ui, upgradeModalOpen: false }
    }))
    addToast({ kind: 'success', title: 'Plan updated', message: `Your workspace now uses the ${plan} plan.` })
  }

  const setAdminConfig = (updates) => {
    setState((prev) => ({
      ...prev,
      adminConfig: {
        ...prev.adminConfig,
        ...updates,
        planLimits: { ...prev.adminConfig.planLimits, ...(updates.planLimits || {}) },
        providerConfig: { ...prev.adminConfig.providerConfig, ...(updates.providerConfig || {}) }
      }
    }))
  }

  const updatePreferences = (preferences) => {
    setState((prev) => ({ ...prev, preferences: { ...prev.preferences, ...preferences } }))
    addToast({ kind: 'success', title: 'Preferences updated', message: 'Your workspace settings have been saved.' })
  }

  // Silent preference update (no toast) — used by the model selector, which can
  // change frequently and should not spam notifications.
  const setChatModelSelection = ({ provider, model }) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...(provider !== undefined ? { chatProvider: provider } : {}),
        ...(model !== undefined ? { chatModel: model } : {})
      }
    }))
  }

  const updateUserProfile = (updates) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...updates } }))
    addToast({ kind: 'success', title: 'Profile saved', message: 'Your personal details were updated.' })
  }

  const login = async (email, password) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      if (response.status === 403 && data.resendOtp) {
        addToast({ kind: 'warning', title: 'Email not verified', message: data.message || 'Please verify your email first.' })
        return { success: false, error: data.message, resendOtp: true, email: data.email }
      }
      const error = getErrorMessage(data)
      addToast({ kind: 'error', title: 'Login failed', message: error })
      return { success: false, error }
    }
    setAuth({ user: data.user, isAuthenticated: true, loading: false })
    setState((prev) => ({ ...prev, user: { ...prev.user, ...data.user } }))
    addToast({ kind: 'success', title: 'Welcome back', message: 'You are now signed in.' })
    return { success: true, user: data.user }
  }

  const signup = async (name, email, password) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      addToast({ kind: 'error', title: 'Signup failed', message: error })
      return { success: false, error }
    }
    addToast({ kind: 'success', title: 'Account created', message: 'Welcome to InfinityAI. Please verify your email.' })
    return { success: true, user: data.user }
  }

  const forgotPassword = async (email) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      return { success: false, error }
    }
    addToast({ kind: 'success', title: 'OTP sent', message: 'Check your email for the reset code.' })
    return { success: true }
  }

  const verifyResetOtp = async (email, otp) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      return { success: false, error }
    }
    return { success: true }
  }

  const resetPassword = async (email, otp, password) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      return { success: false, error }
    }
    addToast({ kind: 'success', title: 'Password reset', message: 'You can now log in with your new password.' })
    return { success: true }
  }

  const verifyEmail = async (email, otp) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      return { success: false, error }
    }
    if (data.user) {
      setAuth({ user: data.user, isAuthenticated: true, loading: false })
      setState((prev) => ({ ...prev, user: { ...prev.user, ...data.user } }))
    }
    addToast({ kind: 'success', title: 'Email verified', message: 'Your account is now active.' })
    return { success: true }
  }

  const resendOtp = async (email) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${apiBase}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = getErrorMessage(data)
      return { success: false, error }
    }
    addToast({ kind: 'success', title: 'OTP resent', message: 'Check your email for the new code.' })
    return { success: true }
  }

  const logout = async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    await fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setAuth({ user: null, isAuthenticated: false, loading: false })
    setState((prev) => ({ ...prev, user: createDefaultState().user }))
    addToast({ kind: 'info', title: 'Signed out', message: 'You have been logged out securely.' })
  }

  const value = useMemo(() => ({
    ...state,
    auth,
    login,
    signup,
    logout,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    verifyEmail,
    resendOtp,
    canUseTool,
    addChatEntry,
    addConversation,
    updateConversation,
    deleteConversation,
    addImageEntry,
    updateImageEntry,
    deleteImageEntry,
    toggleImageFavorite,
    setImageTags,
    addImageCollection,
    deleteImageCollection,
    assignImageCollection,
    saveImageSettings,
    clearImagePromptHistory,
    addFavorite,
    addNotification,
    updateSubscription,
    setAdminConfig,
    updatePreferences,
    setChatModelSelection,
    updateUserProfile,
    addToast,
    dismissToast,
    setCommandPaletteOpen: (value) => setState((prev) => ({ ...prev, ui: { ...prev.ui, commandPaletteOpen: value } })),
    setNotificationsOpen: (value) => setState((prev) => ({ ...prev, ui: { ...prev.ui, notificationsOpen: value } })),
    setUpgradeModalOpen: (value) => setState((prev) => ({ ...prev, ui: { ...prev.ui, upgradeModalOpen: value } }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state, auth])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
