import { z } from 'zod'
import { RecommendedTier } from '@prisma/client'

// Helper: convierte el string recibido en query string a booleano.
// Devuelve undefined para entradas vacías/ausentes para encadenar con .optional().
// Acepta 'true'/'false' (case-insensitive) o el booleano nativo si ya viene tipado.
const booleanFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (value === true || value === false) return value
  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return value
}, z.boolean({ message: 'Expected boolean (true|false)' }).optional())

// Filtros de bundle expuestos por el endpoint GET /api/bundles.
// Cada campo es opcional; los strings vacíos se transforman a undefined.
export const BundleFiltersSchema = z.object({
  tier: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(RecommendedTier).optional()
  ),
  isActive: booleanFromQuery
})

// Query completa: filtros + paginación con valores por defecto seguros.
export const GetBundlesQuerySchema = BundleFiltersSchema.extend({
  page: z.preprocess(
    (value) => (value === '' || value === undefined ? 1 : Number(value)),
    z.number().int().min(1, 'page debe ser >= 1').default(1)
  ),
  limit: z.preprocess(
    (value) => (value === '' || value === undefined ? 20 : Number(value)),
    z.number().int().min(1, 'limit debe ser >= 1').max(100, 'limit máximo 100').default(20)
  )
})

// Tipos inferidos que la capa de servicio consume.
export type BundleFilters = z.infer<typeof BundleFiltersSchema>
export type GetBundlesQuery = z.infer<typeof GetBundlesQuerySchema>
