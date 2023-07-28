import '../../../utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { BadReq } from '../../../utils/v2/error.js'
import { testGet } from '../../../utils/v2/test/routes.js'
import { mockDeploymentSchema, mockModelSchema } from '../../../utils/v2/test/testModels.js'

const mockSchemaService = vi.hoisted(() => {
  return {findSchemasByUse: vi.fn(() => [mockDeploymentSchema, mockModelSchema]),}
})
vi.mock('../../../services/v2/schema.js', () => (mockSchemaService))

const mockValidate = vi.hoisted(() => {
  return { parse: vi.fn() }
})
vi.mock('../../../utils/v2/validate.js', () => mockValidate)

describe('routes > schema > getSchemas', () => {
  test('returns all schemas', async () => {
    const res = await testGet(`/api/v2/schemas`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only upload schemas with the upload parameter', async () => {
    mockSchemaService.findSchemasByUse.mockReturnValueOnce([mockModelSchema])
    const res = await testGet(`/api/v2/schemas?kind=model`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only deployment schemas with the deployment parameter', async () => {
    mockSchemaService.findSchemasByUse.mockReturnValueOnce([mockDeploymentSchema])
    const res = await testGet(`/api/v2/schemas?kind=deployment`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects unknown query parameter', async () => {
    mockValidate.parse.mockImplementationOnce(() => {
      throw BadReq('Mock Error')
    })
    const res = await testGet(`/api/v2/schemas?kind=notValid`)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
