import { describe, expect, test, vi } from 'vitest'

import { createWebhook, sendWebhooks } from '../../src/services/v2/webhook.js'

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/v2/log.js', async () => ({
  default: logMock,
}))

const modelServiceMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelServiceMock)

const authorisationMocks = vi.hoisted(() => ({
  userModelAction: vi.fn(() => true),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: authorisationMocks,
}))

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true })),
}))
vi.mock('node-fetch', async () => fetchMock)

const webhookModelMock = vi.hoisted(() => {
  const obj: any = {}

  obj.find = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn((params) => ({ ...obj, ...params }))
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Webhook.js', () => ({ default: webhookModelMock }))

describe('services > webhook', () => {
  const user: any = { dn: 'test' }

  test('createWebhook > simple', async () => {
    await createWebhook(user, { name: 'test', modelId: 'abc', uri: 'test/uri' })

    expect(webhookModelMock.save).toBeCalled()
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(authorisationMocks.userModelAction).toBeCalled()
  })

  test('createWebhook > no permisson', async () => {
    authorisationMocks.userModelAction.mockReturnValueOnce(false)

    const result = createWebhook(user, { name: 'test', modelId: 'abc', uri: 'test/uri' })

    expect(result).rejects.toThrowError(`You do not have permission to update this model.`)
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(webhookModelMock.save).not.toBeCalled()
  })

  test('sendWebhooks > success', async () => {
    const webhooks = [{ uri: 'test/uri' }, { uri: 'test/another/uri' }]
    webhookModelMock.find.mockReturnValueOnce(webhooks)

    await sendWebhooks('abc', 'createRelease', 'This event happened', { id: '123' } as any)

    expect(fetchMock.default).toBeCalled()
    expect(fetchMock.default.mock.calls.length).toBe(webhooks.length)
    expect(fetchMock.default.mock.calls.at(0)?.at(0)).toBe(webhooks[0].uri)
    expect(fetchMock.default.mock.calls.at(1)?.at(0)).toBe(webhooks[1].uri)
  })

  test('sendWebhooks > Non 200 response', async () => {
    const webhooks = [{ uri: 'test/uri' }]
    webhookModelMock.find.mockReturnValueOnce(webhooks)
    fetchMock.default.mockReturnValueOnce({ ok: false })

    await sendWebhooks('abc', 'createRelease', 'This event happened', { id: '123' } as any)

    expect(fetchMock.default).toBeCalled()
    expect(logMock.error).toBeCalled()
  })

  test('sendWebhooks > fetch error', async () => {
    const webhooks = [{ uri: 'test/uri' }]
    webhookModelMock.find.mockReturnValueOnce(webhooks)
    fetchMock.default.mockRejectedValueOnce('Error')

    await sendWebhooks('abc', 'createRelease', 'This event happened', { id: '123' } as any)

    expect(fetchMock.default).toBeCalled()
    expect(logMock.error).toBeCalled()
  })
})
