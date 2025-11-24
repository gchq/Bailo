import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getSchemaMigrationSchema } from '../../../src/routes/v2/schema/getSchemaMigration.js'
import { createFixture, testGet } from '../../testUtils/routes.js'
import { testSchemaMigration } from '../../testUtils/testModels.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockSchemaMigrationService = vi.hoisted(() => {
  return {
    searchSchemaMigrationById: vi.fn(),
  }
})
vi.mock('../../../src/services/schemaMigration.js', () => mockSchemaMigrationService)

describe('routes > schema > getSchemaMigration', async () => {
  test('successfully updates the schema migration', async () => {
    const fixture = createFixture(getSchemaMigrationSchema)
    mockSchemaMigrationService.searchSchemaMigrationById.mockResolvedValue(testSchemaMigration)
    const res = await testGet(`/api/v2/schema-migration/${fixture.params.schemaMigrationId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getSchemaMigrationSchema)
    mockSchemaMigrationService.searchSchemaMigrationById.mockResolvedValue(testSchemaMigration)
    const res = await testGet(`/api/v2/schema-migration/${fixture.params.schemaMigrationId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewSchemaMigration).toBeCalled()
    expect(audit.onViewSchemaMigration.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
