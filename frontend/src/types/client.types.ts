// Tipos de cliente reflejados del backend.

import type { QuoteStatus } from './product.types'

// --- Entidades ---

export interface Quote {
  id: string
  quoteNumber: string
  status: QuoteStatus
  createdAt: string
}

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientDetail extends Client {
  quotes: Quote[]
}

export interface ClientSummary extends Client {
  quotes: Quote[]
}

// --- Inputs ---

export interface CreateClientInput {
  name: string
  phone?: string
  email?: string
  city?: string
  notes?: string
}

export interface UpdateClientInput {
  name?: string
  phone?: string
  email?: string
  city?: string
  notes?: string
}

// --- Respuesta paginada ---

export interface PaginatedClients {
  data: ClientSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- Validación Zod para el frontend ---

import { z } from 'zod'

export const clientNameSchema = z
  .string()
  .min(2, 'Nombre requerido, mínimo 2 caracteres')
  .max(200, 'Nombre demasiado largo')

export const clientPhoneSchema = z
  .string()
  .regex(/^(\+57)?[0-9]{10}$/, 'Teléfono inválido. Formato: +57XXXXXXXXXX o 3XXXXXXXXX')
  .optional()
  .or(z.literal(''))

export const clientEmailSchema = z
  .string()
  .email('Email inválido')
  .max(200, 'Email demasiado largo')
  .optional()
  .or(z.literal(''))

export const clientCitySchema = z
  .string()
  .max(100, 'Ciudad demasiado larga')
  .optional()
  .or(z.literal(''))

export const clientNotesSchema = z
  .string()
  .max(500, 'Notas demasiado largas')
  .optional()

export const CreateClientSchema = z.object({
  name: clientNameSchema,
  phone: clientPhoneSchema,
  email: clientEmailSchema,
  city: clientCitySchema,
  notes: clientNotesSchema
})

export const UpdateClientSchema = CreateClientSchema.partial()

export type CreateClientFormData = z.infer<typeof CreateClientSchema>
export type UpdateClientFormData = z.infer<typeof UpdateClientSchema>