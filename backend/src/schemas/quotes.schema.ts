import { z } from 'zod'
import { QuoteStatus } from '@prisma/client'

// Helper: convierte el string recibido en query string a un valor del enum
// QuoteStatus, normalizando cadenas vacías a undefined para que el
// `.optional()` las descarte.
const quoteStatusFromQuery = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.enum(QuoteStatus).optional()
)

// Helper: convierte el string recibido en query string a Date. Acepta
// el string nativo ISO 8601 que llega en la URL.
const dateFromQuery = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida')
    .transform((v) => new Date(v))
    .optional()
)

// Filtros base de cotización expuestos por GET /api/quotes.
// Todos los campos son opcionales; las cadenas vacías se normalizan a undefined.
export const QuoteFiltersSchema = z.object({
  status: quoteStatusFromQuery,
  clientId: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().uuid('clientId debe ser un UUID válido').optional()
  ),
  fromDate: dateFromQuery,
  toDate: dateFromQuery
})

// Query completa: filtros + paginación con valores por defecto seguros.
export const GetQuotesQuerySchema = QuoteFiltersSchema.extend({
  page: z.preprocess(
    (value) => (value === '' || value === undefined ? 1 : Number(value)),
    z.number().int().min(1, 'page debe ser >= 1').default(1)
  ),
  limit: z.preprocess(
    (value) => (value === '' || value === undefined ? 20 : Number(value)),
    z
      .number()
      .int()
      .min(1, 'limit debe ser >= 1')
      .max(100, 'limit máximo 100')
      .default(20)
  )
})

// Body para POST /api/quotes. Crea una cotización en estado DRAFT.
// El quoteNumber se genera en el repositorio; el cliente nunca lo envía.
export const CreateQuoteSchema = z.object({
  clientId: z.string().uuid('clientId debe ser un UUID válido'),
  projectName: z.string().max(200, 'projectName demasiado largo').optional(),
  projectAddress: z
    .string()
    .max(300, 'projectAddress demasiado largo')
    .optional(),
  notes: z.string().max(1000, 'notes demasiado largas').optional()
})

// Body para POST /api/quotes/:id/items.
// Si no se envía unitPrice, el servicio lo calcula como
// preferredPrice × 1.45 (margen de equipos).
export const AddItemSchema = z.object({
  productId: z.string().uuid('productId debe ser un UUID válido'),
  roomId: z.string().uuid('roomId debe ser un UUID válido').optional(),
  quantity: z
    .number()
    .int('quantity debe ser entero')
    .min(1, 'quantity debe ser >= 1'),
  unitPrice: z.number().min(0, 'unitPrice debe ser >= 0').optional(),
  estimatedInstall: z
    .number()
    .int('estimatedInstall debe ser entero')
    .min(0, 'estimatedInstall debe ser >= 0')
    .optional()
})

// Body para POST /api/quotes/:id/bundles.
// El precio del bundle se calcula en el servicio como bundle.basePrice ×
// quantity. El campo `roomId` no se persiste porque el modelo QuoteBundle
// actual no tiene esa relación; queda como TODO a nivel de schema.
export const AddBundleSchema = z.object({
  bundleId: z.string().uuid('bundleId debe ser un UUID válido'),
  quantity: z
    .number()
    .int('quantity debe ser entero')
    .min(1, 'quantity debe ser >= 1')
})

// Body para POST /api/quotes/:id/rooms. Crea una nueva zona (sala,
// habitación, etc.) en la cotización.
export const AddRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'name requerido')
    .max(100, 'name demasiado largo'),
  floor: z.number().int().min(0, 'floor debe ser >= 0').optional(),
  areaSqm: z.number().positive('areaSqm debe ser > 0').optional()
})

// Body para PATCH /api/quotes/:id/status. Cambia el estado de la
// cotización. Las transiciones válidas se validan en el servicio.
export const ChangeStatusSchema = z.object({
  status: z.enum(QuoteStatus)
})

// Tipos inferidos consumidos por la capa de servicio y repositorio.
// Mantener una única fuente de verdad (Zod) evita drift entre capas.
export type QuoteFilters = z.infer<typeof QuoteFiltersSchema>
export type GetQuotesQuery = z.infer<typeof GetQuotesQuerySchema>
export type CreateQuoteData = z.infer<typeof CreateQuoteSchema>
export type AddItemData = z.infer<typeof AddItemSchema>
export type AddBundleData = z.infer<typeof AddBundleSchema>
export type AddRoomData = z.infer<typeof AddRoomSchema>
export type ChangeStatusData = z.infer<typeof ChangeStatusSchema>
