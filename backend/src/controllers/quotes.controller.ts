import { FastifyRequest, FastifyReply } from 'fastify'
import type { Prisma } from '@prisma/client'
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
  req: FastifyRequest<{ Body: Prisma.QuoteCreateInput }>,
  reply: FastifyReply
) {
  const quote = await service.create(req.body)
  return reply.code(201).send(quote)
}
