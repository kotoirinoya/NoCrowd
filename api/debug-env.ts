import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readdirSync, readFileSync } from 'node:fs'

function listDir(path: string): string[] | string {
  try {
    return readdirSync(path)
  } catch (err) {
    return String(err)
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let bundleHead = ''
  try {
    bundleHead = readFileSync('/var/task/api/debug-env.js', 'utf-8').slice(0, 1500)
  } catch (err) {
    bundleHead = String(err)
  }
  res.status(200).json({
    task: listDir('/var/task'),
    taskApi: listDir('/var/task/api'),
    taskApiLib: listDir('/var/task/api/_lib'),
    bundleHead,
  })
}
