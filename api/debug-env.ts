import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const count = await prisma.shop.count()
    res.status(200).json({ ok: true, count })
  } catch (err) {
    res.status(500).json({
      debug: String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
    })
  }
}
