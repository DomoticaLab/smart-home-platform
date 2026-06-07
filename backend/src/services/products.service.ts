import { CapabilityCode, Prisma, ProductType, RecommendedTier, StockStatus } from '@prisma/client'
import { ProductsRepository } from '../repositories/products.repo'
import type { ProductWithRelations } from '../repositories/products.repo'
import { BadRequestException, NotFoundException } from '../lib/errors'
import type {
  ComputedAvailability,
  ComputedPrice,
  PaginatedResponse,
  ProductDetailComputed,
  ProductFilters,
  ProductWithSupplierLinks
} from '../types/product.types'

// Resumen agregado del catálogo de productos.
export interface CatalogSummary {
  total: number
  byType: Record<ProductType, number>
  byTier: Record<RecommendedTier, number>
  inStock: number
}

// Margen comercial aplicado sobre el precio base del proveedor.
const PRICE_MARGIN = 0.45

// Orden de preferencia de stock status (mejor -> peor).
const STOCK_PRIORITY: StockStatus[] = [
  StockStatus.IN_STOCK,
  StockStatus.LOW_STOCK,
  StockStatus.BACKORDER,
  StockStatus.OUT_OF_STOCK,
  StockStatus.DISCONTINUED
]

// Convierte un valor Decimal de Prisma (o null) a number de forma segura.
function decimalToNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null
  if (typeof value === 'number') return value
  return value.toNumber()
}

// Devuelve el stock status de mayor prioridad presente en la lista.
function pickBestStockStatus(statuses: StockStatus[]): StockStatus | null {
  for (const candidate of STOCK_PRIORITY) {
    if (statuses.includes(candidate)) {
      return candidate
    }
  }
  return null
}

// Calcula el precio final aplicando margen a la mejor base disponible.
function computeFinalPrice(product: ProductWithSupplierLinks): ComputedPrice {
  const preferred = product.supplierLinks.filter(
    (link) => link.isPreferredSupplier
  )
  const candidates = preferred.length > 0 ? preferred : product.supplierLinks

  const numericPrices: number[] = []
  for (const link of candidates) {
    const value = decimalToNumber(link.price)
    if (value !== null && Number.isFinite(value) && value >= 0) {
      numericPrices.push(value)
    }
  }

  if (numericPrices.length === 0) {
    return {
      amount: 0,
      basePrice: 0,
      currency: 'USD',
      marginApplied: PRICE_MARGIN,
      source: 'unavailable'
    }
  }

  const basePrice = Math.min(...numericPrices)
  const source: ComputedPrice['source'] =
    preferred.length > 0 ? 'preferred' : 'any'

  const currencies = new Set(
    candidates
      .map((link) => link.currency)
      .filter((c): c is string => Boolean(c))
  )
  const currency = currencies.size === 1 ? [...currencies][0]! : 'USD'

  return {
    amount: Number((basePrice * (1 + PRICE_MARGIN)).toFixed(2)),
    basePrice: Number(basePrice.toFixed(2)),
    currency,
    marginApplied: PRICE_MARGIN,
    source
  }
}

// Determina la disponibilidad real agregando el estado de todos los suppliers.
function computeAvailability(product: ProductWithSupplierLinks): ComputedAvailability {
  const statuses = product.supplierLinks.map((link) => link.stockStatus)
  const inStock = statuses.some(
    (s) => s === StockStatus.IN_STOCK || s === StockStatus.LOW_STOCK
  )
  const preferredSuppliersCount = product.supplierLinks.filter(
    (link) => link.isPreferredSupplier
  ).length

  return {
    inStock,
    preferredSuppliersCount,
    totalSuppliersCount: product.supplierLinks.length,
    bestStockStatus: pickBestStockStatus(statuses)
  }
}

export class ProductsService {
  private repo: ProductsRepository

  constructor(repo?: ProductsRepository) {
    this.repo = repo ?? new ProductsRepository()
  }

  // Lista paginada de productos con filtros.
  async getProducts(
    filters: ProductFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<ProductWithRelations>> {
    const page = Math.max(1, Math.floor(pagination.page))
    const limit = Math.max(1, Math.min(100, Math.floor(pagination.limit)))
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.repo.findAll(filters, { skip, take: limit }),
      this.repo.countByFilters(filters)
    ])

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0

    return {
      data: items,
      total,
      page,
      limit,
      totalPages
    }
  }

  // Devuelve el detalle de un producto con precio y disponibilidad calculados.
  async getProductBySlug(slug: string): Promise<ProductDetailComputed> {
    const product = await this.repo.findBySlug(slug)
    if (!product) {
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`)
    }

    return {
      ...product,
      finalPrice: computeFinalPrice(product),
      realAvailability: computeAvailability(product)
    }
  }

  // Productos del mismo productType y recommendedTier, excluyendo el actual.
  async getRelatedProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductWithRelations[]> {
    const [current] = await this.repo.findByIds([productId])
    if (!current) {
      return []
    }

    const related = await this.repo.findAll(
      {
        productType: current.productType,
        tier: current.recommendedTier
      },
      { take: limit + 1 }
    )

    return related.filter((p) => p.id !== productId).slice(0, limit)
  }

  async getByProtocol(protocolSlug: string): Promise<ProductWithRelations[]> {
    return this.repo.findByProtocol(protocolSlug)
  }

  async getByTier(tier: string): Promise<ProductWithRelations[]> {
    if (!this.isValidTier(tier)) {
      throw new BadRequestException(
        'Tier inválido. Valores válidos: ENTRY, STANDARD, PRO, ENTERPRISE'
      )
    }
    return this.repo.findByTier(tier)
  }

  async getByCapability(code: string): Promise<ProductWithRelations[]> {
    if (!this.isValidCapability(code)) {
      throw new BadRequestException(
        `Capability code inválido. Valores válidos: ${this.validCapabilityCodes().join(', ')}`
      )
    }
    return this.repo.findByCapability(code)
  }

  async getCompatibleWithHub(hubSlug: string): Promise<ProductWithRelations[]> {
    const [hub, products] = await Promise.all([
      this.repo.findHubBySlug(hubSlug),
      this.repo.findByHubSlug(hubSlug)
    ])

    if (!hub) {
      throw new NotFoundException(`Hub con slug "${hubSlug}" no encontrado`)
    }
    return products
  }

  async getCatalogSummary(): Promise<CatalogSummary> {
    return this.repo.getCatalogSummary()
  }

  // --- Helpers privados ---

  private isValidTier(value: string): value is RecommendedTier {
    const valid: readonly string[] = Object.values(RecommendedTier)
    return valid.includes(value)
  }

  private validCapabilityCodes(): string[] {
    return Object.values(CapabilityCode) as string[]
  }

  private isValidCapability(value: string): value is CapabilityCode {
    return this.validCapabilityCodes().includes(value)
  }
}