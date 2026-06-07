import { get } from '../lib/http'
import type {
  Product,
  ProductDetail,
  ProductFilters,
  PaginatedResponse,
  CatalogSummary
} from '../types/product.types'

const BASE = '/api/products'

function filtersToQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams()
  if (filters.productType) params.set('productType', filters.productType)
  if (filters.tier) params.set('tier', filters.tier)
  if (filters.protocolSlug) params.set('protocolSlug', filters.protocolSlug)
  if (filters.brandSlug) params.set('brandSlug', filters.brandSlug)
  if (filters.capabilityCode) params.set('capabilityCode', filters.capabilityCode)
  if (filters.localControl !== undefined)
    params.set('localControl', String(filters.localControl))
  if (filters.inStock !== undefined)
    params.set('inStock', String(filters.inStock))
  return params.toString()
}

export async function fetchProducts(
  filters: ProductFilters,
  page: number,
  limit: number
): Promise<PaginatedResponse<Product>> {
  const query = filtersToQueryString(filters)
  const url = `${BASE}?page=${page}&limit=${limit}${query ? `&${query}` : ''}`
  return get<PaginatedResponse<Product>>(url)
}

export async function fetchProductBySlug(
  slug: string
): Promise<ProductDetail> {
  return get<ProductDetail>(`${BASE}/${slug}`)
}

export async function fetchCatalogSummary(): Promise<CatalogSummary> {
  return get<CatalogSummary>(`${BASE}/catalog-summary`)
}

export async function fetchProductsByTier(
  tier: string
): Promise<Product[]> {
  return get<Product[]>(`${BASE}/by-tier/${tier}`)
}

export async function fetchProductsByProtocol(
  protocolSlug: string
): Promise<Product[]> {
  return get<Product[]>(`${BASE}/by-protocol/${protocolSlug}`)
}

export async function fetchProductsByCapability(
  code: string
): Promise<Product[]> {
  return get<Product[]>(`${BASE}/by-capability/${code}`)
}

export async function fetchProductsCompatibleWithHub(
  hubSlug: string
): Promise<Product[]> {
  return get<Product[]>(`${BASE}/compatible-with/${hubSlug}`)
}