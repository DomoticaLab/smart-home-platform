import type { FastifyInstance } from 'fastify'
import {
  createClient,
  getClientById,
  getClients
} from '../controllers/clients.controller'

export default async function clientsRoutes(
  app: FastifyInstance
) {
  app.get('/', getClients)
  app.get('/:id', getClientById)
  app.post('/', createClient)
}
