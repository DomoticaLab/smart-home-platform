import type { FastifyReply, FastifyRequest } from 'fastify'
import { QuoteStatus, RecommendedTier } from '@prisma/client'
import { prisma } from '../lib/prisma'

// Dashboard response shape
export interface DashboardStats {
  quotesByStatus: Record<QuoteStatus, number>
  totalPipeline: number
  totalApproved: number
  topProducts: Array<{
    product: { name: string; slug: string; productType: string }
    timesQuoted: number
  }>
  recentClients: Array<{
    id: string
    name: string
    city: string | null
    quotesCount: number
    lastQuoteDate: string | null
  }>
  recentQuotes: Array<{
    id: string
    quoteNumber: string
    status: QuoteStatus
    total: number | null
    clientName: string | null
    createdAt: string
  }>
  bundlesByTier: Record<RecommendedTier, number>
}

export async function getDashboard(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    // Ejecutar todas las queries en paralelo
    const [
      statusCounts,
      pipelineSum,
      approvedSum,
      topProducts,
      recentClients,
      recentQuotes,
      bundleTierCounts
    ] = await Promise.all([
      // 1. Conteo de cotizaciones por estado
      prisma.quote.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // 2. Suma de totales en pipeline (REVIEW + FINAL)
      prisma.quote.aggregate({
        where: { status: { in: [QuoteStatus.REVIEW, QuoteStatus.FINAL] } },
        _sum: { estimatedTotal: true }
      }),

      // 3. Suma de totales aprobados
      prisma.quote.aggregate({
        where: { status: QuoteStatus.APPROVED },
        _sum: { estimatedTotal: true }
      }),

      // 4. Top 5 productos más citados en cotizaciones
      prisma.quoteItem.groupBy({
        by: ['productId'],
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5
      }),

      // 5. Clientes recientes (últimos 5 con conteo de cotizaciones)
      prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { quotes: true } },
          quotes: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          }
        }
      }),

      // 6. Cotizaciones recientes (últimas 5)
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          _count: { select: { items: true, bundles: true } }
        }
      }),

      // 7. Conteo de bundles por tier (usados en cotizaciones)
      prisma.bundle.groupBy({
        by: ['tier'],
        _count: { id: true }
      })
    ])

    // Enriquecer topProducts con datos del producto. Filtramos los ítems
    // manuales (productId = NULL) porque no son productos del catálogo y
    // no se pueden enriquecer con datos de Product.
    const productIds = topProducts
      .map((p) => p.productId)
      .filter((id): id is string => id !== null)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, productType: true }
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const enrichedTopProducts: DashboardStats['topProducts'] = topProducts
      .filter((p): p is typeof p & { productId: string } => p.productId !== null)
      .map((p) => {
        const product = productMap.get(p.productId)
        return {
          product: {
            name: product?.name ?? 'Desconocido',
            slug: product?.slug ?? '',
            productType: product?.productType ?? 'OTHER'
          },
          timesQuoted: p._count.productId
        }
      })

    // Construir quotesByStatus
    const quotesByStatus = Object.values(QuoteStatus).reduce<Record<QuoteStatus, number>>(
      (acc, s) => {
        const found = statusCounts.find((c) => c.status === s)
        acc[s] = found?._count.id ?? 0
        return acc
      },
      {} as Record<QuoteStatus, number>
    )

    // Recent clients
    const enrichedRecentClients: DashboardStats['recentClients'] = recentClients.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      quotesCount: c._count.quotes,
      lastQuoteDate: c.quotes[0]?.createdAt?.toISOString() ?? null
    }))

    // Recent quotes
    const enrichedRecentQuotes: DashboardStats['recentQuotes'] = recentQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      total: q.estimatedTotal ? Number(q.estimatedTotal) : null,
      clientName: q.client?.name ?? null,
      createdAt: q.createdAt.toISOString()
    }))

    // Bundles by tier
    const bundlesByTier = Object.values(RecommendedTier).reduce<Record<RecommendedTier, number>>(
      (acc, tier) => {
        const found = bundleTierCounts.find((b) => b.tier === tier)
        acc[tier] = found?._count.id ?? 0
        return acc
      },
      {} as Record<RecommendedTier, number>
    )

    const result: DashboardStats = {
      quotesByStatus,
      totalPipeline: pipelineSum._sum.estimatedTotal
        ? Number(pipelineSum._sum.estimatedTotal)
        : 0,
      totalApproved: approvedSum._sum.estimatedTotal
        ? Number(approvedSum._sum.estimatedTotal)
        : 0,
      topProducts: enrichedTopProducts,
      recentClients: enrichedRecentClients,
      recentQuotes: enrichedRecentQuotes,
      bundlesByTier
    }

    return reply.code(200).send(result)
  } catch (err) {
    console.error('Dashboard error:', err)
    return reply.code(500).send({ error: 'Internal Server Error' })
  }
}