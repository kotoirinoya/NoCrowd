import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './_lib/db'
import { expireStaleReservationsForAllShops } from './_lib/expireReservations'
import { toShopDTO } from './_lib/dto'
import { getRatingStatsForShops } from './_lib/ratings'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const steps: Record<string, string> = {}
  try {
    steps.step = 'expireStaleReservationsForAllShops'
    await expireStaleReservationsForAllShops()

    steps.step = 'prisma.shop.findMany'
    const shops = await prisma.shop.findMany({ orderBy: { name: 'asc' } })

    steps.step = 'getRatingStatsForShops'
    const ratingStats = await getRatingStatsForShops(shops.map((s) => s.id))

    steps.step = 'toShopDTO'
    const dtos = shops.map((shop) => toShopDTO(shop, null, ratingStats.get(shop.id)))

    res.status(200).json({ ok: true, count: dtos.length })
  } catch (err) {
    res.status(500).json({
      failedAt: steps.step,
      debug: String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
    })
  }
}
