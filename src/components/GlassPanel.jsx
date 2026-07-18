export default function GlassPanel({ children, className = '', hover = false, soft = false }) {
  return (
    <div className={`${soft ? 'glass-soft' : 'glass'} rounded-[1.75rem] ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]' : ''} ${className}`}>
      {children}
    </div>
  )
}
