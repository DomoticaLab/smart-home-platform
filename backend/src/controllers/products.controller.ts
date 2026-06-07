import type { FastifyReply, FastifyRequest } from 'fastify'
import { ProductsService } from '../services/products.service'
import {
  CapabilityCodeParamSchema,
  GetProductsQuerySchema,
  HubSlugParamSchema,
  ProtocolSlugParamSchema,
  TierParamSchema,
  VALID_CAPABILITY_CODES,
  VALID_TIERS
} from '../schemas/products.schema'
import { BadRequestException, NotFoundException } from '../lib/errors'

const service = new ProductsService()

// Lista de productos con filtros + paginación.
// Query params validados con Zod; respuesta 400 si el query es inválido.
export async function getProducts(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = GetProductsQuerySchema.safeParse(req.query)

  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Query inválida en GET /api/products'
    )
    return reply.code(400).send({
      error: 'Invalid query parameters',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  const { page, limit, ...filters } = parsed.data

  try {
    const result = await service.getProducts(filters, { page, limit })
    return reply.code(200).send(result)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado listando productos')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Devuelve el detalle de un producto por slug.
// Responde 404 si no existe; 500 ante cualquier error inesperado.
export async function getProductBySlug(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { slug } = req.params

  try {
    const product = await service.getProductBySlug(slug)
    return reply.code(200).send(product)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error({ err, slug }, 'Error inesperado obteniendo producto por slug')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Lista los productos cuyo protocolo primario coincide con el slug.
// Devuelve [] si no hay coincidencias. 400 sólo si el slug llega vacío.
export async function getByProtocol(
  req: FastifyRequest<{ Params: { protocolSlug: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = ProtocolSlugParamSchema.safeParse(req.params.protocolSlug)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'protocolSlug inválido en GET /by-protocol/:protocolSlug'
    )
    return reply.code(400).send({
      error: 'Invalid path parameter',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const products = await service.getByProtocol(parsed.data)
    return reply.code(200).send(products)
  } catch (err) {
    req.log.error(
      { err, protocolSlug: parsed.data },
      'Error inesperado listando productos por protocolo'
    )
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Lista los productos con un recommendedTier concreto.
// 400 con lista de valores válidos si el tier no es un RecommendedTier.
export async function getByTier(
  req: FastifyRequest<{ Params: { tier: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = TierParamSchema.safeParse(req.params.tier)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Tier inválido en GET /by-tier/:tier'
    )
    return reply.code(400).send({
      error: `Tier inválido. Valores válidos: ${VALID_TIERS.join(', ')}`,
      statusCode: 400,
      validValues: VALID_TIERS
    })
  }

  try {
    const products = await service.getByTier(parsed.data)
    return reply.code(200).send(products)
  } catch (err) {
    if (err instanceof BadRequestException) {
      return reply.code(400).send({
        error: err.message,
        statusCode: 400
      })
    }
    req.log.error(
      { err, tier: parsed.data },
      'Error inesperado listando productos por tier'
    )
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Lista los productos que tienen una capability específica.
// 400 con lista de valores válidos si el code no es un CapabilityCode.
export async function getByCapability(
  req: FastifyRequest<{ Params: { code: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = CapabilityCodeParamSchema.safeParse(req.params.code)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'Capability code inválido en GET /by-capability/:code'
    )
    return reply.code(400).send({
      error: `Capability code inválido. Valores válidos: ${VALID_CAPABILITY_CODES.join(', ')}`,
      statusCode: 400,
      validValues: VALID_CAPABILITY_CODES
    })
  }

  try {
    const products = await service.getByCapability(parsed.data)
    return reply.code(200).send(products)
  } catch (err) {
    if (err instanceof BadRequestException) {
      return reply.code(400).send({
        error: err.message,
        statusCode: 400
      })
    }
    req.log.error(
      { err, code: parsed.data },
      'Error inesperado listando productos por capability'
    )
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Lista los productos compatibles con el hub indicado.
// 404 si el hub no existe.
export async function getCompatibleWithHub(
  req: FastifyRequest<{ Params: { hubSlug: string } }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const parsed = HubSlugParamSchema.safeParse(req.params.hubSlug)
  if (!parsed.success) {
    req.log.warn(
      { issues: parsed.error.issues },
      'hubSlug inválido en GET /compatible-with/:hubSlug'
    )
    return reply.code(400).send({
      error: 'Invalid path parameter',
      statusCode: 400,
      issues: parsed.error.issues
    })
  }

  try {
    const products = await service.getCompatibleWithHub(parsed.data)
    return reply.code(200).send(products)
  } catch (err) {
    if (err instanceof NotFoundException) {
      return reply.code(404).send({
        error: err.message,
        statusCode: 404
      })
    }
    req.log.error(
      { err, hubSlug: parsed.data },
      'Error inesperado listando productos compatibles con hub'
    )
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}

// Devuelve el resumen agregado del catálogo (totales por tipo/tier + inStock).
// No recibe parámetros: no hay validación previa.
export async function getCatalogSummary(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const summary = await service.getCatalogSummary()
    return reply.code(200).send(summary)
  } catch (err) {
    req.log.error({ err }, 'Error inesperado generando resumen de catálogo')
    return reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  }
}
