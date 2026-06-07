import Fastify, { type FastifyInstance } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { registerRoutes } from './routes/index'
import { config } from './lib/config'
import { prisma } from './lib/prisma'
import { loggerOptions, installRequestLogger } from './plugins/logger'
import { installErrorHandler } from './plugins/errorHandler'

const isDevelopment = config.nodeEnv === 'development'

// Leemos la versión del package.json una sola vez al levantar el módulo.
// En runtime `__dirname` apunta a `dist/`; el `..` nos lleva a la raíz del
// proyecto donde vive package.json.
const packageJsonPath = path.resolve(__dirname, '..', 'package.json')
const packageJson = JSON.parse(
  fs.readFileSync(packageJsonPath, 'utf-8')
) as { version: string }
const APP_VERSION: string = packageJson.version

export function buildApp(): FastifyInstance {
  // Opciones de Pino compartidas con el plugin (mismo nivel, redaction, etc).
  const app = Fastify({ logger: loggerOptions })

  // 1) Logger hook: enriquece req.log con reqId y route estructurados.
  //    Se instala en el root context (no vía `app.register`) para que se
  //    herede por todos los `app.register` posteriores.
  installRequestLogger(app)

  // 2) Error handler: instalado en el root context para que se herede a
  //    TODOS los `app.register` posteriores (cors, sensible, routes, etc).
  //    No usamos `app.register` aquí porque crearía un child context cuyo
  //    handler no se hereda hacia los siblings/parent. Ver comentario en
  //    `plugins/errorHandler.ts` para más detalle.
  installErrorHandler(app)

  // 3) Plugins de infraestructura.
  app.register(cors, {
    origin: isDevelopment ? true : false
  })
  app.register(sensible)

  // 4) Health checks (después de plugins, antes de rutas de negocio).

  /**
   * GET /health
   * Liveness probe: indica que el proceso está vivo. No toca la DB.
   *
   * @returns 200 - { status: 'ok', uptime: number, timestamp: string, version: string }
   *
   * @example
   *   $ curl http://localhost:3000/health
   *   { "status": "ok", "uptime": 12.34, "timestamp": "2026-06-05T12:34:56.789Z", "version": "0.1.0" }
   */
  app.get('/health', async () => ({
    status: 'ok' as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: APP_VERSION
  }))

  /**
   * GET /health/db
   * Readiness probe: verifica que la conexión a PostgreSQL responde
   * ejecutando un `SELECT 1` crudo vía Prisma.
   *
   * @returns 200 - { status: 'ok', db: 'connected' } si el ping fue exitoso
   * @returns 503 - { status: 'fail', db: 'disconnected', reason: 'Database ping failed' } si falló
   *
   * @example
   *   $ curl http://localhost:3000/health/db
   *   { "status": "ok", "db": "connected" }
   */
  app.get('/health/db', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      reply.code(200).send({
        status: 'ok' as const,
        db: 'connected' as const
      })
    } catch (err) {
      app.log.error({ err }, 'Database ping failed')
      reply.code(503).send({
        status: 'fail' as const,
        db: 'disconnected' as const,
        reason: 'Database ping failed'
      })
    }
  })

  // 5) Rutas de negocio (registradas en src/routes/index.ts).
  registerRoutes(app)

  // 6) 404 handler: responde con un cuerpo uniforme para rutas inexistentes.
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      path: request.url,
      statusCode: 404
    })
  })

  return app
}
