import type { FastifyReply, FastifyRequest } from 'fastify'
import { QuotesService } from '../services/quotes.service'
import {
  AddBundleSchema,
  AddItemSchema,
  AddRoomSchema,
  ChangeStatusSchema,
  CreateQuoteSchema,
  GetQuotesQuerySchema
} from '../schemas/quotes.schema'
import {
  BadRequestException,
  NotFoundException
} from '../lib/errors'

const service = new QuotesService()

// --- Handlers ---
// Mapeo uniforme de excepciones de dominio a códigos HTTP:
// - NotFoundException    → 404
// - BadRequestException  → 400
// - ConflictException    → 409
// - Error genérico       → 500 con log estructurado (Pino)

// GET /api/quotes
// Query params validados con Zod (filtros + paginación). 400 si el query es
// inválido; 500 ante cualquier error inesperado.
export async function getQuotes(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = GetQuotesQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Query inválida en GET /api/quotes'
    )
    return reply.code(400).send({
      error: 'Invalid query parameters',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const result = await service.getQuotes(parsed.data)
    return reply.code(200).send(result)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado listando cotizaciones')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// GET /api/quotes/:id
// Devuelve el detalle completo de una cotización. 404 si no existe;
// 500 ante cualquier error inesperado.
export async function getQuoteById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params
  try {
    const quote = await service.getQuoteById(id)
    return reply.code(200).send(quote)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    req.log.error({ err, id }, 'Error inesperado obteniendo cotización')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/quotes
// Crea una cotización en DRAFT. 400 si el body es inválido; 404 si el
// cliente no existe; 201 con la cotización creada.
export async function createQuote(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = CreateQuoteSchema.safeParse(req.body)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Body inválido en POST /api/quotes'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const quote = await service.createQuote(
      parsed.data.clientId,
      parsed.data.projectName,
      parsed.data.projectAddress,
      parsed.data.notes
    )
    return reply.code(201).send(quote)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    req.log.error({ err }, 'Error inesperado creando cotización')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/quotes/:id/rooms
// Crea una nueva room (zona física) en la cotización. 400 si el body es
// inválido; 404 si la cotización no existe; 409 si la cotización no está
// en DRAFT (BadRequestException del servicio).
export async function addRoom(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  const parsed = AddRoomSchema.safeParse(req.body)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues, quoteId: id },
      'Body inválido en POST /api/quotes/:id/rooms'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const room = await service.addRoomToQuote(
      id,
      parsed.data.name,
      parsed.data.floor,
      parsed.data.areaSqm
    )
    return reply.code(201).send(room)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado agregando room')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/quotes/:id/items
// Agrega un item a la cotización. 400 si body inválido; 404 si la quote
// o el producto no existen; 400 si la quote no está en DRAFT.
export async function addItem(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  const parsed = AddItemSchema.safeParse(req.body)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues, quoteId: id },
      'Body inválido en POST /api/quotes/:id/items'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const item = await service.addItemToQuote(
      id,
      parsed.data.productId,
      parsed.data.quantity,
      parsed.data.roomId,
      parsed.data.unitPrice,
      parsed.data.estimatedInstall
    )
    return reply.code(201).send(item)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado agregando item')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// DELETE /api/quotes/:id/items/:productId
// Query opcional: roomId (si no viene, elimina todos los items de ese
// productId en la cotización).
export async function removeItem(
  req: FastifyRequest<{
    Params: { id: string; productId: string }
    Querystring: { roomId?: string }
  }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id, productId } = req.params
  const { roomId } = req.query

  try {
    await service.removeItemFromQuote(id, productId, roomId)
    return reply.code(204).send()
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error(
      { err, quoteId: id, productId, roomId },
      'Error inesperado eliminando item'
    )
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/quotes/:id/bundles
// Asocia un bundle a la cotización. 400 si body inválido; 404 si la
// cotización no existe; 400 si la cotización no está en DRAFT o el
// bundle no existe.
export async function addBundle(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  const parsed = AddBundleSchema.safeParse(req.body)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues, quoteId: id },
      'Body inválido en POST /api/quotes/:id/bundles'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const quoteBundle = await service.addBundleToQuote(
      id,
      parsed.data.bundleId,
      parsed.data.quantity
    )
    return reply.code(201).send(quoteBundle)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado agregando bundle')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// PATCH /api/quotes/:id/status
// Cambia el estado de la cotización. 400 si body inválido o transición
// no permitida; 404 si la cotización no existe.
export async function changeStatus(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  const parsed = ChangeStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues, quoteId: id },
      'Body inválido en PATCH /api/quotes/:id/status'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const quote = await service.changeQuoteStatus(id, parsed.data.status)
    return reply.code(200).send(quote)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado cambiando status')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/quotes/:id/duplicate
// Duplica una cotización en DRAFT. 404 si no existe; 400 si no tiene
// cliente asociado; 201 con la nueva cotización.
export async function duplicateQuote(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params
  try {
    const quote = await service.duplicateQuote(id)
    return reply.code(201).send(quote)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    if (err instanceof BadRequestException) {
      return reply.code(400).send({ error: err.message, statusCode: 400 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado duplicando cotización')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// GET /api/quotes/:id/summary
// Devuelve el objeto estructurado para exportar a PDF. 404 si no existe.
export async function getQuoteSummary(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params
  try {
    const summary = await service.getQuoteSummary(id)
    return reply.code(200).send(summary)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({ error: err.message, statusCode: 404 })
    }
    req.log.error({ err, quoteId: id }, 'Error inesperado generando summary')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}
