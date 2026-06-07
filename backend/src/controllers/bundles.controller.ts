import type { FastifyReply, FastifyRequest } from 'fastify'
import { BundlesService } from '../services/bundles.service'
import { GetBundlesQuerySchema } from '../schemas/bundles.schema'
import { NotFoundException } from '../lib/errors'

const service = new BundlesService()

// Lista de bundles con filtros + paginación.
// Query params validados con Zod; respuesta 400 si el query es inválido.
export async function getBundles(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = GetBundlesQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Query inválida en GET /api/bundles'
    )
    return reply.code(400).send({
      error: 'Invalid query parameters',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  const { page, limit, ...filters } = parsed.data

  try {
    const result = await service.getBundles(filters, { page, limit })
    return reply.code(200).send(result)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado listando bundles')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Devuelve el detalle de un bundle por slug.
// Responde 404 si no existe; 500 ante cualquier error inesperado.
export async function getBundleBySlug(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { slug } = req.params

  try {
    const bundle = await service.getBundleBySlug(slug)
    return reply.code(200).send(bundle)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error({ err, slug }, 'Error inesperado obteniendo bundle por slug')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Devuelve el desglose de precio (equipos + mano de obra + total) de un bundle.
// Responde 404 si el slug no existe; 500 ante cualquier error inesperado.
export async function getBundlePrice(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { slug } = req.params

  try {
    const price = await service.getBundlePrice(slug)
    return reply.code(200).send(price)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error({ err, slug }, 'Error inesperado calculando precio de bundle')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}
