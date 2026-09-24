import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Gender, SchoolType } from '@prisma/client'
import { prisma } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { toUserDTO } from '../_lib/dto.js'

const GENDERS = new Set<Gender>(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'])
const SCHOOL_TYPES = new Set<SchoolType>([
  'ELEMENTARY',
  'JUNIOR_HIGH',
  'HIGH_SCHOOL',
  'UNIVERSITY',
  'VOCATIONAL',
  'OTHER',
])
// 000-0000-0000 のようにハイフン区切りの数字のみを受け付ける（市外局番の桁数差を考慮し2〜4桁ずつ許容）
const PHONE_PATTERN = /^\d{2,4}-\d{2,4}-\d{3,4}$/

async function handleGet(res: VercelResponse, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  res.status(200).json(toUserDTO(user))
}

async function handlePatch(req: VercelRequest, res: VercelResponse, userId: string) {
  const { phone, email, avatarUrl, age, schoolType, schoolName, gender, birthday } = req.body ?? {}
  const data: {
    phone?: string | null
    email?: string | null
    avatarUrl?: string | null
    age?: number | null
    schoolType?: SchoolType | null
    schoolName?: string | null
    gender?: Gender | null
    birthday?: Date | null
  } = {}

  if (phone !== undefined) {
    if (phone !== null && (typeof phone !== 'string' || !PHONE_PATTERN.test(phone))) {
      res.status(400).json({ error: '電話番号は000-0000-0000の形式で入力してください。' })
      return
    }
    data.phone = phone
  }

  if (email !== undefined) {
    if (email !== null && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      res.status(400).json({ error: 'メールアドレスの形式が不正です。' })
      return
    }
    data.email = email
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && typeof avatarUrl !== 'string') {
      res.status(400).json({ error: 'プロフィール画像の形式が不正です。' })
      return
    }
    data.avatarUrl = avatarUrl
  }

  if (age !== undefined) {
    if (age !== null && (typeof age !== 'number' || !Number.isInteger(age) || age < 0 || age > 120)) {
      res.status(400).json({ error: '年齢を正しく入力してください。' })
      return
    }
    data.age = age
  }

  if (schoolType !== undefined) {
    if (schoolType !== null && (typeof schoolType !== 'string' || !SCHOOL_TYPES.has(schoolType as SchoolType))) {
      res.status(400).json({ error: '学校種別の値が不正です。' })
      return
    }
    data.schoolType = schoolType
  }

  if (schoolName !== undefined) {
    if (schoolName !== null && typeof schoolName !== 'string') {
      res.status(400).json({ error: '学校名の形式が不正です。' })
      return
    }
    data.schoolName = schoolName
  }

  if (gender !== undefined) {
    if (gender !== null && (typeof gender !== 'string' || !GENDERS.has(gender as Gender))) {
      res.status(400).json({ error: '性別の値が不正です。' })
      return
    }
    data.gender = gender
  }

  if (birthday !== undefined) {
    if (birthday === null) {
      data.birthday = null
    } else {
      const parsed = typeof birthday === 'string' ? new Date(birthday) : null
      if (!parsed || Number.isNaN(parsed.getTime())) {
        res.status(400).json({ error: '生年月日を正しく入力してください。' })
        return
      }
      data.birthday = parsed
    }
  }

  const user = await prisma.user.update({ where: { id: userId }, data })
  res.status(200).json(toUserDTO(user))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireUser(req, res)
  if (!userId) return

  if (req.method === 'GET') {
    await handleGet(res, userId)
    return
  }
  if (req.method === 'PATCH') {
    await handlePatch(req, res, userId)
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
