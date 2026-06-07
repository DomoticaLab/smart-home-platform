import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Layers, AlertTriangle } from 'lucide-react'
import { useProducts, useCatalogSummary } from '../hooks/useProducts'
import { ProductFilters } from '../components/products/ProductFilters'
import { ProductCard } from '../components/products/ProductCard'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import type { ProductFilters as ProductFiltersType } from '../types/product.types'

const DEFAULT_FILTERS: ProductFiltersType = {}

function SkeletonCard() {
  return (
    <Card padding="md" className="animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-bg-secondary" />
          <div className="h-3 w-1/2 rounded bg-bg-secondary" />
        </div>
        <div className="h-12 w-16 rounded-lg bg-bg-secondary" />
      </div>
      <div className="mt-3 h-3 w-1/3 rounded bg-bg-secondary" />
      <div className="mt-3 flex gap-1">
        <div className="h-5 w-16 rounded bg-bg-secondary" />
        <div className="h-5 w-16 rounded bg-bg-secondary" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="space-y-1">
          <div className="h-6 w-24 rounded bg-bg-secondary" />
          <div className="h-3 w-16 rounded bg-bg-secondary" />
        </div>
        <div className="h-5 w-14 rounded bg-bg-secondary" />
      </div>
    </Card>
  )
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-default bg-bg-secondary">
        <Package className="h-8 w-8 text-text-secondary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">No se encontraron productos</h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        {hasFilters
          ? 'No hay productos que coincidan con los filtros seleccionados.'
          : 'Aún no hay productos en el catálogo. Agrega productos desde el backend.'}
      </p>
      {hasFilters && (
        <Button variant="secondary" size="sm" onClick={onClear} className="mt-4">
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ProductFiltersType>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useProducts(filters, page, 20)
  const { data: summary } = useCatalogSummary()

  const handleFilterChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const hasFilters =
    filters.productType ||
    filters.tier ||
    filters.protocolSlug ||
    filters.capabilityCode ||
    filters.localControl ||
    filters.inStock

  const products = data?.data ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      {/* Resumen del catálogo */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-navy/20">
            <Package className="h-5 w-5 text-navy" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Total</p>
            <p className="text-2xl font-semibold text-text-primary">
              {summary?.total ?? '—'}
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-gold/20">
            <Layers className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">En stock</p>
            <p className="text-2xl font-semibold text-text-primary">
              {summary?.inStock ?? '—'}
            </p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-red/20">
            <AlertTriangle className="h-5 w-5 text-red" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Stock bajo</p>
            <p className="text-2xl font-semibold text-text-primary">
              {(summary?.byType.SENSOR ?? 0) > 0
                ? String(summary?.byType.SENSOR)
                : '—'}
            </p>
          </div>
        </Card>
      </section>

      {/* Catálogo con filtros */}
      <div className="flex gap-6">
        {/* Sidebar de filtros */}
        <aside className="hidden w-[260px] flex-shrink-0 md:block">
          <div className="sticky top-24">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={handleClear}
            />
          </div>
        </aside>

        {/* Grid de productos */}
        <div className="min-w-0 flex-1">
          {/* Header con conteo */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {isLoading ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded bg-bg-secondary" />
              ) : (
                <>
                  <span className="font-medium text-text-primary">{data?.total ?? 0}</span>{' '}
                  producto{data?.total !== 1 ? 's' : ''} encontrado
                  {hasFilters ? ' con filtros' : ''}
                </>
              )}
            </p>
            {isFetching && !isLoading && (
              <Spinner size="sm" color="gold" className="animate-spin" />
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card padding="lg">
              <EmptyState hasFilters={!!hasFilters} onClear={handleClear} />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={(slug) => navigate(`/products/${slug}`)}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={[
                        'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                        page === pageNum
                          ? 'bg-navy text-text-primary'
                          : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                      ].join(' ')}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 7 && page < totalPages && (
                  <>
                    <span className="px-1 text-text-secondary">…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm font-medium text-text-secondary hover:bg-bg-card hover:text-text-primary"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}