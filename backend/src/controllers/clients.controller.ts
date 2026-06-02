import { FastifyReply, FastifyRequest } from 'fastify'
import type { Prisma } from '@prisma/client'
import { ClientsService } from '../services/clients.service'

const service = new ClientsService()

export async function getClients(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const clients = await service.findAll()
  return reply.send(clients)
}

export async function getClientById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const client = await service.findById(req.params.id)
  if (!client) {
    return reply.code(404).send({ error: 'Not found' })
  }
  return reply.send(client)
}

export async function createClient(
  req: FastifyRequest<{ Body: Prisma.ClientCreateInput }>,
  reply: FastifyReply
) {
  const client = await service.create(req.body)
  return reply.code(201).send(client)
}
