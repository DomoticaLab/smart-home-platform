import { get } from '../lib/http'
import type { Bundle, BundleDetail, BundleFilters, BundlePrice, PaginatedBundles } from '../types/bundle.types'

const BASE = '/api/bundles'

function filtersToQueryString(filters: BundleFilters): string {
  const params = new URLSearchParams()
  if (filters.tier) params.set('tier', filters.tier)
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
  return params.toString()
}

export async function fetchBundles(
  filters: BundleFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedBundles> {
  const query = filtersToQueryString(filters)
  const url = `${BASE}?page=${page}&limit=${limit}${query ? `&${query}` : ''}`
  return get<PaginatedBundles>(url)
}

export async function fetchBundleBySlug(slug: string): Promise<BundleDetail> {
  return get<BundleDetail>(`${BASE}/${slug}`)
}

export async function fetchBundlePrice(slug: string): Promise<BundlePrice> {
  return get<BundlePrice>(`${BASE}/${slug}/price`)
}