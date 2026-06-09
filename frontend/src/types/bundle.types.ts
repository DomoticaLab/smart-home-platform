// Tipos de bundle reflejados del backend.

export type RecommendedTier = 'ENTRY' | 'STANDARD' | 'PRO' | 'ENTERPRISE'

// --- Entidades ---

export interface Brand {
  id: string
  name: string
  slug: string
  website: string | null
}

export interface Product {
  id: string
  slug: string
  name: string
  productType: string
  recommendedTier: RecommendedTier
  brand: Brand
}

export interface BundleItem {
  bundleId: string
  productId: string
  quantity: number
  isOptional: boolean
  product: Product
}

export interface Bundle {
  id: string
  slug: string
  name: string
  description: string | null
  basePrice: number | null
  tier: RecommendedTier
  isActive: boolean
  items: BundleItem[]
}

export interface BundleDetail extends Bundle {
  // BundleDetail includes the same items with full product relations
  // already included in BundleItem.product
}

// --- Precio ---

export interface BundlePrice {
  bundleId: string
  bundleSlug: string
  deviceCount: number
  electricianDays: number
  equipmentCost: number
  equipmentSalePrice: number
  laborEstimate: number
  total: number
  marginPct: number
  tier: RecommendedTier
}

// --- Filtros ---

export interface BundleFilters {
  tier?: RecommendedTier
  isActive?: boolean
}

// --- Respuesta paginada ---

export interface PaginatedBundles {
  data: Bundle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- helpers de formato COP ---

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}