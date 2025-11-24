import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { putSchemaMigrationSchema } from '../../../src/routes/v2/schema/putSchemaMigration.js'
import { createFixture, testPut } from '../../testUtils/routes.js'
import { testSchemaMigration } from '../../testUtils/testModels.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockSchemaMigrationService = vi.hoisted(() => {
  return {
    updateSchemaMigrationPlan: vi.fn(),
  }
})
vi.mock('../../../src/services/schemaMigration.js', () => mockSchemaMigrationService)

describe('routes > schema > putSchemaMigration', async () => {
  test('successfully updates the schema migration', async () => {
    const fixture = createFixture(putSchemaMigrationSchema)
    mockSchemaMigrationService.updateSchemaMigrationPlan.mockResolvedValue(testSchemaMigration)
    const res = await testPut(`/api/v2/schema-migration/${fixture.params.schemaMigrationId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putSchemaMigrationSchema)
    mockSchemaMigrationService.updateSchemaMigrationPlan.mockResolvedValue(testSchemaMigration)
    const res = await testPut(`/api/v2/schema-migration/${fixture.params.schemaMigrationId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateSchemaMigration).toBeCalled()
    expect(audit.onUpdateSchemaMigration.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
