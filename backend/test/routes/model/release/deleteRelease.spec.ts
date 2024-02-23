import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { deleteReleaseSchema } from '../../../../src/routes/v2/release/deleteRelease.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

describe('routes > release > deleteRelease', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/v2/release.js', () => ({
      deleteRelease: vi.fn(() => ({ message: 'Successfully removed release.' })),
    }))

    const fixture = createFixture(deleteReleaseSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/v2/release.js', () => ({
      deleteRelease: vi.fn(() => ({ message: 'Successfully removed release.' })),
    }))

    const fixture = createFixture(deleteReleaseSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteRelease).toBeCalled()
    expect(audit.onDeleteRelease.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onDeleteRelease.mock.calls.at(0).at(2)).toMatchSnapshot()
  })
})
