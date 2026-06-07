// Tipos compartidos por las capas de bundles.
// - BundleFilters y GetBundlesQuery: re-exportados desde el schema de Zod
//   para tener una única definición canónica.
// - BundleWithItems y BundleDetail: exportados desde el repositorio
//   (cercanía al Prisma include que les da forma).
// - BundlePriceBreakdown vive aquí porque es un contrato entre servicio y HTTP.

import type { Prisma } from '@prisma/client'
import type { RecommendedTier } from '@prisma/client'

// Re-export del tipo canónico de filtros (Zod-inferred) para que el resto del
// codebase importe siempre desde este punto y no se produzcan duplicaciones.
export type { BundleFilters, GetBundlesQuery } from '../schemas/bundles.schema'

// Re-export de PaginatedResponse para que la capa de bundles no tenga que
// importar desde product.types.ts.
export type { PaginatedResponse } from './product.types'

// Tipo bundle + items + producto (con brand y supplier preferido) — usado en
// listados. Es la proyección mínima para mostrar un bundle y calcular su precio.
export type BundleWithItems = Prisma.BundleGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            brand: true
            supplierLinks: {
              where: { isPreferredSupplier: true }
              include: { supplier: true }
            }
          }
        }
      }
    }
  }
}>

// Tipo bundle con todas las relaciones (usado en detalle y pricing).
export type BundleDetail = Prisma.BundleGetPayload<{
  include: {
    items: {
      include: {
        product: {
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
          }
        }
      }
    }
  }
}>

// Desglose de precio que devuelve BundlesService.getBundlePrice.
// equipmentCost = suma de costo proveedor preferido de cada item × quantity.
// equipmentSalePrice = equipmentCost × (1 + marginPct).
// laborEstimate = (electricianDays × dailyRate + baseConfig) × (1 + laborMargin).
// total = equipmentSalePrice + laborEstimate.
export interface BundlePriceBreakdown {
  bundleId: string
  bundleSlug: string
  deviceCount: number
  electricianDays: number
  equipmentCost: number
  equipmentSalePrice: number
  laborEstimate: number
  total: number
  marginPct: number
  tier: RecommendedTier
}
