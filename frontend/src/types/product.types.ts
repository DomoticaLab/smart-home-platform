// Tipos de producto reflejados del backend.
// Mantienen los mismos nombres de campo que la API devuelve.

export type ProductType =
  | 'SWITCH'
  | 'SENSOR'
  | 'CAMERA'
  | 'HUB'
  | 'THERMOSTAT'
  | 'LOCK'
  | 'PLUG'
  | 'LIGHT'
  | 'BLINDS'
  | 'SPEAKER'
  | 'IR'
  | 'OTHER'

export type QuoteStatus = 'DRAFT' | 'REVIEW' | 'FINAL' | 'APPROVED' | 'ARCHIVED'

export type RecommendedTier = 'ENTRY' | 'STANDARD' | 'PRO' | 'ENTERPRISE'

export type StockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'BACKORDER'
  | 'DISCONTINUED'

export type CapabilityCode =
  | 'ON_OFF'
  | 'DIMMING'
  | 'MOTION'
  | 'CONTACT'
  | 'TEMPERATURE'
  | 'HUMIDITY'
  | 'LIGHT_LEVEL'
  | 'SMOKE'
  | 'WATER_LEAK'
  | 'VIBRATION'
  | 'LOCK'
  | 'UNLOCK'
  | 'ARM'
  | 'DISARM'
  | 'SCENE'
  | 'AUTOMATION'
  | 'VOICE'
  | 'SCHEDULE'
  | 'ENERGY_METER'
  | 'POWER_METER'

export type CompatibilityLevel =
  | 'CERTIFIED'
  | 'COMPATIBLE'
  | 'LIMITED'
  | 'EXPERIMENTAL'
  | 'NOT_SUPPORTED'

// --- Estructuras de respuesta ---

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ComputedPrice {
  amount: number
  currency: string
  marginApplied: number
  basePrice: number
  source: 'preferred' | 'any' | 'unavailable'
}

export interface ComputedAvailability {
  inStock: boolean
  preferredSuppliersCount: number
  totalSuppliersCount: number
  bestStockStatus: StockStatus | null
}

// --- Entidades ---

export interface Brand {
  id: string
  name: string
  slug: string
  website: string | null
}

export interface Protocol {
  id: string
  name: string
  slug: string
}

export interface Capability {
  id: string
  code: CapabilityCode
  name: string
  description: string | null
}

export interface Supplier {
  id: string
  name: string
  slug: string
}

export interface ProductSupplier {
  supplier: Supplier
  price: number | null
  currency: string
  stockStatus: StockStatus
  isPreferredSupplier: boolean
  leadTimeDays: number | null
}

export interface Product {
  id: string
  slug: string
  name: string
  productType: ProductType
  recommendedTier: RecommendedTier
  requiresNeutral: boolean
  installationDifficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPERT'
  powerConsumption: number | null
  localControl: boolean
  cloudRequired: boolean
  brand: Brand
  protocolLinks: Array<{
    isPrimary: boolean
    protocol: Protocol
  }>
  capabilityLinks: Array<{
    capability: Capability
  }>
  supplierLinks: ProductSupplier[]
}

export interface Ecosystem {
  id: string
  name: string
  slug: string
}

export interface InstallationRequirement {
  id: string
  name: string
  description: string | null
}

export interface InfrastructureRequirement {
  id: string
  name: string
  description: string | null
}

export interface Hub {
  id: string
  name: string
  slug: string
  brand: Brand
}

export interface ProductDetail extends Product {
  categoryLinks: Array<{ category: { id: string; name: string; slug: string } }>
  ecosystemCompatibilities: Array<{
    compatibilityLevel: CompatibilityLevel
    requiresBridge: boolean
    ecosystem: Ecosystem
  }>
  installationLinks: Array<{ requirement: InstallationRequirement }>
  infrastructureLinks: Array<{ requirement: InfrastructureRequirement }>
  hubLinks: Array<{ hub: Hub }>
  automationLinks: Array<{ automation: { id: string; name: string } }>
  sceneLinks: Array<{ scene: { id: string; name: string } }>
  finalPrice: ComputedPrice
  realAvailability: ComputedAvailability
}

export interface CatalogSummary {
  total: number
  byType: Record<ProductType, number>
  byTier: Record<RecommendedTier, number>
  inStock: number
}

// --- Filtros ---

export interface ProductFilters {
  productType?: ProductType
  tier?: RecommendedTier
  protocolSlug?: string
  brandSlug?: string
  capabilityCode?: CapabilityCode
  localControl?: boolean
  inStock?: boolean
}