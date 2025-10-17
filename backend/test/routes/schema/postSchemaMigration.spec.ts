import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postSchemaMigrationSchema } from '../../../src/routes/v2/schema/postSchemaMigration.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')
vi.mock('../../../src/services/mirroredModel/tarball.ts', () => ({}))

const mockSchemaMigrationService = vi.hoisted(() => {
  return {
    createSchemaMigrationPlan: vi.fn(),
  }
})
vi.mock('../../../src/services/schemaMigration.js', () => mockSchemaMigrationService)

describe('routes > schema > postSchemaMigration', async () => {
  test('successfully stores the schema migration', async () => {
    const fixture = createFixture(postSchemaMigrationSchema)
    mockSchemaMigrationService.createSchemaMigrationPlan.mockResolvedValue(fixture.body)
    const res = await testPost(`/api/v2/schema-migration`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postSchemaMigrationSchema)
    mockSchemaMigrationService.createSchemaMigrationPlan.mockResolvedValue(fixture.body)
    const res = await testPost(`/api/v2/schema-migration`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateSchemaMigration).toBeCalled()
    expect(audit.onCreateSchemaMigration.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
