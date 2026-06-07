import type { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface TableHeadProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

interface TableCellProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-border-default ${className}`}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return <thead className={`border-b border-border-default bg-bg-secondary ${className}`}>{children}</thead>
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return <tbody className={`divide-y divide-border-default ${className}`}>{children}</tbody>
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={[
        'bg-bg-card transition-colors duration-150',
        'hover:bg-bg-secondary',
        onClick && 'cursor-pointer',
        className
      ].join(' ')}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '', align = 'left' }: TableHeadProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align]

  return (
    <th
      className={[
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary',
        alignClass,
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className = '', align = 'left' }: TableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align]

  return (
    <td className={['px-4 py-3 text-text-primary', alignClass, className].join(' ')}>
      {children}
    </td>
  )
}