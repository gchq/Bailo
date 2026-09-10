import { beforeEach, describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { createAccessRequestGroup, getAccessRequestGroup } from '../../../../src/services/accessRequest.js'
import { testGet, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/services/accessRequest.js', () => ({
  createAccessRequestGroup: vi.fn(),
  getAccessRequestGroup: vi.fn(),
}))
const body = {
  modelIds: ['first', 'second'],
  schemaId: 'schema',
  metadata: { overview: { name: 'Research', entities: ['user:test'] } },
}
const requests = [
  { id: 'request-first', modelId: 'first' },
  { id: 'request-second', modelId: 'second' },
]

beforeEach(() => {
  vi.mocked(createAccessRequestGroup).mockResolvedValue({
    groupId: 'group',
    accessRequests: requests as any,
    failedModelIds: [],
  })
  vi.mocked(getAccessRequestGroup).mockResolvedValue(requests as any)
})

describe('access request group routes', () => {
  test('creates and audits each successful request', async () => {
    const res = await testPost('/api/v2/access-request-groups', { body })
    expect(res.statusCode).toBe(200)
    expect(res.body.accessRequests).toEqual(requests)
    expect(createAccessRequestGroup).toHaveBeenCalledWith(expect.anything(), body.modelIds, {
      schemaId: body.schemaId,
      metadata: body.metadata,
    })
    expect(audit.onCreateAccessRequest).toHaveBeenCalledTimes(2)
  })

  test('returns partial failures and audits successful records only', async () => {
    vi.mocked(createAccessRequestGroup).mockResolvedValue({
      groupId: 'group',
      accessRequests: requests.slice(0, 1) as any,
      failedModelIds: ['second'],
    })
    const res = await testPost('/api/v2/access-request-groups', { body })
    expect(res.statusCode).toBe(200)
    expect(res.body.failedModelIds).toEqual(['second'])
    expect(audit.onCreateAccessRequest).toHaveBeenCalledTimes(1)
  })

  test.each([
    { ...body, modelIds: ['first'] },
    { ...body, modelIds: ['first', 'first'] },
    { ...body, modelIds: Array.from({ length: 21 }, (_, index) => String(index)) },
    { ...body, modelIds: ['first', ''] },
    { ...body, metadata: {} },
    { ...body, groupId: 'injected-group' },
    { ...body, createdBy: 'another-user' },
  ])('rejects malformed or forged input %j', async (input) => {
    const res = await testPost('/api/v2/access-request-groups', { body: input })
    expect(res.statusCode).toBe(400)
    expect(createAccessRequestGroup).not.toHaveBeenCalled()
    expect(audit.onCreateAccessRequest).not.toHaveBeenCalled()
  })

  test('lists and audits the authorised group members', async () => {
    const res = await testGet('/api/v2/model/first/access-request/request-first/group')
    expect(res.statusCode).toBe(200)
    expect(getAccessRequestGroup).toHaveBeenCalledWith(expect.anything(), 'first', 'request-first')
    expect(res.body.accessRequests).toEqual(requests)
    expect(audit.onViewAccessRequests).toHaveBeenCalledWith(expect.anything(), requests)
  })
})
