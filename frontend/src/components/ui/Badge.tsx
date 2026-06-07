import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green/15 text-green border border-green/30',
  warning: 'bg-gold/15 text-gold border border-gold/30',
  error: 'bg-red/15 text-red border border-red/30',
  info: 'bg-navy/30 text-navy border border-navy/40',
  neutral: 'bg-bg-secondary text-text-secondary border border-border-default'
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] tracking-wide',
  md: 'px-2.5 py-1 text-xs tracking-wider'
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full font-medium uppercase',
        variantClasses[variant],
        sizeClasses[size],
        className
      ].join(' ')}
    >
      {children}
    </span>
  )
}