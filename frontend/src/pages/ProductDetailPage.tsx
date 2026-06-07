import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Zap,
  Wifi,
  Radio,
  ShieldCheck,
  Lock,
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
  ZapOff,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { useProduct } from '../hooks/useProducts'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import type { CapabilityCode, CompatibilityLevel } from '../types/product.types'

type Tab = 'specs' | 'compatibility' | 'suppliers' | 'automations'

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

const TIER_CONFIG: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral'; label: string }> = {
  ENTRY: { variant: 'success', label: 'Entry' },
  STANDARD: { variant: 'warning', label: 'Standard' },
  PRO: { variant: 'info', label: 'Pro' },
  ENTERPRISE: { variant: 'neutral', label: 'Enterprise' }
}

const DIFFICULTY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: 'text-green', label: 'Baja' },
  MEDIUM: { color: 'text-gold', label: 'Media' },
  HIGH: { color: 'text-red', label: 'Alta' },
  EXPERT: { color: 'text-red', label: 'Experto' }
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
  UNLOCK: Lock,
  ARM: ShieldCheck,
  DISARM: ShieldCheck,
  SCENE: Gamepad2,
  AUTOMATION: Clock,
  VOICE: Mic,
  SCHEDULE: Clock,
  ENERGY_METER: Power,
  POWER_METER: Power
}

const COMPAT_ICONS: Record<CompatibilityLevel, typeof CheckCircle2> = {
  CERTIFIED: CheckCircle2,
  COMPATIBLE: CheckCircle2,
  LIMITED: HelpCircle,
  EXPERIMENTAL: AlertCircle,
  NOT_SUPPORTED: XCircle
}

const COMPAT_COLORS: Record<CompatibilityLevel, string> = {
  CERTIFIED: 'text-green',
  COMPATIBLE: 'text-green',
  LIMITED: 'text-gold',
  EXPERIMENTAL: 'text-gold',
  NOT_SUPPORTED: 'text-red'
}

const COMPAT_LABELS: Record<CompatibilityLevel, string> = {
  CERTIFIED: 'Certificado',
  COMPATIBLE: 'Compatible',
  LIMITED: 'Limitado',
  EXPERIMENTAL: 'Experimental',
  NOT_SUPPORTED: 'No soportado'
}

const STOCK_LABELS: Record<string, string> = {
  IN_STOCK: 'En stock',
  LOW_STOCK: 'Stock bajo',
  OUT_OF_STOCK: 'Sin stock',
  BACKORDER: 'Backorder',
  DISCONTINUED: 'Descontinuado'
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('specs')

  const { data: product, isLoading, isError } = useProduct(slug ?? '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" color="gold" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red" />
        <h2 className="text-xl font-semibold text-text-primary">Producto no encontrado</h2>
        <p className="mt-2 text-sm text-text-secondary">
          El producto que buscas no existe o no está disponible.
        </p>
        <Button variant="secondary" onClick={() => navigate('/products')} className="mt-6">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>
    )
  }

  const tierCfg = TIER_CONFIG[product.recommendedTier] ?? TIER_CONFIG.ENTRY
  const diffCfg = DIFFICULTY_CONFIG[product.installationDifficulty]
  const primaryProtocol = product.protocolLinks.find((p) => p.isPrimary)?.protocol
    ?? product.protocolLinks[0]?.protocol

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/products')}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        className="text-text-secondary"
      >
        Catálogo
      </Button>

      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{PRODUCT_TYPE_LABELS[product.productType] ?? product.productType}</Badge>
              <Badge variant={tierCfg.variant}>{tierCfg.label}</Badge>
              {product.localControl && (
                <span className="flex items-center gap-1 text-xs text-green">
                  <Lock className="h-3.5 w-3.5" />
                  Control local
                </span>
              )}
              {product.cloudRequired && (
                <span className="flex items-center gap-1 text-xs text-gold">
                  <ZapOff className="h-3.5 w-3.5" />
                  Requiere nube
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-text-primary">{product.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">{product.brand.name}</p>

            {primaryProtocol && (
              <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                <Zap className="h-4 w-4" />
                {primaryProtocol.name}
              </div>
            )}
          </div>

          {/* Precio */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-right">
            <p className="text-xs uppercase tracking-wider text-gold">Precio de venta</p>
            <p className="mt-1 text-3xl font-bold text-gold">
              {product.finalPrice.amount > 0
                ? formatCOP(product.finalPrice.amount)
                : 'Consultar'}
            </p>
            {product.finalPrice.basePrice > 0 && (
              <p className="mt-1 text-xs text-text-secondary">
                Base: {formatCOP(product.finalPrice.basePrice)} · Margen{' '}
                {(product.finalPrice.marginApplied * 100).toFixed(0)}%
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-default">
        {(['specs', 'compatibility', 'suppliers', 'automations'] as Tab[]).map((tab) => (
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
            {tab === 'specs' && 'Especificaciones'}
            {tab === 'compatibility' && 'Compatibilidad'}
            {tab === 'suppliers' && 'Proveedores'}
            {tab === 'automations' && 'Automatizaciones'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'specs' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Capabilities */}
          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Capacidades
            </h3>
            {product.capabilityLinks.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin capacidades registradas.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.capabilityLinks.map(({ capability }) => {
                  const Icon = CAPABILITY_ICONS[capability.code] ?? Zap
                  return (
                    <li
                      key={capability.id}
                      className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-navy" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{capability.name}</p>
                        {capability.description && (
                          <p className="truncate text-xs text-text-secondary">
                            {capability.description}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {/* Technical specs */}
          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Especificaciones técnicas
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-border-default pb-2">
                <dt className="text-sm text-text-secondary">Dificultad de instalación</dt>
                <dd className={`text-sm font-medium ${diffCfg.color}`}>{diffCfg.label}</dd>
              </div>
              <div className="flex justify-between border-b border-border-default pb-2">
                <dt className="text-sm text-text-secondary">Requiere neutro</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {product.requiresNeutral ? 'Sí' : 'No'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border-default pb-2">
                <dt className="text-sm text-text-secondary">Control local</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {product.localControl ? 'Sí' : 'No'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border-default pb-2">
                <dt className="text-sm text-text-secondary">Requiere nube</dt>
                <dd className={`text-sm font-medium ${product.cloudRequired ? 'text-gold' : 'text-green'}`}>
                  {product.cloudRequired ? 'Sí' : 'No'}
                </dd>
              </div>
              {product.powerConsumption != null && (
                <div className="flex justify-between border-b border-border-default pb-2">
                  <dt className="text-sm text-text-secondary">Consumo</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {product.powerConsumption} W
                  </dd>
                </div>
              )}
              {product.categories?.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-border-default pb-2">
                  <dt className="text-sm text-text-secondary">Categorías</dt>
                  <dd className="flex flex-wrap gap-1">
                    {product.categoryLinks.map(({ category }) => (
                      <Badge key={category.id} variant="neutral" size="sm">
                        {category.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              {product.installationLinks?.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-border-default pb-2">
                  <dt className="text-sm text-text-secondary">Requisitos de instalación</dt>
                  <dd className="flex flex-col gap-1">
                    {product.installationLinks.map(({ requirement }) => (
                      <span key={requirement.id} className="text-sm text-text-primary">
                        • {requirement.name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {product.infrastructureLinks?.length > 0 && (
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-text-secondary">Infraestructura requerida</dt>
                  <dd className="flex flex-col gap-1">
                    {product.infrastructureLinks.map(({ requirement }) => (
                      <span key={requirement.id} className="text-sm text-text-primary">
                        • {requirement.name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'compatibility' && (
        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Compatibilidad con ecosistemas
          </h3>
          {product.ecosystemCompatibilities.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin información de compatibilidad.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ecosistema</TableHead>
                  <TableHead align="center">Nivel</TableHead>
                  <TableHead align="center">Bridge requerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.ecosystemCompatibilities.map(({ ecosystem, compatibilityLevel, requiresBridge }) => {
                  const Icon = COMPAT_ICONS[compatibilityLevel]
                  return (
                    <TableRow key={ecosystem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{ecosystem.name}</span>
                          <ExternalLink className="h-3 w-3 text-text-secondary" />
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <span className={`inline-flex items-center gap-1 ${COMPAT_COLORS[compatibilityLevel]}`}>
                          <Icon className="h-4 w-4" />
                          {COMPAT_LABELS[compatibilityLevel]}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        {requiresBridge ? (
                          <span className="text-xs text-gold">Sí</span>
                        ) : (
                          <span className="text-xs text-text-secondary">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Hubs */}
          {product.hubLinks?.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Hubs compatibles
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.hubLinks.map(({ hub }) => (
                  <Badge key={hub.id} variant="info" size="sm">
                    {hub.brand.name} {hub.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'suppliers' && (
        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Proveedores y precios
          </h3>
          {product.supplierLinks.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin proveedores registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead align="right">Precio (COP)</TableHead>
                  <TableHead align="center">Estado</TableHead>
                  <TableHead align="center">Preferred</TableHead>
                  <TableHead align="right">Lead time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.supplierLinks.map((link) => (
                  <TableRow key={link.supplier.id}>
                    <TableCell>
                      <span className="font-medium text-text-primary">{link.supplier.name}</span>
                    </TableCell>
                    <TableCell align="right">
                      {link.price != null ? (
                        <span className="font-medium text-gold">{formatCOP(link.price)}</span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Badge
                        variant={
                          link.stockStatus === 'IN_STOCK'
                            ? 'success'
                            : link.stockStatus === 'LOW_STOCK'
                              ? 'warning'
                              : 'error'
                        }
                        size="sm"
                      >
                        {STOCK_LABELS[link.stockStatus] ?? link.stockStatus}
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      {link.isPreferredSupplier ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-green" />
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {link.leadTimeDays != null ? (
                        <span className="text-sm text-text-secondary">{link.leadTimeDays} días</span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'automations' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Automations */}
          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Automatizaciones disponibles
            </h3>
            {product.automationLinks.length === 0 ? (
              <p className="text-sm text-text-secondary">No hay automatizaciones asociadas.</p>
            ) : (
              <ul className="space-y-2">
                {product.automationLinks.map(({ automation }) => (
                  <li
                    key={automation.id}
                    className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
                  >
                    <Clock className="h-4 w-4 flex-shrink-0 text-navy" />
                    <span className="text-sm text-text-primary">{automation.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Scenes */}
          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Escenas compatibles
            </h3>
            {product.sceneLinks.length === 0 ? (
              <p className="text-sm text-text-secondary">No hay escenas asociadas.</p>
            ) : (
              <ul className="space-y-2">
                {product.sceneLinks.map(({ scene }) => (
                  <li
                    key={scene.id}
                    className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
                  >
                    <Gamepad2 className="h-4 w-4 flex-shrink-0 text-navy" />
                    <span className="text-sm text-text-primary">{scene.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}