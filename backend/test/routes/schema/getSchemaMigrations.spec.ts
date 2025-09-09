import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../testUtils/routes.js'
import { testSchemaMigration } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockSchemaMigrationService = vi.hoisted(() => {
  return {
    searchSchemaMigrations: vi.fn(),
  }
})
vi.mock('../../../src/services/schemaMigration.js', () => mockSchemaMigrationService)

describe('routes > schema > getSchemaMigrations', () => {
  test('returns the schema with the matching ID', async () => {
    mockSchemaMigrationService.searchSchemaMigrations.mockReturnValueOnce([testSchemaMigration])
    const res = await testGet('/api/v2/schema-migrations')

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    mockSchemaMigrationService.searchSchemaMigrations.mockReturnValueOnce([testSchemaMigration])
    const res = await testGet('/api/v2/schema-migrations')

    expect(res.statusCode).toBe(200)
    expect(audit.onViewSchemaMigrations).toBeCalled()
    expect(audit.onViewSchemaMigrations.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
