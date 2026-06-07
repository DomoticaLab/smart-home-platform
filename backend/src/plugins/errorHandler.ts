// Plugin de Fastify que traduce cualquier error a una respuesta HTTP uniforme.
//
// Orden de prioridad (de más específico a más genérico):
//   1. Excepciones de dominio (NotFoundException, ConflictException, etc.)
//   2. ZodError -> 400 VALIDATION_ERROR con `details` por campo.
//   3. PrismaClientKnownRequestError -> mapeo por código (P2002, P2025, ...).
//   4. Fastify FST_ERR_VALIDATION (con `error.validation`).
//   5. Error genérico -> 500 INTERNAL_ERROR, log con stack y cuerpo seguro.
//
// NOTA sobre encapsulación: `app.register(plugin)` en Fastify v4 crea un
// nuevo contexto y el `setErrorHandler` que pongamos adentro NO se hereda
// por el root ni por los contextos hermanos. Por eso `installErrorHandler`
// se llama directamente en `buildApp` (root), desde donde sí se hereda a
// todos los `app.register` posteriores. La función `errorHandlerPlugin` se
// conserva con la firma del spec para uso vía `app.register` cuando se
// necesite el comportamiento scoped (p. ej. en tests de plugins individuales).
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { AppException } from '../lib/errors'

// Cuerpo serializable de la respuesta de error que verá el cliente.
// Mantenemos `details` y `field` opcionales para no inflar respuestas que
// no los necesitan.
export type ErrorBody = {
  error: string
  code: string
  message: string
  details?: unknown
  field?: string
}

type PrismaErrorMapping = {
  statusCode: number
  body: ErrorBody
}

// Convierte un ZodError en un mapa { campo.path: [mensajes] }.
// Acumula mensajes por path para no pisarlos cuando hay varios issues en el
// mismo campo. Si el path es vacío (error a nivel raíz), se agrupa bajo
// la clave "_root".
export function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root'
    const list = formatted[key] ?? []
    list.push(issue.message)
    formatted[key] = list
  }
  return formatted
}

// Mapea los errores conocidos de Prisma a respuestas HTTP.
//   P2002: unique constraint violado (insert/update duplicado).
//   P2025: registro no encontrado por update/delete.
//   Otros: 500 con cuerpo genérico y log con stack.
export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): PrismaErrorMapping {
  if (error.code === 'P2002') {
    const meta = error.meta as { target?: string[] } | undefined
    const target = meta?.target
    const field =
      Array.isArray(target) && target.length > 0 ? target[0] : undefined
    return {
      statusCode: 409,
      body: {
        error: 'Duplicate entry',
        code: 'CONFLICT',
        message: 'A record with the same unique value already exists',
        field
      }
    }
  }
  if (error.code === 'P2025') {
    return {
      statusCode: 404,
      body: {
        error: 'Resource not found',
        code: 'NOT_FOUND',
        message: 'The requested resource does not exist'
      }
    }
  }
  return {
    statusCode: 500,
    body: {
      error: 'Database error',
      code: 'INTERNAL_ERROR',
      message: 'Unexpected database error'
    }
  }
}

// Reconstruye el body de error garantizando que no se filtren campos
// inesperados. Es defensa en profundidad: las clases de dominio ya controlan
// su `toResponse()`, pero cualquier path nuevo pasa por aquí.
function sanitizeBody(body: ErrorBody): ErrorBody {
  const out: ErrorBody = {
    error: body.error,
    code: body.code,
    message: body.message
  }
  if (body.details !== undefined) out.details = body.details
  if (body.field !== undefined) out.field = body.field
  return out
}

// Registra el error handler en una instancia de Fastify. Esta función se
// llama desde `buildApp` en el root para que aplique a todas las rutas
// (incluidos los `app.register` posteriores).
export function installErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error, request, reply) => {
    // 1) Excepciones de dominio. Cada una trae su statusCode, code y message.
    if (error instanceof AppException) {
      reply.status(error.statusCode).send(sanitizeBody(error.toResponse()))
      return
    }

    // 2) Errores de validación de Zod (safeParse().throw, o .parse() directo).
    if (error instanceof ZodError) {
      request.log.warn({ issues: error.issues }, 'Validation failed')
      const body: ErrorBody = {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formatZodError(error)
      }
      reply.status(400).send(sanitizeBody(body))
      return
    }

    // 3) Errores conocidos de Prisma.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const mapping = handlePrismaError(error)
      if (mapping.statusCode >= 500) {
        request.log.error({ err: error }, 'Prisma database error')
      } else {
        request.log.warn(
          { err: error, code: error.code },
          'Prisma known error'
        )
      }
      reply.status(mapping.statusCode).send(sanitizeBody(mapping.body))
      return
    }

    // 4) Fastify envuelve errores de schema como FST_ERR_VALIDATION y agrega
    //    los issues en `error.validation`. Los convertimos al mismo shape.
    const fastifyValidation = (error as { validation?: unknown }).validation
    if (fastifyValidation !== undefined) {
      request.log.warn(
        { validation: fastifyValidation },
        'Fastify validation failed'
      )
      reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: fastifyValidation
      })
      return
    }

    // 5) Cualquier otro error: log con stack (interno) y cuerpo genérico.
    //    El stack NUNCA llega al cliente: sólo el message genérico.
    request.log.error({ err: error }, 'Unhandled application error')
    reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    })
  })
}

// Plugin de Fastify con la firma `register(server, options, done)`.
// Internamente delega a `installErrorHandler` y luego llama a `done`.
// Útil cuando se quiere registrar vía `app.register(...)` y se acepta el
// scope de encapsulación (o se envuelve con `fastify-plugin`).
export function errorHandlerPlugin(
  server: FastifyInstance,
  _options: FastifyPluginOptions,
  done: (err?: Error) => void
): void {
  installErrorHandler(server)
  done()
}
