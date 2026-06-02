import type { FastifyInstance } from 'fastify'
import productRoutes from './products.routes'
import bundleRoutes from './bundles.routes'
import clientsRoutes from './clients.routes'
import quoteRoutes from './quotes.routes'

export function registerRoutes(app: FastifyInstance) {
  app.register(productRoutes, { prefix: '/api/products' })
  app.register(bundleRoutes, { prefix: '/api/bundles' })
  app.register(clientsRoutes, { prefix: '/api/clients' })
  app.register(quoteRoutes, { prefix: '/api/quotes' })

  app.get('/api/health', async () => ({
    status: 'ok' as const,
    timestamp: new Date()
  }))
}
