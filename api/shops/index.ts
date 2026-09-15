import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { expireStaleReservationsForAllShops } from '../_lib/expireReservations'
import { toShopDTO } from '../_lib/dto'
import { getRatingStatsForShops } from '../_lib/ratings'

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
}
