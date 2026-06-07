import type { Prisma, PrismaClient } from '@prisma/client'
import { createPrismaClient } from '../lib/prisma'
import { MARGIN_BUNDLE } from '../lib/constants'
import type { BundleDetail, BundleWithItems } from '../types/bundle.types'
import type { BundleFilters } from '../schemas/bundles.schema'

// Resultado del cálculo de costo de un bundle, expuesto por el repositorio.
// La capa de servicio lo enriquece con la mano de obra.
export interface BundleCostResult {
  equipmentCost: number
  suggestedPrice: number
  margin: number
}

// Construye el where de Prisma a partir de los filtros de la capa superior.
// Mantiene el orden lógico de las condiciones para facilitar el debug.
function buildWhere(filters: BundleFilters): Prisma.BundleWhereInput {
  const where: Prisma.BundleWhereInput = {}

  if (filters.tier) {
    where.tier = filters.tier
  }
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  return where
}

// Include compartido para listados: items + producto (con brand y supplier preferido).
const bundleItemsInclude = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          supplierLinks: {
            where: { isPreferredSupplier: true },
            include: { supplier: true }
          }
        }
      }
    }
  }
} as const

// Include completo para detalle y pricing: items + producto con todas sus relaciones.
const bundleDetailInclude = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          categoryLinks: { include: { category: true } },
          protocolLinks: { include: { protocol: true } },
          capabilityLinks: { include: { capability: true } },
          ecosystemCompatibilities: { include: { ecosystem: true } },
          installationLinks: { include: { requirement: true } },
          infrastructureLinks: { include: { infrastructureRequirement: true } },
          supplierLinks: { include: { supplier: true } },
          hubLinks: { include: { hub: true } }
        }
      }
    }
  }
} as const

export interface FindAllBundlesOptions {
  skip?: number
  take?: number
  orderBy?: Prisma.BundleOrderByWithRelationInput
}

export class BundlesRepository {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? createPrismaClient()
  }

  // Lista bundles aplicando filtros y, opcionalmente, paginación a nivel DB.
  async findAll(
    filters: BundleFilters = {},
    options: FindAllBundlesOptions = {}
  ): Promise<BundleWithItems[]> {
    const where = buildWhere(filters)

    return this.prisma.bundle.findMany({
      where,
      include: bundleItemsInclude,
      orderBy: options.orderBy ?? { name: 'asc' },
      skip: options.skip,
      take: options.take
    })
  }

  // Devuelve el detalle completo de un bundle por slug, o null si no existe.
  async findBySlug(slug: string): Promise<BundleDetail | null> {
    return this.prisma.bundle.findUnique({
      where: { slug },
      include: bundleDetailInclude
    })
  }

  // Recupera varios bundles por id con las relaciones usadas en listados.
  async findByIds(ids: string[]): Promise<BundleWithItems[]> {
    if (ids.length === 0) {
      return []
    }

    return this.prisma.bundle.findMany({
      where: { id: { in: ids } },
      include: bundleItemsInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Cuenta total de bundles que cumplen los filtros (para paginación).
  async countByFilters(filters: BundleFilters = {}): Promise<number> {
    const where = buildWhere(filters)
    return this.prisma.bundle.count({ where })
  }

  // Calcula el costo de equipos de un bundle a partir de los precios de los
  // suppliers preferidos. El precio de venta sugerido aplica el margen definido
  // en constants (MARGIN_BUNDLE) sobre el costo de equipos.
  // Lanza un error si el bundle no existe — el caller debe manejar 404.
  async calculateBundleCost(bundleId: string): Promise<BundleCostResult> {
    // Trae los items con su producto y los suppliers preferidos.
    // Usamos el include de detalle para reusar la query ya validada.
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplierLinks: {
                  where: { isPreferredSupplier: true }
                }
              }
            }
          }
        }
      }
    })

    if (!bundle) {
      throw new Error(`Bundle con id "${bundleId}" no encontrado`)
    }

    // Suma item.quantity × preferredPrice (mínimo del supplier preferido).
    // Si el item no tiene supplier preferido o no tiene precio, se ignora.
    let equipmentCost = 0
    for (const item of bundle.items) {
      const preferred = item.product.supplierLinks
      if (preferred.length === 0) {
        continue
      }
      const prices = preferred
        .map((link) => link.price)
        .filter((p): p is Prisma.Decimal => p !== null)
        .map((p) => p.toNumber())
        .filter((n) => Number.isFinite(n) && n >= 0)
      if (prices.length === 0) {
        continue
      }
      const bestPrice = Math.min(...prices)
      equipmentCost += bestPrice * item.quantity
    }

    // Aplica el margen comercial del bundle (definido en constants).
    const suggestedPrice = Number((equipmentCost * (1 + MARGIN_BUNDLE)).toFixed(2))

    return {
      equipmentCost: Number(equipmentCost.toFixed(2)),
      suggestedPrice,
      margin: MARGIN_BUNDLE
    }
  }
}
