// Shared constants and helpers for the Image Studio UI.

export const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', width: 768, height: 768 },
  { id: '4:3', label: 'Standard', width: 896, height: 672 },
  { id: '3:4', label: 'Portrait', width: 672, height: 896 },
  { id: '16:9', label: 'Wide', width: 1024, height: 576 },
  { id: '9:16', label: 'Story', width: 576, height: 1024 },
  { id: '3:2', label: 'Photo', width: 960, height: 640 }
]

export const RESOLUTIONS = [
  { id: 'sd', label: 'SD · 512', scale: 512 },
  { id: 'hd', label: 'HD · 768', scale: 768 },
  { id: 'fhd', label: 'Full HD · 1024', scale: 1024 }
]

export const PRESET_STYLES = [
  { id: 'none', label: 'None', suffix: '' },
  { id: 'cinematic', label: 'Cinematic', suffix: ', cinematic lighting, dramatic composition, film still, 35mm' },
  { id: 'photoreal', label: 'Photorealistic', suffix: ', ultra realistic, 8k, sharp focus, professional photography' },
  { id: 'anime', label: 'Anime', suffix: ', anime style, vibrant colors, detailed line art, studio quality' },
  { id: 'digital-art', label: 'Digital Art', suffix: ', digital painting, concept art, trending on artstation, intricate detail' },
  { id: '3d', label: '3D Render', suffix: ', 3d render, octane render, volumetric lighting, ray tracing' },
  { id: 'watercolor', label: 'Watercolor', suffix: ', watercolor painting, soft edges, pastel palette, artistic' },
  { id: 'minimal', label: 'Minimal', suffix: ', minimalist, clean composition, negative space, elegant' }
]

export const EDIT_OPERATIONS = [
  { id: 'image-to-image', label: 'Image to Image', description: 'Transform an image with a new prompt' },
  { id: 'background-removal', label: 'Remove Background', description: 'Cut out the subject cleanly' },
  { id: 'upscale', label: 'Upscale 2x', description: 'Increase resolution and detail' },
  { id: 'face-restoration', label: 'Face Restoration', description: 'Enhance and repair faces' },
  { id: 'inpaint', label: 'Inpainting', description: 'Repaint a masked region' },
  { id: 'outpaint', label: 'Outpainting', description: 'Extend the canvas outward' },
  { id: 'crop-resize', label: 'Crop & Resize', description: 'Reframe and resize the image' }
]

export const PRESET_PROMPTS = [
  'Cinematic product mockup on a marble surface, soft studio light',
  'Futuristic interface hero, holographic UI, deep blue palette',
  'Editorial AI portrait, dramatic rim lighting, shallow depth of field',
  'Cozy isometric workspace, warm tones, tiny plants, 3d render'
]

/**
 * Curated model presets surfaced in the Studio's model selector. The `provider`
 * must match a registered ImageProviderManager id. These are defaults — the
 * live catalog (loaded from /api/image/providers/models) takes precedence.
 */
export const MODEL_PRESETS = [
  { id: 'flux', label: 'FLUX', provider: 'flux', models: [
    { id: 'black-forest-labs/flux-dev', name: 'FLUX.1 Dev' },
    { id: 'black-forest-labs/flux-schnell', name: 'FLUX.1 Schnell' },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro' }
  ] },
  { id: 'sdxl', label: 'SDXL', provider: 'sdxl', models: [
    { id: 'stability-ai/sdxl', name: 'SDXL 1.0' },
    { id: 'stability-ai/sdxl-lightning', name: 'SDXL Lightning' }
  ] },
  { id: 'sd35', label: 'SD 3.5', provider: 'sd35', models: [
    { id: 'sd3.5-large', name: 'SD 3.5 Large' },
    { id: 'sd3.5-large-turbo', name: 'SD 3.5 Large Turbo' },
    { id: 'sd3.5-medium', name: 'SD 3.5 Medium' }
  ] },
  { id: 'juggernaut-xl', label: 'Juggernaut', provider: 'juggernaut-xl', models: [
    { id: 'rundiffusion/juggernaut-xl-v9', name: 'Juggernaut XL v9' }
  ] },
  { id: 'dreamshaper-xl', label: 'DreamShaper', provider: 'dreamshaper-xl', models: [
    { id: 'lucataco/dreamshaper-xl', name: 'DreamShaper XL' },
    { id: 'lucataco/dreamshaper-xl-turbo', name: 'DreamShaper XL Turbo' }
  ] },
  { id: 'realistic-vision', label: 'Realistic', provider: 'realistic-vision', models: [
    { id: 'lucataco/realistic-vision-v5', name: 'Realistic Vision v5' }
  ] },
  { id: 'playground-v2', label: 'Playground', provider: 'playground-v2', models: [
    { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5' }
  ] },
  { id: 'stability', label: 'Stability', provider: 'stability', models: [
    { id: 'sd3.5-large', name: 'SD 3.5 Large' },
    { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0' },
    { id: 'stable-image-ultra', name: 'Stable Image Ultra' }
  ] },
  { id: 'openai-image', label: 'OpenAI', provider: 'openai-image', models: [
    { id: 'gpt-image-1', name: 'GPT Image 1' },
    { id: 'dall-e-3', name: 'DALL·E 3' }
  ] },
  { id: 'huggingface', label: 'Hugging Face', provider: 'huggingface', models: [
    { id: 'black-forest-labs/FLUX.1-dev', name: 'FLUX.1 Dev' },
    { id: 'stabilityai/stable-diffusion-3.5-large', name: 'SD 3.5 Large' }
  ] }
]

export const DOWNLOAD_FORMATS = [
  { id: 'png', label: 'PNG', mime: 'image/png', ext: 'png' },
  { id: 'jpg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
  { id: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp' }
]

/** Flatten all preset models into { provider, id, name } entries. */
export function flattenModelPresets() {
  const out = []
  for (const group of MODEL_PRESETS) {
    for (const m of group.models) out.push({ provider: group.provider, id: m.id, name: m.name })
  }
  return out
}

/** Convert an image (data URL or blob URL) to the requested download format. */
export async function convertImageFormat(url, format = 'png', filename = 'infinityai-image') {
  try {
    // Decode the source into a canvas (works for raster + SVG data URLs).
    const img = new Image()
    const loaded = new Promise((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode-failed'))
      img.src = url
    })
    await loaded
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 512
    canvas.height = img.naturalHeight || 512
    const ctx = canvas.getContext('2d')
    if (format === 'jpg') ctx.fillStyle = '#ffffff'
    if (format === 'jpg') ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const fmt = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, fmt, 0.92))
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${filename.replace(/[^a-z0-9-_]/gi, '_').slice(0, 60)}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(href), 1000)
    return true
  } catch {
    return downloadImage(url, filename)
  }
}

/** Trigger a browser download for an image URL (data URL or remote). */
export async function downloadImage(url, filename = 'infinityai-image') {
  try {
    let href = url
    let ext = 'png'
    if (url.startsWith('data:image/svg')) ext = 'svg'
    else if (url.startsWith('data:image/')) ext = url.slice(11, url.indexOf(';')) || 'png'
    if (!url.startsWith('data:')) {
      const res = await fetch(url)
      const blob = await res.blob()
      href = URL.createObjectURL(blob)
    }
    const a = document.createElement('a')
    a.href = href
    a.download = `${filename.replace(/[^a-z0-9-_]/gi, '_').slice(0, 60)}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    if (!url.startsWith('data:')) URL.revokeObjectURL(href)
    return true
  } catch {
    return false
  }
}
