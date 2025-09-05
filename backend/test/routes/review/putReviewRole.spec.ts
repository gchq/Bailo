import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { putReviewRoleSchema } from '../../../src/routes/v2/review/putReviewRole.js'
import { createFixture, testPut } from '../../testUtils/routes.js'
import { testReviewRole } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

vi.mock('../../../src/services/review.js', () => ({
  updateReviewRole: vi.fn(() => testReviewRole),
}))

describe('routes > review > putReviewRole', () => {
  const fixture = createFixture(putReviewRoleSchema)
  test('200 > ok', async () => {
    const res = await testPut(`/api/v2/review/role/${fixture.params.shortName}`, fixture)

    expect(res.statusCode).toBe(200)
  })

  test('audit > expected call', async () => {
    const res = await testPut(`/api/v2/review/role/${fixture.params.shortName}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateReviewRole).toBeCalled()
    expect(audit.onUpdateReviewRole.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
