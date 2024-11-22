import { describe, expect, test, vi } from 'vitest'

import { getModelCurrentUserPermissionsSchema } from '../../../src/routes/v2/model/getModelCurrentUserPermissions.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > getModelCurrentUserPermissions', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      getCurrentUserPermissionsByModel: vi.fn(() => ({
        editEntry: { hasPermission: true },
        editEntryCard: { hasPermission: true },
        createRelease: { hasPermission: true },
        editRelease: { hasPermission: true },
        deleteRelease: { hasPermission: true },
        pushModelImage: { hasPermission: true },
        createInferenceService: { hasPermission: true },
        editInferenceService: { hasPermission: true },
        exportMirroredModel: { hasPermission: true },
      })),
    }))

    const fixture = createFixture(getModelCurrentUserPermissionsSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/permissions/mine`)

    expect(res.statusCode).toBe(200)
  })
})
