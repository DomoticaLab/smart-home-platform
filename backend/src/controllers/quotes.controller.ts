import { FastifyRequest, FastifyReply } from 'fastify'
import { QuotesService } from '../services/quotes.service'

const service = new QuotesService()

export async function getQuotes(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const quotes = await service.findAll()
  return reply.send(quotes)
}

export async function getQuoteById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const quote = await service.findById(req.params.id)
  if (!quote) {
    return reply.status(404).send({ error: 'Not found' })
  }
  return reply.send(quote)
}

export async function createQuote(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const quote = await service.create(req.body as any)
  return reply.status(201).send(quote)
}
