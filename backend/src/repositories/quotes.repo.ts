import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export class QuotesRepository {
  async findAll() {
    return prisma.quote.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id: string) {
    return prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: true } },
        rooms: true,
        bundles: { include: { bundle: true } }
      }
    })
  }

  async create(data: Prisma.QuoteCreateInput) {
    return prisma.quote.create({ data })
  }
}
