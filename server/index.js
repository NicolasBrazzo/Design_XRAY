import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { analyzeUrl, AnalyzeError, validateUrl } from '../engine/src/index.ts'
import { checkPublicUrl } from './ssrf.js'
import { rateLimit } from './rateLimit.js'

const app = express()
const PORT = process.env.PORT || 3000

// Behind a hosting proxy (Railway, Render) every request comes from the proxy's IP: trusting
// its X-Forwarded-For gives the real client IP to req.ip, which the rate limit needs.
// Only set it when there really is a proxy in front, otherwise clients could fake their IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))

// The built client (npm run build in client/). In development Vite serves it instead.
const CLIENT_DIST = path.join(import.meta.dirname, '../client/dist')

// Every analysis launches its own Chromium (~100–200 MB of RAM): past this limit, new requests get 503.
const MAX_RUNNING_ANALYSES = 2
let runningAnalyses = 0

// HTTP status for every error code (engine codes + the ones added here).
const STATUS_BY_CODE = {
  BAD_REQUEST: 400,
  INVALID_URL: 400,
  BLOCKED_URL: 400,
  NOT_FOUND: 404,
  NAME_NOT_RESOLVED: 502,
  HTTP_ERROR: 502,
  BUSY: 503,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  BROWSER_MISSING: 500,
  UNKNOWN: 500,
}

/** All errors have the same shape: { error: { code, message } }. */
function sendError(res, code, message) {
  res.status(STATUS_BY_CODE[code] ?? 500).json({ error: { code, message } })
}

app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, runningAnalyses })
})

const analyzeLimit = rateLimit({
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  windowMs: 10 * 60 * 1000,
  onLimit: (_req, res, retryAfter) =>
    sendError(res, 'RATE_LIMITED', `Too many analyses from your network: try again in ${Math.ceil(retryAfter / 60)} min`),
})

app.post('/api/analyze', analyzeLimit, async (req, res) => {
  const url = req.body?.url

  if (typeof url !== 'string') {
    return sendError(res, 'BAD_REQUEST', 'The body must be { "url": "https://..." }')
  }

  const validation = validateUrl(url)
  if (!validation.result) {
    return sendError(res, 'INVALID_URL', validation.error)
  }

  const blocked = await checkPublicUrl(url)
  if (blocked) {
    return sendError(res, blocked.code, blocked.message)
  }

  if (runningAnalyses >= MAX_RUNNING_ANALYSES) {
    return sendError(res, 'BUSY', 'Two analyses are already running: try again in a few seconds')
  }

  // If the client leaves before the end (closed tab, new search), stop the analysis and free the browser.
  // 'close' also fires after a normal response: writableFinished tells the two cases apart.
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableFinished) controller.abort()
  })

  runningAnalyses++
  try {
    res.json(await analyzeUrl(url, { signal: controller.signal }))
  } catch (error) {
    if (error instanceof AnalyzeError) {
      if (error.code === 'ABORTED') return // nobody is listening any more
      return sendError(res, error.code, error.message)
    }
    console.error(error)
    sendError(res, 'UNKNOWN', 'Internal server error')
  } finally {
    runningAnalyses--
  }
})

app.use('/api', (req, res) => {
  sendError(res, 'NOT_FOUND', `No API at ${req.method} ${req.originalUrl}`)
})

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  // React Router: /results?url=... is a client route. Reloading it must still get the app.
  // After /api, so an unknown API path stays a JSON 404. Express 5 syntax for "any path".
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')))
}

// Errors thrown by middleware, e.g. a body that is not valid JSON.
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'BAD_REQUEST', 'The body is not valid JSON')
  }
  console.error(err)
  sendError(res, 'UNKNOWN', 'Internal server error')
})

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))
