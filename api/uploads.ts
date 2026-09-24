import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { requireUser } from '../server/auth'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const userId = requireUser(req, res)
  if (!userId) return

  const { dataUrl, filename } = req.body ?? {}
  if (typeof dataUrl !== 'string' || typeof filename !== 'string' || !filename) {
    res.status(400).json({ error: '画像データが不正です。' })
    return
  }

  const match = dataUrl.match(DATA_URL_PATTERN)
  if (!match) {
    res.status(400).json({ error: '画像形式はJPEG/PNG等の画像ファイルにしてください。' })
    return
  }
  const [, contentType, base64Data] = match
  const buffer = Buffer.from(base64Data, 'base64')
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    res.status(400).json({ error: '画像サイズは5MB以内にしてください。' })
    return
  }

  const blob = await put(`uploads/${userId}/${Date.now()}-${filename}`, buffer, {
    access: 'public',
    contentType,
  })

  res.status(201).json({ url: blob.url })
}
