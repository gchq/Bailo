import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { deleteReviewRoleSchema } from '../../../src/routes/v2/review/deleteReviewRole.js'
import { createFixture, testDelete } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/services/mirroredModel/tarball.ts', () => ({}))

describe('routes > reviewRoles > deleteReviewRole', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/review.js', () => ({
      removeReviewRole: vi.fn(() => {}),
    }))

    const fixture = createFixture(deleteReviewRoleSchema)
    const res = await testDelete(`/api/v2/review/role/${fixture.params.reviewRoleShortName}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/review.js', () => ({
      removeReviewRole: vi.fn(() => {}),
    }))

    const fixture = createFixture(deleteReviewRoleSchema)
    const res = await testDelete(`/api/v2/review/role/${fixture.params.reviewRoleShortName}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteReviewRole).toBeCalled()
    expect(audit.onDeleteReviewRole.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
