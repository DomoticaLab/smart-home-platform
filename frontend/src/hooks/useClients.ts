import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient
} from '../services/clients.service'
import type { CreateClientInput, UpdateClientInput } from '../types/client.types'

const CLIENTS_KEY = ['clients']

export function useClients(search: string = '', page = 1, limit = 20) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, { search, page }],
    queryFn: () => fetchClients(search || undefined, page, limit),
    placeholderData: (prev) => prev
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: () => fetchClientById(id),
    enabled: !!id
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientInput) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    }
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
      updateClient(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...CLIENTS_KEY, variables.id] })
    }
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    }
  })
}