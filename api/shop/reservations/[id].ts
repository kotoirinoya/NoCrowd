import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../_lib/db.js'
import { requireShop } from '../../_lib/auth.js'
import { toShopReservationDTO } from '../../_lib/dto.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const auth = requireShop(req, res)
  if (!auth) return

  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: '不正なリクエストです。' })
    return
  }

  const { action } = req.body ?? {}
  if (action !== 'complete' && action !== 'no_show') {
    res.status(400).json({ error: '不正なリクエストです。' })
    return
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation || reservation.shopId !== auth.shopId) {
    res.status(404).json({ error: '予約が見つかりません。' })
    return
  }
  if (reservation.status !== 'ACTIVE') {
    res.status(409).json({ error: 'この予約は既に確定/失効しています。' })
    return
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.reservation.update({
      where: { id },
      data:
        action === 'complete'
          ? { status: 'COMPLETED' }
          : { status: 'CANCELLED', cancelledAt: new Date() },
      include: { user: true },
    })
    if (action === 'no_show' && reservation.type === 'INSTANT') {
      // 無断不来店の場合のみ、アプリ上で確保していた座席をすぐに解放する（SCHEDULEDは元々減算していない）。
      // 来店済み(complete)の場合の実際の座席回転は、店舗側が空席数を別途更新する運用とする。
      await tx.shop.update({
        where: { id: auth.shopId },
        data: { availableSeats: { increment: 1 } },
      })
    }
    return next
  })

  res.status(200).json(toShopReservationDTO(updated))
}
