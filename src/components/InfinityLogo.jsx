export default function InfinityLogo({ size = 40, className = '', glow = true }) {
  const id = `infinity-${size}${glow ? '-g' : ''}`
  const stroke = `url(#${id}-stroke)`
  const glowRef = `url(#${id}-glow)`
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
        <linearGradient id={`${id}-stroke`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        {glow ? (
          <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}
      </defs>

      <circle cx="24" cy="24" r="20" stroke={stroke} strokeOpacity="0.18" strokeWidth="1" />
      <path
        d="M18.5 12C15.5 12 13 14.5 13 17.5C13 20.5 15.5 23 18.5 23C21.5 23 24 20.5 24 17.5C24 20.5 26.5 23 29.5 23C32.5 23 35 20.5 35 17.5C35 14.5 32.5 12 29.5 12C26.5 12 24 14.5 24 17.5C24 14.5 21.5 12 18.5 12Z"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? glowRef : undefined}
      />
      <circle cx="24" cy="17.5" r="2.1" fill="#e9d5ff" filter={glow ? glowRef : undefined} />
    </svg>
  )
}
