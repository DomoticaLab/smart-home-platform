import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClientsService } from '../services/clients.service'
import {
  ClientSearchSchema,
  CreateClientSchema,
  UpdateClientSchema
} from '../schemas/clients.schema'
import {
  ConflictException,
  NotFoundException
} from '../lib/errors'

const service = new ClientsService()

// GET /api/clients
// Query params validados con Zod. 400 si el query es inválido.
export async function getClients(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = ClientSearchSchema.safeParse(req.query)

  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Query inválida en GET /api/clients'
    )
    return reply.code(400).send({
      error: 'Invalid query parameters',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  const { search, page, limit } = parsed.data

  try {
    const result = await service.getClients(search, { page, limit })
    return reply.code(200).send(result)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado listando clientes')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// GET /api/clients/:id
// 200 con el detalle; 404 si no existe; 500 ante cualquier error inesperado.
export async function getClientById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  try {
    const client = await service.getClientById(id)
    return reply.code(200).send(client)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error({ err, id }, 'Error inesperado obteniendo cliente por id')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// POST /api/clients
// Body validado con Zod. 400 si el body es inválido; 201 con el cliente creado.
export async function createClient(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = CreateClientSchema.safeParse(req.body)

  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Body inválido en POST /api/clients'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const client = await service.createClient(parsed.data)
    return reply.code(201).send(client)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado creando cliente')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// PUT /api/clients/:id
// Body validado con Zod (partial). 400 si el body es inválido; 404 si el
// id no existe; 200 con el cliente actualizado; 500 ante errores inesperados.
export async function updateClient(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  const parsed = UpdateClientSchema.safeParse(req.body)

  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Body inválido en PUT /api/clients/:id'
    )
    return reply.code(400).send({
      error: 'Invalid request body',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const client = await service.updateClient(id, parsed.data)
    return reply.code(200).send(client)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error({ err, id }, 'Error inesperado actualizando cliente')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// DELETE /api/clients/:id
// 204 si elimina correctamente; 404 si el id no existe; 409 si el cliente
// tiene cotizaciones activas; 500 ante errores inesperados.
export async function deleteClient(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { id } = req.params

  try {
    await service.deleteClient(id)
    return reply.code(204).send()
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    if (err instanceof ConflictException) {
      return reply.code(409).send({
        error: err.message,
        statusCode: 409
      })
    }
    req.log.error({ err, id }, 'Error inesperado eliminando cliente')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}
