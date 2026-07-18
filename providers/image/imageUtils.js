/**
 * Shared helpers for image-generation provider adapters.
 */

/**
 * Fetch with a timeout so a hung provider cannot stall a request.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} [timeoutMs]
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Deterministic 32-bit hash for a string (used to seed the local renderer). */
export function hashString(str) {
  let h = 2166136261
  const s = String(str || '')
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Small seeded PRNG (mulberry32) for reproducible local renders. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTES = [
  ['#6366f1', '#a855f7', '#ec4899'],
  ['#0ea5e9', '#6366f1', '#8b5cf6'],
  ['#10b981', '#0ea5e9', '#6366f1'],
  ['#f59e0b', '#ef4444', '#ec4899'],
  ['#14b8a6', '#22d3ee', '#818cf8'],
  ['#f43f5e', '#8b5cf6', '#3b82f6']
]

/**
 * Render a deterministic, prompt-derived abstract SVG and return it as a data
 * URL. This is the "always works" local generator: no network, no GPU, no key.
 * The output is reproducible for a given prompt+seed so the seed control and
 * "regenerate" behave meaningfully offline.
 *
 * @param {object} params
 * @param {string} params.prompt
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {number} [params.seed]
 * @param {string} [params.label] short label to overlay (e.g. "Upscaled")
 * @returns {{ url: string, seed: number, width: number, height: number }}
 */
export function renderPlaceholderImage({ prompt, width = 768, height = 768, seed, label } = {}) {
  const resolvedSeed = Number.isFinite(seed) ? seed >>> 0 : hashString(prompt) >>> 0
  const rand = mulberry32(resolvedSeed)
  const palette = PALETTES[resolvedSeed % PALETTES.length]
  const [c1, c2, c3] = palette

  const shapes = []
  const shapeCount = 5 + Math.floor(rand() * 6)
  for (let i = 0; i < shapeCount; i += 1) {
    const cx = Math.floor(rand() * width)
    const cy = Math.floor(rand() * height)
    const r = Math.floor((0.1 + rand() * 0.35) * Math.min(width, height))
    const fill = [c1, c2, c3][Math.floor(rand() * 3)]
    const opacity = (0.15 + rand() * 0.35).toFixed(2)
    if (rand() > 0.5) {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" />`)
    } else {
      const w = r * (0.6 + rand())
      const h = r * (0.6 + rand())
      const rot = Math.floor(rand() * 360)
      shapes.push(
        `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="${Math.floor(r * 0.2)}" fill="${fill}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})" />`
      )
    }
  }

  const promptText = String(prompt || 'InfinityAI concept').slice(0, 64)
  const escaped = promptText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const badge = label
    ? `<g><rect x="24" y="24" width="${18 + label.length * 9}" height="34" rx="17" fill="rgba(255,255,255,0.14)" /><text x="42" y="46" font-family="system-ui,sans-serif" font-size="16" fill="#ffffff" font-weight="600">${label}</text></g>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="${(Math.min(width, height) * 0.03).toFixed(1)}" /></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="#0a0c14" />
  <rect width="${width}" height="${height}" fill="url(#bg)" opacity="0.35" />
  <g filter="url(#blur)">${shapes.join('')}</g>
  <rect width="${width}" height="${height}" fill="url(#bg)" opacity="0.08" />
  ${badge}
  <text x="${width / 2}" y="${height - 40}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(14, Math.floor(width * 0.028))}" fill="rgba(255,255,255,0.92)" font-weight="600">${escaped}</text>
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.5)" letter-spacing="3">INFINITYAI · SEED ${resolvedSeed}</text>
</svg>`

  const url = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`
  return { url, seed: resolvedSeed, width, height }
}

/** Curated word banks for the random prompt generator. */
const RANDOM_SUBJECTS = [
  'a lone astronaut', 'a neon city street', 'an ancient forest temple', 'a crystalline dragon',
  'a floating island', 'a cyberpunk samurai', 'a serene mountain lake', 'a retro space station',
  'a bioluminescent jellyfish', 'a majestic phoenix', 'an abandoned lighthouse', 'a futuristic race car'
]
const RANDOM_STYLES = [
  'cinematic lighting', 'watercolor painting', 'hyper-realistic 3D render', 'studio product photography',
  'anime concept art', 'oil painting', 'low-poly illustration', 'vaporwave aesthetic',
  'dramatic chiaroscuro', 'soft pastel palette', 'volumetric fog', 'golden hour glow'
]
const RANDOM_DETAILS = [
  'ultra detailed', '8k resolution', 'shallow depth of field', 'intricate textures',
  'symmetrical composition', 'moody atmosphere', 'vibrant colors', 'sharp focus',
  'award-winning', 'trending on artstation', 'macro detail', 'wide-angle lens'
]

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)]
}

/** Generate a random, well-structured image prompt. */
export function buildRandomPrompt(seed) {
  const rand = mulberry32(Number.isFinite(seed) ? seed >>> 0 : (Date.now() >>> 0))
  const details = new Set()
  const detailCount = 2 + Math.floor(rand() * 2)
  while (details.size < detailCount) details.add(pick(RANDOM_DETAILS, rand))
  return `${pick(RANDOM_SUBJECTS, rand)}, ${pick(RANDOM_STYLES, rand)}, ${[...details].join(', ')}`
}
