// Logger singleton de Pino para uso fuera del contexto de Fastify
// (scripts, jobs, repositorios testeados sin app, etc.).
// El formato es consistente con `plugins/logger.ts` (mismo nivel y redaction).
import pino, { type Logger, type LoggerOptions } from 'pino'

// Lista de paths a redactar en headers, query y body.
// Coincide con `plugins/logger.ts` para que ambos loggers (Fastify y
// singleton) produzcan la misma redacción.
const REDACT_PATHS: string[] = [
  'password',
  'token',
  'authorization',
  'apiKey',
  'secret'
]
const isDevelopment = process.env.NODE_ENV !== 'production'

// Opciones del singleton. Tipadas como `LoggerOptions` para que TS valide
// la forma contra Pino (level, redact, transport, etc.) y rechace tipos
// incompatibles en compilación.
const baseOptions: LoggerOptions = {
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

export const logger: Logger = pino(baseOptions)
