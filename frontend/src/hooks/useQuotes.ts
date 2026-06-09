import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchQuotes,
  fetchQuoteById,
  fetchQuoteSummary,
  createQuote,
  addRoomToQuote,
  addItemToQuote,
  addBundleToQuote,
  removeItemFromQuote,
  changeQuoteStatus,
  duplicateQuote
} from '../services/quotes.service'
import type {
  QuoteFilters,
  CreateQuoteInput,
  AddItemInput,
  AddBundleInput,
  AddRoomInput
} from '../types/quote.types'

const QUOTES_KEY = ['quotes']

export function useQuotes(filters: QuoteFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...QUOTES_KEY, { filters, page }],
    queryFn: () => fetchQuotes(filters, page, limit),
    placeholderData: (prev) => prev
  })
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: [...QUOTES_KEY, id],
    queryFn: () => fetchQuoteById(id),
    enabled: !!id
  })
}

export function useQuoteSummary(id: string) {
  return useQuery({
    queryKey: [...QUOTES_KEY, 'summary', id],
    queryFn: () => fetchQuoteSummary(id),
    enabled: !!id
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateQuoteInput) => createQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTES_KEY })
    }
  })
}

export function useAddRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: AddRoomInput }) =>
      addRoomToQuote(quoteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUOTES_KEY, variables.quoteId] })
    }
  })
}

export function useAddItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: AddItemInput }) =>
      addItemToQuote(quoteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUOTES_KEY, variables.quoteId] })
    }
  })
}

export function useAddBundle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data: AddBundleInput }) =>
      addBundleToQuote(quoteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUOTES_KEY, variables.quoteId] })
    }
  })
}

export function useRemoveItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quoteId, productId }: { quoteId: string; productId: string }) =>
      removeItemFromQuote(quoteId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUOTES_KEY, variables.quoteId] })
    }
  })
}

export function useChangeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quoteId, status }: { quoteId: string; status: string }) =>
      changeQuoteStatus(quoteId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUOTES_KEY, variables.quoteId] })
      queryClient.invalidateQueries({ queryKey: QUOTES_KEY })
    }
  })
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quoteId: string) => duplicateQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTES_KEY })
    }
  })
}