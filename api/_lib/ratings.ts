import { prisma } from './db.js'

interface RatingStats {
  average: number
  count: number
}

export async function getRatingStatsForShops(shopIds: string[]): Promise<Map<string, RatingStats>> {
  const grouped = await prisma.post.groupBy({
    by: ['shopId'],
    where: { shopId: { in: shopIds }, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const map = new Map<string, RatingStats>()
  for (const g of grouped) {
    if (g._avg.rating !== null) {
      map.set(g.shopId, { average: g._avg.rating, count: g._count.rating })
    }
  }
  return map
}

export async function getRatingStatsForShop(shopId: string): Promise<RatingStats | undefined> {
  const map = await getRatingStatsForShops([shopId])
  return map.get(shopId)
}
