import { motion } from 'framer-motion'
import { useState } from 'react'
import { Wand2, Sparkles, Dice5, ChevronDown, ChevronUp, Trash2, Square, History } from 'lucide-react'
import { ASPECT_RATIOS, RESOLUTIONS, PRESET_STYLES } from '../imageStudio'
import GlassPanel from '../GlassPanel'

export default function PromptPanel({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  provider,
  setProvider,
  model,
  setModel,
  modelOptions,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  steps,
  setSteps,
  guidanceScale,
  setGuidanceScale,
  seed,
  setSeed,
  batchSize,
  setBatchSize,
  style,
  setStyle,
  generating,
  onGenerate,
  onCancel,
  providers,
  promptHistory,
  onClearPromptHistory,
  onSelectPrompt,
  onRandomPrompt,
  dimensions,
  isOpen
}) {
  const [expanded, setExpanded] = useState({
    prompt: true,
    settings: true,
    history: false
  })

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className={`h-full flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} lg:translate-x-0 lg:opacity-100`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
        {/* Prompt Section */}
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-indigo-300" /> Prompt
            </div>
            <button onClick={onRandomPrompt} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:scale-105 active:scale-95">
              <Dice5 className="h-3.5 w-3.5" /> Random
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                onGenerate()
              }
            }}
            rows={4}
            placeholder="Describe the image you want to create… (Ctrl+Enter to generate)"
            className="mt-3 w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/40 focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)] placeholder:text-slate-500"
          />
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">Negative prompt</label>
          <input
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid (e.g. blurry, low quality, extra fingers)"
            className="mt-1.5 w-full rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/40 focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)] placeholder:text-slate-500"
          />
        </GlassPanel>

        {/* Style Section */}
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('prompt')}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Preset styles</p>
            {expanded.prompt ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
          {expanded.prompt && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
                      style === s.id
                        ? 'border-indigo-400/50 bg-indigo-500/20 text-white shadow-[0_0_12px_rgba(129,140,248,0.2)]'
                        : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </GlassPanel>

        {/* Settings Section */}
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('settings')}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Generation settings</p>
            {expanded.settings ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
          {expanded.settings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/40 focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{!p.implemented ? ' (placeholder)' : ''}</option>
                    ))}
                    {!providers.length && <option value="local">InfinityAI Local Renderer</option>}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/40 focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                  >
                    {modelOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    {!modelOptions.length && <option value="">Default</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Aspect ratio</label>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
                        aspectRatio === r.id
                          ? 'border-indigo-400/50 bg-indigo-500/20 text-white shadow-[0_0_12px_rgba(129,140,248,0.2)]'
                          : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:border-white/15'
                      }`}
                    >
                      <Square className="h-3 w-3" /> {r.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Resolution</label>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setResolution(r.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
                        resolution === r.id
                          ? 'border-indigo-400/50 bg-indigo-500/20 text-white shadow-[0_0_12px_rgba(129,140,248,0.2)]'
                          : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:border-white/15'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                  <span className="self-center text-xs text-slate-500">{dimensions.width}×{dimensions.height}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span>Steps</span>
                    <span className="text-slate-300">{steps}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span>Guidance scale</span>
                    <span className="text-slate-300">{guidanceScale}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">Seed</label>
                  <div className="flex gap-2">
                    <input
                      value={seed}
                      onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Random"
                      className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-400/40 focus:shadow-[0_0_0_3px_rgba(129,140,248,0.1)]"
                    />
                    <button
                      onClick={() => setSeed(String(Math.floor(Math.random() * 1_000_000)))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:scale-105 active:scale-95"
                      aria-label="Random seed"
                    >
                      <Dice5 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span>Batch size</span>
                    <span className="text-slate-300">{batchSize}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                  />
                </div>
              </div>

              <GenerateButton generating={generating} onGenerate={onGenerate} onCancel={onCancel} batchSize={batchSize} />
            </motion.div>
          )}
        </GlassPanel>

        {/* Prompt History */}
        {promptHistory.length > 0 && (
          <GlassPanel className="p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle('history')}>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <History className="h-3.5 w-3.5" /> Prompt history
              </p>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onClearPromptHistory() }} className="text-xs text-slate-500 hover:text-slate-300 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {expanded.history ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </div>
            </div>
            {expanded.history && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
                {promptHistory.slice(0, 10).map((p, i) => (
                  <button
                    key={`${p}_${i}`}
                    onClick={() => onSelectPrompt(p)}
                    className="w-full text-left rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:border-white/15 hover:shadow-sm group truncate"
                  >
                    {p}
                    <History className="inline-block h-3 w-3 ml-2 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                ))}
              </motion.div>
            )}
          </GlassPanel>
        )}
      </div>
    </div>
  )
}

function GenerateButton({ generating, onGenerate, onCancel, batchSize }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={generating ? onCancel : onGenerate}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition-all duration-200 hover:brightness-110 disabled:opacity-60"
    >
      <Wand2 className="h-4 w-4" /> {generating ? 'Generating…' : `Generate${batchSize > 1 ? ` ${batchSize}` : ''}`}
    </motion.button>
  )
}
