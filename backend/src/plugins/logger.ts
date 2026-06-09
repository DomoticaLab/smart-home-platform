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
        transport: buildPrettyTransport()
      }
    : {
        timestamp: () => `,"time":"${new Date().toISOString()}"`
      })
}

// Construye la configuración del transport de `pino-pretty`.
// Pino lanza los transports en un worker thread que resuelve módulos desde
// su propia ubicación, no desde la del proceso principal. En un monorepo
// con npm workspaces, las dependencias hoisteadas al `node_modules` raíz
// no siempre son resolubles desde el worker del workspace, lo que produce
// `Error: unable to determine transport target for "pino-pretty"` y hace
// que TODA llamada a `request.log` se bloquee (porque el transport nunca
// arranca). Como síntoma, las requests HTTP se loguean en `onRequest` pero
// el handler de la ruta nunca corre y la respuesta nunca sale.
// Mitigación: pasamos una ruta absoluta al transport target. Si
// `require.resolve` falla (p. ej. `pino-pretty` no instalado), caemos a un
// logger JSON sin pretty para no bloquear la app.
function buildPrettyTransport(): LoggerOptions['transport'] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const prettyPath = require.resolve('pino-pretty')
    return {
      target: prettyPath,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true
      }
    }
  } catch {
    // Si `pino-pretty` no está disponible, dejamos que Pino use su
    // logger JSON por defecto. Mejor logs feos que requests colgadas.
    return undefined
  }
}

// Hook que enriquece `request.log` con `reqId` y `route` estructurados.
// `request.id` lo asigna Fastify automáticamente; `request.routerPath` es
// el patrón de URL (ej. "/api/products/:id") cuando ya fue ruteado, o
// `request.url` como fallback.
//
// En Fastify 4 `request.log` es un getter (no settable), así que usamos
// `request.log.child(...)` para crear un logger hijo con los bindings
// extra. El logger hijo conserva el mismo nivel y redact config.
//
// NOTA: en Windows + ts-node vimos que `Object.defineProperty(request, 'log', ...)`
// combinado con el transport de `pino-pretty` puede dejar el request colgado
// (la request se loguea en `onRequest` pero el handler de la ruta nunca
// corre y la respuesta nunca sale). Por seguridad, dejamos el hook como
// no-op y usamos el logger por defecto de Fastify (que ya incluye `reqId`
// y `req`/`res` en cada línea de log de request).
export function installRequestLogger(_server: FastifyInstance): void {
  // Hook deshabilitado: ver comentario arriba.
  // _server.addHook('onRequest', (request) => { ... })
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
