import { useState, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import type { ProductFilters, ProductType, RecommendedTier } from '../../types/product.types'

interface ProductFiltersProps {
  filters: ProductFilters
  onFilterChange: (filters: ProductFilters) => void
  onClear: () => void
  protocols?: Array<{ value: string; label: string }>
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'SWITCH', label: 'Switch' },
  { value: 'SENSOR', label: 'Sensor' },
  { value: 'CAMERA', label: 'Cámara' },
  { value: 'HUB', label: 'Hub / Gateway' },
  { value: 'THERMOSTAT', label: 'Termostato' },
  { value: 'LOCK', label: 'Cerradura' },
  { value: 'PLUG', label: 'Enchufe' },
  { value: 'LIGHT', label: 'Iluminación' },
  { value: 'BLINDS', label: 'Persianas' },
  { value: 'SPEAKER', label: 'Altavoz' },
  { value: 'IR', label: 'Control IR' },
  { value: 'OTHER', label: 'Otro' }
]

const TIERS: Array<{ value: RecommendedTier; label: string }> = [
  { value: 'ENTRY', label: 'Entry' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' }
]

export function ProductFilters({
  filters,
  onFilterChange,
  onClear,
  protocols = []
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)

  const handleChange = useCallback(
    (key: keyof ProductFilters, value: string | boolean | undefined) => {
      const updated = { ...localFilters, [key]: value === '' ? undefined : value }
      setLocalFilters(updated)
      onFilterChange(updated)
    },
    [localFilters, onFilterChange]
  )

  const handleClear = useCallback(() => {
    setLocalFilters({})
    onClear()
  }, [onClear])

  const hasActiveFilters =
    localFilters.productType ||
    localFilters.tier ||
    localFilters.protocolSlug ||
    localFilters.capabilityCode ||
    localFilters.localControl ||
    localFilters.inStock

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <RotateCcw className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      <Select
        label="Tipo de producto"
        options={PRODUCT_TYPES}
        value={localFilters.productType ?? ''}
        onChange={(e) =>
          handleChange('productType', e.target.value as ProductType || undefined)
        }
      />

      <Select
        label="Nivel / Tier"
        options={TIERS}
        value={localFilters.tier ?? ''}
        onChange={(e) =>
          handleChange('tier', e.target.value as RecommendedTier || undefined)
        }
      />

      {protocols.length > 0 && (
        <Select
          label="Protocolo"
          options={[{ value: '', label: 'Todos' }, ...protocols]}
          value={localFilters.protocolSlug ?? ''}
          onChange={(e) => handleChange('protocolSlug', e.target.value || undefined)}
        />
      )}

      <hr className="border-border-default" />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Opciones
        </p>

        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm text-text-primary">Solo control local</span>
          <input
            type="checkbox"
            checked={localFilters.localControl ?? false}
            onChange={(e) => handleChange('localControl', e.target.checked || undefined)}
            className="h-4 w-4 rounded border-border-default bg-bg-secondary text-navy focus:ring-gold/40"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm text-text-primary">Solo en stock</span>
          <input
            type="checkbox"
            checked={localFilters.inStock ?? false}
            onChange={(e) => handleChange('inStock', e.target.checked || undefined)}
            className="h-4 w-4 rounded border-border-default bg-bg-secondary text-navy focus:ring-gold/40"
          />
        </label>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleClear}
        className="mt-2 w-full"
      >
        <RotateCcw className="h-3 w-3" />
        Limpiar filtros
      </Button>
    </Card>
  )
}