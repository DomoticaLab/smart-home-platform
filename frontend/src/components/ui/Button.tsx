import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-navy text-text-primary border border-navy hover:bg-navy/90 hover:border-navy/80 active:bg-navy/80',
  secondary:
    'bg-transparent text-navy border border-navy hover:bg-navy/10 active:bg-navy/20',
  ghost:
    'bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-card active:bg-bg-card/80',
  danger:
    'bg-red text-text-primary border border-red hover:bg-red/90 hover:border-red/80 active:bg-red/80'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2'
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'secondary' ? 'navy' : 'current'} />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  )
}