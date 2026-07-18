import { useEffect, useRef } from 'react'

export default function OtpInput({ value, onChange, length = 6, disabled = false }) {
  const inputsRef = useRef([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index, event) => {
    const val = event.target.value.replace(/[^0-9]/g, '').slice(-1)
    const next = value.split('')
    next[index] = val
    const newValue = next.join('')
    onChange(newValue)
    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const paste = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    onChange(paste)
    const focusIndex = Math.min(paste.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="h-14 w-12 rounded-2xl border border-white/10 bg-white/[0.04] text-center text-xl font-semibold text-white outline-none transition focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-50"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
