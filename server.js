import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dns from 'node:dns'
import net from 'node:net'
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
import nodemailer from 'nodemailer'
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
app.use('/api/', (req, res, next) => {
  if (req.method === 'GET') return next()
  return limiter(req, res, next)
})

const authLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false })
const forgotPasswordLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false })

const EMAIL_FROM = process.env.EMAIL_FROM || 'InfinityAI <noreply@infinityai.app>'
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
if ((!SMTP_USER || !SMTP_PASS) && IS_PRODUCTION) {
  console.error('SMTP_USER and SMTP_PASS are required in production.')
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
  const { passwordHash: _passwordHash, emailOtp: _emailOtp, emailOtpExpiry: _emailOtpExpiry, resetOtp: _resetOtp, resetOtpExpiry: _resetOtpExpiry, resetOtpAttempts: _resetOtpAttempts, emailOtpSentAt: _emailOtpSentAt, resetOtpSentAt: _resetOtpSentAt, ...safe } = user
  return safe
}


console.log('SMTP startup config:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  NODE_ENV: process.env.NODE_ENV,
  SMTP_PASS: process.env.SMTP_PASS ? '***masked***' : undefined
})

;(async () => {
  try {
    const dnsResult = await dns.lookup(process.env.SMTP_HOST)
    console.log('DNS lookup result:', dnsResult)
  } catch (err) {
    console.error('DNS lookup error:', err)
  }

  const tcpHost = process.env.SMTP_HOST
  const tcpPort = Number(process.env.SMTP_PORT)
  const socket = net.createConnection({ host: tcpHost, port: tcpPort })
  const tcpTimeout = setTimeout(() => {
    console.error('Connection timeout')
    socket.destroy()
  }, 30000)
  socket.once('connect', () => {
    clearTimeout(tcpTimeout)
    console.log('Connected successfully')
    socket.end()
  })
  socket.once('error', (err) => {
    clearTimeout(tcpTimeout)
    if (err.code === 'ECONNREFUSED') {
      console.error('ECONNREFUSED')
    } else if (err.code === 'ENOTFOUND') {
      console.error('ENOTFOUND')
    } else {
      console.error('Socket error:', err)
    }
  })
})()

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000
})

const EmailService = {
  async send(to, subject, html) {
    if (!SMTP_USER || !SMTP_PASS) throw new Error('SMTP_USER and SMTP_PASS are not configured')
    console.log("EMAIL_FROM:", EMAIL_FROM)
    console.log("EMAIL_TO:", to)
    try {
      await emailTransporter.verify()
      console.log("SMTP Connected Successfully")
    } catch (err) {
      console.error("SMTP verification failed:", err)
      throw err
    }
    try {
      const info = await emailTransporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html
      })
      console.log("Email sent:", info.messageId)
      return info
    } catch (err) {
      console.error("SMTP send error:", err)
      throw err
    }
  },

  async sendVerificationOtp(email, otp) {
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #6366f1; margin-bottom: 1rem;">Verify your email</h2>
        <p style="color: #374151; line-height: 1.6;">Use the following OTP to verify your InfinityAI account. This code expires in 10 minutes.</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
          <span style="font-size: 2rem; font-weight: bold; letter-spacing: 0.5rem; color: #111827;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `
    await this.send(email, 'Verify your InfinityAI email', html)
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
    if (user.isVerified === false) return null
    return sanitizeUser(user)
  } catch {
    return null
  }
}

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-\[\]{};':"\\|,.<>/?])(?!.*\s).{8,}$/
const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().regex(STRONG_PASSWORD_REGEX, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character') })
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
  const emailOtp = generateOtp()
  const emailOtpExpiry = getOtpExpiry(10)
  const user = { name, email, passwordHash, role: 'user', avatar: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), plan: 'free-trial', location: '', company: '', isVerified: false, emailOtp, emailOtpExpiry, createdAt: now, updatedAt: now }
  const result = await usersCollection.insertOne(user)
  user._id = result.insertedId
  const safe = sanitizeUser(user)
  res.status(201).json({ user: safe })
  try {
    await EmailService.sendVerificationOtp(email, emailOtp)
  } catch (error) {
    console.error("Failed to send verification email")
    console.error(error)
  }
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  const { email, password } = parsed.data
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })
  if (user.isVerified === false) {
    return res.status(403).json({ message: 'Please verify your email first.', resendOtp: true, email: user.email })
  }
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

app.post('/api/auth/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid request' })
  if (!user.resetOtp || !user.resetOtpExpiry) return res.status(400).json({ error: 'No OTP requested' })
  if (new Date(user.resetOtpExpiry) < new Date()) return res.status(400).json({ error: 'OTP has expired' })
  if (user.resetOtp !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' })
  res.json({ ok: true, message: 'OTP verified successfully' })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, password } = req.body || {}
  if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid request' })
  if (!user.resetOtp || !user.resetOtpExpiry) return res.status(400).json({ error: 'No OTP requested' })
  if (new Date(user.resetOtpExpiry) < new Date()) return res.status(400).json({ error: 'OTP has expired' })
  if (user.resetOtp !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' })
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { passwordHash }, $unset: { resetOtp: '', resetOtpExpiry: '', resetOtpAttempts: '' } }
  )
  res.json({ ok: true, message: 'Password reset successfully' })
})

app.post('/api/auth/verify-email', async (req, res) => {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid request' })
  if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' })
  if (!user.emailOtp || !user.emailOtpExpiry) return res.status(400).json({ error: 'No OTP requested' })
  if (new Date(user.emailOtpExpiry) < new Date()) return res.status(400).json({ error: 'OTP has expired' })
  if (user.emailOtp !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' })
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { isVerified: true }, $unset: { emailOtp: '', emailOtpExpiry: '', emailOtpSentAt: '' } }
  )
  const verifiedUser = { ...user, isVerified: true }
  const token = signToken(verifiedUser)
  res.cookie('token', token, sessionCookieOptions)
  const safe = sanitizeUser(verifiedUser)
  res.json({ ok: true, message: 'Email verified successfully', user: safe, token })
})

app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email is required' })
  const db = await connectMongo()
  if (!db || !usersCollection) return res.status(500).json({ error: 'Database unavailable' })
  const user = await usersCollection.findOne({ email })
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' })
  const sixtySecondsAgo = Date.now() - 60 * 1000
  if (user.emailOtpSentAt && new Date(user.emailOtpSentAt).getTime() > sixtySecondsAgo) {
    const remaining = Math.ceil((new Date(user.emailOtpSentAt).getTime() + 60 * 1000 - Date.now()) / 1000)
    return res.status(429).json({ error: `Please wait ${remaining} seconds before resending` })
  }
  const otp = generateOtp()
  const otpExpiry = getOtpExpiry(10)
  const now = new Date().toISOString()
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { emailOtp: otp, emailOtpExpiry: otpExpiry, emailOtpSentAt: now } }
  )
  try {
    await EmailService.sendVerificationOtp(email, otp)
  } catch (error) {
    console.error("Failed to send verification email")
    console.error(error)
  }
  res.json({ ok: true, message: 'OTP sent successfully' })
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
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : undefined
  const state = await loadState()
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
    return res.end()
  }
  const result = await providerManager.chat({ provider, prompt, model, messages })
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
app.post('/api/image', async (req, res) => {
  const state = await loadState()
  const provider = req.body?.provider || state.adminConfig.providerConfig?.imageProvider || imageProviderManager.defaultProviderId
  const params = sanitizeImageParams(req.body)
  const result = await imageProviderManager.generate({ provider, ...params })
  // Keep a human-readable `text` field for legacy consumers.
  if (!result.text) result.text = `Generated image for: ${params.prompt || 'your prompt'}`
  res.json(result)
})

// Image editing operations: image-to-image, upscale, background removal, face
// restoration, inpainting, outpainting, crop/resize.
app.post('/api/image/edit', async (req, res) => {
  const state = await loadState()
  const provider = req.body?.provider || state.adminConfig.providerConfig?.imageProvider || imageProviderManager.defaultProviderId
  const validOps = ['image-to-image', 'inpaint', 'outpaint', 'upscale', 'background-removal', 'face-restoration', 'crop-resize']
  const operation = validOps.includes(req.body?.operation) ? req.body.operation : 'image-to-image'
  const params = sanitizeImageParams(req.body)
  const image = typeof req.body?.image === 'string' ? req.body.image : undefined
  const denoisingStrength = Number.isFinite(Number(req.body?.denoisingStrength)) ? Number(req.body.denoisingStrength) : 0.6
  const result = await imageProviderManager.edit({ provider, operation, image, denoisingStrength, ...params })
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

export async function verifyUserByEmail(email) {
  const db = await connectMongo()
  if (!db || !usersCollection) return null
  const user = await usersCollection.findOne({ email })
  if (!user) return null
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { isVerified: true }, $unset: { emailOtp: '', emailOtpExpiry: '', emailOtpSentAt: '' } }
  )
  return user
}

export async function getUserByEmail(email) {
  const db = await connectMongo()
  if (!db || !usersCollection) return null
  return usersCollection.findOne({ email })
}

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

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  if (mongoClient) {
    await mongoClient.close()
    console.log('MongoDB connection closed')
  }
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  if (mongoClient) {
    await mongoClient.close()
    console.log('MongoDB connection closed')
  }
  process.exit(0)
})

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer().catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
}

export default app
