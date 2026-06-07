import type { CSSProperties } from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerColor = 'current' | 'navy' | 'gold' | 'green' | 'red' | 'white'

interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  className?: string
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 14,
  md: 20,
  lg: 28
}

const colorMap: Record<SpinnerColor, string> = {
  current: 'currentColor',
  navy: '#1A3A5C',
  gold: '#C9A96E',
  green: '#2D7A4F',
  red: '#B03030',
  white: '#E6EDF3'
}

export function Spinner({ size = 'md', color = 'current', className = '' }: SpinnerProps) {
  const px = sizeMap[size]
  const strokeColor = colorMap[color]

  const style: CSSProperties = {
    width: px,
    height: px,
    color: strokeColor
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-label="Cargando"
      role="status"
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 0.75s linear infinite; transform-origin: center; }
      `}</style>
      <circle
        className="spin"
        cx="12"
        cy="12"
        r="10"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="0"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  )
}