import { ClientRequest } from 'http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BasePeerConnector } from '../../../src/connectors/peer/base.js'
import { FederationState, RemoteFederationConfig, SystemStatus } from '../../../src/types/types.js'

vi.mock('node-cache', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return { dummy: true }
    }),
  }
})

// Required otherwise it will try and reach out to the non-existent remote address
vi.mock('http', () => {
  return {
    ClientRequest: vi.fn(),
  }
})

const remoteAddress = 'http://localhost:8080'

const defaultConfig: RemoteFederationConfig = {
  baseUrl: remoteAddress,
  kind: 'bailo',
  label: 'Test',
  state: FederationState.ENABLED,
  cache: { query: 60 },
  httpConfig: { host: 'test' },
  proxy: 'pac+file://test.pac',
}

const user = { dn: 'alice', id: 1 }

class DummyConnector extends BasePeerConnector {
  async init() {
    return true
  }

  async getPeerStatus(): Promise<SystemStatus> {
    return { ping: 'pong' }
  }

  async searchEntries(_user, _opts) {
    return {
      entries: [],
    }
  }
}

describe('BasePeerConnector', () => {
  let connector: DummyConnector

  beforeEach(() => {
    connector = new DummyConnector('testId', { ...defaultConfig })
  })

  it('should instantiate with id and config', () => {
    expect(connector.id).toBe('testId')
    expect(connector.config).toEqual(defaultConfig)
  })

  it('returns frozen config from getConfig', () => {
    const config = connector.getConfig()
    expect(config).toEqual(defaultConfig)
    expect(Object.isFrozen(config)).toBe(true)
  })

  it('returns id from getId', () => {
    expect(connector.getId()).toBe('testId')
  })

  it('returns configured state', () => {
    expect(connector.getConfiguredState()).toBe(defaultConfig.state)
  })

  it('isDisabled returns false if enabled', () => {
    expect(connector.isDisabled()).toBe(false)
  })

  it('isDisabled returns true if disabled', () => {
    const disabled = new DummyConnector('d', { ...defaultConfig, state: FederationState.DISABLED })
    expect(disabled.isDisabled()).toBe(true)
  })

  it('getQueryCache creates and returns a NodeCache instance', () => {
    // Initially undefined, should be created on call
    expect(connector.queryCache).toBeUndefined()
    const cache = connector.getQueryCache()
    expect(cache).toBeDefined()
    expect(connector.queryCache).toBe(cache)
    // Should return the same instance on subsequent calls
    expect(connector.getQueryCache()).toBe(cache)
  })

  it('getQueryCache returns undefined when cache is not set or queryTtl is -1', () => {
    const noCache = new DummyConnector('id1', { ...defaultConfig, cache: undefined })
    expect(noCache.getQueryCache()).toBeUndefined()
    const disabledCache = new DummyConnector('id2', { ...defaultConfig, cache: { query: -1 } })
    expect(disabledCache.getQueryCache()).toBeUndefined()
  })

  it('buildCacheKey returns namespaced key', () => {
    const b64Dn = Buffer.from('alice').toString('base64')
    const b64Key = Buffer.from('foo').toString('base64')
    expect(connector.buildCacheKey(user, 'foo')).toBe(`testId:${b64Dn}:${b64Key}`)
  })

  it('getHttpsAgent merges the right configs and returns from getHttpsAgent', () => {
    const agent = connector.getHttpsAgent()
    const req = new ClientRequest(remoteAddress)
    expect(agent.getProxyForUrl(remoteAddress, req)).toBe('pac+file://test.pac')
  })

  it('getHttpsAgent merges the httpConfig and returns correctly', () => {
    const agent = connector.getHttpsAgent()
    expect(agent.options?.host).toEqual('test')
  })

  it('getHttpsAgent merges the httpConfig and returns correctly', () => {
    const noHttpConfig = new DummyConnector('id1', { ...defaultConfig, httpConfig: {} })
    expect(noHttpConfig.getHttpsAgent().options?.host).toBeUndefined()

    const someHttpConfig = new DummyConnector('id2', {
      ...defaultConfig,
      httpConfig: {
        host: 'test',
      },
    })
    expect(someHttpConfig.getHttpsAgent().options?.host).eq('test')
  })
})
