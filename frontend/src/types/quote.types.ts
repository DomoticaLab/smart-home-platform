// Tipos de cotización reflejados del backend.

import type { QuoteStatus } from './product.types'
export type { QuoteStatus } // Re-exportado para consumo por páginas que importan desde aquí
import type { CreateClientInput } from './client.types'

// --- Entidades ---

export interface Quote {
  id: string
  quoteNumber: string
  status: QuoteStatus
  clientId: string
  projectName: string | null
  projectAddress: string | null
  notes: string | null
  estimatedSubtotal: number | null
  estimatedTotal: number | null
  createdAt: string
  updatedAt: string
}

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string | null
  roomId: string | null
  customName: string | null
  customDescription: string | null
  quantity: number
  unitPrice: number | null
  estimatedInstall: number | null
  createdAt: string
  notes: string | null
  product: {
    id: string
    slug: string
    name: string
    brand: { name: string }
  } | null
  room: { id: string; name: string } | null
}

export interface QuoteBundle {
  id: string
  quoteId: string
  bundleId: string
  quantity: number
  createdAt: string
  notes: string | null
  bundle: {
    id: string
    slug: string
    name: string
    basePrice: number | null
  }
}

export interface Room {
  id: string
  quoteId: string
  name: string
  floor: number | null
  areaSqm: number | null
  createdAt: string
  notes: string | null
}

export interface ClientSummary {
  id: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
}

export interface QuoteDetail extends Quote {
  client: ClientSummary
  rooms: Room[]
  items: QuoteItem[]
  bundles: QuoteBundle[]
}

export interface QuoteSummary {
  quoteNumber: string
  client: {
    name: string
    phone: string | null
    email: string | null
    city: string | null
  }
  project: {
    name: string | null
    address: string | null
  }
  rooms: Array<{
    id: string
    name: string
    floor: number | null
    areaSqm: number | null
    items: Array<{
      productName: string
      brandName: string
      isManual: boolean
      quantity: number
      unitPrice: number
      subtotal: number
    }>
    subtotal: number
  }>
  bundles: Array<{
    bundleName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotalEquipment: number
  laborCost: number
  subtotal: number
  iva: number
  total: number
  marginPct: number
  generatedAt: string
}

// --- Inputs ---

export interface CreateQuoteInput {
  clientId: string
  projectName?: string
  projectAddress?: string
  notes?: string
}

export interface AddItemInput {
  productId?: string
  roomId?: string
  customName?: string
  customDescription?: string
  quantity: number
  unitPrice?: number
  estimatedInstall?: number
}

export interface ManualItem {
  customName: string
  customDescription?: string
  quantity: number
  unitPrice: number
  roomId?: string
  roomName?: string
}

export interface AddBundleInput {
  bundleId: string
  quantity: number
}

export interface AddRoomInput {
  name: string
  floor?: number
  areaSqm?: number
}

export interface QuoteFilters {
  status?: QuoteStatus
  clientId?: string
  fromDate?: string
  toDate?: string
}

// --- Respuesta paginada ---

export interface PaginatedQuotes {
  data: Quote[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- Wizard state ---

export type WizardStep = 1 | 2 | 3 | 4

export interface WizardState {
  step: WizardStep
  clientId: string | null
  projectName: string
  projectAddress: string
  rooms: Array<{ id?: string; name: string; floor?: number; areaSqm?: number }>
  items: Array<{
    productId: string
    productName: string
    brandName: string
    roomId?: string
    roomName?: string
    quantity: number
    unitPrice: number
  }>
  manualItems: Array<{
    customName: string
    customDescription?: string
    roomId?: string
    roomName?: string
    quantity: number
    unitPrice: number
  }>
  bundles: Array<{
    bundleId: string
    bundleName: string
    quantity: number
    unitPrice: number
  }>
}

export type WizardAction =
  | { type: 'SET_CLIENT'; clientId: string }
  | { type: 'SET_PROJECT'; name: string; address: string }
  | { type: 'ADD_ROOM'; room: WizardState['rooms'][number] }
  | { type: 'REMOVE_ROOM'; index: number }
  | { type: 'ADD_ITEM'; item: WizardState['items'][number] }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'ADD_MANUAL_ITEM'; item: WizardState['manualItems'][number] }
  | { type: 'REMOVE_MANUAL_ITEM'; index: number }
  | { type: 'ADD_BUNDLE'; bundle: WizardState['bundles'][number] }
  | { type: 'REMOVE_BUNDLE'; index: number }
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'RESET' }

export const WIZARD_INITIAL_STATE: WizardState = {
  step: 1,
  clientId: null,
  projectName: '',
  projectAddress: '',
  rooms: [],
  items: [],
  manualItems: [],
  bundles: []
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, clientId: action.clientId }
    case 'SET_PROJECT':
      return { ...state, projectName: action.name, projectAddress: action.address }
    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, action.room] }
    case 'REMOVE_ROOM':
      return { ...state, rooms: state.rooms.filter((_, i) => i !== action.index) }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.index) }
    case 'ADD_MANUAL_ITEM':
      return { ...state, manualItems: [...state.manualItems, action.item] }
    case 'REMOVE_MANUAL_ITEM':
      return { ...state, manualItems: state.manualItems.filter((_, i) => i !== action.index) }
    case 'ADD_BUNDLE':
      return { ...state, bundles: [...state.bundles, action.bundle] }
    case 'REMOVE_BUNDLE':
      return { ...state, bundles: state.bundles.filter((_, i) => i !== action.index) }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'RESET':
      return WIZARD_INITIAL_STATE
    default:
      return state
  }
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