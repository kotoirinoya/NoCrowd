import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../server/db'
import { requireUser } from '../../../server/auth'
import { toReservationDTO } from '../../../server/dto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const userId = requireUser(req, res)
  if (!userId) return

  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: '不正なリクエストです。' })
    return
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation || reservation.userId !== userId) {
    res.status(404).json({ error: '予約が見つかりません。' })
    return
  }
  if (reservation.status !== 'ACTIVE') {
    res.status(409).json({ error: 'この予約は既に確定/失効しています。' })
    return
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.reservation.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { shop: true },
    })
    // SCHEDULEDは作成時に空席を減らしていないため、キャンセル時も戻さない
    if (reservation.type === 'INSTANT') {
      await tx.shop.update({
        where: { id: reservation.shopId },
        data: { availableSeats: { increment: 1 } },
      })
    }
    return cancelled
  })

  res.status(200).json(toReservationDTO(updated))
}
