import https from 'node:http'

import { describe, expect, test } from 'vitest'

import { getHttpsAgent } from '../../src/services/http.js'

describe('services > http', () => {
  test('getHttpsAgent', () => {
    expect(getHttpsAgent()).toBeInstanceOf(https.Agent)
  })
})
