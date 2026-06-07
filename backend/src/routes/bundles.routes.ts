import { FastifyInstance } from 'fastify'
import {
  getBundles,
  getBundleBySlug,
  getBundlePrice
} from '../controllers/bundles.controller'

export default async function bundleRoutes(
  app: FastifyInstance
) {
  app.get('/',             getBundles)
  app.get('/:slug',        getBundleBySlug)
  app.get('/:slug/price',  getBundlePrice)
}
