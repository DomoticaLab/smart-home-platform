import { useState, useCallback } from 'react'
import { Search, UserCheck, Plus, X } from 'lucide-react'
import { useClients } from '../../../hooks/useClients'
import { useCreateClient } from '../../../hooks/useClients'
import { ClientForm } from '../../clients/ClientForm'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Spinner } from '../../ui/Spinner'
import type { ClientSummary } from '../../../types/quote.types'
import type { CreateClientFormData } from '../../../types/client.types'

interface Step1ClientProps {
  selectedClientId: string | null
  onClientSelected: (clientId: string) => void
}

export function Step1Client({ selectedClientId, onClientSelected }: Step1ClientProps) {
  const [search, setSearch] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useClients(search, page, 6)
  const createMutation = useCreateClient()

  const clients = data?.data ?? []

  const handleCreateSubmit = useCallback(
    async (formData: CreateClientFormData) => {
      const created = await createMutation.mutateAsync(formData as any)
      onClientSelected(created.id)
      setShowCreateForm(false)
    },
    [createMutation, onClientSelected]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Seleccionar cliente</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Buscá un cliente existente o creá uno nuevo para la cotización.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo cliente
        </Button>
      </div>

      {/* Inline create form */}
      {showCreateForm && (
        <Card padding="md" className="border-gold/30">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gold">Crear nuevo cliente</p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ClientForm
            mode="create"
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createMutation.isPending}
          />
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-border-default bg-bg-secondary pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        {isFetching && !isLoading && (
          <Spinner size="sm" color="gold" className="absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {/* Client list */}
      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border-default bg-bg-secondary" />
          ))
        ) : clients.length === 0 ? (
          <div className="col-span-2 py-8 text-center">
            <p className="text-sm text-text-secondary">
              {search ? 'Ningún cliente coincide con la búsqueda' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          clients.map((client) => {
            const isSelected = selectedClientId === client.id
            return (
              <button
                key={client.id}
                onClick={() => onClientSelected(client.id)}
                className={[
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                  isSelected
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-border-default bg-bg-secondary hover:border-gold/40'
                ].join(' ')}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy/20 text-navy">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{client.name}</p>
                  <p className="mt-0.5 text-xs text-text-secondary truncate">
                    {client.phone ?? client.email ?? '—'}
                  </p>
                  {client.city && (
                    <p className="mt-0.5 text-xs text-text-secondary">{client.city}</p>
                  )}
                </div>
                {isSelected && (
                  <Badge variant="success" size="sm">Seleccionado</Badge>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-text-secondary">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}