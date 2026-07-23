import { motion } from 'framer-motion'
import { useState } from 'react'
import { Wand2, Layers, Square } from 'lucide-react'
import { EDIT_OPERATIONS } from '../imageStudio'
import GlassPanel from '../GlassPanel'
import GenerationStatus from './GenerationStatus'
import ExamplePrompts from './ExamplePrompts'

export default function WorkspacePanel({
  preview,
  statusText,
  generating,
  progress,
  provider,
  model,
  elapsed,
  onCancel,
  onEdit,
  onOpenViewer,
  images,
  setPrompt,
  onGenerate,
}) {
  const [activeOperation, setActiveOperation] = useState(null)

  const handleEdit = async (operation) => {
    setActiveOperation(operation)
    await onEdit(operation, images[0])
    setActiveOperation(null)
  }

  const hasImages = images.length > 0

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      {/* Generation Status */}
      <GenerationStatus
        generating={generating}
        progress={progress}
        provider={provider}
        model={model}
        statusText={statusText}
        onCancel={onCancel}
        elapsed={elapsed}
      />

      {/* Preview */}
      <GlassPanel className="flex-1 flex flex-col p-4 min-h-[400px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Studio preview</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Latest render</h2>
          </div>
          <div className={`rounded-full border px-3 py-1 text-sm transition-all duration-300 ${generating ? 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200 shadow-[0_0_12px_rgba(129,140,248,0.15)]' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]'}`}>
            {generating ? 'Working…' : 'Ready'}
          </div>
        </div>

        <div className="mt-4 flex-1 rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-fuchsia-500/10 p-4 relative overflow-hidden">
          {preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full min-h-[20rem] items-center justify-center rounded-[1rem] border border-white/10 bg-[#07101f]/70 p-3"
            >
              <img
                src={preview}
                alt="Latest render"
                className="max-h-[26rem] w-auto rounded-xl object-contain"
              />
            </motion.div>
          ) : hasImages ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full min-h-[20rem] items-center justify-center rounded-[1rem] border border-white/10 bg-[#07101f]/70 p-3"
            >
              <img
                src={images[0].images?.[0]?.url}
                alt={images[0].prompt}
                className="max-h-[26rem] w-auto rounded-xl object-contain transition-transform duration-300 hover:scale-[1.02] cursor-zoom-in"
                onClick={() => onOpenViewer(images, 0)}
              />
            </motion.div>
          ) : (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center p-6">
              <ExamplePrompts onSelect={(p) => { setPrompt(p); onGenerate(p) }} />
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Editing */}
      {hasImages && (
        <GlassPanel className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="h-4 w-4 text-indigo-300" /> AI Editing
          </p>
          <p className="text-xs text-slate-400">Applies to your most recent image.</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {EDIT_OPERATIONS.map((op) => (
              <button
                key={op.id}
                onClick={() => handleEdit(op.id)}
                disabled={!hasImages || generating || activeOperation === op.id}
                className="flex flex-col items-start rounded-xl border border-white/8 bg-white/[0.03] p-3.5 text-left transition-all duration-200 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {op.id === 'image-to-image' && <Wand2 className="h-3.5 w-3.5 text-indigo-300" />}
                  {op.id === 'background-removal' && <span className="text-xs">🪄</span>}
                  {op.id === 'upscale' && <span className="text-xs">🔍</span>}
                  {op.id === 'face-restoration' && <span className="text-xs">✨</span>}
                  {op.id === 'inpaint' && <span className="text-xs">🖌️</span>}
                  {op.id === 'outpaint' && <span className="text-xs">🖼️</span>}
                  {op.id === 'crop-resize' && <Square className="h-3.5 w-3.5 text-fuchsia-300" />}
                  {op.label}
                </span>
                <span className="mt-1 text-xs text-slate-400">{op.description}</span>
              </button>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
