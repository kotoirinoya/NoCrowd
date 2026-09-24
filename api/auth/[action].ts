import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db.js'
import { verifyPassword, hashPassword, issueUserToken, clearAuthCookie, USER_COOKIE, requireUser } from '../_lib/auth.js'
import { toUserDTO } from '../_lib/dto.js'
import { validateUsername, validatePassword } from '../../shared/validation.js'

async function signup(req: VercelRequest, res: VercelResponse) {
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

async function login(req: VercelRequest, res: VercelResponse) {
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

async function logout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  clearAuthCookie(res, USER_COOKIE)
  res.status(200).json({ ok: true })
}

async function me(req: VercelRequest, res: VercelResponse) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action
  switch (action) {
    case 'signup':
      return signup(req, res)
    case 'login':
      return login(req, res)
    case 'logout':
      return logout(req, res)
    case 'me':
      return me(req, res)
    default:
      res.status(404).json({ error: 'Not Found' })
  }
}
