const DEFAULT_STATE = {
  user: {
    name: 'Infinity Singh',
    email: 'hello@Infinity.ai',
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
    providerStatuses: { openrouter: 'healthy', comfyui: 'healthy' },
    providerConfig: { chatProvider: 'openrouter', imageProvider: 'local', writerProvider: 'backend', codeProvider: 'backend', pdfProvider: 'backend', translateProvider: 'backend' },
    analytics: { totalUsers: 1284, activeUsers: 812, conversionRate: '8.4%' }
  },
  chats: [],
  conversations: [],
  images: [],
  imageStudio: {
    promptHistory: [],
    collections: [],
    settings: {
      provider: 'local',
      model: '',
      aspectRatio: '1:1',
      width: 768,
      height: 768,
      steps: 30,
      guidanceScale: 7,
      seed: '',
      batchSize: 1,
      style: '',
      negativePrompt: ''
    }
  },
  favorites: [],
  notifications: [],
  activity: [],
  logs: [],
  coupons: [],
  preferences: { notificationsEnabled: true, motionEnabled: true, autoSave: true, darkMode: true, reducedMotion: false, chatProvider: 'openrouter', chatModel: '' },
  ui: {
    commandPaletteOpen: false,
    notificationsOpen: false,
    upgradeModalOpen: false
  },
  toasts: []
}

function createDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE))
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
    imageStudio: {
      ...createDefaultState().imageStudio,
      ...(input.imageStudio || {}),
      promptHistory: Array.isArray(input.imageStudio?.promptHistory) ? input.imageStudio.promptHistory : [],
      collections: Array.isArray(input.imageStudio?.collections) ? input.imageStudio.collections : [],
      settings: { ...createDefaultState().imageStudio.settings, ...(input.imageStudio?.settings || {}) }
    },
    toasts: []
  }
}

export { DEFAULT_STATE, createDefaultState, normalizeState }
