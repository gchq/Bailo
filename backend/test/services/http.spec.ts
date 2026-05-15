import https from 'node:http'

import { Dispatcher1Wrapper } from 'undici'
import { describe, expect, test } from 'vitest'

import { getHttpsAgent, getHttpsUndiciAgent } from '../../src/services/http.js'

describe('services > http', () => {
  test('getHttpsAgent', () => {
    expect(getHttpsAgent()).toBeInstanceOf(https.Agent)
  })

  test('getHttpsUndiciAgent', () => {
    expect(getHttpsUndiciAgent()).toBeInstanceOf(Dispatcher1Wrapper)
  })
})
