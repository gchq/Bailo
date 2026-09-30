import { beforeEach, describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { EntryKind } from '../../src/models/Model.js'
import { UserInterface } from '../../src/models/User.js'
import {
  createAccessRequest,
  createAccessRequestGroup,
  getAccessRequestGroup,
} from '../../src/services/accessRequest.js'
import { Forbidden, InternalError, NotFound } from '../../src/utils/error.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')
const models = vi.hoisted(() => ({ getModelById: vi.fn() }))
const schemas = vi.hoisted(() => ({ getSchemaById: vi.fn(), validateContentAgainstSchema: vi.fn() }))
const reviews = vi.hoisted(() => ({ createAccessRequestReviews: vi.fn() }))
const webhooks = vi.hoisted(() => ({ dispatchWebhooks: vi.fn() }))
vi.mock('../../src/services/model.js', () => models)
vi.mock('../../src/services/schema.js', () => schemas)
vi.mock('../../src/services/review.js', () => reviews)
vi.mock('../../src/services/webhook.js', () => webhooks)
const records = getTypedModelMock('AccessRequestModel')
const user = { dn: 'requester' } as UserInterface
const info = {
  schemaId: 'access-schema',
  metadata: { overview: { name: 'Shared purpose', entities: ['user:requester'] } },
}

beforeEach(() => {
  models.getModelById.mockImplementation(async (_user, id) => ({ id, kind: EntryKind.Model }))
  schemas.getSchemaById.mockResolvedValue({ hidden: false })
  schemas.validateContentAgainstSchema.mockResolvedValue({ valid: true, errors: [] })
})

describe('createAccessRequestGroup', () => {
  test('creates distinct requests with one server-generated group and separate reviews', async () => {
    const result = await createAccessRequestGroup(user, ['first', 'second'], info)
    expect(result.groupId).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.failedModelIds).toEqual([])
    expect(result.accessRequests.map((request) => request.modelId)).toEqual(['first', 'second'])
    expect(new Set(result.accessRequests.map((request) => request.id)).size).toBe(2)
    expect(result.accessRequests.every((request) => request.groupId === result.groupId)).toBe(true)
    expect(records.save).toHaveBeenCalledTimes(2)
    expect(reviews.createAccessRequestReviews).toHaveBeenCalledTimes(2)
    expect(webhooks.dispatchWebhooks).toHaveBeenCalledTimes(2)
    expect(authorisation.accessRequest).toHaveBeenCalledTimes(2)
    for (const request of result.accessRequests) {
      expect(request.metadata).toEqual(info.metadata)
      expect(reviews.createAccessRequestReviews).toHaveBeenCalledWith(
        expect.objectContaining({ id: request.modelId }),
        request,
      )
    }
  })

  test('reports inaccessible targets without dropping successful requests', async () => {
    models.getModelById.mockImplementation(async (_user, id) => {
      if (id === 'private') {
        throw Forbidden('Private model')
      }
      return { id, kind: EntryKind.Model }
    })
    const result = await createAccessRequestGroup(user, ['first', 'private', 'last'], info)
    expect(result.failedModelIds).toEqual(['private'])
    expect(result.accessRequests.map((request) => request.modelId)).toEqual(['first', 'last'])
    expect(records.save).toHaveBeenCalledTimes(2)
    expect(reviews.createAccessRequestReviews).toHaveBeenCalledTimes(2)
  })

  test('reports write failures and continues with later models', async () => {
    records.save.mockRejectedValueOnce(new Error('database unavailable'))
    const result = await createAccessRequestGroup(user, ['first', 'second'], info)
    expect(result.failedModelIds).toEqual(['first'])
    expect(result.accessRequests.map((request) => request.modelId)).toEqual(['second'])
    expect(reviews.createAccessRequestReviews).toHaveBeenCalledTimes(1)
    expect(webhooks.dispatchWebhooks).toHaveBeenCalledTimes(1)
  })

  test('does not create requests when schema validation fails', async () => {
    schemas.validateContentAgainstSchema.mockResolvedValue({ valid: false, errors: ['Missing field'] })
    const result = await createAccessRequestGroup(user, ['first', 'second'], info)
    expect(result.accessRequests).toEqual([])
    expect(result.failedModelIds).toEqual(['first', 'second'])
    expect(records.save).not.toHaveBeenCalled()
  })

  test('preserves access-request authorisation independently of model visibility', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: false, id: 'first', info: 'Denied' })
    const result = await createAccessRequestGroup(user, ['first', 'second'], info)
    expect(result.failedModelIds).toEqual(['first'])
    expect(records.save).toHaveBeenCalledTimes(1)
  })

  test('creates a new group for each submission', async () => {
    const first = await createAccessRequestGroup(user, ['first', 'second'], info)
    const second = await createAccessRequestGroup(user, ['first', 'second'], info)
    expect(first.groupId).not.toBe(second.groupId)
  })

  test('leaves existing single-model creation ungrouped', async () => {
    const result = await createAccessRequest(user, 'first', info)
    expect(result.groupId).toBeUndefined()
  })

  test.each([[], ['one'], ['one', 'one'], Array.from({ length: 21 }, (_, index) => String(index))])(
    'rejects an invalid target list %j',
    async (...ids) => {
      await expect(createAccessRequestGroup(user, ids, info)).rejects.toThrow('between 2 and 20')
      expect(models.getModelById).not.toHaveBeenCalled()
      expect(records.save).not.toHaveBeenCalled()
    },
  )
})

describe('getAccessRequestGroup', () => {
  const anchor = { id: 'anchor', modelId: 'first', groupId: 'group', metadata: info.metadata }
  const other = { id: 'other', modelId: 'second', groupId: 'group', metadata: info.metadata }

  beforeEach(() => {
    records.findOne.mockResolvedValue(anchor as any)
    records.find.mockResolvedValue([anchor, other])
  })

  test('checks every related model and request before returning the group', async () => {
    expect(await getAccessRequestGroup(user, 'first', 'anchor')).toEqual([anchor, other])
    expect(records.find).toHaveBeenCalledWith({ groupId: 'group' })
    expect(models.getModelById).toHaveBeenCalledWith(user, 'second')
    expect(authorisation.accessRequest).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ id: 'second' }),
      other,
      'access_request:view',
    )
  })

  test.each([Forbidden('Private'), NotFound('Deleted')])('omits unavailable related models', async (error) => {
    models.getModelById.mockImplementation(async (_user, id) => {
      if (id === 'second') {
        throw error
      }
      return { id, kind: EntryKind.Model }
    })
    expect(await getAccessRequestGroup(user, 'first', 'anchor')).toEqual([anchor])
  })

  test('omits a related request when its request-level permission fails', async () => {
    vi.mocked(authorisation.accessRequest).mockImplementation(async (_user, _model, request) =>
      request.id === 'other' ? { success: false, id: request.id, info: 'Denied' } : { success: true, id: request.id },
    )
    expect(await getAccessRequestGroup(user, 'first', 'anchor')).toEqual([anchor])
  })

  test('does not hide operational errors as an empty group', async () => {
    models.getModelById.mockResolvedValueOnce({ id: 'first' }).mockRejectedValueOnce(InternalError('database error'))
    await expect(getAccessRequestGroup(user, 'first', 'anchor')).rejects.toThrow('database error')
  })

  test('does not enumerate a group through an inaccessible anchor', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: false, id: 'anchor', info: 'Denied' })
    await expect(getAccessRequestGroup(user, 'first', 'anchor')).rejects.toThrow('Denied')
    expect(records.find).not.toHaveBeenCalled()
  })

  test('rejects an anchor from a different URL model', async () => {
    await expect(getAccessRequestGroup(user, 'wrong', 'anchor')).rejects.toThrow('not found')
    expect(records.find).not.toHaveBeenCalled()
  })

  test('returns no group for legacy single-model requests', async () => {
    records.findOne.mockResolvedValue({ ...anchor, groupId: undefined } as any)
    expect(await getAccessRequestGroup(user, 'first', 'anchor')).toEqual([])
    expect(records.find).not.toHaveBeenCalled()
  })
})
