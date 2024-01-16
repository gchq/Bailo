import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/v2/authorisation/index.js'
import {
  createWebhook,
  getWebhooksByModel,
  removeWebhook,
  sendWebhooks,
  updateWebhook,
} from '../../src/services/v2/webhook.js'

vi.mock('../../src/connectors/v2/authorisation/index.js')

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

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true })),
}))
vi.mock('node-fetch', async () => fetchMock)

const webhookModelMock = vi.hoisted(() => {
  const obj: any = {}

  obj.find = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findOneAndDelete = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)

  const model: any = vi.fn((params) => ({ ...obj, ...params }))
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Webhook.js', () => ({ default: webhookModelMock }))

describe('services > webhook', () => {
  const user: any = { dn: 'test' }

  test('createWebhook > simple', async () => {
    await createWebhook(user, { name: 'test', modelId: 'abc', uri: 'test/uri', insecureSSL: false })

    expect(webhookModelMock.save).toBeCalled()
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(authorisation.model).toBeCalled()
  })

  test('UpdateWebhook > simple', async () => {
    await updateWebhook(user, 'modelId', { name: 'test', modelId: 'abc', uri: 'test/uri', insecureSSL: false })

    expect(webhookModelMock.findOneAndUpdate).toBeCalled()
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(authorisation.model).toBeCalled()
  })

  test('removeWebhook > simple', async () => {
    await removeWebhook(user, 'model', 'webhook')

    expect(webhookModelMock.findOneAndDelete).toBeCalled()
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(authorisation.model).toBeCalled()
  })

  test('getWebhooks > simple', async () => {
    const webhooks = ['webhook 1', 'webhook 2']
    vi.mocked(webhookModelMock.find).mockResolvedValueOnce(webhooks)
    const result = await getWebhooksByModel(user, 'model')

    expect(result).toBe(webhooks)
    expect(webhookModelMock.find).toBeCalled()
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(authorisation.model).toBeCalled()
  })

  test('createWebhook > no permisson', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const result = createWebhook(user, { name: 'test', modelId: 'abc', uri: 'test/uri', insecureSSL: false })

    expect(result).rejects.toThrowError(`You do not have permission to update this model.`)
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(webhookModelMock.save).not.toBeCalled()
  })

  test('updateWebhook > no permisson', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const result = updateWebhook(user, 'modelId', { name: 'test', modelId: 'abc', uri: 'test/uri', insecureSSL: false })

    expect(result).rejects.toThrowError(`You do not have permission to update this model.`)
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(webhookModelMock.findOneAndUpdate).not.toBeCalled()
  })

  test('deleteWebhook > no permisson', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const result = removeWebhook(user, 'model', 'webhook')

    expect(result).rejects.toThrowError(`You do not have permission to update this model.`)
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(webhookModelMock.findOneAndDelete).not.toBeCalled()
  })

  test('getWebhooksByModel > no permisson', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const result = getWebhooksByModel(user, 'model')

    expect(result).rejects.toThrowError(`You do not have permission to update this model.`)
    expect(modelServiceMock.getModelById).toBeCalled()
    expect(webhookModelMock.find).not.toBeCalled()
  })

  test('deleteWebhook > webhook not found', async () => {
    vi.mocked(webhookModelMock.findOneAndDelete).mockResolvedValueOnce()

    const result = removeWebhook(user, 'model', 'webhook')

    expect(result).rejects.toThrowError(`The requested webhook was not found.`)
    expect(modelServiceMock.getModelById).toBeCalled()
  })

  test('updateWebhook > webhook not found', async () => {
    vi.mocked(webhookModelMock.findOneAndUpdate).mockResolvedValueOnce()

    const result = updateWebhook(user, 'modelId', { name: 'test', modelId: 'abc', uri: 'test/uri', insecureSSL: false })

    expect(result).rejects.toThrowError(`The requested webhook was not found.`)
    expect(modelServiceMock.getModelById).toBeCalled()
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
