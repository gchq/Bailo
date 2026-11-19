import { type Express } from 'express'
import { type Options, rateLimit } from 'express-rate-limit'

import config from '../../utils/config.js'

/**
 * Configures Express to derive `req.ip` from `X-Forwarded-For` using only the explicitly trusted proxies.
 * Rejects `true`, which would trust every entry in the header and let clients spoof their IP.
 */
export function configureTrustProxy(app: Express) {
  const trustProxy: unknown = config.api.trustProxy
  if (trustProxy === true || trustProxy === 'true') {
    throw new Error(
      "config.api.trustProxy must not be 'true'. Use the number of trusted proxy hops or a list of proxy IPs/CIDRs.",
    )
  }
  app.set('trust proxy', config.api.trustProxy)
}

export function createApiRateLimiter(options: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each client IP to 100 requests per `window` (here, per 15 minutes).
    ...options,
  })
}
