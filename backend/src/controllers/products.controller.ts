import { FastifyRequest, FastifyReply } from 'fastify'
import { ProductsService } from '../services/products.service'

const service = new ProductsService()

export async function getProducts(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const products = await service.findAll()
  return reply.send(products)
}

export async function getProductBySlug(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  const product = await service.findBySlug(req.params.slug)
  if (!product) {
    return reply.status(404).send({ error: 'Not found' })
  }
  return reply.send(product)
}
