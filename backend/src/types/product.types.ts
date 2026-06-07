// Tipos compartidos por las capas de productos.
// - ProductFilters y GetProductsQuery: re-exportados desde el schema de Zod
//   para tener una única definición canónica.
// - ProductWithRelations y ProductDetail: exportados desde el repositorio
//   (cercanía al Prisma include que les da forma).
// - Tipos de soporte de paginación, precio calculado y disponibilidad
//   viven aquí porque son contratos delgados entre servicio y HTTP.

import type {
  CapabilityCode,
  CompatibilityLevel,
  Prisma,
  ProductType,
  RecommendedTier,
  StockStatus
} from '@prisma/client'

// Re-export del tipo canónico de filtros (Zod-inferred) para que el resto del
// codebase importe siempre desde este punto y no se produzcan duplicaciones.
export type { ProductFilters, GetProductsQuery } from '../schemas/products.schema'

// Re-exports desde Prisma para que la capa de servicio no importe Prisma directamente.
export type { ProductType, RecommendedTier, CapabilityCode, StockStatus, CompatibilityLevel }

// Parámetros de paginación enviados desde la capa HTTP.
export interface PaginationParams {
  page: number
  limit: number
}

// Estructura estándar de respuesta paginada.
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Precio calculado por la capa de servicio (margen del 45%).
export interface ComputedPrice {
  amount: number
  currency: string
  marginApplied: number
  basePrice: number
  source: 'preferred' | 'any' | 'unavailable'
}

// Disponibilidad real calculada a partir de los suppliers.
export interface ComputedAvailability {
  inStock: boolean
  preferredSuppliersCount: number
  totalSuppliersCount: number
  bestStockStatus: StockStatus | null
}

// Producto raw de Prisma con solo supplierLinks — usado por los helpers de
// cálculo de precio y disponibilidad que no necesitan las demás relaciones.
export type ProductWithSupplierLinks = Prisma.ProductGetPayload<{
  include: {
    supplierLinks: { include: { supplier: true } }
  }
}>

// Detalle de producto enriquecido por la capa de servicio.
// El shape base es idéntico al ProductDetail del repositorio; se le añaden
// los campos calculados finalPrice y realAvailability.
export type ProductDetailComputed = Prisma.ProductGetPayload<{
  include: {
    brand: true
    categoryLinks: { include: { category: true } }
    protocolLinks: { include: { protocol: true } }
    capabilityLinks: { include: { capability: true } }
    ecosystemCompatibilities: { include: { ecosystem: true } }
    installationLinks: { include: { requirement: true } }
    infrastructureLinks: { include: { infrastructureRequirement: true } }
    supplierLinks: { include: { supplier: true } }
    hubLinks: { include: { hub: true } }
    automationLinks: { include: { automation: true } }
    sceneLinks: { include: { scene: true } }
  }
}>& {
  finalPrice: ComputedPrice
  realAvailability: ComputedAvailability
}
