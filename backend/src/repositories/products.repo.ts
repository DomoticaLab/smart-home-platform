import type { Prisma } from '@prisma/client'
import { ProductType, RecommendedTier, type CapabilityCode } from '@prisma/client'
import { prisma } from '../lib/prisma'
import type { ProductFilters } from '../types/product.types'
import type { CatalogSummary } from '../services/products.service'

// Tipo producto + relaciones usadas en listados (findAll, findByIds).
// Se exporta para que la capa de servicio y controladores no dupliquen el shape.
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    brand: true
    protocolLinks: {
      include: { protocol: true }
    }
    capabilityLinks: {
      include: { capability: true }
    }
    supplierLinks: {
      where: { isPreferredSupplier: true }
      include: { supplier: true }
    }
  }
}>

// Tipo producto + todas las relaciones (usado en detalle).
export type ProductDetail = Prisma.ProductGetPayload<{
  include: {
    brand: true
    categoryLinks: {
      include: { category: true }
    }
    protocolLinks: {
      include: { protocol: true }
    }
    capabilityLinks: {
      include: { capability: true }
    }
    ecosystemCompatibilities: {
      include: { ecosystem: true }
    }
    installationLinks: {
      include: { requirement: true }
    }
    infrastructureLinks: {
      include: { infrastructureRequirement: true }
    }
    supplierLinks: {
      include: { supplier: true }
    }
    hubLinks: {
      include: { hub: true }
    }
    automationLinks: {
      include: { automation: true }
    }
    sceneLinks: {
      include: { scene: true }
    }
  }
}>

// Orden de los protocolLinks: el primary primero.
const protocolLinksInclude = {
  protocol: true
} as const

// Include compartido por los listados y los endpoints especializados.
// Mantenerlo en un único lugar garantiza que los métodos de consulta
// (findAll, findByIds y los nuevos findByProtocol/Tier/Capability/Hub)
// devuelvan exactamente el mismo shape ProductWithRelations.
const productListInclude = {
  brand: true,
  protocolLinks: {
    include: protocolLinksInclude,
    orderBy: { isPrimary: 'desc' }
  },
  capabilityLinks: {
    include: { capability: true }
  },
  supplierLinks: {
    where: { isPreferredSupplier: true },
    include: { supplier: true }
  }
} as const

// Construye el where de Prisma a partir de los filtros de la capa superior.
// Mantiene el orden lógico de las condiciones para facilitar el debug.
function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {}

  if (filters.productType) {
    where.productType = filters.productType
  }
  if (filters.tier) {
    where.recommendedTier = filters.tier
  }
  if (filters.localControl !== undefined) {
    where.localControl = filters.localControl
  }
  if (filters.brandSlug) {
    where.brand = { slug: filters.brandSlug }
  }
  if (filters.protocolSlug) {
    where.protocolLinks = {
      some: { protocol: { slug: filters.protocolSlug } }
    }
  }
  if (filters.capabilityCode) {
    where.capabilityLinks = {
      some: { capability: { code: filters.capabilityCode } }
    }
  }
  if (filters.inStock === true) {
    // Productos con al menos un supplier con stock IN_STOCK o LOW_STOCK.
    where.supplierLinks = {
      some: {
        stockStatus: { in: ['IN_STOCK', 'LOW_STOCK'] }
      }
    }
  }

  return where
}

export interface FindAllOptions {
  skip?: number
  take?: number
  orderBy?: Prisma.ProductOrderByWithRelationInput
}

export class ProductsRepository {
  // Lista productos aplicando filtros y, opcionalmente, paginación a nivel DB.
  async findAll(
    filters: ProductFilters = {},
    options: FindAllOptions = {}
  ): Promise<ProductWithRelations[]> {
    const where = buildWhere(filters)

    return prisma.product.findMany({
      where,
      include: productListInclude,
      orderBy: options.orderBy ?? { name: 'asc' },
      skip: options.skip,
      take: options.take
    })
  }

  // Devuelve el detalle completo de un producto por slug, o null si no existe.
  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        categoryLinks: { include: { category: true } },
        protocolLinks: {
          include: { protocol: true },
          orderBy: { isPrimary: 'desc' }
        },
        capabilityLinks: { include: { capability: true } },
        ecosystemCompatibilities: { include: { ecosystem: true } },
        installationLinks: { include: { requirement: true } },
        infrastructureLinks: { include: { infrastructureRequirement: true } },
        supplierLinks: { include: { supplier: true } },
        hubLinks: { include: { hub: true } },
        automationLinks: { include: { automation: true } },
        sceneLinks: { include: { scene: true } }
      }
    })
  }

  // Recupera varios productos por id con las relaciones usadas en listados.
  async findByIds(ids: string[]): Promise<ProductWithRelations[]> {
    if (ids.length === 0) {
      return []
    }

    return prisma.product.findMany({
      where: { id: { in: ids } },
      include: productListInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Cuenta total de productos que cumplen los filtros (para paginación).
  async countByFilters(filters: ProductFilters = {}): Promise<number> {
    const where = buildWhere(filters)
    return prisma.product.count({ where })
  }

  // Productos cuyo protocolo primario coincide con el slug dado.
  // "Primario" = ProductProtocol con isPrimary = true.
  async findByProtocol(
    protocolSlug: string
  ): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: {
        protocolLinks: {
          some: {
            isPrimary: true,
            protocol: { slug: protocolSlug }
          }
        }
      },
      include: productListInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Productos cuyo recommendedTier coincide con el valor entregado.
  async findByTier(
    tier: RecommendedTier
  ): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: { recommendedTier: tier },
      include: productListInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Productos que tienen al menos una capability con el code entregado.
  async findByCapability(
    code: CapabilityCode
  ): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: {
        capabilityLinks: {
          some: { capability: { code } }
        }
      },
      include: productListInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Devuelve el id del hub que coincide con el slug, o null si no existe.
  // Se separa de findByHubSlug para que la capa de servicio pueda
  // distinguir "hub inexistente" (NotFoundException) de "hub sin productos".
  async findHubBySlug(slug: string): Promise<{ id: string } | null> {
    return prisma.hubGateway.findUnique({
      where: { slug },
      select: { id: true }
    })
  }

  // Productos que están vinculados al hub indicado por slug.
  // Se resuelve la relación ProductHubGateway en una sola query
  // (no requiere un paso previo de fetch del hub).
  async findByHubSlug(hubSlug: string): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: {
        hubLinks: {
          some: { hub: { slug: hubSlug } }
        }
      },
      include: productListInclude,
      orderBy: { name: 'asc' }
    })
  }

  // Resumen agregado del catálogo: total, desglose por tipo/tier y
  // cantidad de productos con stock disponible. Las 4 consultas se
  // ejecutan en paralelo porque son independientes.
  async getCatalogSummary(): Promise<CatalogSummary> {
    const [total, typeGroups, tierGroups, inStock] = await Promise.all([
      prisma.product.count(),
      prisma.product.groupBy({
        by: ['productType'],
        _count: { _all: true }
      }),
      prisma.product.groupBy({
        by: ['recommendedTier'],
        _count: { _all: true }
      }),
      prisma.product.count({
        where: {
          supplierLinks: {
            some: { stockStatus: { in: ['IN_STOCK', 'LOW_STOCK'] } }
          }
        }
      })
    ])

    // Inicializar los records con ceros para garantizar que la respuesta
    // contenga SIEMPRE todas las claves del enum, incluso cuando un bucket
    // está vacío en la base de datos.
    const byType = Object.values(ProductType).reduce<Record<ProductType, number>>(
      (acc, type) => {
        acc[type] = 0
        return acc
      },
      {} as Record<ProductType, number>
    )
    for (const row of typeGroups) {
      byType[row.productType] = row._count._all
    }

    const byTier = Object.values(RecommendedTier).reduce<Record<RecommendedTier, number>>(
      (acc, tier) => {
        acc[tier] = 0
        return acc
      },
      {} as Record<RecommendedTier, number>
    )
    for (const row of tierGroups) {
      byTier[row.recommendedTier] = row._count._all
    }

    return { total, byType, byTier, inStock }
  }
}
