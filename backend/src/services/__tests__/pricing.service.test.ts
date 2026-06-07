// Tests unitarios para PricingService.
// Capa de servicios — sin conexión a DB.
import { describe, it, expect } from 'vitest'
import { pricingService } from '../pricing.service'
import {
  MARGIN_BUNDLE,
  MARGIN_LABOR,
  BASE_LABOR_COST,
  EXTRA_LABOR_COST,
  ELECTRICIAN_DAILY_RATE,
  DEVICE_COUNT_THRESHOLD,
  IVA_RATE
} from '../../lib/constants'

describe('PricingService', () => {
  // --- calculateEquipmentPrice ---

  describe('calculateEquipmentPrice', () => {
    it('aplica margen 25% sobre el costo base (MARGIN_BUNDLE)', () => {
      const result = pricingService.calculateEquipmentPrice(100000)
      // 100000 × (1 + 0.25) = 125000
      expect(result).toBe(125000)
    })

    it('redondea a 2 decimales', () => {
      const result = pricingService.calculateEquipmentPrice(33333)
      // 33333 × 1.25 = 41666.25
      expect(result).toBe(41666.25)
    })

    it('devuelve 0 cuando el costo es 0', () => {
      expect(pricingService.calculateEquipmentPrice(0)).toBe(0)
    })
  })

  // --- calculateLaborCost ---

  describe('calculateLaborCost', () => {
    it('calcula costo para configuración pequeña (≤15 dispositivos)', () => {
      // deviceCount=5, electricianDays=1
      // baseConfig = 160000 + 0 = 160000
      // (1 × 180000 + 160000) × 1.40 = 476000
      const result = pricingService.calculateLaborCost(5, 1)
      expect(result).toBe(476000)
    })

    it('calcula costo para configuración grande (>15 dispositivos)', () => {
      // deviceCount=20 (>15), electricianDays=4
      // baseConfig = 160000 + 100000 = 260000
      // (4 × 180000 + 260000) × 1.40 = 1372000
      const result = pricingService.calculateLaborCost(20, 4)
      expect(result).toBe(1372000)
    })

    it('devuelve costo mínimo con 1 día aunque deviceCount=0', () => {
      const result = pricingService.calculateLaborCost(0, 1)
      // baseConfig = 160000 + 0 (0 no supera threshold)
      // (1 × 180000 + 160000) × 1.40 = 476000
      expect(result).toBe(476000)
    })

    it('usa EXTRA_LABOR_COST cuando deviceCount supera el umbral', () => {
      // deviceCount=16 (>15), electricianDays=4
      // baseConfig = 160000 + 100000 = 260000
      // (4 × 180000 + 260000) × 1.40 = 1372000
      const result = pricingService.calculateLaborCost(16, 4)
      expect(result).toBe(1372000)
    })

    it('es consistente con las constantes de dominio', () => {
      const deviceCount = 10
      const electricianDays = 2
      const expectedBaseConfig = BASE_LABOR_COST // 160000
      const expectedRaw = (electricianDays * ELECTRICIAN_DAILY_RATE + expectedBaseConfig) * (1 + MARGIN_LABOR)
      const result = pricingService.calculateLaborCost(deviceCount, electricianDays)
      expect(result).toBe(Number(expectedRaw.toFixed(2)))
    })
  })

  // --- applyIva ---

  describe('applyIva', () => {
    it('aplica IVA del 19%', () => {
      const result = pricingService.applyIva(1000000)
      // 1000000 × 1.19 = 1190000
      expect(result).toBe(1190000)
    })

    it('devuelve 0 para subtotal 0', () => {
      expect(pricingService.applyIva(0)).toBe(0)
    })

    it('es consistente con IVA_RATE', () => {
      const subtotal = 500000
      const expected = Number((subtotal * (1 + IVA_RATE)).toFixed(2))
      expect(pricingService.applyIva(subtotal)).toBe(expected)
    })
  })

  // --- calculateTotal ---

  describe('calculateTotal', () => {
    it('calcula desglose completo con IVA', () => {
      const result = pricingService.calculateTotal(1000000, 500000, true)

      // equipmentSale = 1000000 × 1.25 = 1250000
      expect(result.equipmentSale).toBe(1250000)
      // labor = 500000 (ya viene con margen)
      expect(result.labor).toBe(500000)
      // subtotal = 1250000 + 500000 = 1750000
      expect(result.subtotal).toBe(1750000)
      // iva = 1750000 × 0.19 = 332500
      expect(result.iva).toBe(332500)
      // total = 1750000 + 332500 = 2082500
      expect(result.total).toBe(2082500)
      // marginPct = MARGIN_BUNDLE = 0.25
      expect(result.marginPct).toBe(MARGIN_BUNDLE)
    })

    it('calcula sin IVA cuando applyIvaFlag=false', () => {
      const result = pricingService.calculateTotal(1000000, 500000, false)

      expect(result.subtotal).toBe(1750000)
      expect(result.iva).toBe(0)
      expect(result.total).toBe(1750000)
    })

    it('margen es siempre MARGIN_BUNDLE sin importar los costos', () => {
      const result = pricingService.calculateTotal(0, 0, false)
      expect(result.marginPct).toBe(0.25)
    })

    it('equipo 0 y labor 0 retorna totales en 0', () => {
      const result = pricingService.calculateTotal(0, 0, true)
      expect(result.equipmentSale).toBe(0)
      expect(result.labor).toBe(0)
      expect(result.subtotal).toBe(0)
      expect(result.iva).toBe(0)
      expect(result.total).toBe(0)
    })

    it('valores decimales se redondean correctamente', () => {
      // 33333 × 1.25 = 41666.25
      const result = pricingService.calculateTotal(33333, 11111, true)
      expect(result.equipmentSale).toBe(41666.25)
      expect(result.labor).toBe(11111)
    })
  })
})