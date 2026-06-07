import {
  BASE_LABOR_COST,
  DEVICE_COUNT_THRESHOLD,
  ELECTRICIAN_DAILY_RATE,
  EXTRA_LABOR_COST,
  IVA_RATE,
  MARGIN_BUNDLE,
  MARGIN_LABOR
} from '../lib/constants'

// Resultado de un cálculo de total de cotización / bundle.
// - equipmentSale: costo de equipos con margen aplicado.
// - labor: costo de mano de obra con margen aplicado.
// - subtotal: equipmentSale + labor (sin IVA).
// - iva: subtotal × IVA_RATE (0 si no se aplica IVA).
// - total: subtotal + iva.
// - marginPct: margen comercial aplicado sobre equipos (MARGIN_BUNDLE).
export interface QuoteTotal {
  equipmentSale: number
  labor: number
  subtotal: number
  iva: number
  total: number
  marginPct: number
}

// Servicio compartido de pricing usado por BundlesService y (a futuro)
// QuotesService. Singleton para evitar múltiples instancias con estado
// trivial — todas las funciones son puras.
export class PricingService {
  // Precio de venta de equipos = costo × (1 + MARGIN_BUNDLE).
  calculateEquipmentPrice(cost: number): number {
    return Number((cost * (1 + MARGIN_BUNDLE)).toFixed(2))
  }

  // Costo de mano de obra = (electricianDays × dailyRate + baseConfig) × (1 + MARGIN_LABOR).
  // baseConfig = BASE_LABOR_COST + (deviceCount > DEVICE_COUNT_THRESHOLD ? EXTRA_LABOR_COST : 0).
  calculateLaborCost(deviceCount: number, electricianDays: number): number {
    const baseConfig =
      BASE_LABOR_COST +
      (deviceCount > DEVICE_COUNT_THRESHOLD ? EXTRA_LABOR_COST : 0)
    const raw = (electricianDays * ELECTRICIAN_DAILY_RATE + baseConfig) * (1 + MARGIN_LABOR)
    return Number(raw.toFixed(2))
  }

  // Aplica IVA al subtotal. Devuelve subtotal × (1 + IVA_RATE).
  applyIva(subtotal: number): number {
    return Number((subtotal * (1 + IVA_RATE)).toFixed(2))
  }

  // Calcula el total combinado de un bundle o cotización.
  // - Si applyIvaFlag es true, el IVA se suma al total.
  // - subtotal siempre es equipmentCost + labor (sin IVA).
  // - iva es 0 cuando no se aplica IVA.
  calculateTotal(
    equipmentCost: number,
    laborCost: number,
    applyIvaFlag: boolean
  ): QuoteTotal {
    const equipmentSale = this.calculateEquipmentPrice(equipmentCost)
    const labor = Number(laborCost.toFixed(2))
    const subtotal = Number((equipmentSale + labor).toFixed(2))
    const iva = applyIvaFlag ? Number((subtotal * IVA_RATE).toFixed(2)) : 0
    const total = Number((subtotal + iva).toFixed(2))

    return {
      equipmentSale,
      labor,
      subtotal,
      iva,
      total,
      marginPct: MARGIN_BUNDLE
    }
  }
}

// Singleton exportado. La capa de servicio importa esta instancia.
export const pricingService = new PricingService()
