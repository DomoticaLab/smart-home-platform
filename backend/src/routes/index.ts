import { FastifyInstance } from 'fastify'
import productRoutes from './products.routes'
import quoteRoutes from './quotes.routes'
import bundleRoutes from './bundles.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(productRoutes, { prefix: '/api/products' })
  app.register(quoteRoutes,   { prefix: '/api/quotes' })
  app.register(bundleRoutes,  { prefix: '/api/bundles' })
}
