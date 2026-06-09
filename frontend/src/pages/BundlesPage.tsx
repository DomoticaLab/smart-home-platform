import { useNavigate } from 'react-router-dom'
import { Check, X, Star, ShoppingCart, Package } from 'lucide-react'
import { useBundles } from '../hooks/useBundles'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import type { Bundle, RecommendedTier } from '../types/bundle.types'
import { formatCOP } from '../types/bundle.types'

// ---------------------------------------------------------------------------
// Sub-componentes internos
// ---------------------------------------------------------------------------

interface BundleProductListProps {
  items: Bundle['items']
  onProductClick?: (slug: string) => void
}

function BundleProductList({ items, onProductClick }: BundleProductListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">Sin productos definidos.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.productId}
          className="flex items-start gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
        >
          <div className="mt-0.5 flex-shrink-0">
            {item.isOptional ? (
              <span className="text-xs font-medium text-text-secondary">○</span>
            ) : (
              <Check className="h-3.5 w-3.5 text-green" />
            )}
          </div>
          <button
            onClick={() => onProductClick?.(item.product.slug)}
            className="flex-1 text-left hover:text-gold transition-colors"
          >
            <p className="text-sm font-medium text-text-primary">{item.product.name}</p>
            <p className="text-xs text-text-secondary">{item.product.brand.name}</p>
          </button>
          <span className="flex-shrink-0 rounded-md border border-border-default bg-bg-card px-1.5 py-0.5 text-xs text-text-secondary">
            ×{item.quantity}
          </span>
        </li>
      ))}
    </ul>
  )
}

interface BundleTierCardProps {
  bundle: Bundle
  price?: { total: number; equipmentSalePrice: number }
  isPopular?: boolean
  onProductClick?: (slug: string) => void
  onAddToQuote?: (bundleId: string) => void
}

const TIER_CONFIG: Record<RecommendedTier, { label: string; color: string; badge: 'success' | 'warning' | 'info' | 'neutral' }> = {
  ENTRY: { label: 'Entry', color: 'text-green', badge: 'success' },
  STANDARD: { label: 'Standard', color: 'text-gold', badge: 'warning' },
  PRO: { label: 'Pro', color: 'text-navy', badge: 'info' },
  ENTERPRISE: { label: 'Enterprise', color: 'text-text-secondary', badge: 'neutral' }
}

function BundleTierCard({
  bundle,
  price,
  isPopular,
  onProductClick,
  onAddToQuote
}: BundleTierCardProps) {
  const tierCfg = TIER_CONFIG[bundle.tier] ?? TIER_CONFIG.ENTRY
  const deviceCount = bundle.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="relative flex flex-col rounded-2xl border border-border-default bg-bg-card p-5 transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-black/10">
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="warning" size="sm" className="flex items-center gap-1 shadow-md">
            <Star className="h-3 w-3" />
            Más elegido
          </Badge>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Badge variant={tierCfg.badge} size="sm">
            {tierCfg.label}
          </Badge>
          <span className="text-xs text-text-secondary">{deviceCount} dispositivos</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-text-primary">{bundle.name}</h3>
        {bundle.description && (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">{bundle.description}</p>
        )}
      </div>

      {/* Precio */}
      <div className="mb-5 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
        {price ? (
          <>
            <p className="text-xs text-gold">Precio total</p>
            <p className="mt-1 text-2xl font-bold text-gold">{formatCOP(price.total)}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Equipos: {formatCOP(price.equipmentSalePrice)} + Instalación
            </p>
          </>
        ) : bundle.basePrice != null ? (
          <>
            <p className="text-xs text-gold">Precio base</p>
            <p className="mt-1 text-2xl font-bold text-gold">{formatCOP(bundle.basePrice)}</p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">Precio bajo consulta</p>
        )}
      </div>

      {/* Productos */}
      <div className="flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Productos incluidos
        </p>
        <BundleProductList
          items={bundle.items}
          onProductClick={onProductClick}
        />
      </div>

      {/* CTA */}
      <Button
        variant={isPopular ? 'primary' : 'secondary'}
        size="md"
        className="mt-5 w-full"
        onClick={() => onAddToQuote?.(bundle.id)}
        leftIcon={<ShoppingCart className="h-4 w-4" />}
      >
        Agregar a cotización
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tabla de comparación
// ---------------------------------------------------------------------------

interface ComparisonRow {
  feature: string
  entry: boolean | string
  standard: boolean | string
  pro: boolean | string
}

interface BundleComparisonTableProps {
  bundles: Bundle[]
}

const COMPARISON_ROWS: Array<{ feature: string; getValue: (b: Bundle) => boolean | string }> = [
  {
    feature: 'Productos incluidos',
    getValue: (b) => `${b.items.length} items`
  },
  {
    feature: 'Dispositivos tot.',
    getValue: (b) => `${b.items.reduce((s, i) => s + i.quantity, 0)}`
  },
  {
    feature: 'Opciones de automatización',
    getValue: (b) => (b.items.some((i) => i.product.productType === 'HUB') ? 'Sí' : 'No')
  },
  {
    feature: 'Soporte técnico',
    getValue: (b) =>
      b.tier === 'ENTERPRISE' ? 'Dedicado' : b.tier === 'PRO' ? 'Prioritario' : 'Estándar'
  },
  {
    feature: 'Incluye gateway',
    getValue: (b) =>
      b.items.some((i) => i.product.productType === 'HUB' || i.product.productType === 'CAMERA')
        ? 'Sí'
        : 'No'
  }
]

function BundleComparisonTable({ bundles }: BundleComparisonTableProps) {
  const entry = bundles.find((b) => b.tier === 'ENTRY')
  const standard = bundles.find((b) => b.tier === 'STANDARD')
  const pro = bundles.find((b) => b.tier === 'PRO')

  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check className="h-4 w-4 text-green" />
    if (value === false) return <X className="h-4 w-4 text-red/50" />
    return <span className="text-sm text-text-primary">{value}</span>
  }

  return (
    <Card padding="md">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Comparación de bundles
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="pb-3 text-left font-semibold text-text-primary">Característica</th>
              {entry && <th className="pb-3 text-center font-semibold text-green">Entry</th>}
              {standard && <th className="pb-3 text-center font-semibold text-gold">Standard</th>}
              {pro && <th className="pb-3 text-center font-semibold text-navy">Pro</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {COMPARISON_ROWS.map(({ feature, getValue }) => (
              <tr key={feature} className="hover:bg-bg-secondary/50 transition-colors">
                <td className="py-3 pr-4 text-text-secondary">{feature}</td>
                {entry && <td className="py-3 text-center">{renderValue(getValue(entry))}</td>}
                {standard && <td className="py-3 text-center">{renderValue(getValue(standard))}</td>}
                {pro && <td className="py-3 text-center">{renderValue(getValue(pro))}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="relative flex flex-col rounded-2xl border border-border-default bg-bg-card p-5 animate-pulse">
      <div className="h-5 w-20 rounded bg-bg-secondary" />
      <div className="mt-3 h-6 w-3/4 rounded bg-bg-secondary" />
      <div className="mt-2 h-4 w-full rounded bg-bg-secondary" />
      <div className="mt-6 h-16 rounded-xl bg-bg-secondary" />
      <div className="mt-4 space-y-2">
        <div className="h-10 rounded-lg bg-bg-secondary" />
        <div className="h-10 rounded-lg bg-bg-secondary" />
        <div className="h-10 rounded-lg bg-bg-secondary" />
      </div>
      <div className="mt-5 h-10 rounded-lg bg-bg-secondary" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function BundlesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useBundles({ isActive: true })

  const bundles = data?.data ?? []

  // Agrupar por tier
  const entryBundle = bundles.find((b) => b.tier === 'ENTRY')
  const standardBundle = bundles.find((b) => b.tier === 'STANDARD')
  const proBundle = bundles.find((b) => b.tier === 'PRO')
  const tierBundles = [entryBundle, standardBundle, proBundle].filter(Boolean) as Bundle[]

  const handleProductClick = (slug: string) => {
    navigate(`/products/${slug}`)
  }

  const handleAddToQuote = (bundleId: string) => {
    // TODO: conectar con el wizard de cotización cuando esté implementado
    console.info('Bundle added to quote:', bundleId)
  }

  const hasBundles = bundles.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Domotica</p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary">Bundles comerciales</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Paquetes preconfigurados listos para cotizar. Seleccioná el tier que mejor se adapte al proyecto del cliente.
            </p>
          </div>
          {data && (
            <div className="flex-shrink-0 rounded-xl border border-border-default bg-bg-secondary px-4 py-2 text-center">
              <p className="text-2xl font-bold text-text-primary">{data.total}</p>
              <p className="text-xs text-text-secondary">bundles activos</p>
            </div>
          )}
        </div>
      </Card>

      {/* Bundles en columnas */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !hasBundles ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-text-secondary" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">No hay bundles activos</h3>
            <p className="mt-2 text-sm text-text-secondary">
              No hay bundles dados de alta en el sistema. Agregá bundles desde el panel de administración.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {entryBundle && (
              <BundleTierCard
                bundle={entryBundle}
                onProductClick={handleProductClick}
                onAddToQuote={handleAddToQuote}
              />
            )}
            {standardBundle && (
              <BundleTierCard
                bundle={standardBundle}
                price={undefined}
                isPopular
                onProductClick={handleProductClick}
                onAddToQuote={handleAddToQuote}
              />
            )}
            {proBundle && (
              <BundleTierCard
                bundle={proBundle}
                onProductClick={handleProductClick}
                onAddToQuote={handleAddToQuote}
              />
            )}
          </div>

          {/* Tabla de comparación */}
          {tierBundles.length > 1 && (
            <BundleComparisonTable bundles={tierBundles} />
          )}

          {/* Bundles adicionales fuera de los 3 tiers principales */}
          {bundles.filter((b) => !['ENTRY', 'STANDARD', 'PRO'].includes(b.tier)).length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Otros bundles
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bundles
                  .filter((b) => !['ENTRY', 'STANDARD', 'PRO'].includes(b.tier))
                  .map((bundle) => (
                    <Card key={bundle.id} padding="md">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="neutral" size="sm">
                            {bundle.tier}
                          </Badge>
                          <p className="mt-2 font-semibold text-text-primary">{bundle.name}</p>
                          {bundle.description && (
                            <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                              {bundle.description}
                            </p>
                          )}
                        </div>
                        {bundle.basePrice != null && (
                          <p className="text-lg font-bold text-gold">{formatCOP(bundle.basePrice)}</p>
                        )}
                      </div>
                      <div className="mt-3">
                        <BundleProductList items={bundle.items} onProductClick={handleProductClick} />
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}