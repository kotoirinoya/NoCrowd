import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { CongestionLevel } from '@prisma/client'
import { prisma } from '../../server/db'
import { requireShop } from '../../server/auth'
import { expireStaleReservationsForShop } from '../../server/expireReservations'
import { toShopDTO, toShopReservationDTO } from '../../server/dto'

const CONGESTION_LEVELS = new Set<CongestionLevel>(['UNKNOWN', 'EMPTY', 'MODERATE', 'FULL'])

function isCongestionLevel(value: string): value is CongestionLevel {
  return CONGESTION_LEVELS.has(value as CongestionLevel)
}

async function handleGet(res: VercelResponse, shopId: string) {
  await expireStaleReservationsForShop(shopId)

  const shop = await prisma.shop.findUnique({ where: { id: shopId } })
  if (!shop) {
    res.status(404).json({ error: 'カフェが見つかりません。' })
    return
  }

  const reservations = await prisma.reservation.findMany({
    where: { shopId, status: 'ACTIVE' },
    include: { user: true },
    orderBy: { reservedAt: 'asc' },
  })

  res.status(200).json({
    shop: toShopDTO(shop, null),
    reservations: reservations.map(toShopReservationDTO),
  })
}

async function handlePost(req: VercelRequest, res: VercelResponse, shopId: string) {
  const { congestionLevel, availableSeats } = req.body ?? {}

  const data: {
    congestionLevel?: CongestionLevel
    congestionUpdatedAt?: Date
    availableSeats?: number
  } = {}

  if (congestionLevel !== undefined) {
    if (typeof congestionLevel !== 'string' || !isCongestionLevel(congestionLevel)) {
      res.status(400).json({ error: '混雑状況の値が不正です。' })
      return
    }
    data.congestionLevel = congestionLevel
    data.congestionUpdatedAt = new Date()
  }

  if (availableSeats !== undefined) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) {
      res.status(404).json({ error: 'カフェが見つかりません。' })
      return
    }
    if (
      typeof availableSeats !== 'number' ||
      !Number.isInteger(availableSeats) ||
      availableSeats < 0 ||
      availableSeats > shop.totalSeats
    ) {
      res.status(400).json({ error: `空席数は0〜${shop.totalSeats}の整数で入力してください。` })
      return
    }
    data.availableSeats = availableSeats
  }

  const updated = await prisma.shop.update({ where: { id: shopId }, data })
  res.status(200).json(toShopDTO(updated, null))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireShop(req, res)
  if (!auth) return

  if (req.method === 'GET') {
    await handleGet(res, auth.shopId)
    return
  }
  if (req.method === 'POST') {
    await handlePost(req, res, auth.shopId)
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
