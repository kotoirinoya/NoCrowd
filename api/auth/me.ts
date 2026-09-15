import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { requireUser } from '../_lib/auth'
import { toUserDTO } from '../_lib/dto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const userId = requireUser(req, res)
  if (!userId) return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    res.status(401).json({ error: 'ログインが必要です。' })
    return
  }

  res.status(200).json(toUserDTO(user))
}
