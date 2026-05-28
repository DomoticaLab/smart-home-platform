import { FastifyRequest, FastifyReply } from 'fastify'
import { BundlesService } from '../services/bundles.service'

const service = new BundlesService()

export async function getBundles(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const bundles = await service.findAll()
  return reply.send(bundles)
}

export async function getBundleBySlug(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  const bundle = await service.findBySlug(req.params.slug)
  if (!bundle) {
    return reply.status(404).send({ error: 'Not found' })
  }
  return reply.send(bundle)
}
