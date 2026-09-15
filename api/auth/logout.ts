import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearAuthCookie, USER_COOKIE } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  clearAuthCookie(res, USER_COOKIE)
  res.status(200).json({ ok: true })
}
