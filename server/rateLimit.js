// Per-IP limit on analyses: each one launches a browser, so a single visitor (or a script)
// must not be able to keep the server busy. Sliding window, kept in memory: fine for one
// instance; with several instances it would need a shared store (e.g. Redis).

/**
 * Returns a middleware that allows `max` requests per IP every `windowMs`.
 * Over the limit it calls `onLimit(req, res, retryAfterSeconds)`.
 */
export function rateLimit({ max, windowMs, onLimit }) {
  /** IP → timestamps of the requests inside the window, oldest first. */
  const hits = new Map()

  // Forget IPs that have been quiet for a whole window, so the map does not grow forever.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs
    for (const [ip, times] of hits) {
      if (times[times.length - 1] <= cutoff) hits.delete(ip)
    }
  }, windowMs)
  sweep.unref()

  return (req, res, next) => {
    const now = Date.now()
    const times = (hits.get(req.ip) ?? []).filter((time) => time > now - windowMs)

    if (times.length >= max) {
      hits.set(req.ip, times)
      const retryAfter = Math.ceil((times[0] + windowMs - now) / 1000)
      res.set('Retry-After', String(retryAfter))
      return onLimit(req, res, retryAfter)
    }

    times.push(now)
    hits.set(req.ip, times)
    next()
  }
}
