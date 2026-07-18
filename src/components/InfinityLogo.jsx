export default function InfinityLogo({ size = 40, className = '', glow = true, mono = false }) {
  const gradId = `inf-grad-${size}-${glow ? 'g' : 'n'}`
  const glowId = `inf-glow-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="InfinityAI logo"
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc" />
          <stop offset="0.5" stopColor="#c084fc" />
          <stop offset="1" stopColor="#f0abfc" />
        </linearGradient>
        {glow ? (
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}
      </defs>

      <path
        d="M14 30C10.7 30 8 27.6 8 24.8C8 22 10.7 19.6 14 19.6C17.3 19.6 20 22 24 24C28 26.8 30.7 24.4 34 24.4C37.3 24.4 40 21.9 40 19.2C40 16.4 37.3 14 34 14C30.7 14 28 16.4 24 18.4C20 20.4 17.3 18 14 18C10.7 18 8 20.4 8 23.2"
        stroke={mono ? 'currentColor' : `url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#${glowId})` : undefined}
      />
    </svg>
  )
}
