import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { parse, serialize } from 'cookie'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  if (candidate.length !== hashBuffer.length) return false
  return timingSafeEqual(candidate, hashBuffer)
}

interface UserTokenPayload {
  sub: string
  role: 'user'
}

interface ShopTokenPayload {
  sub: string
  role: 'shop'
  shopId: string
}

export const USER_COOKIE = 'nocrowd_user_token'
export const SHOP_COOKIE = 'nocrowd_shop_token'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function signToken(payload: UserTokenPayload | ShopTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '30d' })
}

function setAuthCookie(res: VercelResponse, name: string, token: string) {
  res.setHeader(
    'Set-Cookie',
    serialize(name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    }),
  )
}

export function clearAuthCookie(res: VercelResponse, name: string) {
  res.setHeader(
    'Set-Cookie',
    serialize(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  )
}

function getCookie(req: VercelRequest, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  return parse(header)[name]
}

export function issueUserToken(res: VercelResponse, userId: string) {
  setAuthCookie(res, USER_COOKIE, signToken({ sub: userId, role: 'user' }))
}

export function issueShopToken(res: VercelResponse, staffId: string, shopId: string) {
  setAuthCookie(res, SHOP_COOKIE, signToken({ sub: staffId, role: 'shop', shopId }))
}

export function requireUser(req: VercelRequest, res: VercelResponse): string | null {
  const token = getCookie(req, USER_COOKIE)
  if (!token) {
    res.status(401).json({ error: 'ログインが必要です。' })
    return null
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as UserTokenPayload
    if (payload.role !== 'user') throw new Error('invalid role')
    return payload.sub
  } catch {
    res.status(401).json({ error: 'ログインが必要です。' })
    return null
  }
}

export function requireShop(
  req: VercelRequest,
  res: VercelResponse,
): { staffId: string; shopId: string } | null {
  const token = getCookie(req, SHOP_COOKIE)
  if (!token) {
    res.status(401).json({ error: '店舗ログインが必要です。' })
    return null
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as ShopTokenPayload
    if (payload.role !== 'shop') throw new Error('invalid role')
    return { staffId: payload.sub, shopId: payload.shopId }
  } catch {
    res.status(401).json({ error: '店舗ログインが必要です。' })
    return null
  }
}
