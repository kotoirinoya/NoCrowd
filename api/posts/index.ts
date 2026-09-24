import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../server/db'
import { requireUser } from '../../server/auth'
import type { PostDTO } from '../../shared/types'

function toPostDTO(post: {
  id: string
  photoUrl: string
  comment: string
  rating: number | null
  createdAt: Date
  user: { id: string; username: string }
  shop: { id: string; name: string }
}): PostDTO {
  return {
    id: post.id,
    photoUrl: post.photoUrl,
    comment: post.comment,
    rating: post.rating,
    createdAt: post.createdAt.toISOString(),
    user: { id: post.user.id, username: post.user.username },
    shop: { id: post.shop.id, name: post.shop.name },
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { shopId, mine } = req.query

  const where: { shopId?: string; userId?: string } = {}
  if (typeof shopId === 'string' && shopId) {
    where.shopId = shopId
  }
  if (mine === '1') {
    const userId = requireUser(req, res)
    if (!userId) return
    where.userId = userId
  }

  const posts = await prisma.post.findMany({
    where,
    include: { user: true, shop: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  res.status(200).json(posts.map(toPostDTO))
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const userId = requireUser(req, res)
  if (!userId) return

  const { shopId, photoUrl, comment, rating } = req.body ?? {}
  if (typeof shopId !== 'string' || !shopId) {
    res.status(400).json({ error: '入力が完了していません。' })
    return
  }
  if (typeof photoUrl !== 'string' || !photoUrl) {
    res.status(400).json({ error: '写真を選択してください。' })
    return
  }
  if (typeof comment !== 'string' || comment.trim().length === 0) {
    res.status(400).json({ error: 'コメントを入力してください。' })
    return
  }
  if (comment.length > 500) {
    res.status(400).json({ error: 'コメントは500字以内で入力してください。' })
    return
  }
  if (rating !== undefined && rating !== null) {
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: '評価は1〜5で入力してください。' })
      return
    }
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } })
  if (!shop) {
    res.status(404).json({ error: 'カフェが見つかりません。' })
    return
  }

  const post = await prisma.post.create({
    data: {
      userId,
      shopId,
      photoUrl,
      comment: comment.trim(),
      rating: rating ?? null,
    },
    include: { user: true, shop: true },
  })

  res.status(201).json(toPostDTO(post))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    await handleGet(req, res)
    return
  }
  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
