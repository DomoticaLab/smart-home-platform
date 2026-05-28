export interface CreateQuoteInput {
  clientId?: string
  projectName?: string
  projectAddress?: string
  notes?: string
}

export interface AddQuoteItemInput {
  productId: string
  quantity: number
  unitPrice?: number
  estimatedInstall?: number
  roomId?: string
  notes?: string
}
