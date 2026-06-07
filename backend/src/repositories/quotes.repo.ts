import type { Prisma, PrismaClient, Quote, QuoteItem, QuoteBundle, Room } from '@prisma/client'
import { QuoteStatus } from '@prisma/client'
import { createPrismaClient } from '../lib/prisma'
import { BadRequestException, NotFoundException } from '../lib/errors'
import type {
  AddBundleData,
  AddItemData,
  AddRoomData,
  CreateQuoteData
} from '../schemas/quotes.schema'
import type { QuoteFilters } from '../schemas/quotes.schema'

// --- Tipos públicos exportados (consumidos por servicio y controladores) ---

// Resumen de cotización para listados. Incluye datos básicos del cliente
// y contadores de items y bundles (sin cargar el detalle completo).
export type QuoteSummary = Prisma.QuoteGetPayload<{
  include: {
    client: { select: { name: true; phone: true } }
    _count: { select: { items: true; bundles: true } }
  }
}>

// Detalle completo de cotización: cliente, rooms, items con product+room y
// bundles con su bundle y los items del bundle (para mostrar desglose).
// product se incluye con `brand: true` para que la vista de export pueda
// mostrar el brandName sin un join extra.
export type QuoteDetail = Prisma.QuoteGetPayload<{
  include: {
    client: true
    rooms: true
    items: { include: { product: { include: { brand: true } }; room: true } }
    bundles: {
      include: {
        bundle: {
          include: {
            items: { include: { product: true } }
          }
        }
      }
    }
  }
}>

// Resultado del recálculo de totales. Se persiste en Quote.estimatedSubtotal
// y Quote.estimatedTotal y se devuelve al servicio para que lo exponga al
// cliente HTTP.
export interface QuoteTotals {
  equipmentCost: number
  laborCost: number
  estimatedSubtotal: number
  estimatedTotal: number
}

// --- Interfaces de opciones ---

export interface QuotesPagination {
  skip: number
  take: number
}

export interface FindAllQuotesOptions {
  filters: QuoteFilters
  pagination: QuotesPagination
}

// --- Include compartido por el detalle de cotización ---
// Mantenerlo en un único lugar garantiza que todos los endpoints que devuelven
// QuoteDetail tengan exactamente el mismo shape (la forma de `items` y
// `bundles` es parte del contrato entre capas). El include profundo de
// product (con brand) es necesario para que el endpoint /summary pueda
// devolver brandName sin un join extra en el servicio.
const quoteDetailInclude = {
  client: true,
  rooms: { orderBy: { name: 'asc' } },
  items: {
    include: {
      product: { include: { brand: true } },
      room: true
    }
  },
  bundles: {
    include: {
      bundle: {
        include: {
          items: { include: { product: true } }
        }
      }
    }
  }
} as const

// Construye el where de Prisma a partir de los filtros de la capa superior.
// Aplica status, clientId y rango de fechas sobre createdAt.
function buildWhere(filters: QuoteFilters): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {}

  if (filters.status) {
    where.status = filters.status
  }
  if (filters.clientId) {
    where.clientId = filters.clientId
  }
  if (filters.fromDate || filters.toDate) {
    where.createdAt = {}
    if (filters.fromDate) {
      where.createdAt.gte = filters.fromDate
    }
    if (filters.toDate) {
      where.createdAt.lte = filters.toDate
    }
  }

  return where
}

// Mapa de transiciones de estado permitidas para una cotización.
// Cualquier estado puede transicionar a ARCHIVED. DRAFT no puede volver
// desde APPROVED (regla de negocio explícita).
const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.REVIEW, QuoteStatus.ARCHIVED],
  [QuoteStatus.REVIEW]: [QuoteStatus.FINAL, QuoteStatus.ARCHIVED],
  [QuoteStatus.FINAL]: [QuoteStatus.APPROVED, QuoteStatus.ARCHIVED],
  [QuoteStatus.APPROVED]: [QuoteStatus.ARCHIVED],
  [QuoteStatus.ARCHIVED]: []
}

export class QuotesRepository {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? createPrismaClient()
  }

  // Lista cotizaciones aplicando filtros y paginación a nivel DB.
  // Devuelve un array de QuoteSummary (cliente con name/phone + counts).
  async findAll(options: FindAllQuotesOptions): Promise<QuoteSummary[]> {
    const where = buildWhere(options.filters)

    return this.prisma.quote.findMany({
      where,
      include: {
        client: { select: { name: true, phone: true } },
        _count: { select: { items: true, bundles: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: options.pagination.skip,
      take: options.pagination.take
    })
  }

  // Cuenta cotizaciones que cumplen los filtros. Se usa en la capa de
  // servicio para componer la respuesta paginada.
  async countByFilters(filters: QuoteFilters): Promise<number> {
    const where = buildWhere(filters)
    return this.prisma.quote.count({ where })
  }

  // Devuelve el detalle completo de una cotización o null si no existe.
  async findById(id: string): Promise<QuoteDetail | null> {
    return this.prisma.quote.findUnique({
      where: { id },
      include: quoteDetailInclude
    })
  }

  // Devuelve la cotización sin relaciones. Se usa como verificación
  // barata de existencia (más eficiente que findById cuando no se
  // necesitan los includes).
  async findByIdSimple(id: string): Promise<Quote | null> {
    return this.prisma.quote.findUnique({
      where: { id }
    })
  }

  // Genera el siguiente quoteNumber para el año en curso.
  // Formato: COT-{YEAR}-{secuencia 3 dígitos}, p. ej. COT-2026-001.
  // La secuencia se reinicia cada año (la primera del 2026 es COT-2026-001
  // aunque la última del 2025 haya sido COT-2025-099).
  // Se implementa en JS (no en SQL) para mantener la portabilidad del repo
  // y porque la cardinalidad de cotizaciones por año es baja (cientos,
  // no millones). La unicidad la garantiza el índice @@unique del schema.
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `COT-${year}-`

    // Busca el último quoteNumber del año. Usamos startsWith + orderBy
    // descendente; Prisma no soporta LIKE ordenado por sufijo, pero el
    // orden lexicográfico inverso es equivalente al numérico cuando
    // todos los números tienen el mismo ancho (3 dígitos, zero-padded).
    const last = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true }
    })

    let nextSequence = 1
    if (last) {
      const lastSeq = last.quoteNumber.slice(prefix.length)
      const parsed = Number.parseInt(lastSeq, 10)
      if (Number.isFinite(parsed) && parsed > 0) {
        nextSequence = parsed + 1
      }
    }

    return `${prefix}${String(nextSequence).padStart(3, '0')}`
  }

  // Crea una nueva cotización en estado DRAFT con quoteNumber auto-generado.
  // El repositorio no aplica reglas de negocio; eso es responsabilidad de
  // la capa de servicio (verificar que el cliente exista, etc.).
  async create(data: CreateQuoteData): Promise<Quote> {
    const quoteNumber = await this.generateQuoteNumber()

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        clientId: data.clientId,
        projectName: data.projectName ?? null,
        projectAddress: data.projectAddress ?? null,
        notes: data.notes ?? null
      }
    })
  }

  // Agrega un item a la cotización. Si unitPrice no viene, el repositorio
  // NO lo calcula — esa es una regla de negocio que vive en el servicio
  // (porque requiere consultar ProductSupplier). El repositorio sólo
  // persiste los valores que el servicio ya resolvió.
  // Importante: el modelo QuoteItem tiene @@unique([quoteId, productId]),
  // por lo que agregar el mismo productId dos veces falla con P2002.
  // El servicio debe decidir si hace update o lanza ConflictException.
  async addItem(quoteId: string, itemData: AddItemData): Promise<QuoteItem> {
    return this.prisma.quoteItem.create({
      data: {
        quoteId,
        productId: itemData.productId,
        roomId: itemData.roomId ?? null,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice ?? null,
        estimatedInstall: itemData.estimatedInstall ?? null
      }
    })
  }

  // Elimina items de una cotización.
  // - Si roomId viene, elimina solo el item específico (productId+roomId).
  //   Como @@unique es (quoteId, productId), Prisma necesita un where
  //   compuesto. Usamos deleteMany que soporta ese where directamente.
  // - Si roomId NO viene, elimina TODOS los items de ese productId en la quote
  //   (esto es coherente con la regla "si no se especifica room, quitar de
  //   toda la cotización").
  async removeItem(
    quoteId: string,
    productId: string,
    roomId?: string
  ): Promise<void> {
    if (roomId) {
      await this.prisma.quoteItem.deleteMany({
        where: { quoteId, productId, roomId }
      })
    } else {
      await this.prisma.quoteItem.deleteMany({
        where: { quoteId, productId }
      })
    }
  }

  // Asocia un bundle a la cotización. La PK compuesta es (quoteId, bundleId),
  // por lo que cada combinación es única.
  async addBundle(
    quoteId: string,
    bundleData: AddBundleData
  ): Promise<QuoteBundle> {
    return this.prisma.quoteBundle.create({
      data: {
        quoteId,
        bundleId: bundleData.bundleId,
        quantity: bundleData.quantity
      }
    })
  }

  // Crea una nueva room (zona física) en la cotización.
  async addRoom(quoteId: string, roomData: AddRoomData): Promise<Room> {
    return this.prisma.room.create({
      data: {
        quoteId,
        name: roomData.name,
        floor: roomData.floor ?? null,
        areaSqm: roomData.areaSqm ?? null
      }
    })
  }

  // Lista rooms de una cotización (ordenadas por name). Usado por el
  // servicio para implementar la regla "usar la primera room o crear
  // una default 'General'" en addItemToQuote cuando no llega roomId.
  async findFirstRoom(quoteId: string): Promise<Room | null> {
    return this.prisma.room.findFirst({
      where: { quoteId },
      orderBy: { name: 'asc' }
    })
  }

  // Crea una room "default" cuando la cotización aún no tiene ninguna.
  // Es una operación de infraestructura del servicio, no un endpoint
  // público; vive aquí para mantener la query cerca del modelo.
  async createDefaultRoom(quoteId: string, name: string): Promise<Room> {
    return this.prisma.room.create({
      data: {
        quoteId,
        name
      }
    })
  }

  // Cambia el estado de la cotización validando la transición permitida.
  // Lanza NotFoundException si la quote no existe.
  // Lanza BadRequestException si la transición no está permitida.
  async updateStatus(
    quoteId: string,
    newStatus: QuoteStatus
  ): Promise<Quote> {
    const current = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true }
    })

    if (!current) {
      throw new NotFoundException(
        `Cotización con id "${quoteId}" no encontrada`
      )
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transición de estado inválida: ${current.status} → ${newStatus}. ` +
          `Transiciones permitidas desde ${current.status}: ${allowed.join(
            ', '
          ) || 'ninguna'}`
      )
    }

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: newStatus }
    })
  }

  // Recalcula los totales de la cotización a partir de sus items y bundles.
  // - equipmentCost = Σ(item.quantity × item.unitPrice) + Σ(bundle.quantity × bundle.basePrice)
  // - laborCost = pricingService.calculateLaborCost(deviceCount, electricianDays)
  // - estimatedSubtotal = equipmentCost × 1.45 (MARGIN_EQUIPMENT) + laborCost × 1.40 (MARGIN_LABOR)
  // - estimatedTotal = estimatedSubtotal × 1.19 (IVA_RATE)
  // Persiste los totales en la quote y los retorna al servicio.
  // Esta función es PURA en su cálculo: no delega pricing al servicio
  // para mantener el repo autocontenido y testeable. El servicio la llama
  // cuando necesita refrescar los totales.
  async recalculateTotals(
    quoteId: string,
    equipmentCost: number,
    laborCost: number,
    estimatedSubtotal: number,
    estimatedTotal: number
  ): Promise<QuoteTotals> {
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        estimatedSubtotal,
        estimatedTotal
      }
    })

    return {
      equipmentCost,
      laborCost,
      estimatedSubtotal,
      estimatedTotal
    }
  }

  // Helpers de lectura para que el servicio pueda calcular el equipo y la
  // mano de obra sin pasar por Prisma directamente (mantiene el principio
  // de que el servicio NO habla con Prisma).

  // Items de la cotización con el producto incluido (necesario para
  // calcular el equipment cost: sumamos quantity × unitPrice en el servicio).
  async findItems(quoteId: string): Promise<QuoteItem[]> {
    return this.prisma.quoteItem.findMany({
      where: { quoteId }
    })
  }

  // Bundles de la cotización con el bundle base (necesario para
  // bundle.basePrice).
  async findBundles(quoteId: string): Promise<QuoteBundle[]> {
    return this.prisma.quoteBundle.findMany({
      where: { quoteId }
    })
  }

  // Recupera el basePrice de un bundle. Lanza NotFoundException si el
  // bundle no existe.
  async findBundleBasePrice(bundleId: string): Promise<number> {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId },
      select: { basePrice: true }
    })

    if (!bundle) {
      throw new NotFoundException(
        `Bundle con id "${bundleId}" no encontrado`
      )
    }

    return bundle.basePrice ? bundle.basePrice.toNumber() : 0
  }

  // Versión batch de findBundleBasePrice para evitar N+1 en el recálculo
  // de totales. Devuelve un Map id -> basePrice (Decimal | null).
  async findBundleBasePrices(
    bundleIds: string[]
  ): Promise<Map<string, Prisma.Decimal | null>> {
    if (bundleIds.length === 0) {
      return new Map()
    }
    const records = await this.prisma.bundle.findMany({
      where: { id: { in: bundleIds } },
      select: { id: true, basePrice: true }
    })
    return new Map(records.map((b) => [b.id, b.basePrice]))
  }

  // Recupera el unitPrice del supplier preferido de un producto. Devuelve
  // null si no hay supplier preferido o si el precio es null.
  async findPreferredSupplierPrice(
    productId: string
  ): Promise<number | null> {
    const link = await this.prisma.productSupplier.findFirst({
      where: { productId, isPreferredSupplier: true },
      select: { price: true }
    })

    if (!link || !link.price) {
      return null
    }

    return link.price.toNumber()
  }

  // Verifica que un producto exista. Lanza NotFoundException si no existe.
  async ensureProductExists(productId: string): Promise<void> {
    const exists = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    })

    if (!exists) {
      throw new NotFoundException(
        `Producto con id "${productId}" no encontrado`
      )
    }
  }

  // Verifica que un cliente exista. Se usa desde el servicio al crear
  // cotizaciones para validar la FK antes de delegar al create.
  async ensureClientExists(clientId: string): Promise<void> {
    const exists = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(
        `Cliente con id "${clientId}" no encontrado`
      )
    }
  }
}
