import { useQuery } from '@tanstack/react-query'
import {
  fetchProducts,
  fetchProductBySlug,
  fetchCatalogSummary,
  fetchProductsByTier
} from '../services/products.service'
import type { ProductFilters } from '../types/product.types'

export function useProducts(
  filters: ProductFilters,
  page: number,
  limit = 20
) {
  return useQuery({
    queryKey: ['products', filters, page],
    queryFn: () => fetchProducts(filters, page, limit),
    placeholderData: (prev) => prev
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug
  })
}

export function useCatalogSummary() {
  return useQuery({
    queryKey: ['catalog-summary'],
    queryFn: fetchCatalogSummary,
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}

export function useProductsByTier(tier: string) {
  return useQuery({
    queryKey: ['products', 'by-tier', tier],
    queryFn: () => fetchProductsByTier(tier),
    enabled: !!tier
  })
}