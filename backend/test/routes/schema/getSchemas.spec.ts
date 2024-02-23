import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../testUtils/routes.js'
import { testDeploymentSchema, testModelSchema } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    findSchemasByKind: vi.fn(() => [testDeploymentSchema, testModelSchema]),
  }
})
vi.mock('../../../src/services/schema.js', () => mockSchemaService)

describe('routes > schema > getSchemas', () => {
  test('returns all schemas', async () => {
    const res = await testGet(`/api/v2/schemas`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testGet(`/api/v2/schemas`)

    expect(res.statusCode).toBe(200)
    expect(audit.onSearchSchemas).toBeCalled()
    expect(audit.onSearchSchemas.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('returns only model schemas with the model parameter', async () => {
    mockSchemaService.findSchemasByKind.mockReturnValueOnce([testModelSchema])
    const res = await testGet(`/api/v2/schemas?kind=model`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only deployment schemas with the accessRequest parameter', async () => {
    mockSchemaService.findSchemasByKind.mockReturnValueOnce([testDeploymentSchema])
    const res = await testGet(`/api/v2/schemas?kind=accessRequest`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects unknown query parameter', async () => {
    const res = await testGet(`/api/v2/schemas?kind=notValid`)

    expect(mockSchemaService.findSchemasByKind).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
