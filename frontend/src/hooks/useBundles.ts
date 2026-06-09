import { useQuery } from '@tanstack/react-query'
import { fetchBundles, fetchBundleBySlug, fetchBundlePrice } from '../services/bundles.service'
import type { BundleFilters } from '../types/bundle.types'

export function useBundles(filters: BundleFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['bundles', filters, page],
    queryFn: () => fetchBundles(filters, page, limit),
    placeholderData: (prev) => prev
  })
}

export function useBundleDetail(slug: string) {
  return useQuery({
    queryKey: ['bundle', slug],
    queryFn: () => fetchBundleBySlug(slug),
    enabled: !!slug
  })
}

export function useBundlePrice(slug: string) {
  return useQuery({
    queryKey: ['bundle-price', slug],
    queryFn: () => fetchBundlePrice(slug),
    enabled: !!slug
  })
}