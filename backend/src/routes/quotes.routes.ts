import type { FastifyInstance } from 'fastify'
import {
  addBundle,
  addItem,
  addRoom,
  changeStatus,
  createQuote,
  duplicateQuote,
  getQuoteById,
  getQuoteSummary,
  getQuotes,
  removeItem
} from '../controllers/quotes.controller'

// Rutas del recurso quotes. Se registran bajo el prefijo /api/quotes
// en src/routes/index.ts. La convención sigue el estándar REST:
//   GET    /                  → listado paginado con filtros
//   GET    /:id               → detalle completo
//   POST   /                  → crear
//   POST   /:id/rooms         → agregar room
//   POST   /:id/items         → agregar item
//   DELETE /:id/items/:productId → eliminar item(es)
//   POST   /:id/bundles       → asociar bundle
//   PATCH  /:id/status        → cambiar estado (DRAFT|REVIEW|FINAL|APPROVED|ARCHIVED)
//   POST   /:id/duplicate     → duplicar como nueva cotización DRAFT
//   GET    /:id/summary       → vista estructurada para export a PDF
export default async function quotesRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get('/', getQuotes)
  app.get('/:id', getQuoteById)
  app.post('/', createQuote)
  app.post('/:id/rooms', addRoom)
  app.post('/:id/items', addItem)
  app.delete('/:id/items/:productId', removeItem)
  app.post('/:id/bundles', addBundle)
  app.patch('/:id/status', changeStatus)
  app.post('/:id/duplicate', duplicateQuote)
  app.get('/:id/summary', getQuoteSummary)
}
