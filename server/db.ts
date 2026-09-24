import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

// Constructing PrismaClient at module top level can run during the very
// start of a serverless cold start, before the deployed query engine
// binary is reliably accessible, causing FUNCTION_INVOCATION_FAILED.
// This Proxy defers the real construction until the first property
// access, which happens inside a request handler at runtime.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
