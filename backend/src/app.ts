import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { registerRoutes } from './routes/index'
import { config } from './lib/config'

const isDevelopment = config.nodeEnv === 'development'

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              singleLine: true
            }
          }
        : undefined
    }
  })

  app.register(cors, {
    origin: isDevelopment ? true : false
  })
  app.register(sensible)
  registerRoutes(app)

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      path: request.url,
      statusCode: 404
    })
  })

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Unhandled application error')
    reply.code(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    })
  })

  return app
}
