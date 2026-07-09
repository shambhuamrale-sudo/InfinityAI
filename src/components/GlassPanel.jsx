export default function GlassPanel({ children, className = '', hover = false }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/8' : ''} ${className}`}>
      {children}
    </div>
  )
}
