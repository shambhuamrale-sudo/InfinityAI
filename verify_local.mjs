import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const email = 'local' + Date.now() + '@aditya.ai'
  await page.goto(BASE + '/signup', { waitUntil: 'domcontentloaded', timeout: 20000 }); await sleep(700)
  await page.type('input[placeholder="Full name"]', 'Local User')
  await page.type('input[placeholder="Email address"]', email)
  await page.type('input[placeholder="Password"]', 'password123')
  await Promise.all([
    page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 15000 }),
    page.click('button[type="submit"]')
  ])
  // wait for cinematic intro (~8s) + reveal
  await sleep(10000)
  const path = await page.evaluate(() => location.pathname)
  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText || '')
  const sections = {
    tools: await page.evaluate(() => document.body.innerText.includes('Choose your next move')),
    stats: await page.evaluate(() => document.body.innerText.includes('AI Chats Today')),
    usage: await page.evaluate(() => document.body.innerText.includes('Usage health')),
    activity: await page.evaluate(() => document.body.innerText.includes('Activity timeline')),
    favorites: await page.evaluate(() => document.body.innerText.includes('Favorite tools')),
    analytics: await page.evaluate(() => document.body.innerText.includes('Performance snapshot'))
  }
  console.log('PATH:', path)
  console.log('H1:', JSON.stringify(h1))
  console.log('SECTIONS:', JSON.stringify(sections))
  // ignore expected 401s from logged-out /auth/me probes
  const realConsole = consoleErrors.filter((e) => !/401|favicon|net::ERR/.test(e))
  console.log('REAL CONSOLE ERRORS:', realConsole.length, realConsole.slice(0, 5))
  console.log('PAGE ERRORS:', pageErrors.length, pageErrors.slice(0, 5))
  await browser.close()
  const ok = path === '/dashboard' && h1 === 'Dashboard' && Object.values(sections).every(Boolean) && pageErrors.length === 0 && realConsole.length === 0
  console.log(ok ? 'DASHBOARD LOADS OK' : 'DASHBOARD LOAD FAIL')
  process.exit(ok ? 0 : 1)
}
run().catch((e) => { console.error('ERR', e.message); process.exit(1) })
