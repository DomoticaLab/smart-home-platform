import type { ReactNode } from 'react'

type CardPadding = 'sm' | 'md' | 'lg'
type CardVariant = 'default' | 'elevated'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: CardPadding
  hover?: boolean
  variant?: CardVariant
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

const variantClasses: Record<CardVariant, string> = {
  default: 'shadow-md shadow-black/10',
  elevated: 'shadow-xl shadow-black/20'
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  variant = 'default'
}: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border-default bg-bg-card text-text-primary',
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'transition-all duration-200 hover:border-gold/30 hover:shadow-lg hover:shadow-black/20',
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}