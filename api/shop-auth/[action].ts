import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../server/db'
import { verifyPassword, issueShopToken, clearAuthCookie, SHOP_COOKIE } from '../../server/auth'

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

  const staff = await prisma.shopStaff.findUnique({ where: { username: username.trim() } })
  if (!staff || !verifyPassword(password, staff.passwordHash)) {
    res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません。' })
    return
  }

  issueShopToken(res, staff.id, staff.shopId)
  res.status(200).json({ id: staff.id, username: staff.username, shopId: staff.shopId })
}

async function logout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  clearAuthCookie(res, SHOP_COOKIE)
  res.status(200).json({ ok: true })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action
  switch (action) {
    case 'login':
      return login(req, res)
    case 'logout':
      return logout(req, res)
    default:
      res.status(404).json({ error: 'Not Found' })
  }
}
