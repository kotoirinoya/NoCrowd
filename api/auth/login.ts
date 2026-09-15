import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { verifyPassword, issueUserToken } from '../_lib/auth'
import { toUserDTO } from '../_lib/dto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    res.status(400).json({ error: '入力が完了していません。' })
    return
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません。' })
    return
  }

  issueUserToken(res, user.id)
  res.status(200).json(toUserDTO(user))
}
