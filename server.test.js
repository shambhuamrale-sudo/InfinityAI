import assert from 'node:assert/strict'
import test from 'node:test'
import { startServer } from './server.js'

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
