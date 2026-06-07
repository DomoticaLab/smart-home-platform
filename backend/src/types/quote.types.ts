// Tipos compartidos por las capas de cotizaciones.
// - QuoteFilters y GetQuotesQuery: re-exportados desde el schema de Zod
//   para tener una única definición canónica.
// - QuoteSummary, QuoteDetail, QuoteTotals: exportados desde el repositorio
//   (cercanía al Prisma include que les da forma).
// - QuoteSummaryExport vive en el servicio porque es un contrato del servicio
//   con la capa de presentación (export a PDF).

// Re-export del tipo canónico de filtros (Zod-inferred) para que el resto
// del codebase importe siempre desde este punto y no se produzcan
// duplicaciones.
export type {
  QuoteFilters,
  GetQuotesQuery,
  CreateQuoteData,
  AddItemData,
  AddBundleData,
  AddRoomData,
  ChangeStatusData
} from '../schemas/quotes.schema'

// Re-exports de tipos del repositorio (cercanía al Prisma include).
export type {
  QuoteSummary,
  QuoteDetail,
  QuoteTotals
} from '../repositories/quotes.repo'

// Re-export del tipo de export del servicio.
export type { QuoteSummaryExport } from '../services/quotes.service'

// Re-export de PaginatedResponse para que la capa de quotes no tenga que
// importar desde product.types.ts.
export type { PaginatedResponse } from './product.types'
