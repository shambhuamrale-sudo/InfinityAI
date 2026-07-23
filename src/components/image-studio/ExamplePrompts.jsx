import { motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'

const EXAMPLE_PROMPTS = [
  { category: 'Fantasy', emoji: '🧙', label: 'Fantasy landscape', prompt: 'Epic fantasy landscape with floating islands, mystical waterfalls, ancient ruins, golden hour lighting, ultra detailed, 8k' },
  { category: 'Branding', emoji: '🎨', label: 'Modern logo', prompt: 'Minimal modern logo, geometric shapes, gradient purple to pink, clean vector style, professional branding' },
  { category: 'Portrait', emoji: '👤', label: 'Cinematic portrait', prompt: 'Cinematic portrait, dramatic lighting, shallow depth of field, film grain, golden hour, sharp focus on eyes, 35mm lens' },
  { category: 'Anime', emoji: '🌸', label: 'Anime scene', prompt: 'Anime style cityscape at night, cherry blossoms, neon lights, detailed background, studio ghibli inspired, vibrant colors' },
  { category: 'Pixel Art', emoji: '👾', label: 'Pixel art scene', prompt: 'Pixel art game scene, retro 16-bit style, vibrant colors, detailed sprites, 320x240 resolution, nostalgic' },
  { category: 'Photoreal', emoji: '📷', label: 'Realistic product', prompt: 'Professional product photography, studio lighting, white background, macro lens, hyperrealistic, 8k, commercial shot' },
  { category: 'Architecture', emoji: '🏛️', label: 'Architecture render', prompt: 'Modern architecture exterior, glass and steel, sunset reflection, 3D render, octane, architectural photography' },
  { category: 'Abstract', emoji: '🎭', label: 'Abstract art', prompt: 'Abstract digital art, fluid shapes, bold colors, geometric patterns, contemporary art, high contrast, artistic' },
]

export default function ExamplePrompts({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex h-full flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_8px_32px_-8px_rgba(129,140,248,0.3)]"
      >
        <Wand2 className="h-7 w-7" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-2xl font-semibold text-white tracking-tight"
      >
        Create your first masterpiece
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed"
      >
        Start with one of these example prompts, or describe your own vision below.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 grid grid-cols-2 gap-3 w-full max-w-2xl"
      >
        {EXAMPLE_PROMPTS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect?.(item.prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]"
          >
            <span className="text-xl transition-transform duration-200 group-hover:scale-110 mt-0.5">{item.emoji}</span>
            <div>
              <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors">{item.label}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.prompt}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}
