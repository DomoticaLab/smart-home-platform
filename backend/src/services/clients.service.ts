import type { Client } from '@prisma/client'
import { ClientsRepository } from '../repositories/clients.repo'
import type {
  ClientDetail,
  ClientSummary
} from '../repositories/clients.repo'
import type {
  CreateClientData,
  UpdateClientData
} from '../schemas/clients.schema'
import type { PaginatedResponse } from '../types/product.types'
import { NotFoundException } from '../lib/errors'

// Forma común de los datos de entrada (create y update comparten los mismos
// campos; create tiene name obligatorio, update lo tiene opcional).
type ClientDataInput = {
  name?: string | undefined
  phone?: string | undefined
  email?: string | undefined
  city?: string | undefined
  notes?: string | undefined
}

// Normaliza los datos de entrada del cliente:
// - Aplica trim a strings.
// - Email en minúsculas para evitar duplicados por mayúsculas.
// - Convierte string vacío ('') a undefined para que la capa de
//   persistencia los trate como campos no provistos.
function normalizeClientData<T extends ClientDataInput>(data: T): T {
  const normalized: T = { ...data }

  if (typeof normalized.name === 'string') {
    normalized.name = normalized.name.trim()
  }
  if (typeof normalized.phone === 'string') {
    const trimmed = normalized.phone.trim()
    normalized.phone = (trimmed === '' ? undefined : trimmed) as T['phone']
  }
  if (typeof normalized.email === 'string') {
    const trimmed = normalized.email.trim().toLowerCase()
    normalized.email = (trimmed === '' ? undefined : trimmed) as T['email']
  }
  if (typeof normalized.city === 'string') {
    const trimmed = normalized.city.trim()
    normalized.city = (trimmed === '' ? undefined : trimmed) as T['city']
  }
  if (typeof normalized.notes === 'string') {
    const trimmed = normalized.notes.trim()
    normalized.notes = (trimmed === '' ? undefined : trimmed) as T['notes']
  }

  return normalized
}

export class ClientsService {
  private repo: ClientsRepository

  constructor(repo?: ClientsRepository) {
    this.repo = repo ?? new ClientsRepository()
  }

  // Lista paginada de clientes con búsqueda opcional.
  // - page: 1-based, con tope mínimo de 1.
  // - limit: tope máximo 100 (alineado con el límite de Zod).
  // - search: filtro libre sobre name/email/phone.
  async getClients(
    search: string | undefined,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<ClientSummary>> {
    const page = Math.max(1, Math.floor(pagination.page))
    const limit = Math.max(1, Math.min(100, Math.floor(pagination.limit)))
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.repo.findAll({
        search,
        pagination: { skip, take: limit }
      }),
      this.repo.countBySearch(search)
    ])

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0

    return {
      data: items,
      total,
      page,
      limit,
      totalPages
    }
  }

  // Devuelve el detalle completo de un cliente.
  // Lanza NotFoundException si el id no existe.
  async getClientById(id: string): Promise<ClientDetail> {
    const client = await this.repo.findById(id)
    if (!client) {
      throw new NotFoundException(`Cliente con id "${id}" no encontrado`)
    }
    return client
  }

  // Crea un cliente nuevo.
  // La validación de formato se hace con Zod en la capa HTTP; aquí sólo
  // aplicamos la normalización (trim, lowercase de email, vacíos -> undefined).
  async createClient(data: CreateClientData): Promise<Client> {
    const normalized = normalizeClientData(data)
    return this.repo.create(normalized)
  }

  // Actualiza un cliente existente.
  // - Lanza NotFoundException si el id no existe.
  // - Aplica la misma normalización que en createClient.
  async updateClient(
    id: string,
    data: UpdateClientData
  ): Promise<Client> {
    const existing = await this.repo.findByIdSimple(id)
    if (!existing) {
      throw new NotFoundException(`Cliente con id "${id}" no encontrado`)
    }

    const normalized = normalizeClientData(data)
    return this.repo.update(id, normalized)
  }

  // Elimina un cliente.
  // - NotFoundException: si el id no existe.
  // - ConflictException: si el cliente tiene cotizaciones activas
  //   (status distinto de ARCHIVED).
  async deleteClient(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}