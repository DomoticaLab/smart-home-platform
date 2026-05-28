import { prisma } from '../lib/prisma'

export class ProductsRepository {
  async findAll() {
    return prisma.product.findMany({
      include: {
        brand: true,
        protocolLinks: { include: { protocol: true } },
        capabilityLinks: { include: { capability: true } },
        supplierLinks: {
          where: { isPreferredSupplier: true },
          include: { supplier: true }
        }
      }
    })
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        categoryLinks: { include: { category: true } },
        protocolLinks: { include: { protocol: true } },
        capabilityLinks: { include: { capability: true } },
        ecosystemCompatibilities: {
          include: { ecosystem: true }
        },
        supplierLinks: { include: { supplier: true } },
        hubLinks: { include: { hub: true } }
      }
    })
  }
}
