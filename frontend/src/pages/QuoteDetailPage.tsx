import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Printer,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Package
} from 'lucide-react'
import {
  useQuote,
  useQuoteSummary,
  useChangeStatus,
  useDuplicateQuote
} from '../hooks/useQuotes'
import { useToast } from '../components/ui'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { formatCOP } from '../types/quote.types'
import type { QuoteStatus } from '../types/quote.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<QuoteStatus, { label: string; variant: 'neutral' | 'warning' | 'info' | 'success' | 'error'; icon: typeof Clock }> = {
  DRAFT: { label: 'Borrador', variant: 'neutral', icon: FileText },
  REVIEW: { label: 'En revisión', variant: 'warning', icon: Clock },
  FINAL: { label: 'Finalizado', variant: 'info', icon: CheckCircle2 },
  APPROVED: { label: 'Aprobado', variant: 'success', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archivado', variant: 'neutral', icon: Clock }
}

const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['FINAL', 'ARCHIVED'],
  FINAL: ['APPROVED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: []
}

const MARGIN_EQUIPMENT = 0.45
const MARGIN_LABOR = 0.40
const DAILY_RATE = 180000
const BASE_CONFIG = 160000
const EXTRA_LABOR = 100000
const THRESHOLD = 15
const IVA_RATE = 0.19

function estimateElectricianDays(deviceCount: number): number {
  return Math.max(1, Math.ceil(deviceCount / 5))
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateStr))
}

// ---------------------------------------------------------------------------
// State selector component
// ---------------------------------------------------------------------------

interface StatusSelectorProps {
  currentStatus: QuoteStatus
  onChangeStatus: (status: QuoteStatus) => void
  isLoading: boolean
}

function StatusSelector({ currentStatus, onChangeStatus, isLoading }: StatusSelectorProps) {
  const [open, setOpen] = useState(false)
  const allowed = VALID_TRANSITIONS[currentStatus] ?? []

  if (allowed.length === 0) {
    return (
      <Badge variant={STATUS_CONFIG[currentStatus].variant} size="sm">
        {STATUS_CONFIG[currentStatus].label}
      </Badge>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-lg border border-border-default bg-bg-secondary px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-gold/40 disabled:opacity-50"
      >
        <Badge variant={STATUS_CONFIG[currentStatus].variant} size="sm">
          {STATUS_CONFIG[currentStatus].label}
        </Badge>
        <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-border-default bg-bg-card shadow-xl">
            <div className="p-1">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Cambiar estado
              </p>
              {allowed.map((status) => {
                const cfg = STATUS_CONFIG[status]
                return (
                  <button
                    key={status}
                    onClick={() => { onChangeStatus(status); setOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary transition-colors hover:bg-bg-secondary"
                  >
                    <cfg.icon className="h-4 w-4" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ label, value, sublabel, highlight }: {
  label: string
  value: string
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <Card padding="md" className={highlight ? 'border-gold/30 bg-gold/5' : ''}>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? 'text-gold' : 'text-text-primary'}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-text-secondary">{sublabel}</p>}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Rooms accordion
// ---------------------------------------------------------------------------

interface RoomsAccordionProps {
  rooms: Array<{
    id: string
    name: string
    floor: number | null
    areaSqm: number | null
    items: Array<{
      productName: string
      brandName: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
    subtotal: number
  }>
}

function RoomsAccordion({ rooms }: RoomsAccordionProps) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">No hay rooms registrados.</p>
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => {
        const isOpen = open.has(room.id)
        return (
          <div key={room.id} className="rounded-xl border border-border-default bg-bg-secondary">
            <button
              onClick={() => toggle(room.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4 text-text-secondary" /> : <ChevronRight className="h-4 w-4 text-text-secondary" />}
                <span className="font-medium text-text-primary">{room.name}</span>
                <span className="text-xs text-text-secondary">({room.items.length} productos)</span>
              </div>
              <span className="font-semibold text-gold">{formatCOP(room.subtotal)}</span>
            </button>

            {isOpen && (
              <div className="border-t border-border-default px-4 py-3">
                {room.floor != null && (
                  <p className="mb-2 text-xs text-text-secondary">Piso {room.floor}{room.areaSqm ? ` · ${room.areaSqm} m²` : ''}</p>
                )}
                <div className="space-y-2">
                  {room.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border-default/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-text-primary">{item.productName}</p>
                          {item.isManual && <Badge variant="warning" size="xs">Manual</Badge>}
                        </div>
                        <p className="text-xs text-text-secondary">{item.brandName} · ×{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary">{formatCOP(item.subtotal)}</p>
                        <p className="text-xs text-text-secondary">{formatCOP(item.unitPrice)} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------

type Tab = 'detalle' | 'resumen'

interface DetailTabProps {
  quoteId: string
  summary: ReturnType<typeof useQuoteSummary>['data']
}

function DetailTab({ summary }: DetailTabProps) {
  const items = summary?.rooms.flatMap((r) => r.items) ?? []
  const deviceCount = items.reduce((s, i) => s + i.quantity, 0)
  const electricianDays = estimateElectricianDays(deviceCount)
  const laborCost = Number(((electricianDays * DAILY_RATE + BASE_CONFIG + (deviceCount > THRESHOLD ? EXTRA_LABOR : 0)) * (1 + MARGIN_LABOR)).toFixed(2))

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={summary ? formatCOP(summary.total) : '—'}
          sublabel={summary ? `${summary.quoteNumber}` : undefined}
          highlight
        />
        <MetricCard
          label="Equipos"
          value={summary ? formatCOP(summary.subtotalEquipment) : '—'}
          sublabel={`Margen ${((MARGIN_EQUIPMENT) * 100).toFixed(0)}%`}
        />
        <MetricCard
          label="Mano de obra"
          value={summary ? formatCOP(summary.laborCost) : '—'}
          sublabel={`${electricianDays} día${electricianDays !== 1 ? 's' : ''} instalación`}
        />
        <MetricCard
          label="IVA (19%)"
          value={summary ? formatCOP(summary.iva) : '—'}
        />
      </div>

      {/* Rooms */}
      {summary && (
        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Rooms / Zonas</h3>
          <RoomsAccordion rooms={summary.rooms} />
        </Card>
      )}

      {/* Bundles */}
      {summary && summary.bundles.length > 0 && (
        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Bundles</h3>
          <div className="space-y-2">
            {summary.bundles.map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-default/50 pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{b.bundleName}</p>
                  <p className="text-xs text-text-secondary">×{b.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{formatCOP(b.subtotal)}</p>
                  <p className="text-xs text-text-secondary">{formatCOP(b.unitPrice)} c/u</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Totals */}
      {summary && (
        <Card padding="md" className="border-gold/30 bg-gold/5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Subtotal equipos</span>
              <span className="text-sm text-text-primary">{formatCOP(summary.subtotalEquipment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Mano de obra</span>
              <span className="text-sm text-text-primary">{formatCOP(summary.laborCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">IVA (19%)</span>
              <span className="text-sm text-text-primary">{formatCOP(summary.iva)}</span>
            </div>
            <div className="flex justify-between border-t border-border-default pt-2">
              <span className="text-base font-bold text-text-primary">Total</span>
              <span className="text-xl font-bold text-gold">{formatCOP(summary.total)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

interface SummaryTabProps {
  summary: ReturnType<typeof useQuoteSummary>['data']
}

function SummaryTab({ summary }: SummaryTabProps) {
  if (!summary) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-5">
      {/* Header para impresión */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">Cotización</p>
          <h2 className="text-2xl font-bold text-text-primary">{summary.quoteNumber}</h2>
          <p className="mt-1 text-sm text-text-secondary">{summary.client.name}</p>
          {summary.project.name && (
            <p className="text-sm text-text-secondary">{summary.project.name}</p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
          Imprimir
        </Button>
      </div>

      {/* Rooms table */}
      <div className="space-y-4">
        {summary.rooms.map((room) => (
          <div key={room.id} className="rounded-xl border border-border-default">
            <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary px-4 py-3">
              <div>
                <p className="font-semibold text-text-primary">{room.name}</p>
                {room.floor != null && (
                  <p className="text-xs text-text-secondary">Piso {room.floor}{room.areaSqm ? ` · ${room.areaSqm} m²` : ''}</p>
                )}
              </div>
              <span className="font-semibold text-gold">{formatCOP(room.subtotal)}</span>
            </div>
            <div className="divide-y divide-border-default/50">
              {room.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-text-primary">{item.productName}</p>
                      {item.isManual && <Badge variant="warning" size="xs">Manual</Badge>}
                    </div>
                    <p className="text-xs text-text-secondary">{item.brandName} · Cantidad: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-text-primary">{formatCOP(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bundles */}
      {summary.bundles.length > 0 && (
        <div className="rounded-xl border border-border-default">
          <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary px-4 py-3">
            <p className="font-semibold text-text-primary">Bundles</p>
          </div>
          <div className="divide-y divide-border-default/50">
            {summary.bundles.map((b, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-text-primary">{b.bundleName}</p>
                  <p className="text-xs text-text-secondary">Cantidad: {b.quantity}</p>
                </div>
                <span className="font-medium text-text-primary">{formatCOP(b.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-5">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Subtotal</span>
            <span className="text-sm text-text-primary">{formatCOP(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">IVA (19%)</span>
            <span className="text-sm text-text-primary">{formatCOP(summary.iva)}</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2">
            <span className="text-lg font-bold text-text-primary">Total</span>
            <span className="text-2xl font-bold text-gold">{formatCOP(summary.total)}</span>
          </div>
        </div>
      </div>

      {/* Conditions - hidden during print */}
      <div className="hidden print:block space-y-2 text-xs text-text-secondary">
        <p>Validez de la cotización: 30 días.</p>
        <p>Forma de pago: 50% anticipo, 50% contra entrega.</p>
        <p>Tiempo de instalación: sujeto a levantamiento técnico.</p>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .bg-bg-card, .bg-bg-secondary { background: white !important; }
          .border-border-default { border-color: #ccc !important; }
          .text-gold { color: #C9A96E !important; }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('detalle')

  const { data: quote, isLoading, isError } = useQuote(id ?? '')
  const { data: summary } = useQuoteSummary(id ?? '')
  const changeStatusMutation = useChangeStatus()
  const duplicateMutation = useDuplicateQuote()

  const handleChangeStatus = useCallback(
    async (newStatus: QuoteStatus) => {
      if (!id) return
      try {
        await changeStatusMutation.mutateAsync({ quoteId: id, status: newStatus })
        toast.success(`Estado actualizado a ${STATUS_CONFIG[newStatus].label}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
      }
    },
    [id, changeStatusMutation, toast]
  )

  const handleDuplicate = useCallback(async () => {
    if (!id) return
    try {
      const newQuote = await duplicateMutation.mutateAsync(id)
      toast.success('Cotización duplicada')
      navigate(`/quotes/${newQuote.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo duplicar')
    }
  }, [id, duplicateMutation, toast, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" color="gold" />
      </div>
    )
  }

  if (isError || !quote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red" />
        <h2 className="mt-4 text-xl font-semibold text-text-primary">Cotización no encontrada</h2>
        <p className="mt-2 text-sm text-text-secondary">La cotización no existe o no tienes acceso.</p>
        <Button variant="secondary" onClick={() => navigate('/quotes')} className="mt-6">
          <ArrowLeft className="h-4 w-4" />
          Volver a cotizaciones
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[quote.status]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')} className="text-text-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{quote.quoteNumber}</h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {quote.client?.name ?? quote.clientId} · Creada {formatDate(quote.createdAt)}
            </p>
            {quote.projectName && (
              <p className="mt-0.5 text-sm text-text-secondary">{quote.projectName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusSelector
            currentStatus={quote.status}
            onChangeStatus={handleChangeStatus}
            isLoading={changeStatusMutation.isPending}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDuplicate}
            loading={duplicateMutation.isPending}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Duplicar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-default">
        {(['detalle', 'resumen'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-gold text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            ].join(' ')}
          >
            {tab === 'detalle' ? 'Detalle' : 'Resumen para cliente'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'detalle' && (
        <DetailTab quoteId={id ?? ''} summary={summary} />
      )}
      {activeTab === 'resumen' && (
        <SummaryTab summary={summary} />
      )}
    </div>
  )
}