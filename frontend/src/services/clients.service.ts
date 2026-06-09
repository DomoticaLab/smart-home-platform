import { get, post, put, del } from '../lib/http'
import type {
  Client,
  ClientDetail,
  CreateClientInput,
  UpdateClientInput,
  PaginatedClients
} from '../types/client.types'

const BASE = '/api/clients'

export async function fetchClients(
  search?: string,
  page = 1,
  limit = 20
): Promise<PaginatedClients> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  return get<PaginatedClients>(`${BASE}?${params.toString()}`)
}

export async function fetchClientById(id: string): Promise<ClientDetail> {
  return get<ClientDetail>(`${BASE}/${id}`)
}

export async function createClient(
  data: CreateClientInput
): Promise<Client> {
  return post<Client>(BASE, data)
}

export async function updateClient(
  id: string,
  data: UpdateClientInput
): Promise<Client> {
  return put<Client>(`${BASE}/${id}`, data)
}

export async function deleteClient(id: string): Promise<void> {
  return del<void>(`${BASE}/${id}`)
}