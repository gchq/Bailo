import '../../../utils/test/testUtils.js'

import { describe, expect, test } from 'vitest'

import { testGet } from '../../../utils/v2/test/routes.js'

describe('routes > schema > getSchemas', () => {

  test('returns all schemas', async () => {
    const res = await testGet(`/api/v2/schemas?kind=upload`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only upload schemas with the upload parameter', async () => {
    const res = await testGet(`/api/v2/schemas?kind=upload`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only deployment schemas with the deployment parameter', async () => {
    const res = await testGet(`/api/v2/schemas?kind=deployment`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects unknown query parameter', async () => {
    const res = await testGet(`/api/v2/schemas?kind=notValid`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})