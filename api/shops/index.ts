import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../server/db'
import { expireStaleReservationsForAllShops } from '../../server/expireReservations'
import { toShopDTO } from '../../server/dto'
import { getRatingStatsForShops } from '../../server/ratings'

function parseCoord(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    await expireStaleReservationsForAllShops()

    const lat = parseCoord(req.query.lat)
    const lng = parseCoord(req.query.lng)
    const coords = lat !== null && lng !== null ? { lat, lng } : null

    const shops = await prisma.shop.findMany({ orderBy: { name: 'asc' } })
    const ratingStats = await getRatingStatsForShops(shops.map((s) => s.id))
    const dtos = shops.map((shop) => toShopDTO(shop, coords, ratingStats.get(shop.id)))

    if (coords) {
      dtos.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    }

    res.status(200).json(dtos)
  } catch (err) {
    // TEMP DEBUG: remove once the 500 cause is identified
    res.status(500).json({ debug: String(err), stack: err instanceof Error ? err.stack : undefined })
  }
}
