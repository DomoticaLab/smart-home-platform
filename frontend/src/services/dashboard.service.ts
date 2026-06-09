import { get } from '../lib/http'
import type { QuoteStatus } from '../types/product.types'
import type { RecommendedTier } from '../types/product.types'

export interface TopProduct {
  product: { name: string; slug: string; productType: string }
  timesQuoted: number
}

export interface RecentClient {
  id: string
  name: string
  city: string | null
  quotesCount: number
  lastQuoteDate: string | null
}

export interface RecentQuote {
  id: string
  quoteNumber: string
  status: QuoteStatus
  total: number | null
  clientName: string | null
  createdAt: string
}

export interface DashboardStats {
  quotesByStatus: Record<QuoteStatus, number>
  totalPipeline: number
  totalApproved: number
  topProducts: TopProduct[]
  recentClients: RecentClient[]
  recentQuotes: RecentQuote[]
  bundlesByTier: Record<RecommendedTier, number>
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>('/api/dashboard')
}