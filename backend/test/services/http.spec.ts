import { Agent, EnvHttpProxyAgent, ProxyAgent } from 'undici'
import { describe, expect, test, vi } from 'vitest'

import { getHttpsDispatcher, getHttpsUndiciAgent } from '../../src/services/http.js'

const undiciMocks = vi.hoisted(() => ({
  EnvHttpProxyAgent: vi.fn(),
  ProxyAgent: vi.fn(),
}))

vi.mock(import('undici'), async (importOriginal) => {
  const undici = await importOriginal()
  // Record constructor options while still building the real dispatchers
  class EnvHttpProxyAgent extends undici.EnvHttpProxyAgent {
    constructor(opts) {
      super(opts)
      undiciMocks.EnvHttpProxyAgent(opts)
    }
  }
  class ProxyAgent extends undici.ProxyAgent {
    constructor(opts) {
      super(opts)
      undiciMocks.ProxyAgent(opts)
    }
  }
  return { ...undici, EnvHttpProxyAgent, ProxyAgent }
})

describe('services > http', () => {
  test('getHttpsUndiciAgent', () => {
    expect(getHttpsUndiciAgent()).toBeInstanceOf(Agent)
  })

  test('getHttpsDispatcher > uses environment proxy settings without a proxy', () => {
    const dispatcher = getHttpsDispatcher()

    expect(dispatcher).toBeInstanceOf(EnvHttpProxyAgent)
    expect(undiciMocks.EnvHttpProxyAgent).toHaveBeenCalledWith({
      connect: { rejectUnauthorized: true },
      requestTls: { rejectUnauthorized: true },
    })
    expect(undiciMocks.ProxyAgent).not.toHaveBeenCalled()
  })

  test('getHttpsDispatcher > options override the default TLS options', () => {
    getHttpsDispatcher({ rejectUnauthorized: false, ca: 'ca', cert: 'cert', key: 'key' })

    const tls = { rejectUnauthorized: false, ca: 'ca', cert: 'cert', key: 'key' }
    expect(undiciMocks.EnvHttpProxyAgent).toHaveBeenCalledWith({ connect: tls, requestTls: tls })
  })

  test('getHttpsDispatcher > keeps default options that are not overridden', () => {
    getHttpsDispatcher({ ca: 'ca' })

    expect(undiciMocks.EnvHttpProxyAgent).toHaveBeenCalledWith({
      connect: { rejectUnauthorized: true, ca: 'ca' },
      requestTls: { rejectUnauthorized: true, ca: 'ca' },
    })
  })

  test('getHttpsDispatcher > uses the given proxy', () => {
    const dispatcher = getHttpsDispatcher({ proxy: 'http://proxy.example:3128', rejectUnauthorized: false })

    expect(dispatcher).toBeInstanceOf(ProxyAgent)
    expect(undiciMocks.ProxyAgent).toHaveBeenCalledWith({
      uri: 'http://proxy.example:3128',
      requestTls: { rejectUnauthorized: false },
    })
    expect(undiciMocks.EnvHttpProxyAgent).not.toHaveBeenCalled()
  })

  test('getHttpsDispatcher > rejects PAC and other unsupported proxy URLs', () => {
    expect(() => getHttpsDispatcher({ proxy: 'pac+file://test.pac' })).toThrow(
      'Only http:// and https:// proxy URLs are supported.',
    )
    expect(() => getHttpsDispatcher({ proxy: 'socks5://proxy.example' })).toThrow(
      'Only http:// and https:// proxy URLs are supported.',
    )
    expect(() => getHttpsDispatcher({ proxy: 'not a url' })).toThrow(
      'Only http:// and https:// proxy URLs are supported.',
    )
  })
})
