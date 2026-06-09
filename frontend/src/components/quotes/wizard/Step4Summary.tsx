import { useMemo } from 'react'
import { CheckCircle2, MapPin, Package, ShoppingBag } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { formatCOP } from '../../../types/quote.types'
import type { QuoteStatus } from '../../../types/quote.types'

interface ItemRow {
  productName: string
  brandName: string
  roomName?: string
  quantity: number
  unitPrice: number
}

interface BundleRow {
  bundleName: string
  quantity: number
  unitPrice: number
}

interface ManualItemRow {
  customName: string
  customDescription?: string
  roomName?: string
  quantity: number
  unitPrice: number
}

interface Step4SummaryProps {
  clientName: string
  projectName: string
  rooms: Array<{ name: string; floor?: number; areaSqm?: number }>
  items: ItemRow[]
  manualItems: ManualItemRow[]
  bundles: BundleRow[]
  onCreateQuote: (initialStatus: QuoteStatus) => Promise<void>
  isCreating: boolean
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

function calculateLaborCost(deviceCount: number, electricianDays: number): number {
  const labor = electricianDays * DAILY_RATE + BASE_CONFIG + (deviceCount > THRESHOLD ? EXTRA_LABOR : 0)
  return Number((labor * (1 + MARGIN_LABOR)).toFixed(2))
}

export function Step4Summary({
  clientName,
  projectName,
  rooms,
  items,
  bundles,
  onCreateQuote,
  isCreating
}: Step4SummaryProps) {
  const equipmentCost = useMemo(() => {
    return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) +
      bundles.reduce((s, b) => s + b.unitPrice * b.quantity, 0)
  }, [items, bundles])

  const deviceCount = items.reduce((s, i) => s + i.quantity, 0) + bundles.reduce((s, b) => s + b.quantity, 0)
  const electricianDays = estimateElectricianDays(deviceCount)
  const laborCost = calculateLaborCost(deviceCount, electricianDays)
  const equipmentSale = equipmentCost * (1 + MARGIN_EQUIPMENT)
  const subtotal = equipmentSale + laborCost
  const iva = subtotal * IVA_RATE
  const total = subtotal + iva

  // Group items by room
  const itemsByRoom = useMemo(() => {
    const map = new Map<string, ItemRow[]>()
    for (const item of items) {
      const key = item.roomName ?? 'Sin asignar'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Resumen de cotización</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Revisá los datos antes de crear la cotización.
        </p>
      </div>

      {/* Client + project info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Cliente</p>
          <p className="font-semibold text-text-primary">{clientName}</p>
          {projectName && (
            <p className="mt-1 text-sm text-text-secondary">{projectName}</p>
          )}
        </Card>
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Dispositivos</p>
          <p className="text-2xl font-bold text-text-primary">{deviceCount}</p>
          <p className="text-xs text-text-secondary">{electricianDays} día{electricianDays !== 1 ? 's' : ''} de instalación</p>
        </Card>
      </div>

      {/* Items by room */}
      {Array.from(itemsByRoom.entries()).map(([roomName, roomItems]) => (
        <Card key={roomName} padding="md">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-navy" />
            <p className="text-sm font-semibold text-text-primary">{roomName}</p>
            <Badge variant="neutral" size="sm">{roomItems.length} producto{roomItems.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="space-y-2">
            {roomItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-default pb-2 last:border-0">
                <div>
                  <p className="text-sm text-text-primary">{item.productName}</p>
                  <p className="text-xs text-text-secondary">{item.brandName} · ×{item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gold">{formatCOP(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Bundles */}
      {bundles.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-navy" />
            <p className="text-sm font-semibold text-text-primary">Bundles</p>
          </div>
          <div className="space-y-2">
            {bundles.map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-default pb-2 last:border-0">
                <div>
                  <p className="text-sm text-text-primary">{b.bundleName}</p>
                  <p className="text-xs text-text-secondary">×{b.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gold">{formatCOP(b.unitPrice * b.quantity)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Manual Items */}
      {manualItems.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gold" />
            <p className="text-sm font-semibold text-text-primary">Ítems manuales</p>
            <Badge variant="warning" size="sm">{manualItems.length}</Badge>
          </div>
          <div className="space-y-2">
            {manualItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-default pb-2 last:border-0">
                <div>
                  <p className="text-sm text-text-primary">{item.customName}</p>
                  <p className="text-xs text-text-secondary">
                    {item.customDescription ? `${item.customDescription} · ` : ''}
                    {item.roomName ?? 'Sin asignar'} · ×{item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-gold">{formatCOP(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rooms summary */}
      {rooms.length > 0 && (
        <Card padding="md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Rooms ({rooms.length})</p>
          <div className="flex flex-wrap gap-2">
            {rooms.map((room, i) => (
              <Badge key={i} variant="neutral" size="sm">{room.name}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Totals */}
      <Card padding="md" className="border-gold/30 bg-gold/5">
        <p className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">
          Totales estimados
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Costo equipos (base)</span>
            <span className="text-sm text-text-primary">{formatCOP(equipmentCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Venta equipos (×1.45)</span>
            <span className="text-sm text-text-primary">{formatCOP(equipmentSale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Mano de obra ({electricianDays} días)</span>
            <span className="text-sm text-text-primary">{formatCOP(laborCost)}</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2">
            <span className="text-sm font-medium text-text-primary">Subtotal</span>
            <span className="text-sm font-medium text-text-primary">{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">IVA (19%)</span>
            <span className="text-sm text-text-primary">{formatCOP(iva)}</span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2">
            <span className="text-base font-bold text-text-primary">Total</span>
            <span className="text-xl font-bold text-gold">{formatCOP(total)}</span>
          </div>
        </div>
      </Card>

      {/* Create buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          loading={isCreating}
          onClick={() => onCreateQuote('DRAFT')}
        >
          Crear como Borrador
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          loading={isCreating}
          onClick={() => onCreateQuote('REVIEW')}
        >
          Crear y pasar a Revisión
        </Button>
      </div>
    </div>
  )
}