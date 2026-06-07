import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
}

export function Select({
  label,
  error,
  options,
  className = '',
  id,
  value,
  onChange,
  disabled,
  required
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {required && <span className="ml-1 text-red">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={[
          'w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red/60 focus:ring-red/30'
            : 'border-border-default hover:border-text-secondary/40',
          'appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat cursor-pointer',
          className
        ].join(' ')}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`
        }}
      >
        <option value="" disabled>
          Seleccionar...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  )
}