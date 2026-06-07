import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {rest.required && <span className="ml-1 text-red">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
          'placeholder:text-text-secondary/60',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red/60 focus:ring-red/30'
            : 'border-border-default hover:border-text-secondary/40',
          className
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-red">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  )
}