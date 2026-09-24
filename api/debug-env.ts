import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const prisma = new PrismaClient()
    const count = await prisma.shop.count()
    res.status(200).json({ ok: true, count })
  } catch (err) {
    res.status(500).json({
      debug: String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
    })
  }
}
