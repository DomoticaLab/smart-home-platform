import { useState, useCallback, useDeferredValue } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Users,
  X,
  AlertTriangle
} from 'lucide-react'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient
} from '../hooks/useClients'
import { useToast } from '../components/ui'
import { ClientForm } from '../components/clients/ClientForm'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { Spinner } from '../components/ui/Spinner'
import type { ClientSummary, CreateClientFormData, UpdateClientFormData } from '../types/client.types'
import type { QuoteStatus } from '../types/product.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'En revisión',
  FINAL: 'Finalizado',
  APPROVED: 'Aprobado',
  ARCHIVED: 'Archivado'
}

const STATUS_VARIANT: Record<QuoteStatus, 'neutral' | 'warning' | 'info' | 'success' | 'error'> = {
  DRAFT: 'neutral',
  REVIEW: 'warning',
  FINAL: 'info',
  APPROVED: 'success',
  ARCHIVED: 'neutral'
}

function ClientRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-4 w-32 animate-pulse rounded bg-bg-secondary" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 animate-pulse rounded bg-bg-secondary" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 animate-pulse rounded bg-bg-secondary" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-16 animate-pulse rounded bg-bg-secondary" />
      </TableCell>
      <TableCell>
        <div className="h-8 w-20 animate-pulse rounded bg-bg-secondary" />
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

interface DeleteModalProps {
  client: ClientSummary
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteClientModal({ client, isOpen, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar cliente" size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-red/30 bg-red/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red" />
          <div>
            <p className="font-medium text-text-primary">¿Estás seguro?</p>
            <p className="mt-1 text-sm text-text-secondary">
              El cliente <strong>{client.name}</strong> será eliminado permanentemente.
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={onConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit modal
// ---------------------------------------------------------------------------

interface ClientModalProps {
  mode: 'create' | 'edit'
  initialData?: Partial<CreateClientFormData>
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateClientFormData | UpdateClientFormData) => Promise<void>
  isLoading: boolean
}

function ClientModal({ mode, initialData, isOpen, onClose, onSubmit, isLoading }: ClientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'}
      size="md"
    >
      <ClientForm
        mode={mode}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ClientsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingClient, setEditingClient] = useState<ClientSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClientSummary | null>(null)

  // Debounce search input
  const deferredSearch = useDeferredValue(search)

  const { data, isLoading, isFetching } = useClients(deferredSearch, page)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()

  const clients = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  // Abrir modal de creación
  const handleOpenCreate = useCallback(() => {
    setModalMode('create')
    setEditingClient(null)
  }, [])

  // Abrir modal de edición
  const handleOpenEdit = useCallback((client: ClientSummary) => {
    setModalMode('edit')
    setEditingClient(client)
  }, [])

  // Cerrar cualquier modal
  const handleCloseModal = useCallback(() => {
    setEditingClient(null)
  }, [])

  // Submit crear
  const handleCreate = useCallback(
    async (formData: CreateClientFormData | UpdateClientFormData) => {
      await createMutation.mutateAsync(formData as CreateClientFormData)
      toast.success('Cliente creado correctamente')
      handleCloseModal()
      setPage(1)
    },
    [createMutation, toast, handleCloseModal]
  )

  // Submit editar
  const handleUpdate = useCallback(
    async (formData: CreateClientFormData | UpdateClientFormData) => {
      if (!editingClient) return
      await updateMutation.mutateAsync({ id: editingClient.id, data: formData as UpdateClientFormData })
      toast.success('Cliente actualizado correctamente')
      handleCloseModal()
    },
    [editingClient, updateMutation, toast, handleCloseModal]
  )

  // Confirmar eliminación
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Cliente eliminado')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el cliente')
    }
  }, [deleteTarget, deleteMutation, toast])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">CRM</p>
          <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {data ? `${data.total} cliente${data.total !== 1 ? 's' : ''} registrado${data.total !== 1 ? 's' : ''}` : '—'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo cliente
        </Button>
      </div>

      {/* Tabla */}
      <Card padding="sm">
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
          <Search className="h-4 w-4 flex-shrink-0 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
          />
          {isFetching && !isLoading && <Spinner size="sm" color="gold" />}
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Cotizaciones</TableHead>
                <TableHead align="right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ClientRowSkeleton key={i} />)
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Users className="mx-auto mb-3 h-10 w-10 text-text-secondary" />
                    <p className="font-medium text-text-primary">No hay clientes</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {search ? 'Ningun cliente coincide con la búsqueda' : 'Agregá tu primer cliente'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-text-primary">{client.name}</p>
                        {client.email && (
                          <p className="text-xs text-text-secondary">{client.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary">
                        {client.phone ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary">
                        {client.city ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.quotes.length === 0 ? (
                        <span className="text-xs text-text-secondary">Sin cotizaciones</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {client.quotes.slice(0, 3).map((q) => (
                            <Badge
                              key={q.id}
                              variant={STATUS_VARIANT[q.status]}
                              size="sm"
                            >
                              {q.quoteNumber}
                            </Badge>
                          ))}
                          {client.quotes.length > 3 && (
                            <Badge variant="neutral" size="sm">
                              +{client.quotes.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-red/10 hover:text-red"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
            <p className="text-xs text-text-secondary">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    page === p
                      ? 'bg-navy text-text-primary'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modales */}
      <ClientModal
        mode={modalMode}
        initialData={
          editingClient
            ? {
                name: editingClient.name,
                phone: editingClient.phone ?? undefined,
                email: editingClient.email ?? undefined,
                city: editingClient.city ?? undefined,
                notes: editingClient.notes ?? undefined
              }
            : undefined
        }
        isOpen={!!editingClient || modalMode === 'create'}
        onClose={handleCloseModal}
        onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {deleteTarget && (
        <DeleteClientModal
          client={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}