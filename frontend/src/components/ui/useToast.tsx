import { createContext, useCallback, useContext, useState, useRef } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

const MAX_TOASTS = 3
const TOAST_DURATION = 4000

let toastCounter = 0
function nextId() {
  return `toast-${++toastCounter}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId()
      setToasts((prev) => {
        const updated = [...prev, { id, type, message }]
        return updated.slice(-MAX_TOASTS)
      })
      const timer = setTimeout(() => removeToast(id), TOAST_DURATION)
      timersRef.current.set(id, timer)
    },
    [removeToast]
  )

  const toast = {
    success: useCallback((message: string) => addToast('success', message), [addToast]),
    error: useCallback((message: string) => addToast('error', message), [addToast]),
    warning: useCallback((message: string) => addToast('warning', message), [addToast]),
    info: useCallback((message: string) => addToast('info', message), [addToast])
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

// --- ToastContainer (rendered inside provider, fixed bottom-right) ---

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle2; classes: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-green/40 bg-green/10 text-green'
  },
  error: {
    icon: XCircle,
    classes: 'border-red/40 bg-red/10 text-red'
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-gold/40 bg-gold/10 text-gold'
  },
  info: {
    icon: Info,
    classes: 'border-navy/40 bg-navy/10 text-navy'
  }
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((t) => {
        const { icon: Icon, classes } = typeConfig[t.type]
        return (
          <div
            key={t.id}
            className={[
              'flex min-w-[280px] max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-xl',
              'animate-toast-in backdrop-blur-sm',
              classes
            ].join(' ')}
            role="alert"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium text-text-primary">{t.message}</p>
            <button
              onClick={() => onRemove(t.id)}
              className="flex-shrink-0 text-text-secondary transition-colors hover:text-text-primary"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-toast-in {
          animation: toast-in 250ms ease-out;
        }
      `}</style>
    </div>
  )
}

export type { Toast, ToastType }