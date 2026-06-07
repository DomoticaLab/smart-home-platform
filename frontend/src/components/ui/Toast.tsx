// Re-exporta todo desde useToast.ts para mantener compatibilidad
// con el nombre de archivo esperado por la especificación.
export {
  ToastProvider,
  useToast,
  ToastContainer,
  type Toast,
  type ToastType,
  type ToastContextValue
} from './useToast'