import type { Prisma } from '@prisma/client'
import { ClientsRepository } from '../repositories/clients.repo'

const repo = new ClientsRepository()

export class ClientsService {
  async findAll() {
    return repo.findAll()
  }

  async findById(id: string) {
    return repo.findById(id)
  }

  async create(data: Prisma.ClientCreateInput) {
    return repo.create(data)
  }
}
