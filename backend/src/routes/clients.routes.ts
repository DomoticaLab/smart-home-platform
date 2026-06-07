import type { FastifyInstance } from 'fastify'
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient
} from '../controllers/clients.controller'

// Rutas del recurso clients. Se registran bajo el prefijo /api/clients
// en src/routes/index.ts. Mantener las rutas CRUD estándar:
//   GET    /          → listar con paginación y búsqueda
//   GET    /:id       → detalle
//   POST   /          → crear
//   PUT    /:id       → actualizar
//   DELETE /:id       → eliminar
export default async function clientsRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get('/', getClients)
  app.get('/:id', getClientById)
  app.post('/', createClient)
  app.put('/:id', updateClient)
  app.delete('/:id', deleteClient)
}
