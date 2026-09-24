import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './_lib/db.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const count = await prisma.shop.count()
    res.status(200).json({ ok: true, count })
  } catch (err) {
    res.status(500).json({
      debug: String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
    })
  }
}
