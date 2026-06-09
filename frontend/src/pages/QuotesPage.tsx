import { useState, useCallback, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Copy, Eye, ChevronDown, X, DollarSign, FileText, CheckCircle2 } from 'lucide-react'
import { useQuotes, useChangeStatus, useDuplicateQuote } from '../hooks/useQuotes'
import { useToast } from '../components/ui'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import { formatCOP } from '../types/quote.types'
import type { QuoteStatus } from '../types/quote.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<QuoteStatus, { label: string; variant: 'neutral' | 'warning' | 'info' | 'success' | 'error' }> = {
  DRAFT: { label: 'Borrador', variant: 'neutral' },
  REVIEW: { label: 'En revisión', variant: 'warning' },
  FINAL: { label: 'Finalizado', variant: 'info' },
  APPROVED: { label: 'Aprobado', variant: 'success' },
  ARCHIVED: { label: 'Archivado', variant: 'neutral' }
}

const ALL_STATUSES: QuoteStatus[] = ['DRAFT', 'REVIEW', 'FINAL', 'APPROVED', 'ARCHIVED']

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateStr))
}

// ---------------------------------------------------------------------------
// Status filter chips
// ---------------------------------------------------------------------------

interface StatusFiltersProps {
  active: QuoteStatus | null
  counts: Record<QuoteStatus, number>
  onSelect: (status: QuoteStatus | null) => void
}

function StatusFilters({ active, counts, onSelect }: StatusFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={[
          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
          active === null
            ? 'border-gold bg-gold/10 text-gold'
            : 'border-border-default text-text-secondary hover:text-text-primary'
        ].join(' ')}
      >
        Todos ({Object.values(counts).reduce((s, v) => s + v, 0)})
      </button>
      {ALL_STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status]
        const count = counts[status] ?? 0
        return (
          <button
            key={status}
            onClick={() => onSelect(active === status ? null : status)}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active === status
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border-default text-text-secondary hover:text-text-primary'
            ].join(' ')}
          >
            {cfg.label} ({count})
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function QuoteRowSkeleton() {
  return (
    <TableRow>
      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-4 w-32 animate-pulse rounded bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-4 w-28 animate-pulse rounded bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-4 w-20 animate-pulse rounded bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-4 w-16 animate-pulse rounded bg-bg-secondary" /></TableCell>
      <TableCell><div className="h-8 w-16 animate-pulse rounded bg-bg-secondary" /></TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Quick status change dropdown
// ---------------------------------------------------------------------------

interface QuickStatusProps {
  quoteId: string
  currentStatus: QuoteStatus
  onStatusChange: (quoteId: string, status: QuoteStatus) => void
}

function QuickStatusDropdown({ quoteId, currentStatus, onStatusChange }: QuickStatusProps) {
  const [open, setOpen] = useState(false)

  const nextStatuses: QuoteStatus[] = {
    DRAFT: ['REVIEW'],
    REVIEW: ['FINAL'],
    FINAL: ['APPROVED'],
    APPROVED: [],
    ARCHIVED: []
  }[currentStatus] ?? []

  if (nextStatuses.length === 0) {
    return <Badge variant={STATUS_CONFIG[currentStatus].variant} size="sm">{STATUS_CONFIG[currentStatus].label}</Badge>
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full border border-border-default bg-bg-secondary px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-gold/40"
      >
        <Badge variant={STATUS_CONFIG[currentStatus].variant} size="sm">
          {STATUS_CONFIG[currentStatus].label}
        </Badge>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-border-default bg-bg-card shadow-xl">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => { onStatusChange(quoteId, status); setOpen(false) }}
                className="block w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-bg-secondary"
              >
                → {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function QuotesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | null>(null)
  const [page, setPage] = useState(1)

  const deferredSearch = useDeferredValue(search)

  const { data, isLoading, isFetching } = useQuotes(
    statusFilter ? { status: statusFilter } : {},
    page
  )
  const changeStatusMutation = useChangeStatus()
  const duplicateMutation = useDuplicateQuote()

  const quotes = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  // Compute stats from all quotes (for stats, we load page 1 with high limit)
  const { data: allData } = useQuotes({}, 1, 100)

  const stats = {
    total: allData?.total ?? 0,
    inPipeline: allData?.data.filter((q) => ['REVIEW', 'FINAL'].includes(q.status)).length ?? 0,
    totalApproved: allData?.data
      .filter((q) => q.status === 'APPROVED')
      .reduce((s, q) => s + (q.estimatedTotal ?? 0), 0) ?? 0
  }

  // Status counts
  const statusCounts = ALL_STATUSES.reduce<Record<QuoteStatus, number>>((acc, status) => {
    acc[status] = allData?.data.filter((q) => q.status === status).length ?? 0
    return acc
  }, {} as Record<QuoteStatus, number>)

  const handleStatusChange = useCallback(
    async (quoteId: string, newStatus: QuoteStatus) => {
      try {
        await changeStatusMutation.mutateAsync({ quoteId, status: newStatus })
        toast.success(`Estado actualizado`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
      }
    },
    [changeStatusMutation, toast]
  )

  const handleDuplicate = useCallback(
    async (quoteId: string) => {
      try {
        const newQuote = await duplicateMutation.mutateAsync(quoteId)
        toast.success('Cotización duplicada')
        navigate(`/quotes/${newQuote.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo duplicar')
      }
    },
    [duplicateMutation, toast, navigate]
  )

  const filteredQuotes = quotes.filter((q) => {
    if (!deferredSearch) return true
    const q2 = deferredSearch.toLowerCase()
    return (
      q.quoteNumber.toLowerCase().includes(q2) ||
      (q.client?.name ?? '').toLowerCase().includes(q2)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">CRM</p>
          <h1 className="text-2xl font-bold text-text-primary">Cotizaciones</h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/quotes/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nueva cotización
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-navy/20">
            <FileText className="h-5 w-5 text-navy" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Total</p>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-gold/20">
            <DollarSign className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">En pipeline</p>
            <p className="text-2xl font-bold text-gold">{stats.inPipeline}</p>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-green/20">
            <CheckCircle2 className="h-5 w-5 text-green" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Aprobado</p>
            <p className="text-2xl font-bold text-green">
              {stats.totalApproved > 0 ? formatCOP(stats.totalApproved) : '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-border-default px-4 py-3">
          <StatusFilters
            active={statusFilter}
            counts={statusCounts}
            onSelect={(status) => { setStatusFilter(status); setPage(1) }}
          />
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-border-default bg-bg-secondary pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isFetching && !isLoading && <Spinner size="sm" color="gold" />}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead align="right">Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead align="right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <QuoteRowSkeleton key={i} />)
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-text-secondary" />
                    <p className="font-medium text-text-primary">No hay cotizaciones</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {search || statusFilter
                        ? 'Ninguna cotización coincide con los filtros'
                        : 'Creá tu primera cotización'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/quotes/${quote.id}`)}
                        className="text-sm font-semibold text-gold hover:underline"
                      >
                        {quote.quoteNumber}
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-text-primary">{quote.client?.name ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-text-secondary truncate max-w-[150px]">
                        {quote.projectName ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <QuickStatusDropdown
                        quoteId={quote.id}
                        currentStatus={quote.status}
                        onStatusChange={handleStatusChange}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <span className="text-sm font-semibold text-text-primary">
                        {quote.estimatedTotal != null
                          ? formatCOP(quote.estimatedTotal)
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary">
                        {formatDate(quote.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                          title="Ver detalle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(quote.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                          title="Duplicar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
    </div>
  )
}