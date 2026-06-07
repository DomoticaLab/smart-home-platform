import { PrismaClient } from '@prisma/client'

export { PrismaClient }

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

// Factory para crear instancias bajo demanda (usado en tests y para
// inyección de dependencias). En producción se usa el singleton.
export function createPrismaClient(url?: string): PrismaClient {
  if (url) {
    return new PrismaClient({ datasources: { db: { url } } })
  }
  return new PrismaClient()
}

// Singleton default para uso en producción (backward compatible).
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
