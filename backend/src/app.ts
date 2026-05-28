import Fastify from 'fastify'
import { registerRoutes } from './routes/index'

export function buildApp() {
  const app = Fastify({ logger: true })
  registerRoutes(app)
  return app
}
