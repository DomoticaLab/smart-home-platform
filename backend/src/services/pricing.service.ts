// Calculates totals for quotes
// Will be expanded with real logic

export class PricingService {
  calculateSubtotal(
    items: Array<{ unitPrice: number; quantity: number }>
  ): number {
    return items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
  }

  applyMargin(cost: number, marginPct: number): number {
    return cost * (1 + marginPct)
  }

  applyIva(subtotal: number, rate = 0.19): number {
    return subtotal * (1 + rate)
  }
}
