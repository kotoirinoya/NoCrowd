import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { expireStaleReservationsForShop } from '../_lib/expireReservations'
import { generateReservationCode } from '../_lib/reservationCode'
import { toReservationDTO } from '../_lib/dto'
import { RESERVATION_HOLD_MINUTES } from '../../shared/types'

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const userId = requireUser(req, res)
  if (!userId) return

  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: { shop: true },
    orderBy: { reservedAt: 'desc' },
  })

  res.status(200).json(reservations.map(toReservationDTO))
}

async function handleInstantPost(req: VercelRequest, res: VercelResponse, userId: string, shopId: string) {
  const { partySize, contactPhone, contactEmail } = req.body ?? {}

  if (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1) {
    res.status(400).json({ error: '人数を正しく入力してください。' })
    return
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const phone = typeof contactPhone === 'string' && contactPhone ? contactPhone : user.phone
  const email = typeof contactEmail === 'string' && contactEmail ? contactEmail : user.email
  if (!phone && !email) {
    res.status(400).json({ error: '電話番号かメールアドレスのどちらかを入力してください。' })
    return
  }

  await expireStaleReservationsForShop(shopId)

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const existingActive = await tx.reservation.findFirst({
        where: { userId, status: 'ACTIVE', type: 'INSTANT' },
      })
      if (existingActive) {
        throw new Error('ALREADY_RESERVED')
      }
      // 行ロックの競合下でも安全なように、WHERE句付きの単一UPDATEで空席チェックと減算を同時に行う
      const updateResult = await tx.shop.updateMany({
        where: { id: shopId, availableSeats: { gt: 0 } },
        data: { availableSeats: { decrement: 1 } },
      })
      if (updateResult.count === 0) {
        throw new Error('NO_SEATS')
      }
      const now = new Date()
      return tx.reservation.create({
        data: {
          userId,
          shopId,
          type: 'INSTANT',
          code: generateReservationCode(),
          reservedAt: now,
          expiresAt: new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60 * 1000),
          partySize,
          contactPhone: phone,
          contactEmail: email,
        },
        include: { shop: true },
      })
    })

    res.status(201).json(toReservationDTO(reservation))
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_SEATS') {
      res.status(409).json({ error: '満席です。' })
      return
    }
    if (err instanceof Error && err.message === 'ALREADY_RESERVED') {
      res.status(409).json({ error: '既に有効な予約があります。先にキャンセルしてください。' })
      return
    }
    throw err
  }
}

async function handleScheduledPost(req: VercelRequest, res: VercelResponse, userId: string, shopId: string) {
  const { partySize, scheduledFor, contactPhone, contactEmail } = req.body ?? {}

  if (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1) {
    res.status(400).json({ error: '人数を正しく入力してください。' })
    return
  }
  const scheduledDate = typeof scheduledFor === 'string' ? new Date(scheduledFor) : null
  if (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now()) {
    res.status(400).json({ error: '予約日時を正しく入力してください。' })
    return
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const phone = typeof contactPhone === 'string' && contactPhone ? contactPhone : user.phone
  const email = typeof contactEmail === 'string' && contactEmail ? contactEmail : user.email
  if (!phone && !email) {
    res.status(400).json({ error: '電話番号かメールアドレスのどちらかを入力してください。' })
    return
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      shopId,
      type: 'SCHEDULED',
      code: generateReservationCode(),
      partySize,
      scheduledFor: scheduledDate,
      contactPhone: phone,
      contactEmail: email,
    },
    include: { shop: true },
  })

  res.status(201).json(toReservationDTO(reservation))
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const userId = requireUser(req, res)
  if (!userId) return

  const { shopId, type } = req.body ?? {}
  if (typeof shopId !== 'string' || !shopId) {
    res.status(400).json({ error: '入力が完了していません。' })
    return
  }
  if (type !== undefined && type !== 'INSTANT' && type !== 'SCHEDULED') {
    res.status(400).json({ error: '不正なリクエストです。' })
    return
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } })
  if (!shop) {
    res.status(404).json({ error: 'カフェが見つかりません。' })
    return
  }

  if (type === 'SCHEDULED') {
    await handleScheduledPost(req, res, userId, shopId)
  } else {
    await handleInstantPost(req, res, userId, shopId)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    await handleGet(req, res)
    return
  }
  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
