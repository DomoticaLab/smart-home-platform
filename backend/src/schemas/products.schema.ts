import { z } from 'zod'
import {
  CapabilityCode,
  ProductType,
  RecommendedTier
} from '@prisma/client'

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

// Filtros de producto expuestos por el endpoint GET /api/products.
// Cada campo es opcional; los strings vacíos se transforman a undefined.
const emptyToUndefined = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional()
)

export const ProductFiltersSchema = z.object({
  productType: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(ProductType).optional()
  ),
  tier: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(RecommendedTier).optional()
  ),
  protocolSlug: emptyToUndefined,
  brandSlug: emptyToUndefined,
  capabilityCode: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(CapabilityCode).optional()
  ),
  localControl: booleanFromQuery,
  inStock: booleanFromQuery
})

// Query completa: filtros + paginación con valores por defecto seguros.
export const GetProductsQuerySchema = ProductFiltersSchema.extend({
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
export type ProductFilters = z.infer<typeof ProductFiltersSchema>
export type GetProductsQuery = z.infer<typeof GetProductsQuerySchema>

// --- Schemas para path params de endpoints especializados ---
// Cada uno valida un segmento de URL contra reglas de dominio concretas.

// Slug de protocolo: sólo se exige que no llegue vacío a la capa de servicio.
export const ProtocolSlugParamSchema = z.string().min(1)

// Slug de hub: no se permite vacío.
export const HubSlugParamSchema = z.string().min(1)

// Tier de catálogo: debe pertenecer al enum RecommendedTier exportado por Prisma.
// z.enum funciona contra el objeto const que Prisma genera.
export const TierParamSchema = z.enum(RecommendedTier)

// Capability code: debe pertenecer al enum CapabilityCode.
export const CapabilityCodeParamSchema = z.enum(CapabilityCode)

// Listas de valores válidos exportadas para que la capa de controladores
// pueda componer mensajes de error 400 sin reimportar @prisma/client.
// Mantener la lista derivada del enum garantiza que no se desincronice.
export const VALID_TIERS: readonly string[] = Object.values(RecommendedTier)
export const VALID_CAPABILITY_CODES: readonly string[] = Object.values(CapabilityCode)
