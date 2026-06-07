import { z } from 'zod'

// Schema de creación de cliente.
// - name es obligatorio (mínimo 2 caracteres).
// - phone acepta formato colombiano: +57XXXXXXXXXX o 3XXXXXXXXX (10 dígitos).
// - email/phone/city/notes son opcionales; el string vacío también es válido
//   para mantener compatibilidad con formularios que envían "" en campos vacíos.
export const CreateClientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre requerido, mínimo 2 caracteres')
    .max(200, 'Nombre demasiado largo'),
  phone: z
    .string()
    .regex(
      /^(\+57)?[0-9]{10}$/,
      'Teléfono inválido. Formato: +57XXXXXXXXXX o 3XXXXXXXXX'
    )
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Email inválido')
    .max(200, 'Email demasiado largo')
    .optional()
    .or(z.literal('')),
  city: z.string().max(100, 'Ciudad demasiado larga').optional(),
  notes: z.string().max(500, 'Notas demasiado largas').optional()
})

// Schema de actualización: todos los campos opcionales.
// Mantiene el prefijo +57 para phone y la validación de email cuando vienen.
export const UpdateClientSchema = CreateClientSchema.partial()

// Schema para query string de GET /api/clients.
// - search: filtro libre aplicado a name/email/phone.
// - page/limit: paginación con defaults seguros y tope máximo de 100.
export const ClientSearchSchema = z.object({
  search: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).max(200).optional()
  ),
  page: z.coerce.number().int().min(1, 'page debe ser >= 1').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit debe ser >= 1')
    .max(100, 'limit máximo 100')
    .default(20)
})

// Tipos inferidos. La capa de servicio y repositorio consumen estos tipos
// para evitar duplicar la definición del payload.
export type CreateClientData = z.infer<typeof CreateClientSchema>
export type UpdateClientData = z.infer<typeof UpdateClientSchema>
export type ClientSearchQuery = z.infer<typeof ClientSearchSchema>
