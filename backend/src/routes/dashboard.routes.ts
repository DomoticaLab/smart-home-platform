import type { FastifyInstance } from 'fastify'
import { getDashboard } from '../controllers/dashboard.controller'

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', getDashboard)
}