import express from 'express'
import { analyzeUrl, AnalyzeError, validateUrl } from '../engine/src/index.ts'
import { checkPublicUrl } from './ssrf.js'

const app = express()
const PORT = process.env.PORT || 3000

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

app.post('/api/analyze', async (req, res) => {
  const url = req.body?.url

  if (typeof url !== 'string') {
    return sendError(res, 'BAD_REQUEST', 'Il body deve essere { "url": "https://..." }')
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
    return sendError(res, 'BUSY', 'Ci sono già altre analisi in corso: riprova tra qualche secondo')
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
    sendError(res, 'UNKNOWN', 'Errore interno del server')
  } finally {
    runningAnalyses--
  }
})

app.use('/api', (req, res) => {
  sendError(res, 'NOT_FOUND', `Nessuna API su ${req.method} ${req.originalUrl}`)
})

// Errors thrown by middleware, e.g. a body that is not valid JSON.
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'BAD_REQUEST', 'Il body non è JSON valido')
  }
  console.error(err)
  sendError(res, 'UNKNOWN', 'Errore interno del server')
})

app.listen(PORT, () => console.log(`Server su http://localhost:${PORT}`))
