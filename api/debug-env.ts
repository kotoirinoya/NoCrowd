import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readdirSync } from 'node:fs'

function listDir(path: string): string[] | string {
  try {
    return readdirSync(path)
  } catch (err) {
    return String(err)
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    cwd: process.cwd(),
    task: listDir('/var/task'),
    taskApi: listDir('/var/task/api'),
    taskServer: listDir('/var/task/server'),
    taskNodeModulesPrisma: listDir('/var/task/node_modules/.prisma/client'),
  })
}
