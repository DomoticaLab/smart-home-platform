import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export class ClientsRepository {
  async findAll() {
    return prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  async create(data: Prisma.ClientCreateInput) {
    return prisma.client.create({ data })
  }
}
