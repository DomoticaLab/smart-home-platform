import {
  Zap,
  Wifi,
  Radio,
  ShieldCheck,
  Lock,
  Unlock,
  Sun,
  Thermometer,
  Droplets,
  Eye,
  Flame,
  AlertTriangle,
  Power,
  Volume2,
  Gamepad2,
  Clock,
  Mic,
  ZapOff
} from 'lucide-react'
import type { Product, StockStatus, CapabilityCode } from '../../types/product.types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface ProductCardProps {
  product: Product
  onClick?: (slug: string) => void
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SWITCH: 'Switch',
  SENSOR: 'Sensor',
  CAMERA: 'Cámara',
  HUB: 'Hub',
  THERMOSTAT: 'Termostato',
  LOCK: 'Cerradura',
  PLUG: 'Enchufe',
  LIGHT: 'Luz',
  BLINDS: 'Persiana',
  SPEAKER: 'Altavoz',
  IR: 'Control IR',
  OTHER: 'Otro'
}

const TIER_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  ENTRY: 'success',
  STANDARD: 'warning',
  PRO: 'info',
  ENTERPRISE: 'neutral'
}

const TIER_LABEL: Record<string, string> = {
  ENTRY: 'Entry',
  STANDARD: 'Standard',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
}

const STOCK_CONFIG: Record<StockStatus, { variant: 'success' | 'error' | 'warning'; label: string }> = {
  IN_STOCK: { variant: 'success', label: 'En stock' },
  LOW_STOCK: { variant: 'warning', label: 'Stock bajo' },
  OUT_OF_STOCK: { variant: 'error', label: 'Sin stock' },
  BACKORDER: { variant: 'warning', label: 'Backorder' },
  DISCONTINUED: { variant: 'error', label: 'Descontinuado' }
}

const PROTOCOL_ICONS: Record<string, typeof Zap> = {
  zigbee: Zap,
  'wi-fi': Wifi,
  zwave: Radio,
  rf: Radio,
  bluetooth: Radio,
  thread: Wifi,
  matter: ShieldCheck,
  '433mhz': Radio
}

const CAPABILITY_ICONS: Partial<Record<CapabilityCode, typeof Zap>> = {
  ON_OFF: Zap,
  DIMMING: Sun,
  MOTION: Eye,
  CONTACT: ShieldCheck,
  TEMPERATURE: Thermometer,
  HUMIDITY: Droplets,
  LIGHT_LEVEL: Sun,
  SMOKE: Flame,
  WATER_LEAK: Droplets,
  VIBRATION: AlertTriangle,
  LOCK: Lock,
  UNLOCK: Unlock,
  ARM: ShieldCheck,
  DISARM: ShieldCheck,
  SCENE: Gamepad2,
  AUTOMATION: Clock,
  VOICE: Mic,
  SCHEDULE: Clock,
  ENERGY_METER: Power,
  POWER_METER: Power
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const primaryProtocol = product.protocolLinks.find((p) => p.isPrimary)?.protocol
    ?? product.protocolLinks[0]?.protocol

  const ProtocolIcon = primaryProtocol
    ? PROTOCOL_ICONS[primaryProtocol.slug] ?? Zap
    : Zap

  const bestSupplier = product.supplierLinks[0]
  const stockStatus = bestSupplier?.stockStatus ?? 'OUT_OF_STOCK'
  const stockCfg = STOCK_CONFIG[stockStatus] ?? STOCK_CONFIG.OUT_OF_STOCK

  const displayedCapabilities = product.capabilityLinks.slice(0, 4)
  const extraCapabilities = product.capabilityLinks.length - 4

  return (
    <Card
      hover
      className="cursor-pointer"
      onClick={() => onClick?.(product.slug)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {product.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {product.brand.name}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <Badge variant="info" size="sm">
            {PRODUCT_TYPE_LABELS[product.productType] ?? product.productType}
          </Badge>
          <Badge
            variant={TIER_VARIANT[product.recommendedTier] ?? 'neutral'}
            size="sm"
          >
            {TIER_LABEL[product.recommendedTier] ?? product.recommendedTier}
          </Badge>
        </div>
      </div>

      {/* Protocol */}
      {primaryProtocol && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
          <ProtocolIcon className="h-3.5 w-3.3 flex-shrink-0" />
          <span>{primaryProtocol.name}</span>
        </div>
      )}

      {/* Capabilities */}
      {displayedCapabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {displayedCapabilities.map(({ capability }) => {
            const Icon = CAPABILITY_ICONS[capability.code] ?? Zap
            return (
              <span
                key={capability.id}
                className="flex items-center gap-1 rounded-md border border-border-default bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-secondary"
                title={capability.name}
              >
                <Icon className="h-3 w-3" />
                {capability.code.replace(/_/g, ' ')}
              </span>
            )
          })}
          {extraCapabilities > 0 && (
            <span className="flex items-center rounded-md border border-border-default bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-secondary">
              +{extraCapabilities}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          {bestSupplier?.price != null && bestSupplier.price > 0 ? (
            <p className="text-lg font-semibold text-gold">
              {formatCOP(bestSupplier.price)}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">Sin precio</p>
          )}
          {bestSupplier?.price != null && bestSupplier.price > 0 && (
            <p className="text-[10px] text-text-secondary">COP · IVA incl.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={stockCfg.variant} size="sm">
            {stockCfg.label}
          </Badge>
          {product.localControl && (
            <span className="flex items-center gap-0.5 text-[10px] text-green">
              <Lock className="h-3 w-3" />
              Local
            </span>
          )}
          {product.cloudRequired && (
            <span className="flex items-center gap-0.5 text-[10px] text-gold">
              <ZapOff className="h-3 w-3" />
              Nube
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}