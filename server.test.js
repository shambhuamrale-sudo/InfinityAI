import assert from 'node:assert/strict'
import test from 'node:test'
import { startServer, verifyUserByEmail } from './server.js'

test('health endpoint returns ok', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.ok, true)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('signup creates a user and returns a token', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@aditya.ai', password: 'password123' })
    })
    assert.equal(response.status, 201)
    const body = await response.json()
    assert.ok(body.token)
    assert.equal(body.user.email, 'test@aditya.ai')
    assert.equal(body.user.role, 'user')
    assert.equal(body.user.isVerified, false)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('login returns token for valid credentials', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Login User', email: 'login@aditya.ai', password: 'password123' })
    })
    await verifyUserByEmail('login@aditya.ai')
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@aditya.ai', password: 'password123' })
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.ok(body.token)
    assert.equal(body.user.email, 'login@aditya.ai')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('rejects duplicate signup', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dup', email: 'dup@aditya.ai', password: 'password123' })
    })
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dup2', email: 'dup@aditya.ai', password: 'password123' })
    })
    assert.equal(response.status, 409)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('admin config is protected', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trialDays: 5 })
    })
    assert.equal(response.status, 403)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('/api/image generates a local image (backward compatible)', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a neon city', provider: 'local' })
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.ok(Array.isArray(body.images) && body.images.length >= 1, 'images array present')
    assert.ok(body.images[0].url.startsWith('data:image/svg'), 'image is a data URL')
    assert.equal(typeof body.text, 'string', 'legacy text field preserved')
    assert.equal(body.provider, 'local')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('/api/image defaults to the local provider when none is given', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a calm lake' })
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.provider, 'local')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('/api/image/edit returns a preview for placeholder providers', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/api/image/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'upscale', prompt: 'refine', provider: 'local', width: 512, height: 512 })
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.ok(Array.isArray(body.images) && body.images.length === 1)
    assert.equal(body.operation, 'upscale')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('image provider discovery endpoints respond', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    const base = `http://127.0.0.1:${address.port}`
    for (const path of ['/api/image/providers', '/api/image/providers/models', '/api/image/providers/availability', '/api/image/providers/capabilities']) {
      const res = await fetch(`${base}${path}`)
      assert.equal(res.status, 200, `${path} should return 200`)
      const data = await res.json()
      assert.ok(data.providers || data.availability || data.capabilities, `${path} returns data`)
    }
    const rp = await fetch(`${base}/api/image/random-prompt`)
    assert.equal(rp.status, 200)
    const rpBody = await rp.json()
    assert.equal(typeof rpBody.prompt, 'string')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('forgot password sends OTP for existing email', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'FP User', email: 'fp@aditya.ai', password: 'password123' })
    })
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fp@aditya.ai' })
    })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.ok, true)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('verify email activates account', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'VE User', email: 've@aditya.ai', password: 'password123' })
    })
    await verifyUserByEmail('ve@aditya.ai')
    const loginRes = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 've@aditya.ai', password: 'password123' })
    })
    assert.equal(loginRes.status, 200)
    const body = await loginRes.json()
    assert.ok(body.token)
    assert.equal(body.user.email, 've@aditya.ai')
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})

test('resend otp returns cooldown error when called too quickly', async () => {
  const server = await startServer(0)
  try {
    const address = server.address()
    await fetch(`http://127.0.0.1:${address.port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'RO User', email: 'ro@aditya.ai', password: 'password123' })
    })
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ro@aditya.ai' })
    })
    assert.equal(response.status, 200)
    const response2 = await fetch(`http://127.0.0.1:${address.port}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ro@aditya.ai' })
    })
    assert.equal(response2.status, 429)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
})
