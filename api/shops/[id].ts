import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { expireStaleReservationsForShop } from '../_lib/expireReservations'
import { toShopDTO } from '../_lib/dto'
import { getRatingStatsForShop } from '../_lib/ratings'

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

  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: '不正なリクエストです。' })
    return
  }

  await expireStaleReservationsForShop(id)

  const shop = await prisma.shop.findUnique({ where: { id } })
  if (!shop) {
    res.status(404).json({ error: 'カフェが見つかりません。' })
    return
  }

  const lat = parseCoord(req.query.lat)
  const lng = parseCoord(req.query.lng)
  const coords = lat !== null && lng !== null ? { lat, lng } : null

  const ratingStats = await getRatingStatsForShop(id)
  res.status(200).json(toShopDTO(shop, coords, ratingStats))
}
