import { describe, expect, test, vi } from 'vitest'

import { getAccessRequestCurrentUserPermissionsSchema } from '../../../../src/routes/v2/model/accessRequest/getAccessRequestCurrentUserPermissions.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

describe('routes > model > accessRequest > getAccessRequestCurrentUserPermissions', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/accessRequest.js', () => ({
      getCurrentUserPermissionsByAccessRequest: vi.fn(() => ({
        editAccessRequest: { hasPermission: true },
        deleteAccessRequest: { hasPermission: true },
      })),
    }))

    const fixture = createFixture(getAccessRequestCurrentUserPermissionsSchema)
    const res = await testGet(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}/permissions/mine`,
    )

    expect(res.statusCode).toBe(200)
  })
})
