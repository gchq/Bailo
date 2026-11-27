import express from 'express'
import supertest from 'supertest'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { configureTrustProxy, createApiRateLimiter } from '../../../src/routes/middleware/rateLimiter.js'
import { type Config } from '../../../src/utils/config.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'

const LIMIT = 2

function createApp() {
  const app = express()
  configureTrustProxy(app)
  app.use(createApiRateLimiter({ limit: LIMIT }))
  app.get('/', (_req, res) => {
    res.json({ ok: true })
  })
  return app
}

async function exhaustLimit(app: express.Express, forwardedFor: string) {
  for (let i = 0; i < LIMIT; i++) {
    await supertest(app).get('/').set('X-Forwarded-For', forwardedFor).expect(200)
  }
  await supertest(app).get('/').set('X-Forwarded-For', forwardedFor).expect(429)
}

describe('routes > middleware > rateLimiter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('with a single trusted proxy hop', () => {
    test('gives clients behind the same proxy independent buckets', async () => {
      setTestConfig({ api: { trustProxy: 1 } })
      const app = createApp()

      // NGINX appends the address it saw, so the client is the rightmost entry
      await exhaustLimit(app, '203.0.113.1')

      await supertest(app).get('/').set('X-Forwarded-For', '203.0.113.2').expect(200)
    })

    test('ignores spoofed entries to the left of the proxy-appended address', async () => {
      setTestConfig({ api: { trustProxy: 1 } })
      const app = createApp()

      await exhaustLimit(app, '198.51.100.1, 203.0.113.1')

      await supertest(app).get('/').set('X-Forwarded-For', '198.51.100.2, 203.0.113.1').expect(429)
    })
  })

  describe('with two trusted proxy hops', () => {
    test('keys on the client address behind an ingress and NGINX', async () => {
      setTestConfig({ api: { trustProxy: 2 } })
      const app = createApp()

      await exhaustLimit(app, '203.0.113.1, 10.0.0.1')

      await supertest(app).get('/').set('X-Forwarded-For', '203.0.113.2, 10.0.0.1').expect(200)
    })
  })

  describe('with no trusted proxy', () => {
    test('shares one bucket across clients as the direct peer is used', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      setTestConfig({ api: { trustProxy: false } })
      const app = createApp()

      await exhaustLimit(app, '203.0.113.1')

      await supertest(app).get('/').set('X-Forwarded-For', '203.0.113.2').expect(429)
    })
  })

  describe('configureTrustProxy', () => {
    test.each([
      ['a number', 1],
      ['a CIDR', '10.0.0.0/8'],
      ['a list of CIDRs', ['10.0.0.0/8', '172.16.0.0/12']],
      ['false', false],
    ] as Array<[string, Config['api']['trustProxy']]>)('applies %s to Express', (_name, trustProxy) => {
      setTestConfig({ api: { trustProxy } })
      const app = express()

      configureTrustProxy(app)

      expect(app.get('trust proxy')).toEqual(trustProxy)
    })

    test.each([true, 'true'])('rejects permissive value %s', (trustProxy) => {
      setTestConfig({ api: { trustProxy: trustProxy as unknown as Config['api']['trustProxy'] } })

      expect(() => configureTrustProxy(express())).toThrow(/must not be 'true'/)
    })
  })
})
