import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)
const STORAGE_KEY = 'infinityai-state-v1'

const defaultState = {
  user: {
    name: 'Aditya Singh',
    email: 'hello@aditya.ai',
    role: 'Founder',
    avatar: 'AS',
    plan: 'free-trial',
    location: 'London, UK',
    company: 'AI Studio'
  },
  subscription: {
    plan: 'free-trial',
    trialStartedAt: Date.now(),
    trialDays: 2,
    expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
    status: 'active'
  },
  usage: {
    dayChats: 0,
    dayImages: 0,
    monthChats: 0,
    monthImages: 0,
    storageUsed: 24,
    lastResetDay: '',
    lastResetMonth: ''
  },
  adminConfig: {
    trialDays: 2,
    planLimits: {
      'free-trial': { maxChatsPerDay: 20, maxImagesPerDay: 5, maxChatsPerMonth: 400, maxImagesPerMonth: 120 },
      starter: { maxChatsPerDay: 120, maxImagesPerDay: 40, maxChatsPerMonth: 3000, maxImagesPerMonth: 1000 },
      pro: { maxChatsPerDay: 500, maxImagesPerDay: 200, maxChatsPerMonth: 12000, maxImagesPerMonth: 6000 },
      business: { maxChatsPerDay: 2000, maxImagesPerDay: 800, maxChatsPerMonth: 50000, maxImagesPerMonth: 20000 }
    },
    storageLimit: 100,
    providerStatuses: { ollama: 'healthy', comfyui: 'healthy', openrouter: 'healthy' },
    providerConfig: { chatProvider: 'ollama', imageProvider: 'comfyui', writerProvider: 'backend', codeProvider: 'backend', pdfProvider: 'backend', translateProvider: 'backend' },
    analytics: { totalUsers: 1284, activeUsers: 812, conversionRate: '8.4%' }
  },
  chats: [],
  images: [],
  favorites: [],
  notifications: [],
  activity: [],
  logs: [],
  coupons: [],
  preferences: { notificationsEnabled: true, motionEnabled: true, autoSave: true, darkMode: true, reducedMotion: false },
  ui: {
    commandPaletteOpen: false,
    notificationsOpen: false,
    upgradeModalOpen: false
  },
  toasts: []
}

function createDefaultState() {
  return JSON.parse(JSON.stringify(defaultState))
}

function normalizeState(input) {
  const now = new Date()
  const dayKey = now.toISOString().slice(0, 10)
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const usage = input.usage || {}
  return {
    ...createDefaultState(),
    ...input,
    user: { ...createDefaultState().user, ...(input.user || {}) },
    subscription: { ...createDefaultState().subscription, ...(input.subscription || {}) },
    usage: {
      ...createDefaultState().usage,
      ...usage,
      dayChats: usage.lastResetDay === dayKey ? Number(usage.dayChats || 0) : 0,
      dayImages: usage.lastResetDay === dayKey ? Number(usage.dayImages || 0) : 0,
      monthChats: usage.lastResetMonth === monthKey ? Number(usage.monthChats || 0) : 0,
      monthImages: usage.lastResetMonth === monthKey ? Number(usage.monthImages || 0) : 0,
      lastResetDay: dayKey,
      lastResetMonth: monthKey
    },
    adminConfig: {
      ...createDefaultState().adminConfig,
      ...(input.adminConfig || {}),
      planLimits: {
        ...createDefaultState().adminConfig.planLimits,
        ...((input.adminConfig && input.adminConfig.planLimits) || {})
      },
      providerConfig: {
        ...createDefaultState().adminConfig.providerConfig,
        ...((input.adminConfig && input.adminConfig.providerConfig) || {})
      }
    },
    preferences: { ...createDefaultState().preferences, ...(input.preferences || {}) },
    ui: { ...createDefaultState().ui, ...(input.ui || {}) },
    toasts: []
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(createDefaultState)
  const [hydrated, setHydrated] = useState(false)
  const [auth, setAuth] = useState({ user: null, isAuthenticated: false, loading: true })

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
        const response = await fetch(`${apiBase}/auth/me`, { credentials: 'include' })
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
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
        const [plansRes, configRes, serverStateRes] = await Promise.all([
          fetch(`${apiBase}/plans`),
          fetch(`${apiBase}/config`),
          fetch(`${apiBase}/state`)
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
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    timeoutId = window.setTimeout(() => {
      fetch(`${apiBase}/state`, {
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

  const addImageEntry = (prompt, result) => {
    const check = canUseTool('image')
    if (!check.allowed) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, upgradeModalOpen: true } }))
      return false
    }
    const entry = {
      id: Date.now(),
      prompt,
      result,
      createdAt: new Date().toISOString(),
      tool: 'image'
    }
    setState((prev) => ({
      ...prev,
      images: [entry, ...prev.images].slice(0, 20),
      usage: { ...prev.usage, dayImages: prev.usage.dayImages + 1, monthImages: prev.usage.monthImages + 1 },
      activity: [{ id: Date.now(), title: 'Image generated', description: prompt.slice(0, 48), time: 'Just now' }, ...prev.activity].slice(0, 8),
      notifications: [{ id: Date.now(), title: 'Image saved', message: 'Your image concept is now in history.', unread: true }, ...prev.notifications].slice(0, 6)
    }))
    addToast({ kind: 'success', title: 'Image ready', message: 'Your new concept was saved to your image history.' })
    return true
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

  const updateUserProfile = (updates) => {
    setState((prev) => ({ ...prev, user: { ...prev.user, ...updates } }))
    addToast({ kind: 'success', title: 'Profile saved', message: 'Your personal details were updated.' })
  }

  const login = async (email, password) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = data.error || 'Login failed'
      addToast({ kind: 'error', title: 'Login failed', message: error })
      return { success: false, error }
    }
    setAuth({ user: data.user, isAuthenticated: true, loading: false })
    setState((prev) => ({ ...prev, user: { ...prev.user, ...data.user } }))
    addToast({ kind: 'success', title: 'Welcome back', message: 'You are now signed in.' })
    return { success: true, user: data.user }
  }

  const signup = async (name, email, password) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const response = await fetch(`${apiBase}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    })
    const data = await response.json()
    if (!response.ok) {
      const error = data.error || 'Signup failed'
      addToast({ kind: 'error', title: 'Signup failed', message: error })
      return { success: false, error }
    }
    setAuth({ user: data.user, isAuthenticated: true, loading: false })
    setState((prev) => ({ ...prev, user: { ...prev.user, ...data.user } }))
    addToast({ kind: 'success', title: 'Account created', message: 'Welcome to Aditya AI.' })
    return { success: true, user: data.user }
  }

  const logout = async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    await fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setAuth({ user: null, isAuthenticated: false, loading: false })
    setState((prev) => ({ ...prev, user: { ...createDefaultState().user, ...prev.user } }))
    addToast({ kind: 'info', title: 'Signed out', message: 'You have been logged out securely.' })
  }

  const value = useMemo(() => ({
    ...state,
    auth,
    login,
    signup,
    logout,
    canUseTool,
    addChatEntry,
    addImageEntry,
    addFavorite,
    addNotification,
    updateSubscription,
    setAdminConfig,
    updatePreferences,
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

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
