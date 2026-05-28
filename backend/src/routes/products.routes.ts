import { FastifyInstance } from 'fastify'
import {
  getProducts,
  getProductBySlug
} from '../controllers/products.controller'

export default async function productRoutes(
  app: FastifyInstance
) {
  app.get('/',      getProducts)
  app.get('/:slug', getProductBySlug)
}
