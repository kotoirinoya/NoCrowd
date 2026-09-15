// vercel dev の Node関数ランタイムがこの開発コンテナ環境でハングする問題を回避するための、
// ローカル専用の軽量APIサーバー。api/配下のハンドラーをそのまま呼び出す（本番のVercel Functionsには影響しない）。
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../api')

// .env / .env.local を読み込む
for (const file of ['.env', '.env.local']) {
  try {
    const text = readFileSync(path.resolve(__dirname, '..', file), 'utf-8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_]+)="?(.*?)"?$/)
      if (m) process.env[m[1]] = m[2]
    }
  } catch {
    // ファイルが無ければ無視
  }
}

const PORT = 4000

interface Route {
  method: string
  segments: string[]
  file: string
}

function toSegments(pattern: string): string[] {
  return pattern.split('/').filter(Boolean)
}

const ROUTES: Route[] = [
  { method: 'POST', segments: toSegments('/api/auth/signup'), file: 'auth/signup.ts' },
  { method: 'POST', segments: toSegments('/api/auth/login'), file: 'auth/login.ts' },
  { method: 'POST', segments: toSegments('/api/auth/logout'), file: 'auth/logout.ts' },
  { method: 'GET', segments: toSegments('/api/auth/me'), file: 'auth/me.ts' },
  { method: 'GET', segments: toSegments('/api/users/me'), file: 'users/me.ts' },
  { method: 'PATCH', segments: toSegments('/api/users/me'), file: 'users/me.ts' },
  { method: 'POST', segments: toSegments('/api/uploads'), file: 'uploads.ts' },
  { method: 'GET', segments: toSegments('/api/posts'), file: 'posts/index.ts' },
  { method: 'POST', segments: toSegments('/api/posts'), file: 'posts/index.ts' },
  { method: 'GET', segments: toSegments('/api/shops'), file: 'shops/index.ts' },
  { method: 'GET', segments: toSegments('/api/shops/:id'), file: 'shops/[id].ts' },
  { method: 'GET', segments: toSegments('/api/reservations'), file: 'reservations/index.ts' },
  { method: 'POST', segments: toSegments('/api/reservations'), file: 'reservations/index.ts' },
  { method: 'POST', segments: toSegments('/api/reservations/:id/cancel'), file: 'reservations/[id]/cancel.ts' },
  { method: 'POST', segments: toSegments('/api/shop-auth/login'), file: 'shop-auth/login.ts' },
  { method: 'POST', segments: toSegments('/api/shop-auth/logout'), file: 'shop-auth/logout.ts' },
  { method: 'GET', segments: toSegments('/api/shop/status'), file: 'shop/status.ts' },
  { method: 'POST', segments: toSegments('/api/shop/status'), file: 'shop/status.ts' },
  { method: 'POST', segments: toSegments('/api/shop/reservations/:id'), file: 'shop/reservations/[id].ts' },
]

function matchRoute(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
  const pathSegments = toSegments(pathname)
  for (const route of ROUTES) {
    if (route.method !== method) continue
    if (route.segments.length !== pathSegments.length) continue
    const params: Record<string, string> = {}
    let matched = true
    for (let i = 0; i < route.segments.length; i += 1) {
      const routeSeg = route.segments[i]
      const pathSeg = pathSegments[i]
      if (routeSeg.startsWith(':')) {
        params[routeSeg.slice(1)] = decodeURIComponent(pathSeg)
      } else if (routeSeg !== pathSeg) {
        matched = false
        break
      }
    }
    if (matched) return { route, params }
  }
  return null
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined)
        return
      }
      const raw = Buffer.concat(chunks).toString('utf-8')
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(raw)
      }
    })
    req.on('error', reject)
  })
}

type AugmentedResponse = ServerResponse & {
  status: (code: number) => AugmentedResponse
  json: (payload: unknown) => void
}

function augmentResponse(res: ServerResponse): AugmentedResponse {
  const augmented = res as AugmentedResponse
  augmented.status = (code: number) => {
    res.statusCode = code
    return augmented
  }
  augmented.json = (payload: unknown) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }
  return augmented
}

const server = createServer(async (req, res) => {
  const augmentedRes = augmentResponse(res)
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    const match = matchRoute(req.method ?? 'GET', url.pathname)
    if (!match) {
      augmentedRes.status(404).json({ error: 'Not Found' })
      return
    }

    const body = req.method === 'GET' ? undefined : await readBody(req)
    const query: Record<string, string> = { ...match.params }
    for (const [key, value] of url.searchParams) {
      query[key] = value
    }

    const fakeReq = Object.assign(req, { query, body }) as IncomingMessage & {
      query: Record<string, string>
      body: unknown
    }

    const modulePath = path.join(API_DIR, match.route.file)
    const mod = await import(`${modulePath}?t=${Date.now()}`)
    await mod.default(fakeReq, augmentedRes)
  } catch (err) {
    console.error(err)
    if (!res.headersSent) {
      augmentedRes.status(500).json({ error: 'Internal Server Error' })
    }
  }
})

server.listen(PORT, () => {
  console.log(`ローカルAPIサーバー起動: http://localhost:${PORT}`)
})
