// Constantes de dominio compartidas por las capas de servicio y repositorio.
// Mantener todos los valores configurables centralizados aquí facilita el
// ajuste de reglas de negocio sin tocar la lógica.

// --- Márgenes comerciales ---
// Margen aplicado sobre el costo de equipos al calcular el precio de venta.
export const MARGIN_BUNDLE = 0.25
// Margen aplicado sobre el costo de equipos individuales en cotizaciones.
// Es el margen comercial de la venta de equipos (NO de bundles). La regla
// de negocio es: equipmentSale = equipmentCost × (1 + MARGIN_EQUIPMENT).
// El multiplicador efectivo es 1.45 (precio venta = costo × 1.45).
export const MARGIN_EQUIPMENT = 0.45
// Margen aplicado sobre el costo base de mano de obra + electricista.
export const MARGIN_LABOR = 0.40

// --- Costos base de mano de obra (CLP) ---
// Costo base fijo de mano de obra, independiente del número de dispositivos.
export const BASE_LABOR_COST = 160000
// Costo extra de mano de obra cuando se supera el umbral de dispositivos.
export const EXTRA_LABOR_COST = 100000
// Tarifa diaria del electricista.
export const ELECTRICIAN_DAILY_RATE = 180000

// --- Impuestos ---
// Tasa de IVA aplicada al subtotal (Chile: 19%).
export const IVA_RATE = 0.19

// --- Reglas de negocio ---
// Umbral de dispositivos a partir del cual se cobra mano de obra extra.
export const DEVICE_COUNT_THRESHOLD = 15
// Heurística: 1 día de electricista por cada N dispositivos.
export const DEVICES_PER_ELECTRICIAN_DAY = 5
// Días mínimos de electricista (un bundle pequeño nunca es "0 días").
export const MIN_ELECTRICIAN_DAYS = 1

// --- Logging ---
// Nivel por defecto del logger de Pino cuando LOG_LEVEL no está definido.
// Acepta los valores estándar de Pino: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'.
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
