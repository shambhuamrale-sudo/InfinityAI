import { motion } from 'framer-motion'
import { ImagePlus, Search, Download, Copy, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import EmptyState from '../components/EmptyState'
import LazyImage from '../components/LazyImage'
import { downloadImage } from '../components/imageStudio'
import { useAppContext } from '../context/useAppContext'

export default function ImageHistoryPage() {
  const { images, toggleImageFavorite, addToast } = useAppContext()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return images
    return images.filter((image) =>
      (image.prompt || '').toLowerCase().includes(q) ||
      (image.result || '').toLowerCase().includes(q) ||
      (image.tags || []).some((t) => t.toLowerCase().includes(q))
    )
  }, [images, query])

  const handleDownload = async (image) => {
    const url = image.images?.[0]?.url
    if (!url) return
    const ok = await downloadImage(url, image.prompt || 'infinityai')
    addToast(ok ? { kind: 'success', title: 'Downloaded', message: 'Image saved to your device.' } : { kind: 'error', title: 'Download failed', message: 'Could not download the image.' })
  }

  const handleCopy = async (image) => {
    await navigator.clipboard.writeText(image.prompt || '').catch(() => {})
    addToast({ kind: 'success', title: 'Prompt copied', message: 'The prompt is on your clipboard.' })
  }

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Image History</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Gallery-ready concept history.</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition focus-within:border-indigo-400/40">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search images"
              placeholder="Search prompts or tags"
              className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-52"
            />
          </div>
        </motion.header>

        <GlassPanel className="mt-6 p-5">
          {filtered.length ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {filtered.map((image, i) => (
                <motion.div key={image.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="group mb-4 break-inside-avoid overflow-hidden rounded-[1.15rem] border border-white/8 bg-white/[0.03] transition hover:bg-white/[0.06]">
                  {image.images?.[0]?.url ? (
                    <div className="relative">
                      <LazyImage src={image.images[0].url} alt={image.prompt} className="w-full" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconBtn label="Download" onClick={() => handleDownload(image)}><Download className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Copy prompt" onClick={() => handleCopy(image)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn label="Favorite" active={image.favorite} onClick={() => toggleImageFavorite(image.id)}><Star className="h-3.5 w-3.5" /></IconBtn>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4"><ImagePlus className="h-4 w-4 text-indigo-300" /><p className="font-semibold text-white">{image.prompt}</p></div>
                  )}
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-medium text-white">{image.prompt}</p>
                    {image.result ? <p className="mt-1 line-clamp-2 text-xs text-slate-400">{image.result}</p> : null}
                    {image.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {image.tags.map((t) => <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-slate-300">#{t}</span>)}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : images.length ? (
            <EmptyState icon={Search} title="No matches found" description="Try a different keyword to find the concept you're looking for." />
          ) : (
            <EmptyState icon={ImagePlus} title="No image history yet" description="Generate a concept in the Image Studio and it will appear here for review and reuse." />
          )}
        </GlassPanel>
      </div>
    </div>
  )
}

function IconBtn({ children, label, onClick, active }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`grid h-7 w-7 place-items-center rounded-full border border-white/15 backdrop-blur transition hover:scale-105 ${active ? 'bg-amber-400/30 text-amber-200' : 'bg-white/10 text-white hover:bg-white/20'}`}>
      {children}
    </button>
  )
}
