import { prisma } from './db'

// 期限切れになった有効予約をEXPIREDにし、店舗の空席数を戻す。
// バックグラウンドジョブを使わず、読み取り/予約作成のたびに遅延実行する。
// SCHEDULED予約はカレンダー管理をしない簡易仕様のため、席数の増減・自動失効の対象は
// INSTANT（今すぐ確保）のみとする。
export async function expireStaleReservationsForShop(shopId: string): Promise<void> {
  const now = new Date()
  const stale = await prisma.reservation.findMany({
    where: { shopId, status: 'ACTIVE', type: 'INSTANT', expiresAt: { lt: now } },
    select: { id: true },
  })
  if (stale.length === 0) return
  await prisma.$transaction([
    prisma.reservation.updateMany({
      where: { id: { in: stale.map((r) => r.id) } },
      data: { status: 'EXPIRED' },
    }),
    prisma.shop.update({
      where: { id: shopId },
      data: { availableSeats: { increment: stale.length } },
    }),
  ])
}

export async function expireStaleReservationsForAllShops(): Promise<void> {
  const now = new Date()
  const grouped = await prisma.reservation.groupBy({
    by: ['shopId'],
    where: { status: 'ACTIVE', type: 'INSTANT', expiresAt: { lt: now } },
    _count: { _all: true },
  })
  for (const group of grouped) {
    await prisma.$transaction([
      prisma.reservation.updateMany({
        where: { shopId: group.shopId, status: 'ACTIVE', type: 'INSTANT', expiresAt: { lt: now } },
        data: { status: 'EXPIRED' },
      }),
      prisma.shop.update({
        where: { id: group.shopId },
        data: { availableSeats: { increment: group._count._all } },
      }),
    ])
  }
}
