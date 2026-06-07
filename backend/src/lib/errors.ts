// Excepciones de dominio usadas por la capa de servicios.
// La capa HTTP (controladores) las traduce a respuestas con el statusCode apropiado.

export class AppException extends Error {
  // Código HTTP sugerido para que el controlador lo traduzca.
  readonly statusCode: number
  readonly code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
  }

  // Serializa la excepción a un cuerpo de respuesta HTTP "seguro" (sin stack
  // ni campos internos). El campo `error` es una etiqueta corta legible para
  // humanos; `code` es la clave máquina que la UI/SDK puede mapear.
  toResponse(): { error: string, code: string, message: string, details?: unknown } {
    return {
      error: humanizeCode(this.code),
      code: this.code,
      message: this.message
    }
  }
}

// Convierte un código máquina (NOT_FOUND, VALIDATION_ERROR, ...) a un título
// legible para el cliente (Not Found, Validation Error, ...).
function humanizeCode(code: string): string {
  return code
    .split('_')
    .map((segment) =>
      segment.length === 0 ? segment : segment[0] + segment.slice(1).toLowerCase()
    )
    .join(' ')
}

export class NotFoundException extends AppException {
  // Recurso afectado (p. ej. "Cliente", "Cotización"). Es opcional y sólo
  // informativo: el traductor HTTP no lo usa para armar la respuesta.
  readonly resource?: string

  constructor(message = 'Recurso no encontrado', resource?: string) {
    super(message, 404, 'NOT_FOUND')
    this.resource = resource
  }
}

export class BadRequestException extends AppException {
  constructor(message = 'Solicitud inválida') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class ConflictException extends AppException {
  // Campo que originó el conflicto (p. ej. "email" en un unique constraint).
  // Es opcional y sólo informativo.
  readonly field?: string

  constructor(
    message = 'Conflicto con el estado actual del recurso',
    field?: string
  ) {
    super(message, 409, 'CONFLICT')
    this.field = field
  }
}

// Excepción específica para errores de validación. Permite adjuntar el
// detalle de errores por campo (path → lista de mensajes) que se devuelve al
// cliente como `details` en la respuesta HTTP.
export class ValidationException extends AppException {
  readonly errors: Record<string, string[]>

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }

  // Override: agrega el bloque `details` con los errores por campo.
  toResponse(): { error: string, code: string, message: string, details: Record<string, string[]> } {
    return {
      error: 'Validation Error',
      code: this.code,
      message: this.message,
      details: this.errors
    }
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Acceso prohibido') {
    super(message, 403, 'FORBIDDEN')
  }
}
