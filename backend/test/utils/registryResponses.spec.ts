import { describe, expect, test } from 'vitest'

import {
  BaseApiCheckResponseBodySchema,
  BaseApiCheckResponseHeadersSchema,
  parseRegistryResponse,
} from '../../src/utils/registryResponses.js'

describe('clients > registryResponses', () => {
  test('parseRegistryResponse > success', () => {
    const header = { 'docker-distribution-api-version': 'registry/2.0' }
    const result = parseRegistryResponse(BaseApiCheckResponseHeadersSchema, header)

    expect(result).toEqual({ ok: true, data: header })
  })

  test('parseRegistryResponse > handled error', () => {
    const header = {
      errors: [{ code: '404', message: 'Not Found' }],
    }
    const result = parseRegistryResponse(BaseApiCheckResponseBodySchema, header)

    expect(result).toEqual({ ok: false, error: header })
  })

  test('parseRegistryResponse > unhandled error', () => {
    const header = { foo: 'bar' }
    expect(() => parseRegistryResponse(BaseApiCheckResponseBodySchema, header)).toThrowError(
      /^Response did not match expected schema or RegistryErrorResponse./,
    )
  })
})
