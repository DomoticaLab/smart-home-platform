// Plugin de Fastify para el logger de Pino.
//
// El logger se configura al construir Fastify con `loggerOptions` (mismo
// módulo, mismo formato). La función `installRequestLogger` agrega un hook
// `onRequest` en el root context para que cada `request.log` lleve `reqId`
// y `route` como campos estructurados (no string interpolation).
//
// NOTA sobre encapsulación: `app.register(plugin)` en Fastify v4 crea un
// nuevo contexto y los hooks que pongamos ahí NO se heredan por el root ni
// por los contextos hermanos. Por eso `installRequestLogger` se llama
// directamente en `buildApp` (root) para que el hook se herede por todos
// los `app.register` posteriores. La función `loggerPlugin` se conserva
// con la firma del spec para uso vía `app.register` cuando se necesite el
// comportamiento scoped (p. ej. en tests).
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { LoggerOptions } from 'pino'

// Lista de paths a redactar en headers, query y body.
// Coincide con `lib/logger.ts` para que ambos loggers (Fastify y singleton)
// produzcan la misma redacción.
const REDACT_PATHS: string[] = [
  'password',
  'token',
  'authorization',
  'apiKey',
  'secret'
]
const isDevelopment = process.env.NODE_ENV !== 'production'

// Opciones listas para pasar a `Fastify({ logger: loggerOptions })`.
// En dev: pretty + colores. En prod: JSON con timestamp ISO.
// Tipadas como `LoggerOptions` para que TS valide la forma contra Pino.
export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]'
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true
          }
        }
      }
    : {
        timestamp: () => `,"time":"${new Date().toISOString()}"`
      })
}

// Hook que enriquece `request.log` con `reqId` y `route` estructurados.
// `request.id` lo asigna Fastify automáticamente; `request.routerPath` es
// el patrón de URL (ej. "/api/products/:id") cuando ya fue ruteado, o
// `request.url` como fallback.
//
// En Fastify 4 `request.log` es un getter (no settable), así que usamos
// `request.log.child(...)` para crear un logger hijo con los bindings
// extra. El logger hijo conserva el mismo nivel y redact config.
export function installRequestLogger(server: FastifyInstance): void {
  server.addHook('onRequest', (request) => {
    const child = request.log.child({
      reqId: request.id,
      route: request.routerPath ?? request.url
    })
    // Reemplazamos el log del request con el child (Fastify 4 permite esto
    // en hooks de request porque request.log es un proxy, no un valor fijo).
    Object.defineProperty(request, 'log', { value: child, writable: true })
  })
}

// Plugin de Fastify con la firma `register(server, options, done)`.
// Internamente delega a `installRequestLogger` y luego llama a `done`.
export function loggerPlugin(
  server: FastifyInstance,
  _options: FastifyPluginOptions,
  done: (err?: Error) => void
): void {
  installRequestLogger(server)
  done()
}
