import { get, post, del } from '../lib/http'
import type {
  Quote,
  QuoteDetail,
  QuoteSummary,
  QuoteFilters,
  CreateQuoteInput,
  AddItemInput,
  AddBundleInput,
  AddRoomInput,
  PaginatedQuotes
} from '../types/quote.types'

const BASE = '/api/quotes'

export async function fetchQuotes(
  filters: QuoteFilters = {},
  page = 1,
  limit = 20
): Promise<PaginatedQuotes> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.status) params.set('status', filters.status)
  if (filters.clientId) params.set('clientId', filters.clientId)
  return get<PaginatedQuotes>(`${BASE}?${params.toString()}`)
}

export async function fetchQuoteById(id: string): Promise<QuoteDetail> {
  return get<QuoteDetail>(`${BASE}/${id}`)
}

export async function fetchQuoteSummary(id: string): Promise<QuoteSummary> {
  return get<QuoteSummary>(`${BASE}/${id}/summary`)
}

export async function createQuote(data: CreateQuoteInput): Promise<Quote> {
  return post<Quote>(BASE, data)
}

export async function addRoomToQuote(
  quoteId: string,
  data: AddRoomInput
): Promise<unknown> {
  return post(`${BASE}/${quoteId}/rooms`, data)
}

export async function addItemToQuote(
  quoteId: string,
  data: AddItemInput
): Promise<unknown> {
  return post(`${BASE}/${quoteId}/items`, data)
}

export async function addBundleToQuote(
  quoteId: string,
  data: AddBundleInput
): Promise<unknown> {
  return post(`${BASE}/${quoteId}/bundles`, data)
}

export async function removeItemFromQuote(
  quoteId: string,
  productId: string
): Promise<void> {
  return del<void>(`${BASE}/${quoteId}/items/${productId}`)
}

export async function changeQuoteStatus(
  quoteId: string,
  status: string
): Promise<Quote> {
  return post<Quote>(`${BASE}/${quoteId}/status`, { status })
}

export async function duplicateQuote(quoteId: string): Promise<QuoteDetail> {
  return post<QuoteDetail>(`${BASE}/${quoteId}/duplicate`, {})
}