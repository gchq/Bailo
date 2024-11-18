import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { FileScanResult } from '../../../../src/connectors/fileScanning/Base.js'
import { postAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/postAccessRequest.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/accessRequest.js', async () => ({
  createAccessRequest: vi.fn(() => ({ _id: 'test' })),
}))

const fileScanResult: FileScanResult = {
  state: 'complete',
  isInfected: false,
  toolName: 'Test',
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [fileScanResult])),
  init: vi.fn(() => {}),
}))
vi.mock('../../src/connectors/fileScanning/index.js', async () => ({ default: fileScanningMock }))

describe('routes > accessRequest > postAccessRequest', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postAccessRequestSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/access-requests`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postAccessRequestSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/access-requests`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateAccessRequest).toBeCalled()
    expect(audit.onCreateAccessRequest.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postAccessRequestSchema) as any

    // This model does not include a description.
    delete fixture.body.schemaId

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/access-requests`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
