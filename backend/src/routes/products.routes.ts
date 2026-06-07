import { FastifyInstance } from 'fastify'
import {
  getByCapability,
  getByProtocol,
  getByTier,
  getCatalogSummary,
  getCompatibleWithHub,
  getProductBySlug,
  getProducts
} from '../controllers/products.controller'

export default async function productRoutes(
  app: FastifyInstance
) {
  // Las rutas específicas se registran ANTES de la ruta catch-all
  // `/:slug` para que Fastify no las capture con el parámetro dinámico.
  // En particular, /catalog-summary (1 segmento) colisionaría con /:slug
  // si se declarara después.
  app.get('/catalog-summary', getCatalogSummary)
  app.get('/by-protocol/:protocolSlug', getByProtocol)
  app.get('/by-tier/:tier', getByTier)
  app.get('/by-capability/:code', getByCapability)
  app.get('/compatible-with/:hubSlug', getCompatibleWithHub)

  // Rutas originales del recurso de productos.
  app.get('/',      getProducts)
  app.get('/:slug', getProductBySlug)
}
