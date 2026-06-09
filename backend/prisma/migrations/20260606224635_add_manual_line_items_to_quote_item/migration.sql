-- ============================================================================
-- Migration: soporte para ítems manuales en QuoteItem
-- ============================================================================
-- Contexto: los vendedores necesitan poder cotizar equipos que el cliente
-- solicita por su nombre (ej: "batimix 1000", "cable UTP Cat6 por metro",
-- "tornillería", "obra civil") y que no existen en el catálogo de productos.
--
-- Cambios:
--   1. productId pasa a ser opcional (NULL permitido).
--   2. Se agregan customName (obligatorio cuando productId es NULL) y
--      customDescription (opcional, contexto libre).
--   3. La relación Product ahora es opcional en QuoteItem.
--   4. CHECK constraint: exactamente uno de (productId, customName) debe
--      venir. La validación principal vive en Zod (refine) en el backend,
--      este CHECK es una red de seguridad a nivel BD.
--
-- El constraint @@unique([quoteId, productId]) se conserva: en Postgres
-- dos filas con productId NULL NO entran en conflicto (NULL ≠ NULL en
-- unique constraints), por lo que múltiples ítems manuales en la misma
-- cotización se permiten. Los ítems de catálogo siguen deduplicándose.
-- ============================================================================

-- 1. Drop la FK existente antes de tocar la columna
ALTER TABLE "QuoteItem" DROP CONSTRAINT IF EXISTS "QuoteItem_productId_fkey";

-- 2. Hacer productId nullable y agregar las nuevas columnas
ALTER TABLE "QuoteItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "QuoteItem" ADD COLUMN "customName" TEXT;
ALTER TABLE "QuoteItem" ADD COLUMN "customDescription" TEXT;

-- 3. Reconstruir la FK como opcional (ON DELETE RESTRICT se mantiene para
--    no romper integridad referencial cuando hay productId; los NULL
--    no se ven afectados por la FK)
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. CHECK constraint de red de seguridad
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_product_or_custom_required"
  CHECK (
    (("productId" IS NOT NULL) AND ("customName" IS NULL)) OR
    (("productId" IS NULL) AND ("customName" IS NOT NULL))
  );

-- 5. Índice opcional para buscar ítems manuales por nombre (reportes,
--    búsquedas, etc.). Bajo volúmen esperado así que no es crítico.
CREATE INDEX "QuoteItem_customName_idx" ON "QuoteItem" ("customName");
