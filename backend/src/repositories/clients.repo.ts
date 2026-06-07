import type { Prisma, Client } from '@prisma/client'
import { QuoteStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ConflictException, NotFoundException } from '../lib/errors'
import type {
  CreateClientData,
  UpdateClientData
} from '../schemas/clients.schema'

// --- Tipos públicos exportados (consumidos por servicio y controladores) ---

// Cliente con un resumen de cotizaciones (id, quoteNumber, status, createdAt).
// Se usa en listados para no cargar el detalle completo de cada quote.
export type ClientSummary = Prisma.ClientGetPayload<{
  include: {
    quotes: {
      select: {
        id: true
        quoteNumber: true
        status: true
        createdAt: true
      }
    }
  }
}>

// Cliente con todas sus cotizaciones completas, ordenadas por createdAt desc.
// Se usa en el endpoint de detalle.
export type ClientDetail = Prisma.ClientGetPayload<{
  include: {
    quotes: true
  }
}>

// --- Interfaces de opciones ---

export interface ClientsPagination {
  skip: number
  take: number
}

export interface FindAllClientsOptions {
  search?: string
  pagination: ClientsPagination
  orderBy?: Prisma.ClientOrderByWithRelationInput
}

export class ClientsRepository {
  // Lista clientes con búsqueda opcional y paginación.
  // Devuelve un array de ClientSummary (cliente + quotes resumidas).
  async findAll(options: FindAllClientsOptions): Promise<ClientSummary[]> {
    const where = options.search ? this.buildSearchWhere(options.search) : {}

    return prisma.client.findMany({
      where,
      include: {
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: options.orderBy ?? { createdAt: 'desc' },
      skip: options.pagination.skip,
      take: options.pagination.take
    })
  }

  // Cuenta el total de clientes que cumplen el filtro de búsqueda.
  // Se usa en la capa de servicio para componer la respuesta paginada.
  async countBySearch(search?: string): Promise<number> {
    const where = search ? this.buildSearchWhere(search) : {}
    return prisma.client.count({ where })
  }

  // Devuelve el detalle completo de un cliente con sus cotizaciones.
  // Retorna null si no existe.
  async findById(id: string): Promise<ClientDetail | null> {
    return prisma.client.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  // Devuelve el cliente sin relaciones. Se usa como verificación barata
  // de existencia (más eficiente que findById cuando no se necesitan quotes).
  async findByIdSimple(id: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { id }
    })
  }

  // Crea un cliente nuevo. El repositorio no aplica reglas de negocio;
  // eso es responsabilidad de la capa de servicio.
  async create(data: CreateClientData): Promise<Client> {
    return prisma.client.create({
      data: {
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        city: data.city ?? null,
        notes: data.notes ?? null
      }
    })
  }

  // Actualiza un cliente existente. Si algún campo es undefined Prisma
  // no lo modifica (esa es la convención de Prisma para updates parciales).
  // Los strings vacíos se convierten a null para limpiar campos en la DB.
  async update(id: string, data: UpdateClientData): Promise<Client> {
    const updateData: Prisma.ClientUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone ?? null
    if (data.email !== undefined) updateData.email = data.email ?? null
    if (data.city !== undefined) updateData.city = data.city ?? null
    if (data.notes !== undefined) updateData.notes = data.notes ?? null

    return prisma.client.update({
      where: { id },
      data: updateData
    })
  }

  // Elimina un cliente.
  // - Lanza NotFoundException si el cliente no existe.
  // - Lanza ConflictException si el cliente tiene cotizaciones activas
  //   (status distinto de ARCHIVED). El contrato de negocio es: un cliente
  //   con cotizaciones en curso no puede eliminarse para no perder histórico.
  async delete(id: string): Promise<void> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        quotes: {
          select: { status: true }
        }
      }
    })

    if (!client) {
      throw new NotFoundException(`Cliente con id "${id}" no encontrado`)
    }

    const hasActiveQuotes = client.quotes.some(
      (quote) => quote.status !== QuoteStatus.ARCHIVED
    )

    if (hasActiveQuotes) {
      throw new ConflictException(
        'No se puede eliminar el cliente porque tiene cotizaciones activas (no archivadas)'
      )
    }

    await prisma.client.delete({ where: { id } })
  }

  // Construye el where de Prisma para la búsqueda libre.
  // Busca por name, email o phone usando contains + modo insensitive
  // (PostgreSQL lo soporta nativamente).
  private buildSearchWhere(search: string): Prisma.ClientWhereInput {
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
  }
}
