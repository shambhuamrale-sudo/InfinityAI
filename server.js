import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const require = createRequire(import.meta.url)
let pdfParse
try { pdfParse = (await import('pdf-parse')).default || require('pdf-parse') } catch { pdfParse = null }
let mammoth
try { mammoth = (await import('mammoth')).default } catch { mammoth = null }
let Tesseract
try { Tesseract = (await import('tesseract.js')).default } catch { Tesseract = null }
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { MongoClient, ObjectId } from 'mongodb'
import { providerManager, imageProviderManager } from './providers/index.js'

dotenv.config()

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const clientOriginEnv = process.env.CLIENT_ORIGIN
const allowedOrigins = clientOriginEnv
  ? clientOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : IS_PRODUCTION
    ? []
    : ['http://localhost:5173']
const cookieSameSite = process.env.COOKIE_SAMESITE || (allowedOrigins.length ? 'none' : 'lax')
const corsOptions = allowedOrigins.length
  ? { origin: allowedOrigins, credentials: true }
  : IS_PRODUCTION
    ? { origin: false, credentials: true }
    : { origin: true, credentials: true }
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: cookieSameSite,
  secure: IS_PRODUCTION,
  maxAge: 7 * 24 * 60 * 60 * 1000
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const SALT_ROUNDS = Number(process.env.AUTH_SALT_ROUNDS || 12)
let JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error('JWT_SECRET is required in production.')
    process.exit(1)
  }
  JWT_SECRET = 'aditya-ai-jwt-secret-change-in-production'
  console.warn('JWT_SECRET not set. Using insecure default for development only.')
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

const limiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false })
const getLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false })
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET') return getLimiter(req, res, next)
  return limiter(req, res, next)
})

const authLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false })
const forgotPasswordLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false })

// Per-user rate limiting backed by an in-memory store (Redis-like). This gives
// authenticated users a fair, per-identity budget separate from the global IP
// limiter above. Keyed by user id when available, falling back to IP.
const inMemoryStore = new Map()
function memoryStore() {
  return {
    init() {},
    increment(key) {
      const now = Date.now()
      const record = inMemoryStore.get(key) || { count: 0, resetTime: now + 60_000 }
      if (record.resetTime <= now) {
        record.count = 0
        record.resetTime = now + 60_000
      }
      record.count += 1
      inMemoryStore.set(key, record)
      const isAllowed = record.count <= (userLimiterOpts.max || 60)
      const resetMs = Math.max(0, record.resetTime - now)
      return { totalHits: record.count, resetTime: new Date(record.resetTime), msBeforeNext: resetMs, isAllowed }
    },
    decrement(key) {
      const record = inMemoryStore.get(key)
      if (record && record.count > 0) {
        record.count -= 1
        inMemoryStore.set(key, record)
      }
    },
    resetKey(key) {
      inMemoryStore.delete(key)
    }
  }
}

const userLimiterOpts = { windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false, store: memoryStore() }
const userLimiter = rateLimit(userLimiterOpts)

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of inMemoryStore) {
    if (record.resetTime <= now) {
      inMemoryStore.delete(key)
    }
  }
}, 5 * 60_000)

const BREVO_API_KEY = process.env.BREVO_API_KEY
if ((!BREVO_API_KEY) && IS_PRODUCTION) {
  console.error('BREVO_API_KEY is required in production.')
  process.exit(1)
}

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
    providerConfig: { chatProvider: 'ollama', imageProvider: 'local', writerProvider: 'backend', codeProvider: 'backend', pdfProvider: 'backend', translateProvider: 'backend' },
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
  conversations: [],
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
let _chatsCollection = null
let _imagesCollection = null
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
      mongoClient = new MongoClient(mongoMemoryServer.getUri(), { serverSelectionTimeoutMS: 5000 })
      await mongoClient.connect()
      mongoDb = mongoClient.db(process.env.MONGO_DB || 'infinityai')
    } else {
      mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      await mongoClient.connect()
      mongoDb = mongoClient.db(process.env.MONGO_DB || 'infinityai')
    }
    stateCollection = mongoDb.collection('app_state')
    usersCollection = mongoDb.collection('users')
    _chatsCollection = mongoDb.collection('chats')
    _imagesCollection = mongoDb.collection('images')
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
      isVerified: true,
      createdAt: now,
      updatedAt: now
    })
    console.log(`Seeded admin user: ${email}`)
  } catch (error) {
    console.warn('Failed to seed admin user:', error.message)
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function getOtpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

function sanitizeUser(user) {
  if (!user) return user
  const { passwordHash: _passwordHash, resetOtp: _resetOtp, resetOtpExpiry: _resetOtpExpiry, resetOtpAttempts: _resetOtpAttempts, resetOtpSentAt: _resetOtpSentAt, ...safe } = user
  return safe
}




const EmailService = {
  async send(to, subject, html) {
    if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured')
    const payload = {
      sender: {
        name: 'InfinityAI',
        email: process.env.EMAIL_FROM
      },
      to: [
        {
          email: to
        }
      ],
      subject,
      htmlContent: html
    }
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    })
    let body
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
    if (!response.ok) {
      const message = typeof body === 'string' ? body : (body?.message || JSON.stringify(body))
      console.error('HTTP Status:', response.status)
      console.error('Full response body:', body)
      console.error('Error message:', message)
      throw new Error(`Brevo send failed: ${response.status} ${message}`)
    }
    console.log('Brevo email sent successfully.')
    return body
  },

  async sendResetOtp(email, otp) {
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #6366f1; margin-bottom: 1rem;">Reset your password</h2>
        <p style="color: #374151; line-height: 1.6;">Use the following OTP to reset your InfinityAI password. This code expires in 10 minutes.</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
          <span style="font-size: 2rem; font-weight: bold; letter-spacing: 0.5rem; color: #111827;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `
    await this.send(email, 'Reset your InfinityAI password', html)
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
    return sanitizeUser(user)
  } catch {
    return null
  }
}

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-])(?!.*\s).{8,}$/
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().regex(STRONG_PASSWORD_REGEX, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character') })
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const adminConfigSchema = z.object({
  trialDays: z.coerce.number().int().min(1).max(365).optional(),
  storageLimit: z.coerce.number().int().min(1).optional(),
  planLimits: z.object({
    'free-trial': z.object({ maxChatsPerDay: z.coerce.number().int().min(1).optional(), maxImagesPerDay: z.coerce.number().int().min(1).optional(), maxChatsPerMonth: z.coerce.number().int().min(1).optional(), maxImagesPerMonth: z.coerce.number().int().min(1).optional() }).optional(),
    starter: z.object({ maxChatsPerDay: z.coerce.number().int().min(1).optional(), maxImagesPerDay: z.coerce.number().int().min(1).optional(), maxChatsPerMonth: z.coerce.number().int().min(1).optional(), maxImagesPerMonth: z.coerce.number().int().min(1).optional() }).optional(),
    pro: z.object({ maxChatsPerDay: z.coerce.number().int().min(1).optional(), maxImagesPerDay: z.coerce.number().int().min(1).optional(), maxChatsPerMonth: z.coerce.number().int().min(1).optional(), maxImagesPerMonth: z.coerce.number().int().min(1).optional() }).optional(),
    business: z.object({ maxChatsPerDay: z.coerce.number().int().min(1).optional(), maxImagesPerDay: z.coerce.number().int().min(1).optional(), maxChatsPerMonth: z.coerce.number().int().min(1).optional(), maxImagesPerMonth: z.coerce.number().int().min(1).optional() }).optional()
  }).optional(),
  providerConfig: z.object({
    chatProvider: z.string().optional(),
    imageProvider: z.string().optional(),
    writerProvider: z.string().optional(),
    codeProvider: z.string().optional(),
    pdfProvider: z.string().optional(),
    translateProvider: z.string().optional()
  }).optional()
}).passthrough()

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

async function enforcePlanLimit(state, tool, res) {
  const plan = state?.subscription?.plan || 'free-trial'
  const limits = state?.adminConfig?.planLimits?.[plan] || state?.adminConfig?.planLimits?.['free-trial'] || defaultAdminConfig.planLimits['free-trial']
  const isTrialExpired = plan === 'free-trial' && Date.now() > (state?.subscription?.expiresAt || 0)
  if (isTrialExpired) {
    return res.status(403).json({ error: 'Trial expired. Please upgrade your plan.', reason: 'trial-expired' })
  }
  if (tool === 'chat' && state?.usage?.dayChats >= (limits?.maxChatsPerDay || 20)) {
    return res.status(429).json({ error: 'Daily chat limit reached. Please upgrade or try again tomorrow.', reason: 'chat-limit' })
  }
  if (tool === 'image' && state?.usage?.dayImages >= (limits?.maxImagesPerDay || 5)) {
    return res.status(429).json({ error: 'Daily image limit reached. Please upgrade or try again tomorrow.', reason: 'image-limit' })
  }
  return null
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
  const user = { name, email, passwordHash, role: 'user', avatar: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), plan: 'free-trial', location: '', company: '', isVerified: true, createdAt: now, updatedAt: now }
  const result = await usersCollection.insertOne(user)
  user._id = result.insertedId
  const safe = sanitizeUser(user)
  res.status(201).json({ user: safe })
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
  const safe = sanitizeUser(user)
  res.json({ user: safe, token })
})

app.post('/api/auth/logout', async (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: cookieSameSite, secure: IS_PRODUCTION })
  res.json({ ok: true })
})

app.post('/api/auth/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body || {}
  const parsedEmail = z.string().email().safeParse(email)
  if (!parsedEmail.success) return res.status(400).json({ error: 'Valid email is required' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email: parsedEmail.data })
  if (user) {
    const otp = generateOtp()
    const otpExpiry = getOtpExpiry(10)
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { resetOtp: otp, resetOtpExpiry: otpExpiry, resetOtpAttempts: 0 } }
    )
    try {
      await EmailService.sendResetOtp(email, otp)
    } catch (error) {
      console.error("Failed to send reset email")
    console.error(error)
    }
  }
  res.json({ ok: true, message: 'If an account exists, a reset OTP has been sent.' })
})

app.post('/api/auth/verify-reset-otp', forgotPasswordLimiter, async (req, res) => {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid request' })
  if (!user.resetOtp || !user.resetOtpExpiry) return res.status(400).json({ error: 'No OTP requested' })
  if (new Date(user.resetOtpExpiry) < new Date()) return res.status(400).json({ error: 'OTP has expired' })
  const attempts = Number(user.resetOtpAttempts || 0)
  if (attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' })
  if (user.resetOtp !== String(otp)) {
    await usersCollection.updateOne({ _id: user._id }, { $inc: { resetOtpAttempts: 1 } })
    return res.status(400).json({ error: 'Invalid OTP' })
  }
  res.json({ ok: true, message: 'OTP verified successfully' })
})

app.post('/api/auth/reset-password', forgotPasswordLimiter, async (req, res) => {
  const { email, otp, password } = req.body || {}
  if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid request' })
  if (!user.resetOtp || !user.resetOtpExpiry) return res.status(400).json({ error: 'No OTP requested' })
  if (new Date(user.resetOtpExpiry) < new Date()) return res.status(400).json({ error: 'OTP has expired' })
  const attempts = Number(user.resetOtpAttempts || 0)
  if (attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' })
  if (user.resetOtp !== String(otp)) {
    await usersCollection.updateOne({ _id: user._id }, { $inc: { resetOtpAttempts: 1 } })
    return res.status(400).json({ error: 'Invalid OTP' })
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { passwordHash }, $unset: { resetOtp: '', resetOtpExpiry: '', resetOtpAttempts: '' } }
  )
  res.json({ ok: true, message: 'Password reset successfully' })
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

app.get('/api/conversations', async (req, res) => {
  const state = await loadState()
  const conversations = (state.conversations || []).map((c) => ({
    ...c,
    messages: c.messages ? c.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })) : []
  }))
  res.json({ conversations })
})

app.get('/api/conversations/:id', async (req, res) => {
  const state = await loadState()
  const conversation = (state.conversations || []).find((c) => c.id === req.params.id)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
  res.json({ conversation })
})

app.post('/api/conversations', async (req, res) => {
  const state = await loadState()
  const conversation = {
    id: `conv_${Date.now()}`,
    title: req.body?.title || 'New conversation',
    messages: req.body?.messages || [],
    provider: req.body?.provider || state.adminConfig.providerConfig?.chatProvider || 'ollama',
    model: req.body?.model || state.adminConfig.providerConfig?.chatModel || process.env.OLLAMA_MODEL || 'llama3.2',
    pinned: false,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  const nextState = await saveState({ ...state, conversations: [conversation, ...(state.conversations || [])] })
  res.json({ conversation, conversations: nextState.conversations })
})

app.put('/api/conversations/:id', async (req, res) => {
  const state = await loadState()
  const conversations = state.conversations || []
  const index = conversations.findIndex((c) => c.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Conversation not found' })
  const updated = { ...conversations[index], ...req.body, updatedAt: new Date().toISOString() }
  conversations[index] = updated
  const nextState = await saveState({ ...state, conversations: [...conversations] })
  res.json({ conversation: updated, conversations: nextState.conversations })
})

app.delete('/api/conversations/:id', async (req, res) => {
  const state = await loadState()
  const nextConversations = (state.conversations || []).filter((c) => c.id !== req.params.id)
  const nextState = await saveState({ ...state, conversations: nextConversations })
  res.json({ conversations: nextState.conversations })
})

app.post('/api/conversations/:id/duplicate', async (req, res) => {
  const state = await loadState()
  const source = (state.conversations || []).find((c) => c.id === req.params.id)
  if (!source) return res.status(404).json({ error: 'Conversation not found' })
  const duplicate = {
    ...source,
    id: `conv_${Date.now()}`,
    title: `${source.title} (copy)`,
    pinned: false,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  const nextState = await saveState({ ...state, conversations: [duplicate, ...(state.conversations || [])] })
  res.json({ conversation: duplicate, conversations: nextState.conversations })
})

app.post('/api/chat/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported file type' })
  }
  const base64 = req.file.buffer.toString('base64')
  const attachment = {
    id: `att_${Date.now()}`,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    data: base64,
    createdAt: new Date().toISOString()
  }
  res.json({ attachment })
})

app.get('/api/conversations/:id/export', async (req, res) => {
  const state = await loadState()
  const conversation = (state.conversations || []).find((c) => c.id === req.params.id)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
  const format = req.query.format || 'md'
  let content = ''
  let contentType = 'text/plain'
  let extension = 'txt'
  if (format === 'md') {
    content = conversation.messages.map((m) => `## ${m.role === 'user' ? 'You' : 'Assistant'}\n\n${m.content}`).join('\n\n---\n\n')
    contentType = 'text/markdown'
    extension = 'md'
  } else if (format === 'html') {
    content = `<!DOCTYPE html><html><head><title>${conversation.title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#1a1a1a;background:#f8fafc}pre{background:#f1f5f9;padding:1rem;border-radius:0.5rem;overflow-x:auto}code{font-family:monospace}blockquote{border-left:4px solid #6366f1;padding-left:1rem;color:#4b5563}</style></head><body><h1>${conversation.title}</h1>${conversation.messages.map((m) => `<h2>${m.role === 'user' ? 'You' : 'Assistant'}</h2><div>${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/^#+\s+(.*)$/gm, '<h3>$1</h3>').replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>').replace(/^-\s+(.*)$/gm, '<li>$1</li>').replace(/\n/g, '<br>')}</div>`).join('<hr>')}</body></html>`
    contentType = 'text/html'
    extension = 'html'
  } else if (format === 'pdf') {
    content = conversation.messages.map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}:\n\n${m.content}`).join('\n\n---\n\n')
    contentType = 'text/plain'
    extension = 'txt'
  }
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${conversation.title.replace(/[^a-z0-9]/gi, '_')}.${extension}"`)
  res.send(content)
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
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const incoming = req.body || {}
  const allowedKeys = ['preferences', 'ui', 'favorites', 'notifications', 'activity', 'toasts', 'chats', 'images', 'conversations']
  const sanitized = {}
  for (const key of allowedKeys) {
    if (incoming[key] !== undefined) {
      sanitized[key] = incoming[key]
    }
  }
  const state = await saveState({ ...sanitized })
  res.json(state)
})

app.post('/api/admin/config', async (req, res) => {
  const user = req.user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  const parsed = adminConfigSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }
  const state = await loadState()
  const nextState = await saveState({ ...state, adminConfig: { ...state.adminConfig, ...parsed.data } })
  res.json(nextState.adminConfig)
})

app.post('/api/chat', userLimiter, async (req, res) => {
  const prompt = req.body?.prompt || ''
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : undefined
  const state = await loadState()
  const limitResponse = await enforcePlanLimit(state, 'chat', res)
  if (limitResponse) return
  const provider = req.body?.provider || state.adminConfig.providerConfig?.chatProvider || 'ollama'
  const model = req.body?.model || state.adminConfig.providerConfig?.chatModel || process.env.OLLAMA_MODEL || 'llama3.2'
  const stream = Boolean(req.body?.stream)
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()
    try {
      const selected = providerManager.select(provider)
      if (selected && selected.streamChat) {
        await selected.streamChat({ prompt, model, messages }, (chunk) => {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
        })
      } else {
        const result = await providerManager.chat({ provider, prompt, model, messages })
        res.write(`data: ${JSON.stringify({ text: result.text })}\n\n`)
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    await saveState({ ...state, usage: { ...state.usage, dayChats: state.usage.dayChats + 1, monthChats: state.usage.monthChats + 1 } })
    return res.end()
  }
  const result = await providerManager.chat({ provider, prompt, model, messages })
  await saveState({ ...state, usage: { ...state.usage, dayChats: state.usage.dayChats + 1, monthChats: state.usage.monthChats + 1 } })
  res.json(result)
})

// ── Provider system (Phase 2) — additive, read-only discovery endpoints ──────

// List providers with static capability descriptors.
app.get('/api/providers', (_req, res) => {
  res.json({ providers: providerManager.listProviders(), default: providerManager.defaultProviderId })
})

// List providers together with their model catalogs (may probe local Ollama).
app.get('/api/providers/models', async (_req, res) => {
  try {
    const providers = await providerManager.listProvidersWithModels()
    res.json({ providers })
  } catch (error) {
    console.warn('Failed to list provider models:', error.message)
    res.json({ providers: providerManager.listProviders() })
  }
})

// Runtime availability for all providers (or ?id=xxx for one).
app.get('/api/providers/availability', async (req, res) => {
  const id = typeof req.query?.id === 'string' ? req.query.id : undefined
  const availability = await providerManager.checkAvailability(id)
  res.json({ availability })
})

// Capabilities for all providers (or ?id=xxx for one).
app.get('/api/providers/capabilities', (req, res) => {
  const id = typeof req.query?.id === 'string' ? req.query.id : undefined
  res.json({ capabilities: providerManager.getCapabilities(id) })
})

// Validate an API key for a provider (admin-only; never echoes the key back).
app.post('/api/providers/validate', async (req, res) => {
  const user = req.user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  const id = req.body?.provider
  if (!id || !providerManager.has(id)) {
    return res.status(400).json({ error: 'Unknown provider' })
  }
  const result = await providerManager.validateApiKey(id, req.body?.apiKey)
  res.json(result)
})

function sanitizeImageParams(body = {}) {
  const clamp = (value, min, max, fallback) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.min(Math.max(n, min), max)
  }
  const params = {
    prompt: typeof body.prompt === 'string' ? body.prompt.slice(0, 2000) : '',
    negativePrompt: typeof body.negativePrompt === 'string' ? body.negativePrompt.slice(0, 2000) : '',
    width: clamp(body.width, 128, 2048, 768),
    height: clamp(body.height, 128, 2048, 768),
    steps: clamp(body.steps, 1, 150, 30),
    guidanceScale: clamp(body.guidanceScale, 0, 30, 7),
    batchSize: clamp(body.batchSize, 1, 8, 1),
    model: typeof body.model === 'string' ? body.model : undefined
  }
  if (body.seed !== undefined && body.seed !== null && `${body.seed}` !== '') {
    const seed = Number(body.seed)
    if (Number.isFinite(seed) && seed >= 0) params.seed = Math.floor(seed)
  }
  return params
}

// Text-to-image generation. Backward compatible: still returns `text`, and now
// also returns a normalized `images` array plus generation metadata.
app.post('/api/image', userLimiter, async (req, res) => {
  const state = await loadState()
  const limitResponse = await enforcePlanLimit(state, 'image', res)
  if (limitResponse) return
  const provider = req.body?.provider || state.adminConfig.providerConfig?.imageProvider || imageProviderManager.defaultProviderId
  const params = sanitizeImageParams(req.body)
  const result = await imageProviderManager.generate({ provider, ...params })
  // Keep a human-readable `text` field for legacy consumers.
  if (!result.text) result.text = `Generated image for: ${params.prompt || 'your prompt'}`
  await saveState({ ...state, usage: { ...state.usage, dayImages: state.usage.dayImages + 1, monthImages: state.usage.monthImages + 1 } })
  res.json(result)
})

// Image editing operations: image-to-image, upscale, background removal, face
// restoration, inpainting, outpainting, crop/resize.
app.post('/api/image/edit', async (req, res) => {
  const state = await loadState()
  const limitResponse = await enforcePlanLimit(state, 'image', res)
  if (limitResponse) return
  const provider = req.body?.provider || state.adminConfig.providerConfig?.imageProvider || imageProviderManager.defaultProviderId
  const validOps = ['image-to-image', 'inpaint', 'outpaint', 'upscale', 'background-removal', 'face-restoration', 'crop-resize']
  const operation = validOps.includes(req.body?.operation) ? req.body.operation : 'image-to-image'
  const params = sanitizeImageParams(req.body)
  const image = typeof req.body?.image === 'string' ? req.body.image : undefined
  const denoisingStrength = Number.isFinite(Number(req.body?.denoisingStrength)) ? Number(req.body.denoisingStrength) : 0.6
  const result = await imageProviderManager.edit({ provider, operation, image, denoisingStrength, ...params })
  await saveState({ ...state, usage: { ...state.usage, dayImages: state.usage.dayImages + 1, monthImages: state.usage.monthImages + 1 } })
  res.json(result)
})

// Image provider discovery (mirrors /api/providers for chat).
app.get('/api/image/providers', (_req, res) => {
  res.json({ providers: imageProviderManager.listProviders(), default: imageProviderManager.defaultProviderId })
})

app.get('/api/image/providers/models', async (_req, res) => {
  try {
    const providers = await imageProviderManager.listProvidersWithModels()
    res.json({ providers })
  } catch (error) {
    console.warn('Failed to list image provider models:', error.message)
    res.json({ providers: imageProviderManager.listProviders() })
  }
})

app.get('/api/image/providers/availability', async (req, res) => {
  const id = typeof req.query?.id === 'string' ? req.query.id : undefined
  const availability = await imageProviderManager.checkAvailability(id)
  res.json({ availability })
})

app.get('/api/image/providers/capabilities', (req, res) => {
  const id = typeof req.query?.id === 'string' ? req.query.id : undefined
  res.json({ capabilities: imageProviderManager.getCapabilities(id) })
})

// Validate an image provider API key (admin-only; never echoes the key back).
app.post('/api/image/providers/validate', async (req, res) => {
  const user = req.user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  const id = req.body?.provider
  if (!id || !imageProviderManager.has(id)) {
    return res.status(400).json({ error: 'Unknown provider' })
  }
  const result = await imageProviderManager.validateApiKey(id, req.body?.apiKey)
  res.json(result)
})

// Random prompt generator for the studio.
app.get('/api/image/random-prompt', (req, res) => {
  const seed = Number(req.query?.seed)
  res.json({ prompt: imageProviderManager.randomPrompt(Number.isFinite(seed) ? seed : undefined) })
})

app.post('/api/writer', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const tone = req.body?.tone || 'professional'
  const length = req.body?.length || 'medium'
  const templates = req.body?.templates || ''
  const systemPrompt = `You are an expert copywriter. Generate polished, launch-ready copy. Tone: ${tone}. Length: ${length}.${templates ? ` Use these templates as guidance: ${templates}` : ''} Always produce clear, benefit-led, confident copy with a strong call to action.`
  try {
    const result = await providerManager.chat({ prompt, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Writer error:', error)
    res.status(500).json({ error: 'Writer service unavailable', response: buildFallbackText('writer', prompt), provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/code', async (req, res) => {
  const prompt = req.body?.prompt || ''
  const language = req.body?.language || 'javascript'
  const framework = req.body?.framework || ''
  const systemPrompt = `You are an expert software engineer. Generate clean, production-ready ${language}${framework ? ` code using ${framework}` : ''} for this request. Include comments, error handling, and follow best practices. If the request asks for explanation, debugging, or optimization, provide detailed analysis with code examples.`
  try {
    const result = await providerManager.chat({ prompt, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Code error:', error)
    res.status(500).json({ error: 'Code service unavailable', response: buildFallbackText('code', prompt), provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/pdf', pdfUpload.single('file'), async (req, res) => {
  const startTime = Date.now()
  let extractedText = ''
  const userPrompt = req.body?.prompt || ''
  try {
    if (req.file) {
      const buffer = req.file.buffer
      const mime = req.file.mimetype
      if (mime === 'application/pdf' && pdfParse) {
        try {
          const data = await pdfParse(buffer)
          extractedText = (data.text || '').trim()
        } catch (pdfErr) {
          console.warn('pdf-parse failed:', pdfErr.message)
        }
      } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && mammoth) {
        try {
          const result = await mammoth.extractRawText({ buffer })
          extractedText = (result.value || '').trim()
        } catch (docErr) {
          console.warn('mammoth failed:', docErr.message)
        }
      } else if (mime === 'text/plain') {
        extractedText = buffer.toString('utf-8').trim()
      } else {
        extractedText = `[Unsupported file type: ${mime}]`
      }
    }
    const text = req.body?.text || extractedText
    if (!text && !userPrompt) {
      return res.json({ response: buildFallbackText('pdf', 'document'), provider: 'backend', usedFallback: true })
    }
    const systemPrompt = `You are a document analysis expert. Analyze the provided document text and respond to the user's request. If no specific request is given, provide a comprehensive summary including: main topics, key findings, important data points, and suggested actions. Be concise but thorough.`
    const result = await providerManager.chat({ prompt: userPrompt || 'Summarize this document', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Document text:\n\n${text}\n\n${userPrompt ? `Request: ${userPrompt}` : 'Please summarize this document.'}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, text: text.slice(0, 5000), tokens: result.tokens, time: Date.now() - startTime })
  } catch (error) {
    console.error('PDF error:', error)
    res.status(500).json({ error: 'PDF service unavailable', response: buildFallbackText('pdf', userPrompt), provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/translate', async (req, res) => {
  const text = req.body?.text || ''
  const target = req.body?.target || 'Spanish'
  const source = req.body?.source || 'auto'
  const context = req.body?.context || 'general'
  const systemPrompt = `You are a professional translator. Translate the following text to ${target}. Context: ${context}. Preserve the original meaning, tone, and formatting. Only return the translated text, without explanations or notes. If the text contains code or special formatting, preserve it exactly.`
  try {
    const result = await providerManager.chat({ prompt: text, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, target, source, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Translate error:', error)
    res.status(500).json({ error: 'Translation service unavailable', response: buildFallbackText('translate', text), provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/vision', async (req, res) => {
  const prompt = req.body?.prompt || 'Describe this image in detail'
  const image = req.body?.image || ''
  const systemPrompt = `You are an expert image analyst. Analyze the provided image and answer the user's question. Describe visual elements, text, objects, people, scenes, colors, and context in detail. If the user asks a specific question, focus on answering it accurately.`
  try {
    const result = await providerManager.chat({ prompt: image ? `${prompt}\n\nImage data (base64 or URL): ${image.slice(0, 10000)}` : prompt, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Vision error:', error)
    res.status(500).json({ error: 'Vision service unavailable', response: 'Image analysis is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/ocr', async (req, res) => {
  const image = req.body?.image || ''
  const language = req.body?.language || 'eng'
  try {
    if (Tesseract && image) {
      const { data: { text } } = await Tesseract.recognize(image, language)
      return res.json({ response: text.trim(), provider: 'tesseract', usedFallback: false, language })
    }
    const systemPrompt = `You are an OCR text extraction expert. Extract all visible text from the provided image data. Return only the extracted text, preserving line breaks and formatting as much as possible. If no text is visible, return "No text detected in image."`
    const result = await providerManager.chat({ prompt: image ? `Extract text from this image: ${image.slice(0, 10000)}` : 'No image provided', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: 'Extract all text from this image.' }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, language, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('OCR error:', error)
    res.status(500).json({ error: 'OCR service unavailable', response: 'Text extraction is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/grammar', async (req, res) => {
  const text = req.body?.text || ''
  const systemPrompt = `You are a professional grammar and style editor. Analyze the provided text for: grammar errors, spelling mistakes, punctuation issues, awkward phrasing, and style improvements. Return your response in this exact format:

## Grammar Check Results

### Issues Found
- **Error type**: [brief explanation]
- **Suggestion**: [corrected version]

### Corrected Text
[the full corrected text]

### Improvements
- [list of style and clarity improvements]

If no errors are found, say "No significant grammar or spelling errors detected." and provide 2-3 optional style improvements.`
  try {
    const result = await providerManager.chat({ prompt: text, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Check the grammar and style of this text:\n\n${text}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Grammar error:', error)
    res.status(500).json({ error: 'Grammar service unavailable', response: 'Grammar checking is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/email', async (req, res) => {
  const context = req.body?.context || ''
  const recipient = req.body?.recipient || ''
  const tone = req.body?.tone || 'professional'
  const purpose = req.body?.purpose || 'general'
  const keyPoints = req.body?.keyPoints || ''
  const systemPrompt = `You are an expert email writer. Write a professional, polished email based on the following context. Tone: ${tone}. Purpose: ${purpose}.${recipient ? ` Recipient: ${recipient}.` : ''}${keyPoints ? ` Key points to include: ${keyPoints}` : ''}

Structure the email with:
- Clear subject line
- Appropriate greeting
- Well-structured body with clear paragraphs
- Professional closing
- Signature placeholder

Keep it concise and actionable. Use proper email formatting.`
  try {
    const result = await providerManager.chat({ prompt: context, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Write an email with the following context:\n${context}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: 'Email service unavailable', response: 'Email generation is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/resume', async (req, res) => {
  const section = req.body?.section || 'full'
  const experience = req.body?.experience || ''
  const skills = req.body?.skills || ''
  const education = req.body?.education || ''
  const targetRole = req.body?.targetRole || ''
  const systemPrompt = `You are an expert resume writer and career coach. Generate a polished, ATS-friendly resume section based on the provided information.${targetRole ? ` Target role: ${targetRole}.` : ''}

For the "${section}" section:
- Use strong action verbs
- Quantify achievements where possible
- Keep bullet points concise and impactful
- Use industry-standard keywords
- Format as clean markdown

If generating a full resume, structure it with: Contact, Summary, Experience, Education, Skills sections.`
  try {
    const prompt = `Generate resume ${section} section.\n\nExperience:\n${experience}\n\nSkills:\n${skills}\n\nEducation:\n${education}`
    const result = await providerManager.chat({ prompt, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, section, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Resume error:', error)
    res.status(500).json({ error: 'Resume service unavailable', response: 'Resume generation is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/sql', async (req, res) => {
  const schema = req.body?.schema || ''
  const query = req.body?.query || ''
  const dbType = req.body?.dbType || 'generic SQL'
  const systemPrompt = `You are an expert SQL developer. Generate optimized, production-ready ${dbType} queries based on the provided schema and requirements. Include:
- Proper JOINs and WHERE clauses
- Index recommendations where helpful
- Comments explaining complex logic
- Parameterized queries where applicable
- Both the query and a brief explanation

Never include sensitive data patterns. If the request is ambiguous, ask clarifying questions in comments.`
  try {
    const result = await providerManager.chat({ prompt: query, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Schema:\n${schema}\n\nRequest: ${query || 'Generate sample queries for this schema'}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, dbType, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('SQL error:', error)
    res.status(500).json({ error: 'SQL service unavailable', response: 'SQL generation is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/regex', async (req, res) => {
  const description = req.body?.description || ''
  const examples = req.body?.examples || ''
  const language = req.body?.language || 'javascript'
  const systemPrompt = `You are a regex expert. Generate accurate regular expressions based on natural language descriptions. Provide:
1. The regex pattern
2. A brief explanation of how it works
3. Example matches
4. Common pitfalls to avoid
5. A test snippet in ${language}

Use standard regex syntax compatible with ${language}. If multiple valid patterns exist, provide the most efficient one.`
  try {
    const result = await providerManager.chat({ prompt: description, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Generate a regex for: ${description}\n\nExamples: ${examples}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, language, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Regex error:', error)
    res.status(500).json({ error: 'Regex service unavailable', response: 'Regex generation is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/json', async (req, res) => {
  const input = req.body?.input || ''
  const action = req.body?.action || 'format'
  const result = { response: '', provider: 'backend', usedFallback: false }
  try {
    if (action === 'validate' || action === 'format' || action === 'prettify') {
      try {
        const parsed = JSON.parse(input)
        result.response = action === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
        result.usedFallback = false
      } catch (parseError) {
        result.response = `JSON Parse Error: ${parseError.message}\n\nPlease check your JSON syntax. Common issues:\n- Trailing commas\n- Missing quotes around keys\n- Single quotes instead of double quotes\n- Unescaped characters in strings`
        result.usedFallback = true
      }
    } else if (action === 'minify') {
      try {
        const parsed = JSON.parse(input)
        result.response = JSON.stringify(parsed)
        result.usedFallback = false
      } catch (parseError) {
        result.response = `JSON Parse Error: ${parseError.message}`
        result.usedFallback = true
      }
    } else if (action === 'analyze') {
      try {
        const parsed = JSON.parse(input)
        const keys = Object.keys(parsed)
        const size = new Blob([input]).size
        const analysis = {
          valid: true,
          size: `${(size / 1024).toFixed(2)} KB`,
          keys: keys.length,
          type: Array.isArray(parsed) ? 'array' : typeof parsed === 'object' ? 'object' : typeof parsed,
          depth: JSON.stringify(parsed).split('\n').length,
          sampleKeys: keys.slice(0, 10)
        }
        result.response = JSON.stringify(analysis, null, 2)
        result.usedFallback = false
      } catch (parseError) {
        result.response = `JSON Parse Error: ${parseError.message}`
        result.usedFallback = true
      }
    } else {
      result.response = JSON.stringify(JSON.parse(input), null, 2)
      result.usedFallback = false
    }
    res.json(result)
  } catch (error) {
    console.error('JSON error:', error)
    res.status(500).json({ error: 'JSON service unavailable', response: 'JSON processing is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/debug', async (req, res) => {
  const code = req.body?.code || ''
  const error = req.body?.error || ''
  const language = req.body?.language || 'javascript'
  const systemPrompt = `You are an expert debugger. Analyze the provided code and error message. Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Fixed code with explanations
4. Prevention strategies
5. Related edge cases to consider

Be specific and practical. Show the exact changes needed.`
  try {
    const result = await providerManager.chat({ prompt: code, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Debug this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nError message:\n${error || 'No error message provided'}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, language, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ error: 'Debug service unavailable', response: 'Debugging is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/explain', async (req, res) => {
  const code = req.body?.code || ''
  const language = req.body?.language || 'javascript'
  const detailLevel = req.body?.detailLevel || 'medium'
  const systemPrompt = `You are an expert code instructor. Explain the provided ${language} code line-by-line or section-by-section. Detail level: ${detailLevel}. Include:
1. Overall purpose and flow
2. Line-by-line or section explanations
3. Key concepts and patterns used
4. Input/output behavior
5. Time and space complexity where relevant

Use clear, educational language. Format with code blocks and bullet points.`
  try {
    const result = await providerManager.chat({ prompt: code, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Explain this ${language} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\`` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, language, detailLevel, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Explain error:', error)
    res.status(500).json({ error: 'Explain service unavailable', response: 'Code explanation is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/optimize', async (req, res) => {
  const code = req.body?.code || ''
  const language = req.body?.language || 'javascript'
  const goals = req.body?.goals || 'performance, readability, maintainability'
  const systemPrompt = `You are an expert code optimizer. Analyze and optimize the provided ${language} code. Focus on: ${goals}. Provide:
1. Performance improvements (time/space complexity)
2. Readability enhancements
3. Modern syntax / idiomatic patterns
4. Best practice violations and fixes
5. The optimized code with comments explaining changes

Show before/after comparisons where helpful.`
  try {
    const result = await providerManager.chat({ prompt: code, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Optimize this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nGoals: ${goals}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, language, goals, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Optimize error:', error)
    res.status(500).json({ error: 'Optimize service unavailable', response: 'Code optimization is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
})

app.post('/api/document-analyze', async (req, res) => {
  const text = req.body?.text || ''
  const prompt = req.body?.prompt || ''
  const analysisType = req.body?.analysisType || 'comprehensive'
  const systemPrompt = `You are a document analysis expert. Perform a ${analysisType} analysis of the provided document text. Include:
1. Executive summary
2. Key themes and topics
3. Important entities (people, places, organizations, dates)
4. Sentiment and tone analysis
5. Key data points and statistics
6. Action items or recommendations
7. Risk factors or concerns (if any)

Format with clear headings and bullet points. Be objective and thorough.`
  try {
    const result = await providerManager.chat({ prompt: prompt || 'Analyze this document', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Document text:\n\n${text}\n\n${prompt ? `Specific request: ${prompt}` : 'Please provide a comprehensive analysis.'}` }] })
    res.json({ response: result.text, provider: result.provider, usedFallback: result.usedFallback, analysisType, tokens: result.tokens, time: result.time })
  } catch (error) {
    console.error('Document analyze error:', error)
    res.status(500).json({ error: 'Document analysis unavailable', response: 'Document analysis is currently unavailable. Please try again later.', provider: 'fallback', usedFallback: true })
  }
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

app.use((error, req, res, _next) => {
  console.error(error)
  if (res.headersSent) return
  const isStream = req.headers.accept?.includes('text/event-stream')
  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.write(`data: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`)
    res.write('data: [DONE]\n\n')
    return res.end()
  }
  res.status(500).json({ error: 'Internal server error' })
})

export async function startServer(port = Number(process.env.PORT || 4000)) {
  if (IS_PRODUCTION) {
    try {
      await connectMongo()
      console.log('MongoDB connection established')
    } catch (error) {
      console.error('Failed to connect to MongoDB on startup:', error.message)
      process.exit(1)
    }
  }
  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Aditya AI API listening on port ${port}`)
      resolve(server)
    })
  })
}

export async function stopMemoryServer() {
  if (mongoMemoryServer) {
    try {
      await mongoMemoryServer.stop()
      mongoMemoryServer = null
      MongoMemoryServer = null
    } catch (error) {
      console.warn('Failed to stop memory server:', error.message)
    }
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  try {
    if (mongoClient) {
      await mongoClient.close()
      console.log('MongoDB connection closed')
    }
  } catch (error) {
    console.error('Error during SIGTERM shutdown:', error)
  } finally {
    process.exit(0)
  }
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  try {
    if (mongoClient) {
      await mongoClient.close()
      console.log('MongoDB connection closed')
    }
  } catch (error) {
    console.error('Error during SIGINT shutdown:', error)
  } finally {
    process.exit(0)
  }
})

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
}

export default app
