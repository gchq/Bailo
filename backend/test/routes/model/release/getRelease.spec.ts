import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getReleaseSchema } from '../../../../src/routes/v2/release/getRelease.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  getReleaseBySemver: vi.fn(() => ({ _id: 'test', toObject: vi.fn(() => ({ _id: 'test' })) })),
}))

const getFilesByIds = vi.hoisted(() => vi.fn(() => []))

vi.mock('../../../../src/services/file.ts', () => ({
  getFilesByIds,
}))

const findResponsesById = vi.hoisted(() => vi.fn(() => []))

vi.mock('../../../../src/services/response.ts', () => ({
  findResponsesById,
}))

describe('routes > release > getRelease', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getReleaseSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(getFilesByIds).toBeCalled()
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getReleaseSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewRelease).toBeCalled()
    expect(audit.onViewRelease.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
