import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'
import { testReviewRole } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/services/mirroredModel/tarball.ts', () => ({}))

describe('routes > model > roles > getModelRoles', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/roles.js', () => ({
      getAllEntryRoles: vi.fn(() => [testReviewRole]),
    }))

    const res = await testGet(`/api/v2/roles?modelId='1234'`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/roles.js', () => ({
      getAllEntryRoles: vi.fn(() => [testReviewRole]),
    }))

    const res = await testGet(`/api/v2/roles?modelId='1234'`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewReviewRoles).toBeCalled()
    expect(audit.onViewReviewRoles.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
