// Tests unitarios para BundlesService.
// NO usa vi.mock — los mocks se injectan vía constructor para evitar
// que Prisma intente conectar a la DB real al cargar el módulo.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '../../lib/errors'
import type { BundleWithItems } from '../../types/bundle.types'
import { RecommendedTier } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { BundlesService } from '../bundles.service'

// --- Mock del repositorio ---
// Creado a mano para que NO haya ningún import de Prisma real.
// El servicio recibe este mock via constructor.
const mockRepo = {
  findAll: vi.fn(),
  countByFilters: vi.fn(),
  findBySlug: vi.fn(),
  findByIds: vi.fn(),
  calculateBundleCost: vi.fn()
}

const service = new BundlesService(mockRepo as any)

// --- Helpers ---

function makeMockProductForBundle(productId = 'product-1') {
  return {
    id: productId,
    slug: 'sonoff-basic',
    name: 'Sonoff Basic',
    productType: 'SWITCH',
    recommendedTier: 'ENTRY',
    requiresNeutral: true,
    installationDifficulty: 'LOW',
    powerConsumption: new Prisma.Decimal(1.5),
    localControl: true,
    cloudRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandId: 'brand-1',
    sku: null,
    modelCode: null,
    description: null,
    activePowerUnit: null,
    metadata: null,
    brand: {
      id: 'brand-1',
      name: 'SONOFF',
      slug: 'sonoff',
      website: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    supplierLinks: []
  }
}

function makeMockBundleWithItems(
  bundleOverrides: Record<string, unknown> = {},
  itemEntries: Array<{ productId: string; quantity: number; isOptional: boolean }> = []
): BundleWithItems {
  const bundleId = 'bundle-id-1'
  const bundleSlug = (bundleOverrides.slug as string) ?? 'kit-iluminacion-smart'

  return {
    id: bundleId,
    slug: bundleSlug,
    name: 'Kit Iluminación Smart',
    description: 'Kit completo para iluminar tu hogar',
    basePrice: new Prisma.Decimal(800000),
    tier: RecommendedTier.STANDARD,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...bundleOverrides,
    items: itemEntries.map((entry) => ({
      bundleId,
      productId: entry.productId,
      quantity: entry.quantity,
      isOptional: entry.isOptional,
      product: makeMockProductForBundle(entry.productId)
    }))
  } as unknown as BundleWithItems
}

// --- Tests ---
describe('BundlesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- getBundles ---

  describe('getBundles', () => {
    it('retorna lista de bundles cuando existen bundles activos', async () => {
      const mockBundles = [
        makeMockBundleWithItems({}, [{ productId: 'p1', quantity: 2, isOptional: false }])
      ]
      mockRepo.findAll.mockResolvedValue(mockBundles)
      mockRepo.countByFilters.mockResolvedValue(1)

      const result = await service.getBundles({}, { page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(mockRepo.findAll).toHaveBeenCalledWith({}, { skip: 0, take: 20 })
    })

    it('retorna lista vacía cuando no hay bundles', async () => {
      mockRepo.findAll.mockResolvedValue([])
      mockRepo.countByFilters.mockResolvedValue(0)

      const result = await service.getBundles({}, { page: 1, limit: 20 })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('aplica paginación correctamente', async () => {
      mockRepo.findAll.mockResolvedValue([])
      mockRepo.countByFilters.mockResolvedValue(0)

      await service.getBundles({}, { page: 3, limit: 10 })

      expect(mockRepo.findAll).toHaveBeenCalledWith({}, { skip: 20, take: 10 })
    })
  })

  // --- getBundleBySlug ---

  describe('getBundleBySlug', () => {
    it('retorna bundle cuando el slug existe', async () => {
      const mockBundle = makeMockBundleWithItems({ slug: 'existente' })
      mockRepo.findBySlug.mockResolvedValue(mockBundle)

      const result = await service.getBundleBySlug('existente')

      expect(result.slug).toBe('existente')
      expect(mockRepo.findBySlug).toHaveBeenCalledWith('existente')
    })

    it('lanza NotFoundException cuando el slug no existe', async () => {
      mockRepo.findBySlug.mockResolvedValue(null)

      await expect(service.getBundleBySlug('inexistente')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  // --- getBundlePrice ---

  describe('getBundlePrice', () => {
    it('calcula precio correctamente con bundle de 3 items', async () => {
      const bundle = makeMockBundleWithItems(
        { slug: 'kit-completo' },
        [
          { productId: 'p1', quantity: 2, isOptional: false },
          { productId: 'p2', quantity: 1, isOptional: false },
          { productId: 'p3', quantity: 1, isOptional: false }
        ]
      )
      mockRepo.findBySlug.mockResolvedValue(bundle)
      mockRepo.calculateBundleCost.mockResolvedValue({
        equipmentCost: 800000,
        suggestedPrice: 1000000,
        margin: 0.25
      })

      const result = await service.getBundlePrice('kit-completo')

      // deviceCount = 2 + 1 + 1 = 4
      expect(result.deviceCount).toBe(4)
      // electricianDays = ceil(4/5) = 1, mínimo 1
      expect(result.electricianDays).toBe(1)
      expect(result.equipmentCost).toBe(800000)
      expect(result.equipmentSalePrice).toBe(1000000)
      // laborEstimate = (1×180000 + 160000) × 1.40 = 476000
      expect(result.laborEstimate).toBe(476000)
      // total = 1000000 + 476000 = 1476000
      expect(result.total).toBe(1476000)
      expect(result.marginPct).toBe(0.25)
    })

    it('lanza NotFoundException si el bundle no existe', async () => {
      mockRepo.findBySlug.mockResolvedValue(null)

      await expect(service.getBundlePrice('inexistente')).rejects.toThrow(
        NotFoundException
      )
    })

    it('calcula días de electricista correctamente para muchos dispositivos', async () => {
      const items = Array.from({ length: 17 }, (_, i) => ({
        productId: `p${i}`,
        quantity: 1,
        isOptional: false
      }))
      const bundle = makeMockBundleWithItems({ slug: 'kit-grande' }, items)
      mockRepo.findBySlug.mockResolvedValue(bundle)
      mockRepo.calculateBundleCost.mockResolvedValue({
        equipmentCost: 5000000,
        suggestedPrice: 6250000,
        margin: 0.25
      })

      const result = await service.getBundlePrice('kit-grande')

      expect(result.deviceCount).toBe(17)
      expect(result.electricianDays).toBe(4)
      // labor = (4×180000 + 160000 + 2×100000) × 1.40 = 1372000
      expect(result.laborEstimate).toBe(1372000)
    })
  })
})