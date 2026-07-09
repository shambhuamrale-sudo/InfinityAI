import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { MongoClient, ObjectId } from 'mongodb'

dotenv.config()

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const clientOriginEnv = process.env.CLIENT_ORIGIN
const allowedOrigins = clientOriginEnv
  ? clientOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : []
const cookieSameSite = process.env.COOKIE_SAMESITE || (allowedOrigins.length ? 'none' : 'lax')
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: cookieSameSite,
  secure: IS_PRODUCTION,
  maxAge: 7 * 24 * 60 * 60 * 1000
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins, credentials: true } : { origin: true, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

const SALT_ROUNDS = Number(process.env.AUTH_SALT_ROUNDS || 12)
const JWT_SECRET = process.env.JWT_SECRET || 'aditya-ai-jwt-secret-change-in-production'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

const limiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false })
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET') return next()
  return limiter(req, res, next)
})

const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false })

const defaultPlans = [
  { id: 'free-trial', name: 'Free Trial', price: 0, features: ['2 days access', '20 AI chats/day', '5 AI images/day'] },
  { id: 'starter', name: 'Starter', price: 19, features: ['Configurable limits', 'Priority support', 'Advanced templates'] },
  { id: 'pro', name: 'Pro', price: 49, features: ['Higher limits', 'Team collaboration', 'Advanced automations'] },
  { id: 'business', name: 'Business', price: 99, features: ['Highest limits', 'Admin controls', 'Dedicated success'] }
]

const defaultAdminConfig = {
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
}

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
  adminConfig: defaultAdminConfig,
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

let memoryState = { ...defaultState, updatedAt: new Date().toISOString() }
let mongoClient = null
let mongoDb = null
let stateCollection = null
let usersCollection = null
let chatsCollection = null
let imagesCollection = null
let MongoMemoryServer = null
let mongoMemoryServer = null

async function connectMongo() {
  if (mongoDb) return mongoDb
  const uri = process.env.MONGO_URI
  if (IS_PRODUCTION && !uri) {
    const message = 'MONGO_URI is required in production. Configure MongoDB Atlas (see DEPLOYMENT.md).'
    console.error(message)
    throw new Error(message)
  }
  try {
    if (!uri) {
      if (!MongoMemoryServer) {
        const mod = await import('mongodb-memory-server')
        MongoMemoryServer = mod.MongoMemoryServer
      }
      mongoMemoryServer = await MongoMemoryServer.create()
      mongoClient = new MongoClient(mongoMemoryServer.getUri())
      await mongoClient.connect()
      mongoDb = mongoClient.db(process.env.MONGO_DB || 'infinityai')
    } else {
      mongoClient = new MongoClient(uri)
      await mongoClient.connect()
      mongoDb = mongoClient.db(process.env.MONGO_DB || 'infinityai')
    }
    stateCollection = mongoDb.collection('app_state')
    usersCollection = mongoDb.collection('users')
    chatsCollection = mongoDb.collection('chats')
    imagesCollection = mongoDb.collection('images')
    await ensureAdmin()
    return mongoDb
  } catch (error) {
    if (IS_PRODUCTION) {
      console.error('MongoDB connection failed (production requires MongoDB Atlas):', error.message)
      throw error
    }
    console.warn('MongoDB unavailable, using in-memory state:', error.message)
    return null
  }
}

let adminSeeded = false
async function ensureAdmin() {
  if (adminSeeded || !usersCollection) return
  adminSeeded = true
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return
  try {
    const existing = await usersCollection.findOne({ email })
    if (existing) return
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const now = new Date().toISOString()
    await usersCollection.insertOne({
      name: 'Admin',
      email,
      passwordHash,
      role: 'admin',
      avatar: 'AD',
      plan: 'business',
      location: '',
      company: '',
      createdAt: now,
      updatedAt: now
    })
    console.log(`Seeded admin user: ${email}`)
  } catch (error) {
    console.warn('Failed to seed admin user:', error.message)
  }
}

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

async function getUserFromToken(req) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = await connectMongo()
    if (!db || !usersCollection) return null
    const userId = ObjectId.isValid(decoded.id) ? new ObjectId(decoded.id) : decoded.id
    const user = await usersCollection.findOne({ _id: userId })
    if (!user) return null
    const { password, ...safe } = user
    return safe
  } catch {
    return null
  }
}

const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) })
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

function normalizeState(incoming = {}) {
  const now = new Date()
  const dayKey = now.toISOString().slice(0, 10)
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const usage = incoming.usage || {}
  const nextUsage = {
    ...defaultState.usage,
    ...usage,
    dayChats: usage.lastResetDay === dayKey ? Number(usage.dayChats || 0) : 0,
    dayImages: usage.lastResetDay === dayKey ? Number(usage.dayImages || 0) : 0,
    monthChats: usage.lastResetMonth === monthKey ? Number(usage.monthChats || 0) : 0,
    monthImages: usage.lastResetMonth === monthKey ? Number(usage.monthImages || 0) : 0,
    lastResetDay: dayKey,
    lastResetMonth: monthKey
  }

  return {
    ...defaultState,
    ...incoming,
    user: { ...defaultState.user, ...(incoming.user || {}) },
    subscription: { ...defaultState.subscription, ...(incoming.subscription || {}) },
    usage: nextUsage,
    adminConfig: {
      ...defaultAdminConfig,
      ...(incoming.adminConfig || {}),
      planLimits: {
        ...defaultAdminConfig.planLimits,
        ...((incoming.adminConfig && incoming.adminConfig.planLimits) || {})
      },
      providerConfig: {
        ...defaultAdminConfig.providerConfig,
        ...((incoming.adminConfig && incoming.adminConfig.providerConfig) || {})
      }
    },
    preferences: { ...defaultState.preferences, ...(incoming.preferences || {}) },
    ui: { ...defaultState.ui, ...(incoming.ui || {}) },
    toasts: [],
    updatedAt: new Date().toISOString()
  }
}

async function loadState() {
  const db = await connectMongo()
  if (db && stateCollection) {
    const doc = await stateCollection.findOne({ key: 'app-state' })
    if (doc?.state) return normalizeState(doc.state)
  }
  return normalizeState(memoryState)
}

async function saveState(state) {
  const snapshot = normalizeState(state)
  memoryState = snapshot
  const db = await connectMongo()
  if (db && stateCollection) {
    await stateCollection.updateOne({ key: 'app-state' }, { $set: { state: snapshot, updatedAt: snapshot.updatedAt } }, { upsert: true })
  }
  return snapshot
}

function buildFallbackText(kind, prompt) {
  const normalized = (prompt || '').trim() || 'your prompt'
  if (kind === 'chat') {
    return `Here is a practical response for: ${normalized}\n\n- Summarize the key points.\n- Suggest the next action.\n- Offer a polished draft you can refine.`
  }
  if (kind === 'writer') {
    return `Draft copy for ${normalized}:\n\nLaunch your next idea with a clear promise, benefit-led messaging, and confident calls to action.`
  }
  if (kind === 'code') {
    return `// Generated starter for: ${normalized}\nexport function buildSolution() {\n  return 'Implementation ready';\n}`
  }
  if (kind === 'pdf') {
    return `Summary for ${normalized}:\n\n- Main takeaway\n- Key decision\n- Suggested next step`
  }
  if (kind === 'translate') {
    return `Translated draft for ${normalized}`
  }
  return normalized
}

async function callOllama(prompt, model) {
  const base = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
  try {
    const response = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || process.env.OLLAMA_MODEL || 'llama3.2', prompt: `You are a helpful AI assistant. ${prompt}`, stream: false })
    })
    if (!response.ok) throw new Error(`Ollama responded with ${response.status}`)
    const data = await response.json()
    if (data?.response) return { text: data.response.trim(), provider: 'ollama', usedFallback: false }
  } catch (error) {
    console.warn('Ollama unavailable, using fallback response:', error.message)
  }
  return { text: buildFallbackText('chat', prompt), provider: 'fallback', usedFallback: true }
}

async function callComfyUI(prompt) {
  const base = process.env.COMFYUI_URL || 'http://127.0.0.1:8188'
  try {
    const response = await fetch(`${base}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, workflow: 'default' })
    })
    if (!response.ok) throw new Error(`ComfyUI responded with ${response.status}`)
    const data = await response.json()
    return { text: `Image generation queued successfully for ${prompt}.`, provider: 'comfyui', usedFallback: false, payload: data }
  } catch (error) {
    console.warn('ComfyUI unavailable, using fallback response:', error.message)
  }
  return { text: `Generated concept for: ${prompt}`, provider: 'fallback', usedFallback: true }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Aditya AI API is running' })
})

app.get('/api/plans', (_req, res) => {
  res.json(defaultPlans)
})

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  const { name, email, password } = parsed.data
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const existing = await usersCollection.findOne({ email })
  if (existing) return res.status(409).json({ error: 'Email already registered' })
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const now = new Date().toISOString()
  const user = { name, email, passwordHash, role: 'user', avatar: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), plan: 'free-trial', location: '', company: '', createdAt: now, updatedAt: now }
  const result = await usersCollection.insertOne(user)
  user._id = result.insertedId
  const token = signToken(user)
  res.cookie('token', token, sessionCookieOptions)
  const { password: _password, ...safe } = user
  res.status(201).json({ user: safe, token })
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  const { email, password } = parsed.data
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })
  const token = signToken(user)
  res.cookie('token', token, sessionCookieOptions)
  const { password: _password, ...safe } = user
  res.json({ user: safe, token })
})

app.post('/api/auth/logout', async (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: cookieSameSite, secure: IS_PRODUCTION })
  res.json({ ok: true })
})

app.get('/api/auth/me', async (req, res) => {
  const user = await getUserFromToken(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json({ user })
})

app.use('/api', async (req, res, next) => {
  req.user = await getUserFromToken(req)
  next()
})

app.get('/api/config', async (_req, res) => {
  const state = await loadState()
  res.json(state.adminConfig)
})

app.get('/api/state', async (_req, res) => {
  const state = await loadState()
  res.json(state)
})

app.post('/api/state', async (req, res) => {
  const state = await saveState(req.body || {})
  res.json(state)
})

app.post('/api/admin/config', async (req, res) => {
  const user = req.user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  const state = await loadState()
  const nextState = await saveState({ ...state, adminConfig: { ...state.adminConfig, ...req.body } })
  res.json(nextState.adminConfig)
})

app.post('/api/chat', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const state = await loadState()
  const provider = req.body?.provider || state.adminConfig.providerConfig?.chatProvider || 'ollama'
  const model = req.body?.model || state.adminConfig.providerConfig?.chatModel || process.env.OLLAMA_MODEL || 'llama3.2'
  const result = provider === 'ollama' ? await callOllama(prompt, model) : { text: buildFallbackText('chat', prompt), provider, usedFallback: true }
  res.json(result)
})

app.post('/api/image', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const state = await loadState()
  const provider = req.body?.provider || state.adminConfig.providerConfig?.imageProvider || 'comfyui'
  const result = provider === 'comfyui' ? await callComfyUI(prompt) : { text: buildFallbackText('image', prompt), provider, usedFallback: true }
  res.json(result)
})

app.post('/api/writer', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const result = await callOllama(`Write a polished launch-ready copy based on this prompt: ${prompt}`, process.env.OLLAMA_MODEL || 'llama3.2')
  res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback })
})

app.post('/api/code', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const result = await callOllama(`Generate a useful code snippet for this request: ${prompt}`, process.env.OLLAMA_MODEL || 'llama3.2')
  res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback })
})

app.post('/api/pdf', async (req, res) => {
  const text = req.body?.text || ''
  const prompt = req.body?.prompt || ''
  const summary = text ? `Summary for ${prompt || 'the uploaded document'}:\n\n${text.slice(0, 600)}` : buildFallbackText('pdf', prompt)
  res.json({ response: summary, provider: 'backend', usedFallback: !text })
})

app.post('/api/translate', async (req, res) => {
  const text = req.body?.text || ''
  const target = req.body?.target || 'Spanish'
  const response = text ? `${target} translation: ${text}` : buildFallbackText('translate', '')
  res.json({ response, provider: 'backend', usedFallback: !text })
})

app.post('/api/favorites', async (req, res) => {
  const state = await loadState()
  const favorite = req.body || {}
  const favorites = [favorite, ...state.favorites.filter((entry) => entry.id !== favorite.id)].slice(0, 10)
  const nextState = await saveState({ ...state, favorites })
  res.json(nextState.favorites)
})

app.post('/api/preferences', async (req, res) => {
  const state = await loadState()
  const nextState = await saveState({ ...state, preferences: { ...state.preferences, ...(req.body || {}) } })
  res.json(nextState.preferences)
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

export async function startServer(port = Number(process.env.PORT || 4000)) {
  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Aditya AI API listening on port ${port}`)
      resolve(server)
    })
  })
}

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
}

export default app
