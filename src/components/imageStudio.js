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

export async function downloadImage(url, filename = 'infinityai-image') {
  try {
    let href = url
    let ext = 'png'
    if (typeof url === 'string' && url.startsWith('data:image/svg')) ext = 'svg'
    else if (typeof url === 'string' && url.startsWith('data:image/')) ext = url.slice(11, url.indexOf(';')) || 'png'
    if (typeof url === 'string' && !url.startsWith('data:')) {
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
    if (typeof url === 'string' && !url.startsWith('data:')) URL.revokeObjectURL(href)
    return true
  } catch {
    return false
  }
}