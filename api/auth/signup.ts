import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { hashPassword, issueUserToken } from '../_lib/auth'
import { toUserDTO } from '../_lib/dto'
import { validateUsername, validatePassword } from '../../shared/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: '入力が完了していません。' })
    return
  }

  const usernameError = validateUsername(username)
  if (usernameError) {
    res.status(400).json({ error: usernameError })
    return
  }
  const passwordError = validatePassword(password)
  if (passwordError) {
    res.status(400).json({ error: passwordError })
    return
  }

  const existing = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (existing) {
    res.status(409).json({ error: 'このユーザー名は既に使われています。' })
    return
  }

  const user = await prisma.user.create({
    data: { username: username.trim(), passwordHash: hashPassword(password) },
  })

  issueUserToken(res, user.id)
  res.status(201).json(toUserDTO(user))
}
