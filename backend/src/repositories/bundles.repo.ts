import { prisma } from '../lib/prisma'

export class BundlesRepository {
  async findAll() {
    return prisma.bundle.findMany({
      where: { isActive: true },
      include: {
        items: { include: { product: true } }
      }
    })
  }

  async findBySlug(slug: string) {
    return prisma.bundle.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      }
    })
  }
}
