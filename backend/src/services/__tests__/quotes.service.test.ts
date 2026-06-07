// Tests unitarios para QuotesService.
// NO usa vi.mock — los mocks se injectan vía constructor para evitar
// que Prisma intente conectar a la DB real al cargar el módulo.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BadRequestException, NotFoundException } from '../../lib/errors'
import { QuoteStatus } from '@prisma/client'
import type { QuoteDetail } from '../../repositories/quotes.repo'
import { Prisma } from '@prisma/client'
import { QuotesService } from '../quotes.service'

// --- Mock del repositorio ---
// Creado a mano para evitar cualquier conexión a DB real.
const mockRepo = {
  findAll: vi.fn(),
  countByFilters: vi.fn(),
  findById: vi.fn(),
  findByIdSimple: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  ensureClientExists: vi.fn(),
  ensureProductExists: vi.fn(),
  findFirstRoom: vi.fn(),
  createDefaultRoom: vi.fn(),
  addItem: vi.fn(),
  removeItem: vi.fn(),
  addBundle: vi.fn(),
  addRoom: vi.fn(),
  findBundleBasePrice: vi.fn(),
  findBundleBasePrices: vi.fn(),
  findItems: vi.fn(),
  findBundles: vi.fn(),
  recalculateTotals: vi.fn()
}

const service = new QuotesService(mockRepo as any)

// --- Helpers ---

function makeMockProduct() {
  return {
    id: 'product-1',
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
    supplierLinks: [],
    protocolLinks: [],
    capabilityLinks: [],
    categoryLinks: [],
    ecosystemCompatibilities: [],
    installationLinks: [],
    infrastructureLinks: [],
    hubLinks: [],
    automationLinks: [],
    sceneLinks: []
  }
}

function makeMockQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quote-id-1',
    quoteNumber: 'COT-2026-001',
    status: QuoteStatus.DRAFT,
    clientId: 'client-uuid-1',
    projectName: null,
    projectAddress: null,
    notes: null,
    estimatedSubtotal: null,
    estimatedTotal: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

function makeMockQuoteDetail(overrides: Record<string, unknown> = {}): QuoteDetail {
  const quote = makeMockQuote()
  return {
    ...quote,
    client: {
      id: 'client-uuid-1',
      name: 'Juan Pérez',
      phone: '+573001234567',
      email: 'juan@example.com',
      city: 'Bogotá',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    rooms: [],
    items: [],
    bundles: [],
    ...overrides
  } as unknown as QuoteDetail
}

// --- Tests ---
describe('QuotesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- createQuote ---

  describe('createQuote', () => {
    it('genera quoteNumber con formato COT-{YEAR}-{001}', async () => {
      mockRepo.ensureClientExists.mockResolvedValue(undefined)
      mockRepo.create.mockResolvedValue(makeMockQuote({ quoteNumber: 'COT-2026-001' }))
      mockRepo.findById.mockResolvedValue(makeMockQuoteDetail())

      const result = await service.createQuote('client-uuid-1', 'Proyecto Test')

      expect(result.quoteNumber).toMatch(/^COT-\d{4}-\d{3}$/)
      expect(mockRepo.create).toHaveBeenCalled()
    })

    it('lanza NotFoundException si el cliente no existe', async () => {
      mockRepo.ensureClientExists.mockRejectedValue(
        new NotFoundException('Cliente no encontrado')
      )

      await expect(
        service.createQuote('cliente-inexistente', 'Proyecto Test')
      ).rejects.toThrow(NotFoundException)
    })
  })

  // --- changeQuoteStatus ---

  describe('changeQuoteStatus', () => {
    it('permite transición DRAFT → REVIEW', async () => {
      const updatedQuote = makeMockQuote({ status: QuoteStatus.REVIEW })
      mockRepo.updateStatus.mockResolvedValue(updatedQuote)

      const result = await service.changeQuoteStatus('quote-id-1', QuoteStatus.REVIEW)

      expect(result.status).toBe(QuoteStatus.REVIEW)
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('quote-id-1', QuoteStatus.REVIEW)
    })

    it('lanza BadRequestException en transición inválida APPROVED → DRAFT', async () => {
      mockRepo.updateStatus.mockRejectedValue(
        new BadRequestException('Transición de estado no permitida: APPROVED → DRAFT')
      )

      await expect(
        service.changeQuoteStatus('quote-id-1', QuoteStatus.DRAFT)
      ).rejects.toThrow(BadRequestException)
    })

    it('recarga la quote si el nuevo estado es APPROVED', async () => {
      const approvedQuote = makeMockQuote({ status: QuoteStatus.APPROVED })
      const refreshedQuote = makeMockQuoteDetail({ status: QuoteStatus.APPROVED })

      mockRepo.updateStatus.mockResolvedValueOnce(approvedQuote)
      mockRepo.recalculateTotals.mockResolvedValue({
        equipmentCost: 0,
        laborCost: 0,
        estimatedSubtotal: 0,
        estimatedTotal: 0
      })
      mockRepo.findByIdSimple.mockResolvedValue(refreshedQuote)
      mockRepo.findItems.mockResolvedValue([])
      mockRepo.findBundles.mockResolvedValue([])
      mockRepo.findBundleBasePrices.mockResolvedValue(new Map())

      await service.changeQuoteStatus('quote-id-1', QuoteStatus.APPROVED)

      expect(mockRepo.recalculateTotals).toHaveBeenCalled()
    })
  })

  // --- duplicateQuote ---

  describe('duplicateQuote', () => {
    it('crea copia con nuevo número y status DRAFT', async () => {
      const originalQuote = makeMockQuoteDetail({
        quoteNumber: 'COT-2026-001',
        status: QuoteStatus.FINAL,
        projectName: 'Proyecto Original',
        projectAddress: 'Calle 123',
        notes: 'Notas importantes',
        rooms: [
          {
            id: 'room-1',
            name: 'Sala',
            floor: 1,
            areaSqm: new Prisma.Decimal(25),
            quoteId: 'quote-id-1',
            createdAt: new Date(),
            notes: null
          }
        ] as QuoteDetail['rooms'],
        items: [
          {
            id: 'item-1',
            quoteId: 'quote-id-1',
            productId: 'product-1',
            roomId: 'room-1',
            quantity: 2,
            unitPrice: new Prisma.Decimal(150000),
            estimatedInstall: new Prisma.Decimal(60),
            createdAt: new Date(),
            notes: null,
            product: makeMockProduct(),
            room: null
          }
        ] as QuoteDetail['items'],
        bundles: []
      })

      const newQuote = makeMockQuoteDetail({
        id: 'quote-id-2',
        quoteNumber: 'COT-2026-002',
        status: QuoteStatus.DRAFT
      })

      mockRepo.findById
        .mockResolvedValueOnce(originalQuote)
        .mockResolvedValueOnce(newQuote)
      mockRepo.create.mockResolvedValue(newQuote)
      mockRepo.addRoom.mockResolvedValue({
        id: 'room-new-1',
        name: 'Sala',
        floor: 1,
        areaSqm: new Prisma.Decimal(25),
        quoteId: 'quote-id-2',
        createdAt: new Date(),
        notes: null
      })
      mockRepo.addItem.mockResolvedValue({} as any)
      mockRepo.findItems.mockResolvedValue([])
      mockRepo.findBundles.mockResolvedValue([])
      mockRepo.findBundleBasePrices.mockResolvedValue(new Map())
      mockRepo.recalculateTotals.mockResolvedValue({
        equipmentCost: 300000,
        laborCost: 476000,
        estimatedSubtotal: 911000,
        estimatedTotal: 1084090
      })

      const result = await service.duplicateQuote('quote-id-1')

      expect(result.status).toBe(QuoteStatus.DRAFT)
      expect(result.quoteNumber).not.toBe('COT-2026-001')
      expect(mockRepo.create).toHaveBeenCalled()
      const createCall = mockRepo.create.mock.calls[0]![0] as { projectAddress?: unknown; notes?: unknown }
      expect(createCall.projectAddress).toBeUndefined()
      expect(createCall.notes).toBeUndefined()
    })

    it('lanza NotFoundException si la quote original no existe', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.duplicateQuote('inexistente')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  // --- getQuoteSummary ---

  describe('getQuoteSummary', () => {
    it('retorna estructura correcta con totales calculados', async () => {
      const quoteWithData = makeMockQuoteDetail({
        quoteNumber: 'COT-2026-005',
        projectName: 'Mi Proyecto',
        rooms: [
          {
            id: 'room-1',
            name: 'Habitación',
            floor: 2,
            areaSqm: new Prisma.Decimal(15),
            quoteId: 'quote-id-1',
            createdAt: new Date(),
            notes: null
          }
        ] as QuoteDetail['rooms'],
        items: [
          {
            id: 'item-1',
            quoteId: 'quote-id-1',
            productId: 'product-1',
            roomId: 'room-1',
            quantity: 3,
            unitPrice: new Prisma.Decimal(150000),
            estimatedInstall: new Prisma.Decimal(30),
            createdAt: new Date(),
            notes: null,
            product: makeMockProduct(),
            room: null
          }
        ] as QuoteDetail['items'],
        bundles: [
          {
            quoteId: 'quote-id-1',
            bundleId: 'bundle-1',
            quantity: 1,
            createdAt: new Date(),
            notes: null,
            bundle: {
              id: 'bundle-1',
              slug: 'kit-curtain',
              name: 'Kit Cortinas Smart',
              description: null,
              basePrice: new Prisma.Decimal(600000),
              tier: 'STANDARD' as const,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              items: []
            }
          }
        ] as QuoteDetail['bundles']
      })

      mockRepo.findById.mockResolvedValue(quoteWithData)

      const result = await service.getQuoteSummary('quote-id-1')

      expect(result.quoteNumber).toBe('COT-2026-005')
      expect(result.client.name).toBe('Juan Pérez')
      expect(result.project.name).toBe('Mi Proyecto')
      expect(result.rooms).toHaveLength(1)
      expect(result.rooms[0]!.items).toHaveLength(1)
      expect(result.rooms[0]!.items[0]!.productName).toBe('Sonoff Basic')
      expect(result.rooms[0]!.items[0]!.brandName).toBe('SONOFF')
      expect(result.bundles).toHaveLength(1)
      expect(result.bundles[0]!.bundleName).toBe('Kit Cortinas Smart')
      expect(result.marginPct).toBe(0.45) // MARGIN_EQUIPMENT
      expect(typeof result.total).toBe('number')
      expect(typeof result.iva).toBe('number')
      expect(result.generatedAt).toBeInstanceOf(Date)
    })

    it('lanza NotFoundException si la quote no existe', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.getQuoteSummary('inexistente')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  // --- addItemToQuote ---

  describe('addItemToQuote', () => {
    it('solo permite agregar items a cotizaciones en DRAFT', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(
        makeMockQuote({ status: QuoteStatus.FINAL }) as QuoteDetail
      )

      await expect(
        service.addItemToQuote('quote-id-1', 'product-1', 2)
      ).rejects.toThrow(BadRequestException)
    })

    it('lanza NotFoundException si la quote no existe', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(null)

      await expect(
        service.addItemToQuote('inexistente', 'product-1', 1)
      ).rejects.toThrow(NotFoundException)
    })
  })

  // --- removeItemFromQuote ---

  describe('removeItemFromQuote', () => {
    it('solo permite eliminar items de cotizaciones en DRAFT', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(
        makeMockQuote({ status: QuoteStatus.APPROVED }) as QuoteDetail
      )

      await expect(
        service.removeItemFromQuote('quote-id-1', 'product-1')
      ).rejects.toThrow(BadRequestException)
    })
  })

  // --- addBundleToQuote ---

  describe('addBundleToQuote', () => {
    it('solo permite agregar bundles a cotizaciones en DRAFT', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(
        makeMockQuote({ status: QuoteStatus.REVIEW }) as QuoteDetail
      )

      await expect(
        service.addBundleToQuote('quote-id-1', 'bundle-1', 1)
      ).rejects.toThrow(BadRequestException)
    })

    it('lanza NotFoundException si la quote no existe', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(null)

      await expect(
        service.addBundleToQuote('inexistente', 'bundle-1', 1)
      ).rejects.toThrow(NotFoundException)
    })
  })

  // --- addRoomToQuote ---

  describe('addRoomToQuote', () => {
    it('solo permite agregar rooms a cotizaciones en DRAFT', async () => {
      mockRepo.findByIdSimple.mockResolvedValue(
        makeMockQuote({ status: QuoteStatus.ARCHIVED }) as QuoteDetail
      )

      await expect(
        service.addRoomToQuote('quote-id-1', 'Terraza')
      ).rejects.toThrow(BadRequestException)
    })
  })
})