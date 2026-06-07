import { BundlesRepository } from '../repositories/bundles.repo'
import type {
  BundleDetail,
  BundleFilters,
  BundlePriceBreakdown,
  BundleWithItems
} from '../types/bundle.types'
import type { PaginatedResponse } from '../types/product.types'
import { NotFoundException } from '../lib/errors'
import { pricingService } from './pricing.service'
import {
  DEVICES_PER_ELECTRICIAN_DAY,
  MIN_ELECTRICIAN_DAYS
} from '../lib/constants'

// Heurística: estima los días de electricista en función del número de
// dispositivos del bundle. 1 día por cada DEVICES_PER_ELECTRICIAN_DAY
// dispositivos, con un mínimo de MIN_ELECTRICIAN_DAYS.
function estimateElectricianDays(deviceCount: number): number {
  const days = Math.ceil(deviceCount / DEVICES_PER_ELECTRICIAN_DAY)
  return Math.max(MIN_ELECTRICIAN_DAYS, days)
}

export class BundlesService {
  private repo: BundlesRepository

  constructor(repo?: BundlesRepository) {
    this.repo = repo ?? new BundlesRepository()
  }

  // Lista paginada de bundles con filtros.
  async getBundles(
    filters: BundleFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<BundleWithItems>> {
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

  // Devuelve el detalle completo de un bundle por slug.
  // Lanza NotFoundException si el slug no existe.
  async getBundleBySlug(slug: string): Promise<BundleDetail> {
    const bundle = await this.repo.findBySlug(slug)
    if (!bundle) {
      throw new NotFoundException(`Bundle con slug "${slug}" no encontrado`)
    }
    return bundle
  }

  // Devuelve el desglose de precio de un bundle por slug.
  // El endpoint HTTP expone slug, así que el servicio resuelve el bundle por
  // slug y luego delega el cálculo de costo de equipos al repositorio.
  // - Lanza NotFoundException si el slug no existe.
  async getBundlePrice(slug: string): Promise<BundlePriceBreakdown> {
    const bundle = await this.getBundleBySlug(slug)

    // Suma de quantities de todos los items (incluyendo opcionales).
    const deviceCount = bundle.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    )

    const cost = await this.repo.calculateBundleCost(bundle.id)
    const electricianDays = estimateElectricianDays(deviceCount)
    const laborEstimate = pricingService.calculateLaborCost(
      deviceCount,
      electricianDays
    )
    const total = Number((cost.suggestedPrice + laborEstimate).toFixed(2))

    return {
      bundleId: bundle.id,
      bundleSlug: bundle.slug,
      deviceCount,
      electricianDays,
      equipmentCost: cost.equipmentCost,
      equipmentSalePrice: cost.suggestedPrice,
      laborEstimate,
      total,
      marginPct: cost.margin,
      tier: bundle.tier
    }
  }
}