import type { Prisma, Quote, QuoteItem, QuoteBundle, Room } from '@prisma/client'
import { QuoteStatus } from '@prisma/client'
import { QuotesRepository } from '../repositories/quotes.repo'
import type {
  QuoteDetail,
  QuoteSummary,
  QuoteTotals
} from '../repositories/quotes.repo'
import type {
  AddBundleData,
  AddItemData,
  AddRoomData,
  CreateQuoteData
} from '../schemas/quotes.schema'
import type { GetQuotesQuery } from '../schemas/quotes.schema'
import type { PaginatedResponse } from '../types/product.types'
import { BadRequestException, NotFoundException } from '../lib/errors'
import {
  DEVICES_PER_ELECTRICIAN_DAY,
  MARGIN_EQUIPMENT,
  MIN_ELECTRICIAN_DAYS,
  IVA_RATE
} from '../lib/constants'
import { pricingService } from './pricing.service'

// --- Tipo público para el endpoint de export ---
// Estructura "plana" optimizada para serializar a PDF. Vive en el servicio
// porque es un contrato entre la capa de negocio y la capa de presentación.
export interface QuoteSummaryExport {
  quoteNumber: string
  client: {
    name: string
    phone: string | null
    email: string | null
    city: string | null
  }
  project: {
    name: string | null
    address: string | null
  }
  rooms: Array<{
    id: string
    name: string
    floor: number | null
    areaSqm: number | null
    items: Array<{
      productName: string
      brandName: string
      isManual: boolean
      quantity: number
      unitPrice: number
      subtotal: number
    }>
    subtotal: number
  }>
  bundles: Array<{
    bundleName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotalEquipment: number
  laborCost: number
  subtotal: number
  iva: number
  total: number
  marginPct: number
  generatedAt: Date
}

// Heurística: días de electricista en función del número de dispositivos
// instalados. 1 día por cada DEVICES_PER_ELECTRICIAN_DAY dispositivos, con
// un piso de MIN_ELECTRICIAN_DAYS (1). Misma fórmula que BundlesService
// para mantener consistencia entre dominios.
function estimateElectricianDays(deviceCount: number): number {
  const days = Math.ceil(deviceCount / DEVICES_PER_ELECTRICIAN_DAY)
  return Math.max(MIN_ELECTRICIAN_DAYS, days)
}

// Convierte un Decimal/number/null a number de forma segura.
// El `null` se trata como 0 (no contribuye al cálculo).
function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  return value.toNumber()
}

// Cálculo central de totales de cotización. Acepta los items y bundles
// ya cargados para que esta función se mantenga como un helper puro de
// cálculo (testeable sin DB). El servicio la llama con los datos que ya
// cargó del this.repo.
function computeQuoteTotals(
  items: Array<{ quantity: number; unitPrice: Prisma.Decimal | number | null }>,
  bundles: Array<{
    quantity: number
    bundle: { basePrice: Prisma.Decimal | number | null }
  }>
): {
  equipmentCost: number
  laborCost: number
  estimatedSubtotal: number
  estimatedTotal: number
  deviceCount: number
} {
  // equipmentCost = Σ(item.quantity × item.unitPrice) + Σ(bundle.quantity × bundle.basePrice)
  let equipmentCost = 0
  let deviceCount = 0
  for (const item of items) {
    const unitPrice = decimalToNumber(item.unitPrice)
    equipmentCost += item.quantity * unitPrice
    deviceCount += item.quantity
  }
  for (const b of bundles) {
    const basePrice = decimalToNumber(b.bundle.basePrice)
    equipmentCost += b.quantity * basePrice
    deviceCount += b.quantity
  }

  // Días de electricista por número total de dispositivos instalados.
  const electricianDays = estimateElectricianDays(deviceCount)

  // laborCost = (electricianDays × dailyRate + baseConfig) × (1 + MARGIN_LABOR)
  // Delegamos a pricingService para que la fórmula viva en un único lugar.
  const laborCost = pricingService.calculateLaborCost(deviceCount, electricianDays)

  // equipmentSale = equipmentCost × (1 + MARGIN_EQUIPMENT) = × 1.45
  const equipmentSale = equipmentCost * (1 + MARGIN_EQUIPMENT)

  // estimatedSubtotal = equipmentSale + laborCost
  // (MARGIN_LABOR ya está aplicado dentro de laborCost).
  const estimatedSubtotal = equipmentSale + laborCost

  // estimatedTotal = estimatedSubtotal × (1 + IVA_RATE)
  const estimatedTotal = estimatedSubtotal * (1 + IVA_RATE)

  return {
    equipmentCost: Number(equipmentCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    estimatedSubtotal: Number(estimatedSubtotal.toFixed(2)),
    estimatedTotal: Number(estimatedTotal.toFixed(2)),
    deviceCount
  }
}

export class QuotesService {
  private repo: QuotesRepository

  constructor(repo?: QuotesRepository) {
    this.repo = repo ?? new QuotesRepository()
  }

  // Lista paginada de cotizaciones con filtros opcionales.
  async getQuotes(
    query: GetQuotesQuery
  ): Promise<PaginatedResponse<QuoteSummary>> {
    const { page, limit, ...filters } = query
    const pageSafe = Math.max(1, Math.floor(page))
    const limitSafe = Math.max(1, Math.min(100, Math.floor(limit)))
    const skip = (pageSafe - 1) * limitSafe

    const [items, total] = await Promise.all([
      this.repo.findAll({ filters, pagination: { skip, take: limitSafe } }),
      this.repo.countByFilters(filters)
    ])

    const totalPages = limitSafe > 0 ? Math.ceil(total / limitSafe) : 0

    return {
      data: items,
      total,
      page: pageSafe,
      limit: limitSafe,
      totalPages
    }
  }

  // Devuelve el detalle completo de una cotización.
  // Lanza NotFoundException si el id no existe.
  async getQuoteById(id: string): Promise<QuoteDetail> {
    const quote = await this.repo.findById(id)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${id}" no encontrada`)
    }
    return quote
  }

  // Crea una cotización nueva en estado DRAFT.
  // - Valida que el cliente exista (NotFoundException si no).
  // - Aplica trim a strings opcionales.
  // - El repo genera el quoteNumber y devuelve el id.
  // - Re-leemos la quote con el include completo para devolver QuoteDetail.
  async createQuote(
    clientId: string,
    projectName?: string,
    projectAddress?: string,
    notes?: string
  ): Promise<QuoteDetail> {
    // Validación referencial delegada al repo (que lanza NotFoundException).
    await this.repo.ensureClientExists(clientId)

    const data: CreateQuoteData = {
      clientId,
      projectName: projectName?.trim() || undefined,
      projectAddress: projectAddress?.trim() || undefined,
      notes: notes?.trim() || undefined
    }

    const created = await this.repo.create(data)

    const detail = await this.repo.findById(created.id)
    if (!detail) {
      // No debería pasar (acabamos de crearlo), pero defendemos el tipo.
      throw new NotFoundException('No se pudo recuperar la cotización creada')
    }

    return detail
  }

  // Agrega un item a una cotización en DRAFT.
  // - Valida que la quote exista y esté en DRAFT.
  // Agrega un item a la cotización. Acepta dos variantes:
  //   1. Ítem de catálogo: payload.productId presente. El servicio valida
  //      que el producto exista, resuelve roomId y calcula unitPrice
  //      (preferredPrice × 1.45) si no vienen.
  //   2. Ítem manual: payload.customName presente. NO se valida producto
  //      (no hay), y unitPrice es OBLIGATORIO en este caso (lo aporta el
  //      vendedor, no se puede calcular del catálogo).
  //
  // En ambos casos la quote debe estar en DRAFT.
  async addItemToQuote(
    quoteId: string,
    payload: {
      productId?: string
      roomId?: string
      customName?: string
      customDescription?: string
      quantity: number
      unitPrice?: number
      estimatedInstall?: number
    }
  ): Promise<QuoteItem> {
    const quote = await this.repo.findByIdSimple(quoteId)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${quoteId}" no encontrada`)
    }
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se pueden agregar items a cotizaciones en DRAFT. Estado actual: ${quote.status}`
      )
    }

    const isManual = payload.customName !== undefined
    const isCatalog = payload.productId !== undefined

    if (isCatalog) {
      // Validar que el producto exista.
      await this.repo.ensureProductExists(payload.productId!)
    } else if (isManual) {
      // Para ítems manuales, unitPrice es obligatorio: no hay forma de
      // calcularlo del catálogo porque el producto no existe.
      if (payload.unitPrice === undefined) {
        throw new BadRequestException(
          'Los ítems manuales requieren unitPrice explícito (lo ingresa el vendedor).'
        )
      }
    }

    // Resolver roomId: si no viene, usar la primera existente o crear "General".
    let resolvedRoomId: string | null = payload.roomId ?? null
    if (!resolvedRoomId) {
      const firstRoom = await this.repo.findFirstRoom(quoteId)
      if (firstRoom) {
        resolvedRoomId = firstRoom.id
      } else {
        const general = await this.repo.createDefaultRoom(quoteId, 'General')
        resolvedRoomId = general.id
      }
    }

    // Resolver unitPrice: para catálogo, si no viene, buscar preferredPrice × 1.45.
    // Para manuales, ya validamos arriba que venga.
    let resolvedUnitPrice: number | undefined = payload.unitPrice
    if (isCatalog && resolvedUnitPrice === undefined) {
      const preferredPrice = await this.repo.findPreferredSupplierPrice(
        payload.productId!
      )
      if (preferredPrice !== null) {
        resolvedUnitPrice = Number(
          (preferredPrice * (1 + MARGIN_EQUIPMENT)).toFixed(2)
        )
      }
    }

    const itemData: AddItemData = {
      productId: payload.productId,
      // AddItemData.roomId es `string | undefined` (opcional). Convertimos
      // el null interno (que usamos como "sin asignar") a undefined para
      // que el contrato del schema de Zod se cumpla.
      roomId: resolvedRoomId ?? undefined,
      customName: payload.customName,
      customDescription: payload.customDescription,
      quantity: payload.quantity,
      unitPrice: resolvedUnitPrice,
      estimatedInstall: payload.estimatedInstall
    }

    return this.repo.addItem(quoteId, itemData)
  }

  // Elimina un item de la cotización.
  // - Si roomId viene, elimina solo el item específico.
  // - Si roomId no viene, elimina todos los items de ese productId.
  async removeItemFromQuote(
    quoteId: string,
    productId: string,
    roomId?: string
  ): Promise<void> {
    const quote = await this.repo.findByIdSimple(quoteId)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${quoteId}" no encontrada`)
    }
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se pueden eliminar items de cotizaciones en DRAFT. Estado actual: ${quote.status}`
      )
    }

    await this.repo.removeItem(quoteId, productId, roomId)
  }

  // Agrega un bundle a una cotización en DRAFT.
  // - Valida que la quote esté en DRAFT.
  // - Verifica que el bundle exista y tenga basePrice.
  // - Tras agregar, recalcula y persiste los totales para mantener
  //   consistency entre los datos del quote y los totales mostrados.
  // NOTA: el parámetro `roomId` se acepta en la firma para mantener
  // compatibilidad con el spec, pero el modelo QuoteBundle no persiste
  // esa asociación (TODO: añadir `roomId` al schema si se requiere).
  async addBundleToQuote(
    quoteId: string,
    bundleId: string,
    quantity: number,
    _roomId?: string
  ): Promise<QuoteBundle> {
    const quote = await this.repo.findByIdSimple(quoteId)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${quoteId}" no encontrada`)
    }
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se pueden agregar bundles a cotizaciones en DRAFT. Estado actual: ${quote.status}`
      )
    }

    // Verificar que el bundle exista. El repo lanza NotFoundException si
    // no existe (404). No persistimos el basePrice en el QuoteBundle porque
    // el modelo no tiene ese campo; el cálculo de totales lo trae vía
    // recalculateAndPersist abajo.
    await this.repo.findBundleBasePrice(bundleId)

    const data: AddBundleData = {
      bundleId,
      quantity
    }

    const quoteBundle = await this.repo.addBundle(quoteId, data)

    // Recalcular totales para que estimatedSubtotal/estimatedTotal reflejen
    // el nuevo bundle. Mantiene la consistencia del estado persistido.
    await this.recalculateAndPersist(quoteId)

    return quoteBundle
  }

  // Crea una nueva room en la cotización.
  // - Valida que la quote esté en DRAFT.
  async addRoomToQuote(
    quoteId: string,
    name: string,
    floor?: number,
    areaSqm?: number
  ): Promise<Room> {
    const quote = await this.repo.findByIdSimple(quoteId)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${quoteId}" no encontrada`)
    }
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se pueden agregar rooms a cotizaciones en DRAFT. Estado actual: ${quote.status}`
      )
    }

    const data: AddRoomData = {
      name: name.trim(),
      floor,
      areaSqm
    }

    return this.repo.addRoom(quoteId, data)
  }

  // Cambia el estado de la cotización.
  // - Las transiciones válidas las valida el repo (BadRequestException si
  //   la transición no está permitida).
  // - Si el nuevo estado es APPROVED, recalcula y persiste los totales
  //   para que la quote quede lista para facturación/export.
  async changeQuoteStatus(
    quoteId: string,
    newStatus: QuoteStatus
  ): Promise<Quote> {
    const quote = await this.repo.updateStatus(quoteId, newStatus)

    if (newStatus === QuoteStatus.APPROVED) {
      await this.recalculateAndPersist(quoteId)
      const refreshed = await this.repo.findByIdSimple(quoteId)
      if (refreshed) return refreshed
    }

    return quote
  }

  // Duplica una cotización existente en DRAFT.
  // - Crea una nueva con status DRAFT y nuevo quoteNumber.
  // - Copia rooms, items y bundles (con los mismos precios unitarios).
  // - NO copia notes ni projectAddress (se dejan vacíos).
  async duplicateQuote(quoteId: string): Promise<QuoteDetail> {
    const original = await this.repo.findById(quoteId)
    if (!original) {
      throw new NotFoundException(
        `Cotización con id "${quoteId}" no encontrada`
      )
    }

    if (!original.clientId) {
      throw new BadRequestException(
        'No se puede duplicar una cotización sin cliente asociado'
      )
    }

    // 1. Crear la nueva quote con quoteNumber auto-generado.
    const data: CreateQuoteData = {
      clientId: original.clientId,
      projectName: original.projectName ?? undefined,
      // projectAddress y notes explícitamente vacíos según spec.
      projectAddress: undefined,
      notes: undefined
    }

    const newQuote = await this.repo.create(data)

    // 2. Copiar rooms (mantenemos un mapa oldId -> newId para reasignar
    //    los items de forma consistente).
    const roomIdMap = new Map<string, string>()
    for (const room of original.rooms) {
      const newRoom = await this.repo.addRoom(newQuote.id, {
        name: room.name,
        floor: room.floor ?? undefined,
        areaSqm: room.areaSqm ? room.areaSqm.toNumber() : undefined
      })
      roomIdMap.set(room.id, newRoom.id)
    }

    // 3. Copiar items (con el roomId mapeado al nuevo id).
    for (const item of original.items) {
      await this.repo.addItem(newQuote.id, {
        productId: item.productId ?? undefined,
        roomId: item.roomId
          ? roomIdMap.get(item.roomId) ?? undefined
          : undefined,
        customName: item.customName ?? undefined,
        customDescription: item.customDescription ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice ? item.unitPrice.toNumber() : undefined,
        estimatedInstall: item.estimatedInstall
          ? item.estimatedInstall.toNumber()
          : undefined
      })
    }

    // 4. Copiar bundles.
    for (const bundle of original.bundles) {
      await this.repo.addBundle(newQuote.id, {
        bundleId: bundle.bundleId,
        quantity: bundle.quantity
      })
    }

    // 5. Recalcular totales para que la nueva quote tenga subtotal/total.
    await this.recalculateAndPersist(newQuote.id)

    // 6. Re-leer con el include completo.
    const detail = await this.repo.findById(newQuote.id)
    if (!detail) {
      throw new NotFoundException(
        'No se pudo recuperar la cotización duplicada'
      )
    }
    return detail
  }

  // Devuelve un objeto estructurado para exportar la cotización a PDF.
  // Es la vista "denormalizada" que consume el generador de PDFs.
  async getQuoteSummary(quoteId: string): Promise<QuoteSummaryExport> {
    const quote = await this.repo.findById(quoteId)
    if (!quote) {
      throw new NotFoundException(`Cotización con id "${quoteId}" no encontrada`)
    }

    // --- Desglose por room ---
    const roomsMap = new Map<
      string,
      {
        id: string
        name: string
        floor: number | null
        areaSqm: number | null
        items: Array<{
          productName: string
          brandName: string
          isManual: boolean
          quantity: number
          unitPrice: number
          subtotal: number
        }>
        subtotal: number
      }
    >()

    // Inicializamos las rooms en el orden en que vienen del repo
    // (ordenadas por name en el include).
    for (const room of quote.rooms) {
      roomsMap.set(room.id, {
        id: room.id,
        name: room.name,
        floor: room.floor,
        areaSqm: room.areaSqm ? room.areaSqm.toNumber() : null,
        items: [],
        subtotal: 0
      })
    }

    // Bucket para items huérfanos (sin roomId o con roomId inválido).
    // El modelo permite roomId NULL, así que este caso es real.
    const unassigned: {
      id: string
      name: string
      floor: number | null
      areaSqm: number | null
      items: Array<{
        productName: string
        brandName: string
        isManual: boolean
        quantity: number
        unitPrice: number
        subtotal: number
      }>
      subtotal: number
    } = {
      id: '__unassigned__',
      name: 'Sin asignar',
      floor: null,
      areaSqm: null,
      items: [],
      subtotal: 0
    }

    for (const item of quote.items) {
      const unitPrice = decimalToNumber(item.unitPrice)
      const subtotal = Number((item.quantity * unitPrice).toFixed(2))
      // El modelo permite ítems manuales (product = NULL). En ese caso el
      // nombre a mostrar en el PDF viene de customName; la marca se omite
      // porque no aplica para equipos fuera del catálogo.
      const productName =
        item.product?.name ?? item.customName ?? 'Ítem manual sin nombre'
      const brandName = item.product
        ? (item.product.brand?.name ?? item.product.brandId)
        : 'Ítem manual'
      const entry = {
        productName,
        brandName,
        isManual: !item.product,
        quantity: item.quantity,
        unitPrice,
        subtotal
      }

      if (item.roomId && roomsMap.has(item.roomId)) {
        const target = roomsMap.get(item.roomId)!
        target.items.push(entry)
        target.subtotal = Number((target.subtotal + subtotal).toFixed(2))
      } else {
        unassigned.items.push(entry)
        unassigned.subtotal = Number((unassigned.subtotal + subtotal).toFixed(2))
      }
    }

    const rooms = Array.from(roomsMap.values())
    if (unassigned.items.length > 0) {
      rooms.push(unassigned)
    }

    // --- Bundles ---
    const bundleEntries = quote.bundles.map((b) => {
      const basePrice = decimalToNumber(b.bundle.basePrice)
      const unitPrice = basePrice
      const subtotal = Number((b.quantity * unitPrice).toFixed(2))
      return {
        bundleName: b.bundle.name,
        quantity: b.quantity,
        unitPrice,
        subtotal
      }
    })

    // --- Totales ---
    const totals = computeQuoteTotals(
      quote.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
      quote.bundles.map((b) => ({
        quantity: b.quantity,
        bundle: { basePrice: b.bundle.basePrice }
      }))
    )

    const equipmentSale = totals.equipmentCost * (1 + MARGIN_EQUIPMENT)
    const subtotal = equipmentSale + totals.laborCost
    const iva = subtotal * IVA_RATE
    const total = subtotal + iva

    return {
      quoteNumber: quote.quoteNumber,
      client: {
        name: quote.client?.name ?? 'Sin cliente',
        phone: quote.client?.phone ?? null,
        email: quote.client?.email ?? null,
        city: quote.client?.city ?? null
      },
      project: {
        name: quote.projectName ?? null,
        address: quote.projectAddress ?? null
      },
      rooms,
      bundles: bundleEntries,
      subtotalEquipment: Number(equipmentSale.toFixed(2)),
      laborCost: totals.laborCost,
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      marginPct: MARGIN_EQUIPMENT,
      generatedAt: new Date()
    }
  }

  // --- Helper privado ---

  // Recalcula los totales a partir de los items y bundles persistidos y
  // los escribe en la quote. Devuelve los totales calculados.
  // Se usa internamente después de operaciones que modifican items/bundles
  // (addBundleToQuote, changeQuoteStatus→APPROVED, duplicateQuote).
  // Toda la I/O pasa por el repo: este método sólo orquesta y calcula.
  private async recalculateAndPersist(quoteId: string): Promise<QuoteTotals> {
    const [items, bundles] = await Promise.all([
      this.repo.findItems(quoteId),
      this.repo.findBundles(quoteId)
    ])

    // Cargar los basePrice de todos los bundles en una sola query (batch).
    const bundleIds = bundles.map((b) => b.bundleId)
    const basePriceMap = await this.repo.findBundleBasePrices(bundleIds)

    const enrichedBundles = bundles.map((b) => ({
      quantity: b.quantity,
      bundle: { basePrice: basePriceMap.get(b.bundleId) ?? null }
    }))

    const totals = computeQuoteTotals(
      items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      enrichedBundles
    )

    return this.repo.recalculateTotals(
      quoteId,
      totals.equipmentCost,
      totals.laborCost,
      totals.estimatedSubtotal,
      totals.estimatedTotal
    )
  }
}
